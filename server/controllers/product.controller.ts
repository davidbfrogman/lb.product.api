import { IProductDoc, Product, ITokenPayload, IBaseModel, IProduct, IBaseModelDoc } from '../models';
import { Router, Request, Response, RequestParamHandler, NextFunction, RequestHandler } from 'express';
import mongoose = require('mongoose');
import { Schema, Model, Document } from 'mongoose';
import { BaseController } from './base/base.controller';
import { CONST } from '../constants';
import { IProductRepository, ProductRepository } from "../repositories";
import { OwnershipType } from "../enumerations";
import { IOwnership } from "../models/ownership.interface";
import { AmazonS3Service } from '../services/index';
import * as moment from 'moment';
import * as log from 'winston';
var bcrypt = require('bcrypt');

export class ProductController extends BaseController {

  public defaultPopulationArgument = {
    path: "supplier"
  };
  public rolesRequiringOwnership = ["product:editor"];
  public isOwnershipRequired = true;

  protected repository: IProductRepository = new ProductRepository();

  constructor() {
    super();
  }

  // This will add ownerships whenever a document is created.
  // Here we can later add supplier ID, and also check that supplier ID in the checking logic.
  public addOwnerships(request: Request, response: Response, next: NextFunction, productDocument: IProductDoc): void {
    let currentToken: ITokenPayload = request[CONST.REQUEST_TOKEN_LOCATION];
    productDocument.ownerships = [{
      ownerId: currentToken.organizationId,
      ownershipType: OwnershipType.organization
    }];
  }

  public async deleteImage(request: Request, response: Response, next: NextFunction): Promise<IProductDoc> {
    try {
      const productId = await this.getId(request);
      const productImageId = request && request.params ? request.params['imageId'] : null;
      const product = await this.repository.single(productId);

      //now we need to get the product image this request is referring to.
      const imageIndex = product.images.findIndex((image) => {
        return image._id == productImageId;
      });

      if (imageIndex >= 0) {

        product.images[imageIndex].variations.forEach(async (variation) => {
          await AmazonS3Service.deleteFileFromS3(variation.key);
        });

        product.images.splice(imageIndex, 1);

        await this.repository.save(product);

        response.status(200).json(product.images);

        return product;
      } else {
        throw { message: "Product image not found.", status: 404 };
      }

    } catch (err) { next(err); }
  }

  public async destroy(request: Request, response: Response, next: NextFunction, sendResponse: boolean = true): Promise<IProductDoc> {
    try {
      if (await super.isModificationAllowed(request, response, next)) {

        // First we go out and get the model from the database
        const productId = await this.getId(request);
        const product = await this.repository.single(productId);

        if (!product) { throw { message: "Item Not Found", status: 404 }; }

        // These really wordy for loops are needed, because those mongoose arrays don't always behave with a foreach.
        // We're only going to delete the product images if this is a product template.
        if (product && product.images && product.isTemplate) {
          for (var i = 0; i < product.images.length; i++) {
            var image = product.images[i];
            if(image.variations && image.variations.length > 0){
              for (var j = 0; j < image.variations.length; j++) {
                var variation = image.variations[j];
                await AmazonS3Service.deleteFileFromS3(variation.key);
              }
            }
          }
        }

        await super.destroy(request, response, next, true);

        return product;
      }
    } catch (err) { next(err); }
  }

  // For product documents we're going to test ownership based on organization id,
  // although we need to be testing based on supplier id as well.
  // TODO check ownership on supplier ID.
  public isOwner(request: Request, response: Response, next: NextFunction, productDocument: IProductDoc): boolean {
    // We'll assume this is only for CRUD
    // Get the current token, so we can get the ownerId in this case organization id off of here.
    let currentToken: ITokenPayload = request[CONST.REQUEST_TOKEN_LOCATION];

    // For now we're just going to check that the ownership is around organization.
    return super.isOwnerInOwnership(productDocument, currentToken.organizationId, OwnershipType.organization);
  }

  public async createProductFromTemplate(request: Request, response: Response, next: NextFunction): Promise<IProductDoc> {
    try {
      // Create a new product.  The false here at the end of the create request allows us to not send the product back in a response just yet.
      // We need to get the product id off the product that was passed in, so that we can use it as our "master product id reference"
      let templateId = this.getId(request);
      let productTemplate: IProductDoc = await this.repository.single(templateId);

      // This allows us to basically create a clone of the existing document.
      productTemplate.isNew = true;
      productTemplate._id = mongoose.Types.ObjectId();

      request.body = productTemplate;

      // TODO: At some point we're going to have to copy the images for this active product over
      // so we don't change images on the product template.
      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#copyObject-property

      // Let the base class handle creation for us, but don't return the response back just yet.
      // Ownership will also be changed, and created by the base class.
      let newProduct: IProductDoc = await super.create(request, response, next, false) as IProductDoc;

      // Change the product to no longer be a template
      newProduct.isTemplate = false;
      newProduct.masterProductId = templateId;
      // Products are only active for one day.
      newProduct.active.startDate = moment().format(CONST.MOMENT_DATE_FORMAT);
      newProduct.active.endDate = moment().add(moment.duration(1,'day')).format(CONST.MOMENT_DATE_FORMAT);

      // Save the update to the database
      await this.repository.save(newProduct);

      // Send the new product which is not a template back.
      response.status(201).json(newProduct);

      return newProduct;
    } catch (err) { next(err); }
  }

  public async preCreateHook(Product: IProductDoc): Promise<IProductDoc> {
    Product.href = `${CONST.ep.API}${CONST.ep.V1}${CONST.ep.PRODUCTS}/${Product._id}`;
    return Product;
  }

  public async preSendResponseHook(Product: IProductDoc): Promise<IProductDoc> {
    return Product;
  }
}
