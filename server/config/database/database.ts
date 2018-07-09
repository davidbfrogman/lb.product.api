import mongoose = require('mongoose');
import { ConnectionOptions } from 'mongoose';
import { Config } from '../config';
import { HealthStatus } from '../../health-status';
import log = require('winston');
mongoose.Promise = require('bluebird'); 
//import autoIncrement = require('mongoose-auto-increment');
import { OrderSchema } from '../../models/order.interface';

export class Database {

    public static databaseName: string = '';
    public static async connect(): Promise<void> {
        const connectionOptions: any = {
            useMongoClient: true,
        }
        if(!HealthStatus.isDatabaseConnected){
            try{
                await mongoose.connect(Config.active.get('database.mongoConnectionString'), connectionOptions);
                this.databaseName = mongoose.connection.db.databaseName;

                log.info(`Connected To Mongo Database: ${mongoose.connection.db.databaseName}`);
                HealthStatus.isDatabaseConnected = true;
            }
            catch(err){
                log.info('error while trying to connect with mongodb', err);
                HealthStatus.isDatabaseConnected = false;
            }
        }
    }
}

export { mongoose };