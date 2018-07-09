import { IOrder, ISupplier } from "../../index";
import { IOrderNotificationBase } from "./order-notification-base.interface";

export interface IOrderAcceptedNotification extends IOrderNotificationBase{
    acceptedBy?: ISupplier;
    acceptedAt?: string;
}