import { Router, Request, Response, RequestParamHandler, NextFunction, RequestHandler, Application } from 'express';
import mongoose = require('mongoose');
import { Schema, Model, Document } from 'mongoose';
import { Config } from '../config/config';
import { ITokenPayload, IBaseModelDoc, IProduct } from '../models/';
import { CONST } from "../constants";
import { ApiErrorHandler } from "../api-error-handler";
import * as rimraf from 'rimraf';
import * as path from 'path';
import * as multer from 'multer';
import * as sharp from 'sharp';
import log = require('winston');
import * as enums from '../enumerations';
import * as AWS from 'aws-sdk';
import { ProductRepository } from '../repositories/index';
import * as fs from 'async-file';
import { MulterFile } from '../models';
import { AmazonS3Service } from '../services/index';
import { IImage, IImageVariation } from '../models/image.interface';

export class ImageUploadController {

    public async imageUploadMiddleware(request: Request, response: Response, next: NextFunction) {
        try {
            // Because this is created as a middleware this doesn't point to the class.
            await new ImageUploadController().handler(request, response, next);
            next();
        } catch (err) {
            ApiErrorHandler.sendError(`Image Uploading / Resizing failed. ${err}`, 500, response, null, err);
        }
    }

    public async handler(request: Request, response: Response, next: NextFunction) {

        if (request && request.files && request.files[0]) {
            // Grab the multer file off the request.  
            const rawImageFile = request.files[0] as MulterFile;
            try {
                //Now we go get the product
                const product = await new ProductRepository().single(request.params['id']);

                // Create image variations
                const raw = await this.generateVariation(enums.ImageType.raw, rawImageFile, response);
                const thumb = await this.generateVariation(enums.ImageType.thumbnail, rawImageFile, response, 150, 150);
                const icon = await this.generateVariation(enums.ImageType.icon, rawImageFile, response, 50, 50, 50);
                const small = await this.generateVariation(enums.ImageType.small, rawImageFile, response, 300);
                const medium = await this.generateVariation(enums.ImageType.medium, rawImageFile, response, 500);
                const large = await this.generateVariation(enums.ImageType.large, rawImageFile, response, 1024);

                // figure out what the maximum product image order number is, and add one to it. 
                const nextOrderNum = this.getNextOrderNumber(product) + 10;

                let image: IImage = {
                    isActive: true,
                    order: nextOrderNum,
                    variations: new Array<IImageVariation>()
                }

                // Add the product images.
                this.addVariation(image, rawImageFile, raw, enums.ImageType.raw, nextOrderNum);
                this.addVariation(image, rawImageFile, thumb, enums.ImageType.thumbnail, nextOrderNum);
                this.addVariation(image, rawImageFile, icon, enums.ImageType.icon, nextOrderNum);
                this.addVariation(image, rawImageFile, small, enums.ImageType.small, nextOrderNum);
                this.addVariation(image, rawImageFile, medium, enums.ImageType.medium, nextOrderNum);
                this.addVariation(image, rawImageFile, large, enums.ImageType.large, nextOrderNum);

                // If this is the first image, we're going to create a new array.
                if(!product.images){
                    product.images = new Array<IImage>();
                }

                product.images.push(image);

                // Save the updated product.
                const updatedProduct = await new ProductRepository().save(product);

                response.status(200).json(updatedProduct);
            } catch (err) {
                this.rollbackProductImages(rawImageFile, true);
                ApiErrorHandler.sendError(`Error during image processing. ${err}`, 500, response, null, err);
            }
            finally {
                this.rollbackProductImages(rawImageFile, false);
            }
        }
        else {
            ApiErrorHandler.sendError(`File wasn't present on the request.  Are you sure you sent the file with field named 'file'`, 500, response, null, null);
        }
    }

    public getNextOrderNumber(product: IProduct): number {
        if (product && product.images && product.images.length > 0) {
            let max = 0;
            product.images.forEach(image => {
                max = Math.max(max, image.order);
            });
            return ++max;
        }
        return 0;
    }

