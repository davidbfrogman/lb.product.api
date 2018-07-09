//During the test the env variable is set to test
import { Database } from '../config/database/database';
import { App, server } from '../server-entry';
import { Product, IProduct, Supplier, Order, OrderCounter, Notification } from '../models';
import { Config } from '../config/config';
import { HealthStatus } from '../health-status';
import mongoose = require('mongoose');
import * as log from 'winston';


import * as chai from 'chai';
import { CONST } from "../constants";
let expect = chai.expect;
let should = chai.should();
chai.use(require('chai-http'));
import { suite, test, context, } from "mocha-typescript";

export class Cleanup {
    
    public static async clearDatabase() {
        //await Database.connect();
        if (process.env.NODE_ENV === 'integration'
            && Database.databaseName.includes('integration')
        ) {
            log.info('Clearing the database.');
            await Product.remove({});
            await Supplier.remove({});
            await Order.remove({});
            await Notification.remove({});
            // We don't clear out the order number counter table.  Otherwise we would have to call seed in all of our tests.
            // I don't want to have to call seed.
            //await OrderCounter.remove({});
            log.info('Database all clear');
        }
        else {
            throw ('The clear database method is trying to be run against a database that isnt integration');
        }
    }
}