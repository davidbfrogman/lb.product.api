import { IProduct, Product, OrderCounter } from "../../models";
import { Config } from "../config";
import { CONST } from "../../constants";
import { OrganizationType } from "../../enumerations";
const util = require('util');
var bcrypt = require('bcrypt');
import log = require('winston');
import { mongoose } from "./database";

export class DatabaseBootstrap {

    public static async seed() {
        // We need to seed this data if it doesn't exist.  
        // We're trying to make sure there is a record of the order number in the database, as that's what we use to generate new id's
        const orderCounterRecord = await OrderCounter.findById({_id: 'order'});
        
        if(!orderCounterRecord){
            await OrderCounter.create({_id: 'order', seq: 1000 });
        }
    }
}