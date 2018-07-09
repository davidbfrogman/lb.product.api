import { mongoose } from '../config/database/database';
import { Schema, Model, Document, model } from 'mongoose';
import { IBaseModel, IBaseModelDoc, IAddress } from "./index";
import * as enums from "../enumerations";
import { IOwnership } from "./ownership.interface";
import { IImage, IPhone, IEmail } from './';


export interface IContact extends IBaseModel {
    firstName: string,
    lastName: string,
    type: enums.ContactType,
    emails: IEmail[],
    addresses: IAddress[],
    phones: IPhone[],
    createdBy?: string;
    modifiedBy?: string;
    createdAt?: Date,
    modifiedAt?: Date,
}

export interface IContactDoc extends IContact, IBaseModelDoc {

}

const ContactSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    ownerships: [{
        _id: { auto: false },
        ownerId: { type: String },
        ownershipType: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.OwnershipType)] },
    }],
    emails: [{
        email: { type: String },
        emailType: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.EmailType)] },
    }],
    phones: [{
        phone: { type: String },
        phoneType: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.PhoneType)] },
    }],
    addresses: [{
        street1: { type: String },
        street2: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        province: { type: String },
        countryCode: { type: String },
        zip: { type: String },
        addressType: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.AddressType)] },
    }],
    contactType: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.ContactType)] },
}, { timestamps: true });

//If you do any pre save methods, and you use fat arrow syntax 'this' doesn't refer to the document.
ContactSchema.pre('save', function (next) {
    //If there's any validators, this field requires validation.
    next();
});

// This will compile the schema for the object, and place it in this Instance.
export const Contact = mongoose.model<IContactDoc>('contact', ContactSchema);