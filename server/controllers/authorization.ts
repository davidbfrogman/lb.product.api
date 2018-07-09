// middleware for doing role-based permissions
import { Router, Request, Response, RequestParamHandler, NextFunction, RequestHandler, Application } from 'express';
import { Config } from "../config/config";
import { ITokenPayload } from "../models/index";
import { CONST } from "../constants";
import { AuthenticationController } from "./authentication.controller";
import { ApiErrorHandler } from "../api-error-handler";

export class Authz {

    public static isMatchBetweenRoleLists(userRoles: string[], authRoles: string[]): boolean {
        return userRoles.some(r => authRoles.indexOf(r) >= 0);
    }

    public static permit(...authRoles: string[]): (request: any, res: any, next: any) => void {
        return (request, res, next) => {
            var token = request[CONST.REQUEST_TOKEN_LOCATION] as ITokenPayload;
            if (token && token.userId && token.roles && this.isMatchBetweenRoleLists(token.roles, authRoles))
                next(); // role is allowed, so continue on the next middleware
            else {
                ApiErrorHandler.sendAuthFailure(res, 403, 'You are not in the correct role for this resource');
            }
        }
    }
}
