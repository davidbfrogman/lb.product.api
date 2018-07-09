import { IPushNotificationPayload } from "../models/push-notification.interface";
import * as log from "winston";
import * as admin from 'firebase-admin';

var serviceAccount = require('../firebaseKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://leblum-io.firebaseio.com"
});

export class FirebaseService {
    constructor() {
    }

    public static async sendNotification(
        tokens: Array<string>, 
        notification: IPushNotificationPayload
    ) : Promise<admin.messaging.MessagingDevicesResponse> {
        // Send a message to the devices corresponding to the provided
        // registration tokens.
        try {
            let response = await admin.messaging().sendToDevice(tokens,notification);
            log.info('Sent a notification to device', response);
            return response;
        } catch (error) {
            log.error('Error Sending notification to device', error);
            throw (error);
        }
    }
}

