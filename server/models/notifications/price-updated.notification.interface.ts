import { IProduct, ISupplier } from "../index";

export interface IPriceUpdatedNotification{
    updatedPrice: string,
    product: IProduct,
    supplier: ISupplier,
    updatedAt: string,
}