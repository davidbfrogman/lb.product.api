import { Router, Request, Response, RequestParamHandler, NextFunction, RequestHandler } from 'express';

export class SearchCriteria {
    public limit: number;
    public skip: number;
    public criteria: string;
    public sort: string;
    constructor(request: Request, next: NextFunction) {
        this.limit = parseInt(request.query.limit, 10) || 25;
        this.skip = parseInt(request.query.skip, 10) || 0;
        this.criteria = request.query.criteria || request.query.criteria || request.query.selection || null;

        try {
            if (this.criteria) {
                this.criteria = JSON.parse(this.criteria);
            }
        } catch (err) {
            next(err);
        }

        this.sort = request.query.sort || request.query.sortBy || request.query.sortby || null;

        try {
            if (this.sort) {
                this.sort = JSON.parse(this.sort);
            }
        } catch (err) {
            next(err);
        }
    }
}
