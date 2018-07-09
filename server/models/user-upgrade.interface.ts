import { mongoose } from '../config/database/database';
import { Schema, Model, Document, model } from 'mongoose';
import { IBaseModel, IBaseModelDoc } from "./index";

export interface IUserUpgradeRequest extends IBaseModel {
    userId: string;
    organizationName: string;
    roleName: string;
}

export interface IUserUpgradeResponse extends IBaseModel{
    organizationId: string,
}