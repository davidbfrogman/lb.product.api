import { IPagingMetadata } from "./paging-metadata.interface";
import { IBaseModel, IBaseModelDoc } from "./index";

export interface IQueryResponse<T extends IBaseModelDoc>{
    results: Array<T>;
    paging: IPagingMetadata;
}