import { NextFunction, Request, RequestHandler, RequestParamHandler, Response, Router } from 'express';
import { Document, DocumentQuery, Model, Schema } from 'mongoose';
import * as log from 'winston';
import { IValidationError, SearchCriteria, IBaseModel, IBaseModelDoc, ITokenPayload } from '../../models/';
import { ObjectId } from 'bson';
import { BaseRepository, IBaseRepository } from "../../repositories/";
import { CONST } from "../../constants";
import { OwnershipType } from "../../enumerations";
import { Authz } from "../authorization";
import { IOwnership } from "../../models/ownership.interface";
import { ApiErrorHandler } from "../../api-error-handler";
import { IQueryResponse } from '../../models/query-response.interface';

export abstract class BaseController {

    protected abstract repository: IBaseRepository<IBaseModelDoc>;
    public abstract defaultPopulationArgument: object;

    // Determines whether the base class will test ownership
    public abstract isOwnershipRequired: boolean;

    // Determines what roles ownership will be tested with.  Not all roles require ownership, ie Admins
    public abstract rolesRequiringOwnership: Array<string>;

    // If implemented this will be called on document creation.  This will allow us to add ownership at creation time.
    public abstract addOwnerships(request: Request, response: Response, next: NextFunction, modelDoc: IBaseModelDoc): void;

    // The child classes implementation of ownership testing.  Allows for child classes to test various data points.
    public abstract isOwner(request: Request, response: Response, next: NextFunction, document: IBaseModelDoc): boolean;

    protected isOwnerInOwnership(document: IBaseModel, ownerId: string, ownershipType: OwnershipType): boolean {
        let isOwner: boolean = false;

        document.ownerships.forEach(documentOwnershipElement => {
            if (documentOwnershipElement.ownershipType === ownershipType
                // One of these is a bson id on the document, the other is a string, so don't use triple equal
                && documentOwnershipElement.ownerId == ownerId) {
                isOwner = true;
            }
        });
        return isOwner;
    }

    public async isModificationAllowed(request: Request, response: Response, next: NextFunction): Promise<boolean> {
        // If ownership is required we need to make sure the user has the rights to CRUD this item.
        if (this.isOwnershipRequired && this.rolesRequiringOwnership.length > 0 &&
            // Is the user a role, that exists in the roles array that requires an ownership test.
            Authz.isMatchBetweenRoleLists(this.rolesRequiringOwnership, (request[CONST.REQUEST_TOKEN_LOCATION] as ITokenPayload).roles)
        ) {
            // We need to get the document before we can CRUD it
            let document = await this.repository.single(this.getId(request));
            if (!this.isOwner(request, response, next, document)) {
                ApiErrorHandler.sendAuthFailure(response, 403, 'You are not allowed to CRUD this resource.');
                return false;
            }
        }
        return true;
    }

    public async isValid(model: IBaseModelDoc): Promise<IValidationError[]> {
        return null;
    };

    public async preCreateHook(model: IBaseModelDoc): Promise<IBaseModelDoc> {
        return model;
    }

    public async preUpdateHook(model: IBaseModelDoc): Promise<IBaseModelDoc> {
        return model;
    }

    public async updateValidation(model: IBaseModelDoc){
        return true;
    }

    protected getId(request: Request): string {
        return request && request.params ? request.params['id'] : null;
    }

    public blank(request: Request, response: Response, next: NextFunction): void {
        response.json(this.repository.blank());
    }

    public utility(request: Request, response: Response, next: NextFunction): void {
        response.json({});
    }

    public respondWithValidationErrors(request: Request, response: Response, next: NextFunction, validationErrors: IValidationError[]): void {
        response.status(412).json({
            validationError: 'Your Item did not pass validation',
            validationErrors: validationErrors
        });
    }

    public async query<T extends IBaseModelDoc>(request: Request, response: Response, next: NextFunction): Promise<IQueryResponse<T>> {
        try {
            const searchCriteria = new SearchCriteria(request, next);

            // We're going to query for the models.
            let models: T[] = await this.repository.query(request.body, this.defaultPopulationArgument, searchCriteria) as T[];

            // A pager will need to know the total count of models, based on the search parameters.  
            let totalCount= await this.repository.searchingCount(request.body);

            let queryResponse: IQueryResponse<T> = {
                results: models,
                paging:{
                    limit: searchCriteria.limit,
                    skip: searchCriteria.skip,
                    count: totalCount,
                }
            }
            response.json(queryResponse);

            log.info(`Queried for: ${this.repository.getCollectionName()}, Found: ${models.length}`);
            return queryResponse;
        } catch (err) { next(err); }
    }

