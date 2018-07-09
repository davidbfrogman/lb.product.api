import { IOrder, Order, IBaseModel, IOrderDoc, IValidationError, ISupplier, ISupplierDoc, NotificationSchema, INotificationDoc } from '../models';
import { Router, Request, Response, RequestParamHandler, NextFunction, RequestHandler } from 'express';
import mongoose = require('mongoose');
import { Schema, Model, Document } from 'mongoose';
import { CONST } from '../constants';
import { OwnershipType, NotificationType } from "../enumerations";
import { IOwnership } from "../models/ownership.interface";
import { AmazonS3Service } from '../services/index';
import * as log from 'winston';
import { IOrderRepository, OrderRepository, NotificationRepository, INotificationRepository } from '../repositories/index';
import { ApiErrorHandler } from '../api-error-handler';
import { FirebaseService } from '../services/firebase.service';
import * as admin from 'firebase-admin';
import * as enums from '../enumerations';
import { INotification } from '../models/notifications/notification.interface';
import * as moment from 'moment';

export class OrderNotification {

    private static notificationRepo: INotificationRepository = new NotificationRepository();

    // This is where we're going to be sending a notification to the supplier asking
    // them to accept the order, or decline the order
    public static async NotifyOnStatusChangeSent(order: IOrderDoc): Promise<admin.messaging.MessagingDevicesResponse> {
        if (order.supplier) {
            // We know the supplier is coming in populated. We're going to get the id 
            let supplier: ISupplierDoc = order.supplier as ISupplierDoc;

            // Even if the supplier doesn't have any push tokens, we're going to send him a notification, by storing a new order notification in our database.
            let notification: INotification = {
                type: NotificationType.NewOrder_Supplier,
                isActionable: true,
                isActionCompleted: false,
                isRead: false,
                newOrderNotification: {
                    order: order._id,
                    expiresAt: moment().add(moment.duration(15, 'minutes')).format(CONST.MOMENT_DATE_FORMAT),
                    supplier: supplier._id,
                },
                relatedTo: supplier._id,
                isSystem: false,
            };

            await this.saveNotification(notification);
        }

        //Now we take the supplier off the order, and send a notification to his push tokens        
        if (order.supplier && order.supplier.pushTokens && order.supplier.pushTokens.length > 0) {
            let pushResponse = await FirebaseService.sendNotification(order.supplier.pushTokens, {
                notification: {
                    title: 'New order request',
                    message: 'An order has been sent to you.  Can you fulfill this order?'
                },
                data: {
                    location: `/order-detail/${order._id}`,
                    id: `${order._id}`,
                    //Firebase freaks out if the value here isn't a string.  So we have to convert it before we send the notification.
                    type: enums.PushNotificationType.orderSent.toString(),
                }
            });
            if (pushResponse.successCount !== order.supplier.pushTokens.length) {
                log.error('There were some errors while sending push notifications to a supplier.  The count of tokens, and success count dont match');
            }

            return pushResponse;
        };
    }

    public static async NotifyOnStatusChangeAccepted(order: IOrderDoc): Promise<INotificationDoc> {
        if (order.supplier) {
            // We know the supplier is coming in populated. We're going to get the id 
            let supplier: ISupplierDoc = order.supplier as ISupplierDoc;
            // Even if the supplier doesn't have any push tokens, we're going to send him a notification, by storing a new order notification in our database.
            let notification: INotification = {
                type: NotificationType.OrderAccepted_Core,
                isActionable: true,
                isActionCompleted: false,
                isRead: false,
                orderAcceptedNotification: {
                    order: order,
                    acceptedAt: moment().format(CONST.MOMENT_DATE_FORMAT),
                    acceptedBy: supplier._id,
                },
                isSystem: true,
            };

            return await this.saveNotification(notification);
        }
    }

    public static async NotifyOnStatusChangeRejected(order: IOrderDoc): Promise<INotificationDoc> {
        if (order.supplier) {
            // We know the supplier is coming in populated. We're going to get the id 
            let supplier: ISupplierDoc = order.supplier as ISupplierDoc;
            // Even if the supplier doesn't have any push tokens, we're going to send him a notification, by storing a new order notification in our database.
            let notification: INotification = {
                type: NotificationType.OrderRejected_Core,
                isActionable: true,
                isActionCompleted: false,
                isRead: false,
                orderRejectedNotification: {
                    order: order,
                    rejectedAt: moment().format(CONST.MOMENT_DATE_FORMAT),
                    rejectedBy: supplier._id,
                },
                isSystem: true,
            };
            return await this.saveNotification(notification);
        }
    }

    private static async saveNotification(notification: INotification): Promise<INotificationDoc>{

        let notificationDoc: INotificationDoc = this.notificationRepo.createFromInterface(notification);
        
        await this.notificationRepo.save(notificationDoc);

        return notificationDoc;
    }
}