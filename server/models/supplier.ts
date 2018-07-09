import { mongoose } from '../config/database/database';
import { Schema, Model, Document, model } from 'mongoose';
import { IBaseModel, IBaseModelDoc, IAddress, IContact, IEmail, ITeamMember } from "./index";
import * as enums from "../enumerations";
import { IOwnership } from "./ownership.interface";
import { IImage } from './image.interface';
import { IPhone } from './phone.interface';


export interface ISupplier extends IBaseModel {
    ownerships?: {
        ownerId: string,
        ownershipType: enums.OwnershipType
    }[],
    name:string,
    slug?:string,
    companyEmail?: string,
    companyPhone?: string,
    companyAddress?: IAddress,
    pickupAddress?: IAddress,
    pickupName?: string,
    pickupPhone?: string,
    pickupEmail?: string,
    isApproved: boolean,
    isActive: boolean,
    teamMembers?: ITeamMember[],
    pushTokens?: Array<string>,
}

export interface ISupplierDoc extends ISupplier, IBaseModelDoc {

}

const SupplierSchema = new Schema({
    ownerships: [{
        _id: { auto: false },
        ownerId:  { type: Schema.Types.ObjectId },
        ownershipType: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.OwnershipType)] },
    }],
    name: { type: String , unique:true},
    slug: { type: String, unique:true },
    companyEmail: { type: String },
    companyPhone: { type: String },
    companyAddress:{
        street1: { type: String },
        street2: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        province: { type: String },
        countryCode: { type: String },
        zip: { type: String },
    },
    pickupName: { type: String },
    pickupEmail: { type: String },
    pickupPhone: { type: String },
    pickupAddress:{
        street1: { type: String },
        street2: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        province: { type: String },
        countryCode: { type: String },
        zip: { type: String },
    },
    teamMembers: [{
        userId:  { type: Schema.Types.ObjectId },
        isApproved: {type: Boolean},
        memberType: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.TeamMemberType)] },
    }],
    isApproved: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    pushTokens: [{ type: String, required: false}]
}, { timestamps: true });

//If you do any pre save methods, and you use fat arrow syntax 'this' doesn't refer to the document.
SupplierSchema.pre('save', function (next) {
    //If there's any validators, this field requires validation.
    next();
});

// This will compile the schema for the object, and place it in this Instance.
export const Supplier = mongoose.model<ISupplierDoc>('supplier', SupplierSchema);