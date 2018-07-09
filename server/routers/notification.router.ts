import { Router } from 'express';
import { NotificationController } from '../controllers/';
import { Request, Response, RequestHandler, } from 'express';
import { RequestHandlerParams, NextFunction } from 'express-serve-static-core';
import { BaseRouter } from './base/base.router';
import { CONST } from '../constants';

export class NotificationRouter extends BaseRouter {
    public router: Router = Router();
    public controller = new NotificationController();
    public resource: string;

    public constructor(){
        super();
        this.resource = CONST.ep.NOTIFICATIONS;
    }
}