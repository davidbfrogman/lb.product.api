import { mongoose } from '../config/database/database';
import { IBaseModel, IBaseModelDoc } from "./index";
import * as enums from "../enumerations";
import { IOwnership } from "./ownership.interface";
import { IImage } from './image.interface';


export interface IAddress {
    street1: string,
    street2: string,
    city: string,
    state: string,
    country: string,
    province: string,
    countryCode: string,
    zip: string,
    type: enums.AddressType
}