import { IOrderDoc } from "../../models/index";
import { BaseRepository } from "../base/base.repository";
import { Model } from "mongoose";
import { IBaseRepository } from "../index";

export interface IOrderRepository extends IBaseRepository<IOrderDoc>{
    // createOrderFromTemplate(productTemplate: IOrderDoc): Promise<IOrderDoc>;
}