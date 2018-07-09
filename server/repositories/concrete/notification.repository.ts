import { Notification, INotificationDoc } from "../../models/index";
import { Model } from "mongoose";
import { BaseRepository } from '../base/base.repository';
import { IBaseRepository } from '../base/base.repository.interface';
import { INotificationRepository } from '../interfaces/Notification.repository.interface';

export class NotificationRepository extends BaseRepository<INotificationDoc> implements INotificationRepository, IBaseRepository<INotificationDoc> {
    protected mongooseModelInstance: Model<INotificationDoc> = Notification;
    
    public constructor() {
        super();
    }
}