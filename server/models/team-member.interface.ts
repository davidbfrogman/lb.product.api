import { mongoose } from '../config/database/database';
import { IBaseModel, IBaseModelDoc } from "./index";
import * as enums from "../enumerations";
import { IOwnership } from "./ownership.interface";
import { IImage } from './image.interface';


export interface ITeamMember {
    userId: string,
    isApproved: boolean,
    memberType: enums.TeamMemberType,
}