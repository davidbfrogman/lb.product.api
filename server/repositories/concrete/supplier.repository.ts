import { Supplier, ISupplierDoc } from "../../models/index";
import { Model } from "mongoose";
import { BaseRepository } from '../base/base.repository';
import { IBaseRepository } from '../base/base.repository.interface';
import { ISupplierRepository } from '../interfaces/supplier.repository.interface';

export class SupplierRepository extends BaseRepository<ISupplierDoc> implements ISupplierRepository, IBaseRepository<ISupplierDoc> {
    protected mongooseModelInstance: Model<ISupplierDoc> = Supplier;
    
    public constructor() {
        super();
    }

    public async getSupplierByName(name: string): Promise<ISupplierDoc>{
        let supplier = await Supplier.findOne({ name: name });
        return supplier;
    }

    public async getSupplierBySlug(slug: string): Promise<ISupplierDoc>{
        let supplier = await Supplier.findOne({ slug: slug });
        return supplier;
    }

}