    public addVariation(image: IImage, file: MulterFile, sharpInfo: sharp.OutputInfo, type: enums.ImageType, order: number): IImage {
        image.variations.push({
            type: type,
            height: sharpInfo.height,
            width: sharpInfo.width,
            url: `${Config.active.get('ProductImageURLLocationRoot')}${Config.active.get('ProductImageBucketName')}/${AmazonS3Service.variationName(type, file)}`,
            key: AmazonS3Service.variationName(type, file)
        });
        return image;
    }

    public async generateVariation(imageType: enums.ImageType, rawImageFile: MulterFile, response: Response, width: number = null, height: number = null, quality: number = 80): Promise<sharp.OutputInfo | any> {
        // If you don't turn off cache when you're trying to cleanup the files, you won't be able to deconste the file.
        sharp.cache(false);

        const outputInfo: sharp.OutputInfo = await sharp(path.resolve(__dirname, '../../', `${CONST.IMAGE_UPLOAD_PATH}${rawImageFile.filename}`))
            .resize(width, height)
            .crop(sharp.gravity.center)
            .toFormat(sharp.format.png, {
                quality: quality,
            })
            .toFile(`${CONST.IMAGE_UPLOAD_PATH}${AmazonS3Service.variationName(imageType, rawImageFile)}`);

        await AmazonS3Service.uploadImageToS3(response, rawImageFile, imageType);

        return outputInfo;
    }

    public async rollbackProductImages(rawImageFile: MulterFile, cleanS3: boolean) {
        try {
            // first we're going to try and clean up the image file that was uploaded to the server.
            await fs.delete(path.resolve(__dirname, '../../', `${CONST.IMAGE_UPLOAD_PATH}${rawImageFile.filename}`));
        } catch (err) {
            log.error(`SWALLOWING! There was an error trying to delete the file that was created during upload.
            Upload path could fill. filename: ${rawImageFile.filename}  Exception: ${err}`);
        }

        try {
            // Now we're going to try and cleanup the images on s3
            //while we still have easy access to the file we're going to send it up to s3.
            this.rollbackImageVariations(rawImageFile, enums.ImageType.raw, cleanS3);
            this.rollbackImageVariations(rawImageFile, enums.ImageType.icon, cleanS3);
            this.rollbackImageVariations(rawImageFile, enums.ImageType.thumbnail, cleanS3);
            this.rollbackImageVariations(rawImageFile, enums.ImageType.small, cleanS3);
            this.rollbackImageVariations(rawImageFile, enums.ImageType.medium, cleanS3);
            this.rollbackImageVariations(rawImageFile, enums.ImageType.large, cleanS3);

        } catch (err) {
            log.error(`SWALLOWING!  There was an error trying to cleanup the files from the server, and S3.
            Upload path could fill. filename: ${rawImageFile.filename}  Exception: ${err}`);
        }

    }

    public async rollbackImageVariations(rawImageFile: MulterFile, imageType: enums.ImageType, cleanS3: boolean): Promise<void> {
        try {
            // now we're going to try and clean up all the variations that were created.
            await fs.delete(path.resolve(__dirname, '../../', `${CONST.IMAGE_UPLOAD_PATH}${AmazonS3Service.variationName(imageType, rawImageFile)}`));
        } catch (err) {
            log.error(`SWALLOWING! While trying to cleanup image variations there was an error. filename: ${AmazonS3Service.variationName(imageType, rawImageFile)}
             Exception: ${err}`);
        }

        try {
            if (cleanS3) {
                AmazonS3Service.cleanAws(rawImageFile, imageType);
            }
        } catch (err) {
            log.error(`SWALLOWING! Exception while trying to clean the image from S3 KEY: ${AmazonS3Service.variationName(imageType, rawImageFile)}
            Exception: ${err}`);
        }
    }
}