    public async clear(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            let before: number = await this.repository.count(new SearchCriteria(request, next));
            await this.repository.clear(request.body);
            let after: number = await this.repository.count(new SearchCriteria(request, next));

            response.json({
                Collection: this.repository.getCollectionName(),
                Message: 'All items cleared from collection',
                CountOfItemsRemoved: before - after
            });

            log.info(`Cleared the entire collection: ${this.repository.getCollectionName()}`);
        } catch (err) { next(err); }
    }

    public async destroy(request: Request, response: Response, next: NextFunction, sendResponse: boolean = true): Promise<IBaseModelDoc> {
        try {
            if (await this.isModificationAllowed(request, response, next)) {
                let deletedModel = await this.repository.destroy(this.getId(request));

                if (!deletedModel) { throw { message: "Item Not Found", status: 404 }; }

                if(sendResponse){
                    response.json({
                        ItemRemovedId: deletedModel.id,
                        ItemRemoved: deletedModel,
                    });
                }

                log.info(`Removed a: ${this.repository.getCollectionName()}, ID: ${this.getId(request)}`);

                return deletedModel;
            }
        } catch (err) { next(err); }
    }

    //Update full / partial, is the difference between put and patch.
    public updateFull(request: Request, response: Response, next: NextFunction): Promise<IBaseModelDoc | void> {
        return this.update(request, response, next, true);
    }

    public updatePartial(request: Request, response: Response, next: NextFunction): Promise<IBaseModelDoc | void> {
        return this.update(request, response, next, false);
    }

    private async update(request: Request, response: Response, next: NextFunction, isFull: boolean): Promise<IBaseModelDoc> {
        try {
            if (await this.isModificationAllowed(request, response, next)) {

                let model = await this.preUpdateHook(this.repository.createFromBody(request.body));

                //I think validation will break on partial updates.  Something to look for.
                let validationErrors = await this.isValid(model);

                if (validationErrors && validationErrors.length > 0) {
                    this.respondWithValidationErrors(request, response, next, validationErrors);
                    return null;
                }

                // notice that we're using the request body in the set operation NOT the item after the pre update hook.
                let updateBody: any;
                if (isFull) {
                    // here we have a full document, so we don't need the set operation
                    updateBody = model;
                }
                else {
                    // here someone only passed in a few fields, so we use the set operation to only change the fields that were passed in.
                    updateBody = { $set: request.body }
                }

                model = await this.repository.update(this.getId(request), updateBody);
                if (!model) { throw { message: 'Item Not found', status: 404 }; }

                response.status(202).json(model);
                log.info(`Updated a: ${this.repository.getCollectionName()}, ID: ${model._id}`);
                return model;
            }
        } catch (err) { next(err) }
    }

    public async create(request: Request, response: Response, next: NextFunction, sendResponse: boolean = true): Promise<IBaseModelDoc> {
        try {
                let model = await this.preCreateHook(this.repository.createFromBody(request.body));

                let validationErrors = await this.isValid(model);

                if (validationErrors && validationErrors.length > 0) {
                    this.respondWithValidationErrors(request, response, next, validationErrors);
                    return null;
                }

                this.addOwnerships(request, response, next, model);

                model = await this.repository.create(model);

                if (sendResponse) {
                    response.status(201).json(model);
                }

                log.info(`Created New: ${this.repository.getCollectionName()}, ID: ${model._id}`);

                return model;
        } catch (err) { next(err) }
    }

    public async count(request: Request, response: Response, next: NextFunction): Promise<number> {
        try {
            const searchCriteria = new SearchCriteria(request, next);
            const count: number = await this.repository.count(searchCriteria);

            response.json({
                CollectionName: this.repository.getCollectionName(),
                CollectionCount: count,
                SearchCriteria: searchCriteria.criteria,
            });

            log.info(`Executed Count Operation: ${this.repository.getCollectionName()}, Count: ${count}`);
            
            return count;
        } catch (err) { next(err) }

    }

    public async list(request: Request, response: Response, next: NextFunction): Promise<IBaseModelDoc[]> {
        try {
            let models: IBaseModelDoc[] = await this.repository.list(new SearchCriteria(request, next), this.defaultPopulationArgument);

            response.json(models);

            log.info(`Executed List Operation: ${this.repository.getCollectionName()}, Count: ${models.length}`);

            return models;
        } catch (err) { next(err) }
    }

    public async single(request: Request, response: Response, next: NextFunction): Promise<IBaseModelDoc> {
        try {
            let model: IBaseModelDoc = await this.repository.single(this.getId(request), this.defaultPopulationArgument);
            if (!model)
                throw ({ message: 'Item Not Found', status: 404 });

            response.json(model);

            log.info(`Executed Single Operation: ${this.repository.getCollectionName()}, item._id: ${model._id}`);

            return model;
        } catch (err) { next(err) }
    }
}