const newRelic = require('newrelic'); //  Has to be the first line of this file. 
import * as express from 'express';
import * as http from 'http';
import * as compression from 'compression';
import * as morgan from 'morgan';
import * as fs from 'fs';
import * as helmet from 'helmet';
import * as routers from './routers';


import { ObjectId } from 'bson';
import { join } from 'path';
import { json, urlencoded } from 'body-parser';
import { mongoose, Database } from './config/database/database';
import { DatabaseBootstrap } from './config/database/database-bootstrap';
import { CONST } from './constants';
import { Config } from './config/config';
import { Router } from 'express';
import { ApiErrorHandler } from './api-error-handler';
import { HealthStatus } from './health-status';
import { SupportingServicesBootstrap } from './config/supporting-services.bootstrap';


import methodOverride = require('method-override');
import log = require('winston');

import { Authz } from "./controllers/authorization";
import path = require('path');
import cors = require('cors')
import { AuthenticationController } from './controllers/authentication.controller';
import { MulterConfiguration } from './config/multer.configuration';
import { ImageUploadController } from './controllers/index';
import { IdentityApiService } from './services/identity.api.service';

// Creates and configures an ExpressJS web server.
class Application {
  // ref to Express instance
  public express: express.Application;
  public currentDatabase: Database;
  public server: http.Server;

  // Run configuration methods on the Express instance.
  constructor() {
    log.info('Starting up Express Server.');

    this.checkEnvironment();

    this.express = express();
    this.logging();      // Initialize logging 
    this.healthcheck();  // Router for the healthcheck
    this.connectDatabase(); // Setup database connection
    this.seedSupportingServices();  // We want to make sure that anything this service needs exists in other services.
    this.loggingClientEndpoint();
    this.authenticateSystemUser();
    this.middleware();   // Setup the middleware - compression, etc...
    this.secure();       // Turn on security measures
    this.swagger();      // Serve up swagger, this is before authentication, as swagger is open
    this.middleware();   // Setup the middleware
    this.routes();       // Setup routers for all the controllers
    this.client();       // This will serve the client angular application, will serve all static files.
    this.handlers();     // Any additional handlers, home page, etc.
    this.initErrorHandler(); // This global error handler, will handle 404s for us, and any other errors.  It has to be LAST in the stack.

    this.server = this.express.listen(Config.active.get('port'), () => {
      log.info(`Listening on port: ${Config.active.get('port')}`);
      log.info(`Current version ${process.env.npm_package_version}`);
      log.info(`App Name ${process.env.npm_package_name}`);
    });
  }

  // At startup, we're going to automatically authenticate the system user, so we can use that token
  private async authenticateSystemUser(): Promise<void> {
    const token = await IdentityApiService.getSysToken();
    log.info(`System user has been authenticated.`);
  }

  // Here we're going to make sure that the environment is setup.  
  // We're also going to double check that nothing goofy is going on.
  private checkEnvironment() {
    if (!process.env.NODE_ENV) {
      throw JSON.stringify({
        error: 'You must have a node environment set: NODE_ENV',
        message: 'You can set a node environemnt using set NODE_ENV development. Be sure to close and reopen any active console windows',
      });
    }
    else {
      log.info(`Current Environment set via environment variables (NODE_ENV):${process.env.NODE_ENV}`);
    }
    HealthStatus.isEnvironmentVariableSet = true;
  }

  // We want to configure logging so that if we're outputting it to the console
  // it's nice and colorized, otherwise we remove that transport.
  private logging(): void {
    if (Config.active.get('isConsoleLoggingActive')) {
      log.remove(log.transports.Console);
      log.add(log.transports.Console, { colorize: Config.active.get('isConsoleColored') });

      // If we can use colors, for instance when running locally, we want to use them.
      // Out on the server though, for real logs, the colors will add weird tokens, that we don't want showing up in our logs.
      if (Config.active.get('isConsoleColored')) {
        this.express.use(morgan('dev', {
          skip: this.skipHealthCheck
        })); // Using morgan middleware for logging all requests.  the 'dev' here is just a particular format.
      }
      // Otherwise, this is most likely logging somewhere where colors would be bad.  For instance off on the actual
      // Server, in which case we don't want colors, and we need to know the environement.
      else {
        morgan.token('environment', () => {
          return process.env.NODE_ENV;
        });
        this.express.use(morgan(':date :environment :method :url :status :response-time ms :res[content-length]', {
          skip: this.skipHealthCheck
        }));
      }
    }
    else {
      log.remove(log.transports.Console);
    }
    HealthStatus.isLoggingInitialized = true;
  }

  // Because we really don't need to fill the logs with a ton of health check 200's we're going to skip
  // logging the 200 health checks.  if they are 500's and something went wrong that's a different story and we'll log them.
  private skipHealthCheck(request: express.Request, response: express.Response) {
    return request.originalUrl.includes('healthcheck') && response.statusCode === 200;
  }

  initErrorHandler(): any {
    log.info('Instantiating Default Error Handler Route');
    this.express.use((error: Error & { status: number }, request: express.Request, response: express.Response, next: express.NextFunction): void => {
      ApiErrorHandler.HandleApiError(error, request, response, next);
    });
    HealthStatus.isApiErrorHandlerInitialized = true;
  }

