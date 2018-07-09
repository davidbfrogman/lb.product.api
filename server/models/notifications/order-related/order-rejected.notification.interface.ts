import { IOrder, ISupplier } from "../../index";
import { IOrderNotificationBase } from "./order-notification-base.interface";

export interface IOrderRejectedNotification extends IOrderNotificationBase{
    rejectedBy?: ISupplier;
    rejectedAt?: string;
}