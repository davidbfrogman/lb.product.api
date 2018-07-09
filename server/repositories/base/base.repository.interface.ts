import { Model, Document } from "mongoose";
import { SearchCriteria, IBaseModelDoc, IBaseModel } from "../../models/";

export interface IBaseRepository<IModelDoc extends IBaseModelDoc> {
    
    save(document: IModelDoc): Promise<IModelDoc>;
    createFromBody(body: object): IModelDoc;
    createFromInterface(model: IBaseModel): IModelDoc;
    getCollectionName(): string;

    single(id: string, populationArgument?: any): Promise<IModelDoc>;

    list(searchCriteria: SearchCriteria, populationArgument?: any): Promise<IModelDoc[]>;

    blank();

    count(searchCriteria: SearchCriteria): Promise<number>;
    searchingCount(searchBody: any): Promise<number>;

    create(model: IModelDoc): Promise<IModelDoc>;

    update(id:string, body: any): Promise<IModelDoc>;
    update(id:string, body: IModelDoc): Promise<IModelDoc>;

    destroy(id:string): Promise<IModelDoc>;

    clear(searchBody: any): Promise<void>;

    query(searchBody: any, populationArgument: any, searchCriteria?: SearchCriteria): Promise<IModelDoc[]>;
}