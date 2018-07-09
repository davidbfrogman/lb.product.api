import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { Request, Response, RequestHandler, } from 'express';
import { RequestHandlerParams, NextFunction } from 'express-serve-static-core';
import { BaseRouter } from './base/base.router';
import { CONST } from '../constants';
import { Authz } from '../controllers/authorization';
import { SupplierRegistrationController } from '../controllers/index';

export class SupplierRegistrationRouter extends BaseRouter {
    public router: Router = Router();
    public controller = new SupplierRegistrationController();
    public resource: string;

    public constructor() {
        super();
        this.resource = CONST.ep.SUPPLIERS + CONST.ep.REGISTER;
    }

    public getRouter(): Router {
        return this.router.post(this.resource, Authz.permit(CONST.GUEST_ROLE), async (request: Request, response: Response, next: NextFunction) => {
            await this.controller.register(request, response, next);
        });
    }
}