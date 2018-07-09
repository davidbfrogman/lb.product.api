import { ISupplier, Supplier, ITokenPayload, IBaseModel, ISupplierDoc, IUserUpgradeResponse } from '../models';
import { Router, Request, Response, RequestParamHandler, NextFunction, RequestHandler } from 'express';
import mongoose = require('mongoose');
import { Schema, Model, Document } from 'mongoose';
import { BaseController } from './base/base.controller';
import { CONST } from '../constants';
import { OwnershipType } from "../enumerations";
import { IOwnership } from "../models/ownership.interface";
import { AmazonS3Service, IdentityApiService } from '../services/index';
import * as log from 'winston';
import { ISupplierRepository, SupplierRepository } from '../repositories/index';
import { ApiErrorHandler } from '../api-error-handler';
var bcrypt = require('bcrypt');

export class SupplierRegistrationController extends BaseController {

    public defaultPopulationArgument = {};

    public rolesRequiringOwnership = [];
    public isOwnershipRequired = false;

    protected repository: ISupplierRepository = new SupplierRepository();

    constructor() {
        super();
    }

    public async register(request: Request, response: Response, next: NextFunction): Promise<ISupplierDoc> {
        try {
            // Firt check to make sure the suuplier name is unique, and the slug is unique
            let supplier: ISupplier = this.repository.createFromBody(request.body);
            if(await this.repository.getSupplierByName(supplier.name)){
                ApiErrorHandler.sendError('A supplier already exists with that name.  Please choose a unique name, or sign in to an existing team.', 400, response);
                return;
            }

            if(await this.repository.getSupplierBySlug(supplier.slug)){
                ApiErrorHandler.sendError('A supplier already exists with that name.  Please choose a unique name, or sign in to an existing team.', 400, response);
                return;
            }

            // First we create a supplier doc.
            let supplierDoc: ISupplierDoc = await super.create(request, response, next, false) as ISupplierDoc;

            // This call will upgrade the user to supplier editor role.  we also need to correct data on our end. 
            let upgradeResponse: IUserUpgradeResponse = await new IdentityApiService(CONST.ep.USERS + CONST.ep.UPGRADE).upgrade({
                organizationName: supplierDoc.name,
                userId: (request[CONST.REQUEST_TOKEN_LOCATION] as ITokenPayload).userId,
                roleName: CONST.SUPPLIER_EDITOR_ROLE,
            });

            // Now we should have back an organizationID, and we need to clean up the ownerships on that side of thing.
            supplierDoc.ownerships = [{
                ownerId: upgradeResponse.organizationId,
                ownershipType: OwnershipType.organization
            }];

            supplierDoc = await this.repository.save(supplierDoc);

            response.status(201).json(supplierDoc);
            log.info(`Registered new supplier Name: ${supplierDoc.name}`);

            return supplierDoc;
        } catch (err) { next(err); }
    }

    // This will add ownerships whenever a document is created.
    // Here we can later add supplier ID, and also check that supplier ID in the checking logic.
    public addOwnerships(request: Request, response: Response, next: NextFunction, supplierDoc: ISupplierDoc): void {
        let currentToken: ITokenPayload = request[CONST.REQUEST_TOKEN_LOCATION];
        supplierDoc.ownerships = [{
            ownerId: currentToken.organizationId,
            ownershipType: OwnershipType.organization
        }];
    }

    // For product documents we're going to test ownership based on organization id,
    // although we need to be testing based on supplier id as well.
    // TODO check ownership on supplier ID.
    public isOwner(request: Request, response: Response, next: NextFunction, supplierDoc: ISupplierDoc): boolean {
        // We'll assume this is only for CRUD
        // Get the current token, so we can get the ownerId in this case organization id off of here.
        let currentToken: ITokenPayload = request[CONST.REQUEST_TOKEN_LOCATION];

        // For now we're just going to check that the ownership is around organization.
        return super.isOwnerInOwnership(supplierDoc, currentToken.organizationId, OwnershipType.organization);
    }

    public async preCreateHook(supplier: ISupplierDoc): Promise<ISupplierDoc> {
        //supplier.href = `${CONST.ep.API}${CONST.ep.V1}${CONST.ep.SUPPLIERS}/${supplier._id}`;
        return supplier;
    }

    public async preSendResponseHook(supplier: ISupplierDoc): Promise<ISupplierDoc> {
        return supplier;
    }
}
