import { Config } from '../../config/config';
import { CONST } from "../../constants";
import log = require('winston');

import * as superagent from "superagent";
import { IBaseModel } from '../../models/index';
import { IdentityApiService } from '../index';

export abstract class BaseService {

    protected apiName: string;
    protected baseUrl: string;
    protected endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    public async get<T extends IBaseModel>(id: string, query?: any): Promise<T> {
        try {
            const url = `${this.baseUrl}${this.endpoint}/${id}`;

            const response = await superagent
                .get(url)
                .set(CONST.TOKEN_HEADER_KEY, await IdentityApiService.getSysToken())
                .send(query);

            return response.body;
        } catch (err) { this.errorHandler(err) }
    }

    public async getList<T extends IBaseModel>(query?: Object): Promise<T[]> {
        try {
            const url = `${this.baseUrl}${this.endpoint}${CONST.ep.common.QUERY}`;
            const response = await superagent
                .get(url)
                .set(CONST.TOKEN_HEADER_KEY, await IdentityApiService.getSysToken())
                .send(query);
            return response.body;
        } catch (err) { this.errorHandler(err) }
    }

    public async delete(id: string): Promise<any> {
        try {
            const url = `${this.baseUrl}${this.endpoint}/${id}`;
            let response = await superagent
                .delete(url)
                .set(CONST.TOKEN_HEADER_KEY, await IdentityApiService.getSysToken());
            return response.body;
        } catch (err) { this.errorHandler(err) }
    }

    public async deleteMany(query: Object): Promise<any> {
        try {
            const url = `${this.baseUrl}${this.endpoint}`;
            let response = await superagent
                .delete(url)
                .set(CONST.TOKEN_HEADER_KEY, await IdentityApiService.getSysToken())
                .send(query)
            return response.body;
        } catch (err) { this.errorHandler(err) }
    }

    public async create<T extends IBaseModel>(T: T): Promise<T> {
        try {
            const url = `${this.baseUrl}${this.endpoint}`;
            const response = await superagent
                .post(url)
                .set(CONST.TOKEN_HEADER_KEY, await IdentityApiService.getSysToken())
                .send(T);
            return response.body;
        } catch (err) { this.errorHandler(err) }
    }

    public async update<T extends IBaseModel>(body: any, id: string): Promise<T> {
        try {
            const url = `${this.baseUrl}${this.endpoint}/${id}`;
            const response = await superagent
                .patch(url)
                .set(CONST.TOKEN_HEADER_KEY, await IdentityApiService.getSysToken())
                .send(body);
            return response.body;
        } catch (err) { this.errorHandler(err) }
    }

    public async createRaw(body: any): Promise<superagent.Response> {
        try {
            return await superagent
                .post(`${this.baseUrl}${this.endpoint}`)
                .set(CONST.TOKEN_HEADER_KEY, await IdentityApiService.getSysToken())
                .send(body)
                .catch(err => this.errorHandler(err));
        } catch (err) { this.errorHandler(err) }
    }

    public async query(query: any): Promise<superagent.Response> {
        try {
            return await superagent
                .post(`${this.baseUrl}${this.endpoint}${CONST.ep.common.QUERY}`)
                .set(CONST.TOKEN_HEADER_KEY, await IdentityApiService.getSysToken())
                .send(query)
                .catch(err => this.errorHandler(err));
        } catch (err) { this.errorHandler(err) }
    }

    public async deleteSingle(queryBody: any): Promise<superagent.Response> {
        try {
            let queryResponse = await this.query(queryBody);

            // There should be only one model returned by this query, and if we don't get just one back
            // we're not going to delete anything.
            if (queryResponse.status === 200 && queryResponse.body.length === 1 && queryResponse.body[0]._id) {
                return await superagent
                    .delete(`${this.baseUrl}${this.endpoint}/${queryResponse.body[0]._id}`)
                    .set(CONST.TOKEN_HEADER_KEY, await IdentityApiService.getSysToken())
                    .catch(err => this.errorHandler(err));

            }
            // else{
            //     throw(`There was an error on delete single.  Your query didn't return just one result, or was an error.  Query ResponseBody: ${queryResponse.body}`);
            // }
        } catch (err) { this.errorHandler(err) }
    }

    public errorHandler(err: any): superagent.Response {
        if (err) {
            log.error(`There was an error calling out to the ${this.apiName}`, {
                message: err.message ? err.message : 'null',
                status: err.status ? err.status : 'null',
                url: err.response && err.response.request && err.response.request.url ? err.response.request.url : 'null',
                text: err.response && err.response.text ? err.response.text : 'null',
                description: err.response && err.response.body && err.response.body.description ? err.response.body.description : 'null'
            });
            throw err;
        }
        return null;
    }
}