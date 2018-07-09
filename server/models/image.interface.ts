import * as enums from "../enumerations";

export interface IImage{
    _id?: string,
    order?: number,
    isActive?: boolean,
    variations?: IImageVariation[],
}

export interface IImageVariation{
    _id?: string,
    type?: enums.ImageType,
    url?: string,
    width?: number,
    height?: number,
    key?: string,
}