  private healthcheck() {
    this.express.get('/healthcheck', (request: express.Request, response: express.Response) => {
      const isSetupComplete = HealthStatus.isHealthy();
      response.statusCode = isSetupComplete ? 200 : 500;
      response.json({
        ApplicationName: process.env.npm_package_name,
        StatusCode: isSetupComplete ? 200 : 500,
        SetupComplete: isSetupComplete,
        Version: process.env.npm_package_version
      });
    });
  }

  private loggingClientEndpoint() {
    this.express.post('/clientlogs', (request: express.Request, response: express.Response) => {
      log.log(request.body.level, request.body.message);
    });
  }

  private async connectDatabase() {
    await Database.connect();
    await DatabaseBootstrap.seed();
    HealthStatus.isDatabaseSeeded = true;
    log.info('Completed Setup, boostrapped database, database now online');
    this.server.emit("dbConnected");  // Used by the unit tests to prevent them from starting until the database is connected. 
  }

  private async seedSupportingServices() {
    await SupportingServicesBootstrap.seed();
    log.info('Supporting services have been seeded, all ancillary data has been created');
    HealthStatus.isSupportingServicesSeeded = true;
  }

  private secure() {
    this.express.use(helmet()); //Protecting the app from a lot of vulnerabilities turn on when you want to use TLS.
    HealthStatus.isSecured = true;
  }

  // This will allow us to serve the static homepage for our swagger definition
  // along with the swagger ui explorer.
  private swagger(): void {
    log.info('Initializing Swagger');
    this.express.use(CONST.ep.API_DOCS, express.static(__dirname + '/swagger/swagger-ui'));
    this.express.use(CONST.ep.API_SWAGGER_DEF, express.static(__dirname + '/swagger/'));
  }

  private client(): void {
    log.info('Initializing Client');

    // this allows you to see the files uploaded in dev http://localhost:8080/uploads/067e2ad8ca80503b9ae41c9c06855a9a-1afd01789a7015a436d35c6914236865-1493816227467.jpeg
    this.express.use('/uploads', express.static(path.resolve(__dirname, '../img-uploads/')));

    this.express.use(express.static(path.join(__dirname, '../client/dist/' + Config.active.get('clientDistFolder') + '/')));
    this.express.use('*', express.static(path.join(__dirname, '../client/dist/' + Config.active.get('clientDistFolder') + '/index.html')));
  }

  // Configure Express middleware.
  private middleware(): void {
    log.info('Initializing Middleware');
    this.express.disable('x-powered-by');
    this.express.use(json());
    this.express.use(urlencoded({ extended: true }));
    this.express.use(methodOverride(function (req) {
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        const method = req.body._method;
        delete req.body._method;
        return method;
      }
    }));
    // compress all requests
    this.express.use(compression());
    this.express.use(cors());
  }

  private routes(): void {
    log.info('Initializing Routers');

    // Now we lock up the rest.
    this.express.use('/api/*', new AuthenticationController().authMiddleware);

    this.express.use(CONST.ep.API + CONST.ep.V1, new routers.SupplierRegistrationRouter().getRouter());
    this.express.use(CONST.ep.API + CONST.ep.V1, new routers.ProductRouter().getRouter());
    this.express.use(CONST.ep.API + CONST.ep.V1, new routers.SupplierRouter().getRouter());
    

    // This isn't quite right, the security here is bad.  This is basically saying all suppliers, can access all orders.  
    // really when a supplier is sent an order, we need to update their ownership, and then we can check security against their ownership of their order.
    // TODO: cleanup security around orders and suppliers.
    this.express.use(CONST.ep.API + CONST.ep.V1, Authz.permit(CONST.ADMIN_ROLE, CONST.SUPPLIER_EDITOR_ROLE, CONST.SUPPLIER_ADMIN_ROLE ),  new routers.OrderRouter().getRouter());
    this.express.use(CONST.ep.API + CONST.ep.V1, Authz.permit(CONST.ADMIN_ROLE, CONST.SUPPLIER_EDITOR_ROLE, CONST.SUPPLIER_ADMIN_ROLE ),  new routers.NotificationRouter().getRouter());
    
    this.express.use(CONST.ep.API + CONST.ep.V1 + `${CONST.ep.PRODUCTS}${CONST.ep.UPLOAD_IMAGES}/:id`,
      Authz.permit(CONST.PRODUCT_ADMIN_ROLE, CONST.ADMIN_ROLE, CONST.PRODUCT_EDITOR_ROLE),
      new MulterConfiguration().uploader.array('file'),
      new ImageUploadController().imageUploadMiddleware
    );
  }

  // We want to return a json response that will at least be helpful for 
  // the root route of our api.
  private handlers(): void {
    log.info('Initializing Handlers');
    this.express.get('/api', (request: express.Request, response: express.Response) => {
      response.json({
        name: Config.active.get('name'),
        description: 'An product api for the leblum services',
        APIVersion: CONST.ep.V1,
        DocumentationLocation: `${request.protocol}://${request.get('host')}${CONST.ep.API_DOCS}`,
        APILocation: `${request.protocol}://${request.get('host')}${CONST.ep.API}${CONST.ep.V1}`,
        Healthcheck: `${request.protocol}://${request.get('host')}/healthcheck`
      })
    });

    this.express.get('*', function (req, res, next) {
      throw ({ message: `No router was found for your request, page not found.  Requested Page: ${req.originalUrl}`, status: 404 });
    });
  }
}
export default new Application();