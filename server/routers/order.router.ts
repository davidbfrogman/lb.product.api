import { Router } from 'express';
import { OrderController } from '../controllers/';
import { Request, Response, RequestHandler, } from 'express';
import { RequestHandlerParams, NextFunction } from 'express-serve-static-core';
import { BaseRouter } from './base/base.router';
import { CONST } from '../constants';
import { Authz } from '../controllers/authorization';

export class OrderRouter extends BaseRouter {
    public router: Router = Router();
    public controller = new OrderController();
    public resource: string;

    public constructor(){
        super();
        this.resource = CONST.ep.ORDERS;
    }

    public getRouter(): Router {
        return super.getRouter()
            .patch(`${this.resource}${CONST.ep.SEND}/:id`, async (request: Request, response: Response, next: NextFunction) => {
                await this.controller.send(request, response, next);
            })
            .patch(`${this.resource}${CONST.ep.ACCEPT}/:id`, async (request: Request, response: Response, next: NextFunction) => {
                await this.controller.accept(request, response, next);
            })
            .patch(`${this.resource}${CONST.ep.REJECT}/:id`, async (request: Request, response: Response, next: NextFunction) => {
                await this.controller.reject(request, response, next);
            })
            .patch(`${this.resource}${CONST.ep.PICKUP}/:id`, async (request: Request, response: Response, next: NextFunction) => {
                await this.controller.pickup(request, response, next);
            })
            .patch(`${this.resource}${CONST.ep.DELIVER}/:id`, async (request: Request, response: Response, next: NextFunction) => {
                await this.controller.deliver(request, response, next);
            })
            .patch(`${this.resource}${CONST.ep.COMPLETE}/:id`, async (request: Request, response: Response, next: NextFunction) => {
                await this.controller.complete(request, response, next);
            });
    }
}