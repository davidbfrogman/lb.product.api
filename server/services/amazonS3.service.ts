import * as AWS from 'aws-sdk';
import { Router, Request, Response, RequestParamHandler, NextFunction, RequestHandler, Application } from 'express';
import mongoose = require('mongoose');
import { Schema, Model, Document } from 'mongoose';
import { Config } from '../config/config';
import { ITokenPayload, IBaseModelDoc, IProduct, MulterFile } from '../models/';
import { CONST } from "../constants";
import { ApiErrorHandler } from "../api-error-handler";
import * as rimraf from 'rimraf';
import * as path from 'path';
import * as multer from 'multer';
import * as sharp from 'sharp';
import log = require('winston');
import * as enums from '../enumerations';
import * as fs from 'async-file';
import { S3 } from 'aws-sdk';

export class AmazonS3Service{

    public static async uploadImageToS3(response: Response, rawImageFile: MulterFile, imageType: enums.ImageType): Promise<S3.PutObjectOutput> {
        let data = null;
        try {
            data = await fs.readFile(path.resolve(__dirname, '../../', `${CONST.IMAGE_UPLOAD_PATH}${this.variationName(imageType, rawImageFile)}`));
        } catch (err) {
            ApiErrorHandler.sendError(`Problem reading the contents of resized file back out. ${err}`, 500, response, null, err);
            return;
        }

        //while we still have easy access to the file we're going to send it up to s3.

        this.configureAws();

        const s3 = this.configureS3(rawImageFile.mimetype);

        try {
            let s3data = await s3.putObject({
                Body: data,
                Bucket: Config.active.get('ProductImageBucketName'),
                Key: this.variationName(imageType, rawImageFile),
                Metadata: {
                    ContentType: rawImageFile.mimetype
                },
                ContentType: rawImageFile.mimetype
            }).promise();

            log.info(`Uploaded image to s3:${JSON.stringify(s3data.$response.data)}`);
            return s3data;
        } catch (err) {
            ApiErrorHandler.sendError(`Failure during s3 upload. ${err}`, 500, response, null, err);
        }
    }

    public static async cleanAws(rawImageFile: MulterFile, imageType: enums.ImageType){
        this.configureAws();
        
        await this.deleteFileFromS3(this.variationName(imageType, rawImageFile));
    }

    private static configureS3(mimeType: string): S3{
        const options: S3.ClientConfiguration = {
            apiVersion: '2006-03-01',
            params: {
                Bucket: Config.active.get('ProductImageBucketName'),
                ACL: 'public-read',
                Metadata: {
                    ContentType: mimeType
                }
            }
        };
        return new AWS.S3(options);
    }
    
    private static configureAws() {
        AWS.config.update({
            accessKeyId: Config.active.get('AWSAccessKey'),
            secretAccessKey: Config.active.get('AWSSecret'),
            region: 'us-east-2',
        });
    }

    public static variationName(imageType: enums.ImageType, rawImageFile: MulterFile): string {
        return `${enums.ImageType[imageType]}-${rawImageFile.filename}`;
    }

    public static async deleteFileFromS3(key: string): Promise<S3.DeleteObjectOutput>{
        this.configureAws();
        const s3: S3 = this.configureS3(null)
        let s3data = await s3.deleteObject({
            Bucket: Config.active.get('ProductImageBucketName'),
            Key: key
        }).promise();

        log.info(`Cleanup: Deleted Object from S3: ${JSON.stringify(s3data.$response.data)}`);

        return s3data;
    }
}