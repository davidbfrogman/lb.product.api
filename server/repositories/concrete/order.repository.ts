import { Order, IOrderDoc } from "../../models/index";
import { Model } from "mongoose";
import { BaseRepository } from '../base/base.repository';
import { IBaseRepository } from '../base/base.repository.interface';
import { IOrderRepository } from '../interfaces/order.repository.interface';

export class OrderRepository extends BaseRepository<IOrderDoc> implements IOrderRepository, IBaseRepository<IOrderDoc> {
    protected mongooseModelInstance: Model<IOrderDoc> = Order;
    
    public constructor() {
        super();
    }
}