import { Router } from 'express';
import { Request, Response, RequestHandler, } from 'express';
import { RequestHandlerParams, NextFunction } from 'express-serve-static-core';
import { BaseRouter } from './base/base.router';
import { CONST } from '../constants';
import { SupplierController } from '../controllers/index';
import { Authz } from '../controllers/authorization';

export class SupplierRouter extends BaseRouter {
    public router: Router = Router();
    public controller = new SupplierController();
    public resource: string;

    public constructor(){
        super();
        this.resource = CONST.ep.SUPPLIERS;
    }

    public getRouter(): Router {
        return super.getRouter().all(`${this.resource}`, Authz.permit(CONST.SUPPLIER_ADMIN_ROLE, CONST.ADMIN_ROLE, CONST.SUPPLIER_EDITOR_ROLE));
    }
}