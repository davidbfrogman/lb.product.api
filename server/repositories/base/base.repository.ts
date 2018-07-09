
import { Model, Document } from "mongoose";
import { SearchCriteria, IBaseModel, IBaseModelDoc } from "../../models/index";
import { IBaseRepository } from "./base.repository.interface";

export abstract class BaseRepository<IModelDoc extends IBaseModelDoc> implements IBaseRepository<IModelDoc>{

    protected abstract mongooseModelInstance: Model<IModelDoc>;

    public async save(document: IModelDoc): Promise<IModelDoc> {
        return await document.save();
    }

    public createFromInterface(model: IBaseModel): IModelDoc {
        return new this.mongooseModelInstance(model);
    }

    public createFromBody(body: object): IModelDoc {
        return new this.mongooseModelInstance(body);
    }

    public getCollectionName(): string {
        return this.mongooseModelInstance.collection.name;
    }

    public async single(id: string, populationArgument?: any): Promise<IModelDoc> {
        let query = this.mongooseModelInstance.findById(id);
        query = populationArgument ? query.populate(populationArgument) : query;
        return await query;
    }

    public async list(searchCriteria: SearchCriteria, populationArgument?: any): Promise<IModelDoc[]> {
        let query = this.mongooseModelInstance.find()
            .skip(searchCriteria.skip)
            .limit(searchCriteria.limit)
            .sort(searchCriteria.sort);

        query = populationArgument ? query.populate(populationArgument) : query;

        return await query;
    }

    public blank() {
        return new this.mongooseModelInstance();
    }

    public async count(searchCriteria: SearchCriteria): Promise<number> {
        return await this.mongooseModelInstance
            .find(searchCriteria.criteria)
            .count();
    }

    public async searchingCount(searchBody: any): Promise<number> {
        return await this.mongooseModelInstance
            .find(searchBody)
            .count();
    }

    public async create(model: IModelDoc): Promise<IModelDoc> {
        return await model.save();
    }

    public async update(id: string, body: any): Promise<IModelDoc> {
        return await this.mongooseModelInstance.findByIdAndUpdate(id, body, { new: true });
    }

    public async destroy(id: string): Promise<IModelDoc> {
        return await this.mongooseModelInstance.findByIdAndRemove(id);
    }

    public async clear(searchBody: any): Promise<void> {
        return await this.mongooseModelInstance.remove(searchBody);
    }

    public async query(searchBody: any, populationArgument: any, searchCriteria: SearchCriteria): Promise<IModelDoc[]> {
        this.recursivlyConvertRegexes(searchBody);
        let query;

        query = searchCriteria 
            ?   this.mongooseModelInstance.find(searchBody).skip(searchCriteria.skip).limit(searchCriteria.limit)
            :   this.mongooseModelInstance.find(searchBody);

        query = populationArgument ? query.populate(populationArgument) : query;
        return await query;
    }

    public recursivlyConvertRegexes(requestBody: any) {
        if (requestBody instanceof Array) {
            for (var i = 0; i < requestBody.length; ++i) {
                this.recursivlyConvertRegexes(requestBody[i])
            }
        }
        let keysArray = Object.keys(requestBody);
        for (var index = 0; index < keysArray.length; index++) {
            var currentKey = keysArray[index];
            var element = requestBody[currentKey];
            if ((element instanceof Object || element instanceof Array) && Object.keys(element).length > 0) {
                this.recursivlyConvertRegexes(element);
            }
            else {
                if (currentKey === '$regex') {
                    requestBody[currentKey] = new RegExp(requestBody[currentKey], 'i');
                    return;
                }
            }
        }
    }
}