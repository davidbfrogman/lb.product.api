import { Schema, Model, Document } from 'mongoose';
import { IOwnership } from "../ownership.interface";

export interface IBaseModel {
    createdBy?: string;
    modifiedBy?: string;
    createdAt?: Date,
    updatedAt?: Date,
    ownerships?:Array<IOwnership>
}