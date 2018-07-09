import { IProductDoc } from "../../models/index";
import { BaseRepository } from "../base/base.repository";
import { Model } from "mongoose";
import { IBaseRepository } from "../index";

export interface IProductRepository extends IBaseRepository<IProductDoc>{
    // createProductFromTemplate(productTemplate: IProductDoc): Promise<IProductDoc>;
}