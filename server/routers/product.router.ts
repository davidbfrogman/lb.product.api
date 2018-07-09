import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { Request, Response, RequestHandler, } from 'express';
import { RequestHandlerParams, NextFunction } from 'express-serve-static-core';
import { BaseRouter } from './base/base.router';
import { CONST } from '../constants';
import { Authz } from '../controllers/authorization';

export class ProductRouter extends BaseRouter {
    public router: Router = Router();
    public controller = new ProductController();
    public resource: string;

    public constructor(){
        super();
        this.resource = CONST.ep.PRODUCTS;
    }

    public getRouter(): Router {
        return super.getRouter().all(`${this.resource}`, Authz.permit(CONST.PRODUCT_ADMIN_ROLE, CONST.ADMIN_ROLE, CONST.PRODUCT_EDITOR_ROLE))
            .post(`${this.resource}${CONST.ep.CREATE_FROM_TEMPLATE}/:id`, async (request: Request, response: Response, next: NextFunction) => {
                await this.controller.createProductFromTemplate(request, response, next);
            })
            .delete(`${this.resource}${CONST.ep.DELETE_IMAGE}/:id/:imageId`, async (request: Request, response: Response, next: NextFunction) => {
                await this.controller.deleteImage(request, response, next);
            });
    }
}