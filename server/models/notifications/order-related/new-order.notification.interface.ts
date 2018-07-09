import { IOrder, ISupplier } from "../../index";
import { IOrderNotificationBase } from "./order-notification-base.interface";

export interface INewOrderNotification extends IOrderNotificationBase {
    supplier?: ISupplier;
    expiresAt: string;
}