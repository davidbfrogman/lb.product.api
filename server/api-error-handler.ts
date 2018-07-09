import { NextFunction, Request, Response } from 'express';
import log = require('winston');
import { Config } from './config/config';

export class ApiErrorHandler {

    public static sendError(message: string, status: number, response: Response, errorCode?: string, exception?: any){
        log.error(`API Expected Error: ${message}, errorcode:${errorCode}, status: ${status} exception: ${exception}`)
        response.status(status).json({
            message: message,
            status: status,
            errorCode: errorCode,
            exception: exception
        });
    }
    
    public static sendAuthFailure(response: Response, status: number, description: string): Response {
        return response.status(status).json({
            message: 'Authentication Failed',
            description: description
        });
    }

    public static HandleApiError(error: Error & { status: number }, request: Request, response: Response, next: NextFunction) {
        if(error.stack){
            log.error(JSON.stringify(error) + '  Call Stack: ' + JSON.stringify(error.stack));
        }
        else{
            log.error(JSON.stringify(error));
        }

        // Set the response status code on the response in the case of error.
        response.statusCode = error.status || 500;

        //If there was an authentication errror.
        if (error.name == 'JWTExpressError') {
            response.status(401);
        }
        response.json({
            message: error.message || 'Server Error',
            status: error.status || 500,
            URL: request.url,
            method: request.method,
            stack: Config.active.get('returnCallStackOnError') ? error.stack : '',
            requestBody: request.body
        });
    }
}