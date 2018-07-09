import { mongoose } from '../config/database/database';
import { Schema, Model, Document, model } from 'mongoose';
import { IBaseModel, IBaseModelDoc, ISupplier } from "./index";
import * as enums from "../enumerations";
import { IOwnership } from "./ownership.interface";
import { IImage } from './image.interface';


export interface IProduct extends IBaseModel {
    ownerships?: {
        ownerId: string,
        ownershipType: enums.OwnershipType
    }[],
    supplier?: ISupplier,
    wooProductId?: string,
    displayName?: string,
    commonName?: string,
    shortDescription?: string,
    longDescription?: string,
    thumbnailDescription?: string,
    type?: enums.ProductType,
    category?: string,
    tags?: string[],
    isTemplate: boolean,
    isLocal?: boolean,
    masterProductId?: string,
    sku?: string,
    primaryColor?: enums.PrimaryColor,
    productLocation?: {
        type:string,
        coordinates: Array<number>
    },
    deliveryOptions?: {
        personalPickup?: {
            pickupLocation?: {
                type:string,
                coordinates: Array<number>
            }
        },
        supplierDelivery?: {
            serviceZipCodes?: number[],
            serviceRadius?: number
        },
        courierDelivery?: {
            serviceZipCodes?: number[]
        }
    },
    reviews?: {
        customerEmail?: string,
        customerFirstName?: string,
        customerLastName?: string,
        customerUserId?: string,
        createdDate?: string,
        rating?: number,
        purchaseDate?: string,
        message?: string,
        isVerified?: boolean,
        isActive?: boolean,
        sellerResponse?: {
            name?: string,
            message?: string,
            responseDate?: string,
        }
    },
    sizes?: string[],
    weights?: string[],
    cutDate?: string,
    combinedWith?: string[],
    similarTo?: string[],
    pricing?: {
        supplier?: {
            perStem?: number,
            markdownPercentage?: number,
            stemsPerBundle?: number
        },
        markupPercentage?: number,
        industryPrice?: number,
        meanPrice?: number
    },
    active?: {
        startDate?: string,
        endDate?: string,
    },
    images?: IImage[],
    version?: string,
    stemAttributes?: {
        version?: string,
        latinName?: string,
        varietal?: string,
        nickname?: string,
        grade?: string,
        stemLength?: string,
        grams?: number,
        inflorescence?: string,
        bloomSize?: string,
        bloomsPerStem?: string,
        lifespan?: string,
        season?: string,
    }
    href?: string,
    createdBy?: string;
    modifiedBy?: string;
    createdAt?: Date,
    modifiedAt?: Date,
}

export interface IProductDoc extends IProduct, IBaseModelDoc {

}

const ProductSchema = new Schema({
    ownerships: [{
        _id: { auto: false },
        ownerId:  { type: Schema.Types.ObjectId },
        ownershipType: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.OwnershipType)] },
    }],
    supplier: {type: Schema.Types.ObjectId, ref: 'supplier'},
    displayName: { type: String },
    commonName: { type: String },
    wooProductId: {type: String },
    shortDescription: { type: String },
    longDescription: { type: String },
    thumbnailDescription: { type: String },
    type: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.ProductType)] },
    category: { type: String },
    tags: { type: [String] },
    isTemplate: { type: Boolean, required: true, default: true },
    isLocal: { type: Boolean },
    masterProductId: { type: Schema.Types.ObjectId },
    sku: { type: String },
    primaryColor: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.PrimaryColor)] },
    // What the mongo compass query looks like: {"productLocation":{"$geoWithin":{"$centerSphere":[[40.76665209596496,-73.98568992400604],4.4717033545255673e-7]}}}
    // The order here is Longitude, and then Latitude.
    productLocation: { 'type': {type: String, enum: "Point", default: "Point"}, coordinates: { type: [Number], default: [0,0] } },
    deliveryOptions: {
        personalPickup: {
            pickupLocation: { 'type': {type: String, enum: "Point", default: "Point"}, coordinates: { type: [Number], default: [0,0]} },
        },
        supplierDelivery: {
            serviceZipCodes: { type: [Number] },
            serviceRadius: { type: Number, require: false }
        },
        courierDelivery: {
            serviceZipCodes: { type: [Number] }
        }
    },
    reviews: {
        customerEmail: { type: String },
        customerFirstName: { type: String },
        customerLastName: { type: String },
        customerUserId: { type: Schema.Types.ObjectId },
        createdDate: { type: String },
        rating: { type: Number },
        purchaseDate: { type: String },
        message: { type: String },
        isVerified: { type: Boolean },
        isActive: { type: Boolean },
        sellerResponse: {
            name: { type: String },
            message: { type: String },
            responseDate: { type: String },
        }
    },
    sizes: { type: [String] },
    weights: { type: [String] },
    cutDate: { type: String },
    combinedWith: { type: [Schema.Types.ObjectId] },
    similarTo: { type: [Schema.Types.ObjectId] },
    pricing: {
        supplier: {
            perStem: { type: Number },
            markdownPercentage: { type: Number, default: 0 },
            stemsPerBundle: { type: Number }
        },
        markupPercentage: { type: Number },
        industryPrice: { type: Number },
        meanPrice: { type: Number, default: 0 }
    },
    active: {
        startDate: { type: String },
        endDate: { type: String },
    },
    images: [{
        order: { type: Number },
        isActive: { type: Boolean },
        variations: [{
            type: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.ProductType)] },
            url: { type: String },
            width: { type: Number },
            height: { type: Number },
            key: {type: String},
        }],
    }],
    version: { type: String },
    stemAttributes: {
        version: { type: String },
        latinName: { type: String },
        varietal: { type: String },
        nickname: { type: String },
        grade: { type: String },
        stemLength: { type: String },
        grams: { type: Number },
        inflorescence: { type: String },
        bloomSize: { type: String },
        bloomsPerStem: { type: String },
        lifespan: { type: String },
        season: { type: String },
    },
    href: { type: String }
}, { timestamps: true });

ProductSchema.index({productLocation: '2dsphere'});
ProductSchema.index({'deliveryOptions.personalPickup.pickupLocation': '2dsphere'});

//If you do any pre save methods, and you use fat arrow syntax 'this' doesn't refer to the document.
ProductSchema.pre('save', function (next) {
    //If there's any validators, this field requires validation.
    next();
});

// This will compile the schema for the object, and place it in this Instance.
export const Product = mongoose.model<IProductDoc>('product', ProductSchema);