import { mongoose } from '../config/database/database';
import { Schema, Model, Document, model } from 'mongoose';
import { IBaseModel, IBaseModelDoc, IAddress, IContact, IEmail, ITeamMember } from "./index";
import * as enums from "../enumerations";
import { IOrderItem, ISupplier } from "./";
import { BijectionEncoder } from '../utils/bijection-encoder';
import * as log from 'winston';



export interface IOrder extends IBaseModel {
    ownerships?: {
        ownerId: string,
        ownershipType: enums.OwnershipType
    }[],
    orderNumber?: number,
    code?: string,
    status: enums.OrderStatus,
    wooOrderNumber?: string,
    wooCustomerId?: string,
    supplier?: ISupplier,
    subtotal?: number,
    tax?: number,
    total?: number,
    notes?: string,
    itemsHash?: string,
    items?: Array<IOrderItem>,
}

export interface IOrderDoc extends IOrder, IBaseModelDoc {

}

export const OrderSchema = new Schema({
    ownerships: [{
        _id: { auto: false },
        ownerId:  { type: Schema.Types.ObjectId },
        ownershipType: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.OwnershipType)] },
    }],
    orderNumber: { type: Number, unique: true },
    code: { type: String, unique: true },
    status: { type: Number, enum: [enums.EnumHelper.getValuesFromEnum(enums.OrderStatus)] },
    wooOrderNumber: { type: Number },
    supplier: {type: Schema.Types.ObjectId, ref: 'supplier'},
    wooCustomerId: { type: String },
    subtotal: { type: Number },
    tax: { type: Number },
    total: { type: Number },
    notes: { type: String },
    itemsHash: { type: String },
    items: [{
        product: { type: Schema.Types.ObjectId, ref: 'product' },
        quantity: { type: Number },
        price: { type: Number }
    }],
}, { timestamps: true });

// This sequence schema is used to create a counter, that we can use to automatically increase the order number
// by one every time a new order is created.  Then we can encode this order number, and turn it into an easy to 
// use order code.  Which will give us a large keyspace with only a few characters.  We start it at 1000, so we start with a 3 character code.
export const OrderCounterSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    seq: { type: Number, default: 1 }
});

export const OrderCounter = mongoose.model('orderCounter', OrderCounterSchema);

//If you do any pre save methods, and you use fat arrow syntax 'this' doesn't refer to the document.
OrderSchema.pre('save',  function(next) {
    var doc: any = this;
    OrderCounter.findByIdAndUpdate({_id: 'order'}, {$inc: { seq: 1} }, {new: true, upsert: true}).then((count: any) => {
        doc.orderNumber = count.seq;

        log.info(`The order ID were encoding: ${this.orderNumber}`);
    
        doc.code = BijectionEncoder.encode(doc.orderNumber);
        next();
    })
    .catch(error=>{
        log.error(`There was an error during counter execution.  ${error}`);
        throw error;
    });
});

// This will compile the schema for the object, and place it in this Instance.
export const Order = mongoose.model<IOrderDoc>('order', OrderSchema);   
