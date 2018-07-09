import convict = require('convict');

export class ConfigurationSchema{
public static convictSchema: convict.Config = convict({
    env: {
      doc: 'The applicaton environment.',
      format: ['production', 'development', 'ci', 'test', 'staging', 'integration'],
      default: 'development',
      env: 'NODE_ENV'
    },
    port: {
      doc: 'The port to bind.',
      format: 'port',
      default: 9000,
      env: 'PORT'
    },
    name: {
      doc: 'The current app name could be useful for debugging',
      format: String,
      default: 'leblum unamed app',
      env: 'APP_NAME'
    },
    database: {
      mongoConnectionString: {
        doc: 'Mongo Connection string',
        format: '*',
        default: '',
        env: 'MONGO_CONNECTION_STRING',
        sensitive: true,
      },
    },
    identityApiEndpoint:{
      doc: 'The location of the identity api',
      format: String,
      default: 'dev.identity.lebum.io',
      env: 'IDENTITY_API_ENDPOINT',
      sensitive: false
    },
    ampq:{
      ampqConnectionString:{
        doc: 'AMPQ Connection string for rabbit',
        format: '*',
        default: 'amqp://wkaxkarj:NAsD1ISNCESHMmVlK9Mch6IcBjapIBYn@puma.rmq.cloudamqp.com/wkaxkarj',
        env: 'AMPQ_CONNECTION_STRING',
        sensitive: true
      }
    },
    jwtSecretToken: {
      doc: 'The secrect token were signing jwts with',
      format: String,
      default: 'asdf97a9s8d7baodfbhoda8f7g9adf8asj',
      env: 'JWT_SECRET_TOKEN',
      sensitive: true
    },
    systemUserPassword:{
      doc:'This is the password for the system user',
      format: String,
      default: 'ads9f8a8s7df6adfiug87daf6gsudifyiasd7',
      env: 'SYSTEM_USER_PASS',
      sensitive: true
    },
    returnCallStackOnError: {
      doc: 'When the api encounters an error do we return a call stack',
      format: Boolean,
      default: true,
      env: 'RETURN_CALL_STACK',
    },
    isConsoleLoggingActive: {
      doc: 'Do we want to log output to the console?',
      format: Boolean,
      default: true,
      env: 'CONSOLE_LOGGING',
    },
    isConsoleColored: {
      doc: 'Colorization Affects the logging, so be careful on which environments you turn this on.',
      format: Boolean,
      default: true,
      env: 'CONSOLE_COLOR',
    },
    mandrillApiKey:{
      doc:'DEFAULT HERE IS TEST KEY! This is the api key that we want to use with mandrill.  Keep in mind there is a different test for the integration environment',
      format: String,
      default: 'Zh8DlnQXZIW5urHG7f1Llw',
      env: 'MANDRILL_API_KEY',
      sensitive: true
    },
    AWSAccessKey:{
      doc:'Access Key for S3',
      format: String,
      default: 'AKIAI6N3HPHRV4DVP7JQ',
      env: 'AWS_ACCESS_KEY',
      sensitive: true
    },
    AWSSecret:{
      doc:'Access Secret for S3',
      format: String,
      default: 'zDFqAvTSTqjO5D2bOMTOcBdACzB80NWkE4z/cHNw',
      env: 'AWS_S3_SECRET',
      sensitive: true
    },
    ProductImageBucketName:{
      doc:'Bucket where were uploading product images',
      format: String,
      default: 'dev-product-api-images',
      env: 'PRODUCT_IMAGE_BUCKET_NAME',
      sensitive: true
    },
    ProductImageURLLocationRoot:{
      doc:'This is the root of the url that well use whenever a product image is added.',
      format: String,
      default: 'https://s3.us-east-2.amazonaws.com/',
      env: 'PRODUCT_IMAGE_URL_LOCATION_ROOT',
      sensitive: true
    },
    SupplierImageBucketName:{
      doc:'Bucket where were uploading supplier images/logos etc...',
      format: String,
      default: 'dev-supplier-api-images',
      env: 'SUPPLIER_IMAGE_BUCKET_NAME',
      sensitive: true
    },
    SupplierImageURLLocationRoot:{
      doc:'This is the root of the url that well use whenever a supplier image is added.',
      format: String,
      default: 'https://s3.us-east-2.amazonaws.com/',
      env: 'SUPPLIER_IMAGE_URL_LOCATION_ROOT',
      sensitive: true
    },
    clientDistFolder:{
      doc:'The client dist folder needs to be set, we build the docker image with all the client folders built.',
      format: String,
      default: 'dist',
      env: 'CLIENT_DIST_FOLDER',
      sensitive: false,
    }
  });
}