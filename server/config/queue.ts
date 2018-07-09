import log = require('winston');
import { Config } from './config'
import { CONST } from '../constants';

let jackrabbit = require('jackrabbit');
let url = Config.active.get('ampq.ampqConnectionString');

let rabbit = jackrabbit(url);
log.info(`Connected to RabbitMQ on url:${url}`);

let exchange = rabbit.default();

let queue = exchange.queue({ name: CONST.LEBLUM_API_Q_BACKPLANE, durable: true, prefetch:1 });
log.info(`Started Queue Name:${CONST.LEBLUM_API_Q_BACKPLANE}`);

export { rabbit, exchange, queue };