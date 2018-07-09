import { ISupplier, Supplier, ITokenPayload, IBaseModel, ISupplierDoc, IValidationError } from '../models';
import { Router, Request, Response, RequestParamHandler, NextFunction, RequestHandler } from 'express';
import mongoose = require('mongoose');
import { Schema, Model, Document } from 'mongoose';
import { BaseController } from './base/base.controller';
import { CONST } from '../constants';
import { OwnershipType } from "../enumerations";
import { IOwnership } from "../models/ownership.interface";
import { AmazonS3Service } from '../services/index';
import * as log from 'winston';
import { ISupplierRepository, SupplierRepository } from '../repositories/index';
import { ApiErrorHandler } from '../api-error-handler';
var bcrypt = require('bcrypt');

export class SupplierController extends BaseController {

  public defaultPopulationArgument =
  {
    path: 'contacts'
  };

  public rolesRequiringOwnership = ["supplier:editor"];
  public isOwnershipRequired = true;

  protected repository: ISupplierRepository = new SupplierRepository();

  constructor() {
    super();
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

  public async isValid(supplier: ISupplierDoc): Promise<IValidationError[]> {
    let validationErrors = new Array<IValidationError>();
    if (!await this.checkName(supplier)) {
      log.info('Name Validation failed');
      validationErrors.push({
        field: 'name',
        message: 'That supplier name is already taken, you cant update/create to a name thats already taken',
        path: 'name',
        value: supplier.name
      });
    }
    if (!await this.checkSlug(supplier)) {
      log.info('Slug Validation Failed');
      validationErrors.push({
        field: 'slug',
        message: 'That supplier team name is already taken, you cant update/create to a team name thats already taken',
        path: 'slug',
        value: supplier.slug
      });
    }
    return validationErrors;
  }

  private async checkSlug(supplier: ISupplierDoc): Promise<boolean> {
    // If they are trying to change email.
    if (supplier && supplier.slug) {
      const supplierBySlug = await this.repository.getSupplierBySlug(supplier.slug);

      // Notice here how I didn't use _id when you have a document, you want to use .id because the _id has a generation time on it, and it's 
      // not an exact match.
      if (supplierBySlug && (supplierBySlug.id !== supplier.id)) {
        return false;
      }
    }
    return true;
  }

  private async checkName(supplier: ISupplierDoc): Promise<boolean> {
    // If they are trying to change email.
    if (supplier && supplier.name) {
      const supplierByName = await this.repository.getSupplierByName(supplier.name);

      // Notice here how I didn't use _id when you have a document, you want to use .id because the _id has a generation time on it, and it's 
      // not an exact match.
      if (supplierByName && (supplierByName.id !== supplier.id)) {
        return false; 
      }
    }
    return true;
  }

  public async preCreateHook(supplier: ISupplierDoc): Promise<ISupplierDoc> {
    //supplier.href = `${CONST.ep.API}${CONST.ep.V1}${CONST.ep.SUPPLIERS}/${supplier._id}`;
    return supplier;
  }

  public async preSendResponseHook(supplier: ISupplierDoc): Promise<ISupplierDoc> {
    return supplier;
  }
}
