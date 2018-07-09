import { ISupplierDoc } from "../../models/index";
import { BaseRepository } from "../base/base.repository";
import { Model } from "mongoose";
import { IBaseRepository } from "../index";

export interface ISupplierRepository extends IBaseRepository<ISupplierDoc>{
    getSupplierByName(name: string): Promise<ISupplierDoc>;
    getSupplierBySlug(slug: string): Promise<ISupplierDoc>;
}