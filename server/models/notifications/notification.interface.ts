import { mongoose } from '../../config/database/database';
import { Schema, Model, Document, model } from 'mongoose';
import { IBaseModel, IBaseModelDoc } from "../index";
import * as enums from "../../enumerations";
import { BijectionEncoder } from '../../utils/bijection-encoder';
import * as log from 'winston';
import { INewOrderNotification } from './order-related/new-order.notification.interface';
import { IOrderAcceptedNotification } from './order-related/order-accepted.notification.interface';
import { IPriceUpdatedNotification } from './price-updated.notification.interface';
import { IOrderRejectedNotification } from './order-related/order-rejected.notification.interface';

export interface INotification extends IBaseModel {
    type: enums.NotificationType
    newOrderNotification?: INewOrderNotification,
    orderAcceptedNotification?: IOrderAcceptedNotification,
    orderRejectedNotification?: IOrderRejectedNotification,
    priceUpdatedNotification?: IPriceUpdatedNotification,
    // This field makes it easier to build our notification list.  in the supplier mobile app, and taki dashboard.
    relatedTo?: string,
    isRead?: boolean;
    readAt?: string;
    isActionable?: boolean;
    isActionCompleted?: boolean;
    isSystem?: boolean;
}

export interface INotificationDoc extends INotification, IBaseModelDoc {

}

export const NotificationSchema = new Schema({
    newOrderNotification: {
        order: { type: Schema.Types.ObjectId, ref: 'order' },
        supplier: { type: Schema.Types.ObjectId, ref: 'supplier' },
        enteredAt: { type: String },
        expiresAt: { type: String }
    },
    orderAcceptedNotification: {
        order: { type: Schema.Types.ObjectId, ref: 'order' },
        acceptedBy: { type: Schema.Types.ObjectId, ref: 'supplier' },
        acceptedAt: { type: String }
    },
    orderRejectedNotification: {
        order: { type: Schema.Types.ObjectId, ref: 'order' },
        rejectedBy: { type: Schema.Types.ObjectId, ref: 'supplier' },
        rejectedAt: { type: String }
    },
    priceUpdatedNotification: {
        updatedPrice: { type: Number },
        product: { type: Schema.Types.ObjectId, ref: 'product' },
        supplier: { type: Schema.Types.ObjectId, ref: 'supplier' },
        updatedAt: { type: String }
    },
    // This could be supplier, courier, particular team member, or user.  We're going to keep this generic for now.
    relatedTo: { type: Schema.Types.ObjectId },
    type: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.NotificationType)] },
    isRead: { type: Boolean, default: false },
    readAt: { type: String },
    isActionable: { type: Boolean },
    isActionCompleted: { type: Boolean },
    isSystem: { type: Boolean },
}, { timestamps: true });

// This will compile the schema for the object, and place it in this Instance.
export const Notification = mongoose.model<INotificationDoc>('notification', NotificationSchema);   
