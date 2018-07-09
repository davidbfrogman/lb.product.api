import { Config } from '../config/config';
import { CONST } from "../constants";

import * as moment from 'moment';
import * as superagent from "superagent";

import * as log from 'winston';
import { BaseService } from "./base/base.service";
import { ITokenPayload, IUserUpgradeRequest, IUserUpgradeResponse } from '../models/index';
import { OrganizationType } from '../enumerations';
const jwt = require('jsonwebtoken');

export class IdentityApiService extends BaseService {

    private static currentSystemToken: string;
    private static currentSystemTokenExpiresAt: string;

    constructor(endpoint: string) {
        super(endpoint);
        super.baseUrl = Config.active.get('identityApiEndpoint');
        super.apiName = 'Identity.Api.Service';
    };

    public static async getSysToken(): Promise<string> {
        //If the systemToken is null, or the system token is close to expiring, go get a new system token.
        if (!this.currentSystemToken ||
            moment().isAfter(moment(this.currentSystemTokenExpiresAt, CONST.MOMENT_DATE_FORMAT).subtract(1, 'h'))) {

            const token = await new IdentityApiService(CONST.ep.AUTHENTICATE).authenticateUser("system@leblum.com", Config.active.get('systemUserPassword'));
            
            // We're just going to decode the token.  DON'T just trust tokens from anyone.  This isn't from a user, it's from our 
            // identity service.
            let decoded: ITokenPayload = jwt.decode(token);

            this.currentSystemToken = token;
            this.currentSystemTokenExpiresAt = decoded.expiresAt;
        }
        return this.currentSystemToken;
    }

    public async upgrade(userUpgradeRequest: IUserUpgradeRequest): Promise<IUserUpgradeResponse>{
        try {
            log.info('upgrading a user:' + userUpgradeRequest.userId);
            let response: superagent.Response = await superagent
                .post(`${this.baseUrl}${CONST.ep.USERS}${CONST.ep.UPGRADE}`)
                .set(CONST.TOKEN_HEADER_KEY, await IdentityApiService.getSysToken())
                .send(userUpgradeRequest);

            return response.body as IUserUpgradeResponse;
        }
        catch (err) {
            this.errorHandler(err);
        }
    }

    // This will authenticate a user, and return their auth token from the identity api.
    // mostly used for testing purposes.  don't authenticate a user from this microservice.
    public async authenticateUser(email: string, password: string): Promise<string> {
        // We don't need to add a x-access-token here because the register endpoint is open.
        try {
            log.info('Authenticating a user:' + email);
            let response: superagent.Response = await superagent
                .post(`${this.baseUrl}${CONST.ep.AUTHENTICATE}`)
                .send({
                    email: email,
                    password: password,
                });

            return response.body.token;
        }
        catch (err) {
            this.errorHandler(err);
        }
    }

    // This will register a user.
    public async registerUser(body: any): Promise<superagent.Response> {
        // We don't need to add a x-access-token here because the register endpoint is open.
        try {
            console.log('registering user ' + `${this.baseUrl}${CONST.ep.REGISTER}`)
            let response: superagent.Response = await superagent
                .post(`${this.baseUrl}${CONST.ep.REGISTER}`)
                .send(body);

            return response;
        }
        catch (err) {
            super.errorHandler(err);
        }
    }

}