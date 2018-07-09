import { Product, IProductDoc } from "../../models/index";
import { Model } from "mongoose";
import { BaseRepository } from '../base/base.repository';
import { IBaseRepository } from '../base/base.repository.interface';
import { IProductRepository } from '../interfaces/product.repository.interface';

export class ProductRepository extends BaseRepository<IProductDoc> implements IProductRepository, IBaseRepository<IProductDoc> {
    protected mongooseModelInstance: Model<IProductDoc> = Product;
    
    public constructor() {
        super();
    }
}