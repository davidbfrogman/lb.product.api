import { IOrder, Order, ITokenPayload, IBaseModel, IOrderDoc, IValidationError } from '../models';
import { Router, Request, Response, RequestParamHandler, NextFunction, RequestHandler } from 'express';
import mongoose = require('mongoose');
import { Schema, Model, Document } from 'mongoose';
import { BaseController } from './base/base.controller';
import { CONST } from '../constants';
import { OwnershipType, OrderStatus } from "../enumerations";
import { IOwnership } from "../models/ownership.interface";
import { AmazonS3Service } from '../services/index';
import * as log from 'winston';
import { IOrderRepository, OrderRepository } from '../repositories/index';
import { ApiErrorHandler } from '../api-error-handler';
import * as enums from '../enumerations';
import { FirebaseService } from '../services/firebase.service';
import { OrderNotification } from '../notifications/order.notification';

export class OrderController extends BaseController {

  public defaultPopulationArgument = {
    // This will populate both the supplier on the document, and also the product.
    // in the future this might be a problem as the product document is pretty big.
    path: 'supplier items.product',
    //select: 'displayName images',
    // populate: {
    //   path: 'items.product',
    //   select: 'displayName images'
    // }
  };

  public rolesRequiringOwnership = [];
  public isOwnershipRequired = false;

  protected repository: IOrderRepository = new OrderRepository();

  constructor() {
    super();
  }

  public async send(request: Request, response: Response, next: NextFunction): Promise<IOrderDoc> {
    return await this.changeOrderStatus(OrderStatus.sent, request, response, next);
  }

  public async accept(request: Request, response: Response, next: NextFunction): Promise<IOrderDoc> {
    return await this.changeOrderStatus(OrderStatus.accepted, request, response, next);
  }

  public async reject(request: Request, response: Response, next: NextFunction): Promise<IOrderDoc> {
    return await this.changeOrderStatus(OrderStatus.rejected, request, response, next);
  }

  public async pickup(request: Request, response: Response, next: NextFunction): Promise<IOrderDoc> {
    return await this.changeOrderStatus(OrderStatus.pickedUp, request, response, next);
  }

  public async deliver(request: Request, response: Response, next: NextFunction): Promise<IOrderDoc> {
    return await this.changeOrderStatus(OrderStatus.delivered, request, response, next);
  }

  public async complete(request: Request, response: Response, next: NextFunction): Promise<IOrderDoc> {
    return await this.changeOrderStatus(OrderStatus.completed, request, response, next);
  }

  private async changeOrderStatus(status: OrderStatus, request: Request, response: Response, next: NextFunction): Promise<IOrderDoc> {
    // here we're going to change the order status to sent,
    // and also fire off a push notification. 
    try {
      if (await this.isModificationAllowed(request, response, next)) {

        let order: IOrderDoc = await this.repository.single(this.getId(request), this.defaultPopulationArgument);
        if (!order) {
          throw ({ message: 'Order Not Found', status: 404 });
        }

        if (status === OrderStatus.sent) {
          await OrderNotification.NotifyOnStatusChangeSent(order);
        }

        if (status === OrderStatus.accepted) {
          await OrderNotification.NotifyOnStatusChangeAccepted(order);
        }

        if (status === OrderStatus.rejected) {
          await OrderNotification.NotifyOnStatusChangeRejected(order);
        }

        order.status = status;

        await this.repository.save(order);

        response.status(202).json(order);
        log.info(`Updated a: ${this.repository.getCollectionName()}, ID: ${order._id}, Order status changed to sent.`);
        return order;
      }
    }
    catch (error) { next(error); }
  }  
  
  // This will add ownerships whenever a document is created.
  // Here we can later add order ID, and also check that order ID in the checking logic.
  public addOwnerships(request: Request, response: Response, next: NextFunction, orderDoc: IOrderDoc): void {
    return;
  }

  // For product documents we're going to test ownership based on organization id,
  // although we need to be testing based on order id as well.
  // TODO check ownership on order ID.
  public isOwner(request: Request, response: Response, next: NextFunction, orderDoc: IOrderDoc): boolean {
    return true;
  }
}
