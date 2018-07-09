import * as crypto from 'crypto';
import * as mime from 'mime';
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { CONST } from '../constants';
import * as log from 'winston';
import { ApiErrorHandler } from '../api-error-handler';


export class MulterConfiguration{
    public constructor(){
        this.ensureUploadFolderExists();
    }

    public storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, `${CONST.IMAGE_UPLOAD_PATH}`)
        },
        filename: this.fileName,
    });

    public uploader = multer({
        storage: this.storage,
        fileFilter: this.fileFilter,
        limits: {
            fileSize : 200000000, //200mb limit on filesize, this number is in bytes
            files: 25 //maximum  of 30 files at a time
        },
    });

    public ensureUploadFolderExists(){
        try{
            var dir = CONST.IMAGE_UPLOAD_PATH;
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
        }
        catch(err){
            throw(JSON.stringify({
                message: 'There was an error creating the default file upload directory.  Check Multer.',
                error: err
            }));
        }
    }

    public fileName(req, file, cb) {
        crypto.pseudoRandomBytes(16, (err, raw) => {
            let fileName: string = file.originalname;
            // I'm slicing off the extention, so that the image name is easier to read, although this might
            // lead to problems later, if for some reason there is a file named 'a.y'
            // first trim off the extension with .jpg etc...
            let tokens = fileName.split(new RegExp('\.[^.]+$'));
            if(tokens.length != 2)
            {
                log.error('A bad file was uploaded in multer: here are the tokens that broke it:' + tokens);
                return cb(new Error('The file you tried to upload was not named in a standard format. filename.jpeg is expected.'), false);
            }
            // Here we're trimming the filename down to 15 chars.  I don't want ridiculously long filenames.
            tokens[0] = tokens[0].trim().substring(0,Math.min(tokens[0].length,15))
            cb(null,`${tokens[0]}-${raw.toString('hex')}-${Date.now()}.${mime.getExtension(file.mimetype)}`);
        });
    }

    public fileFilter(req, file, cb) {
        // accept image only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg|)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}