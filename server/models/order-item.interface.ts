import { mongoose } from '../config/database/database';
import { Schema, Model, Document, model } from 'mongoose';
import { IBaseModel, IBaseModelDoc, IAddress, IContact, IEmail, ITeamMember } from "./index";
import * as enums from "../enumerations";
import { IOwnership } from "./ownership.interface";
import { IImage } from './image.interface';
import { IPhone } from './phone.interface';
import { IProduct } from './product';


export interface IOrderItem {
    _id?: string,
    product?: IProduct,
    quantity: number,
    price: number,
}

