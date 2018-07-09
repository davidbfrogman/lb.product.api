import { BaseService } from "./";
import { Observable } from "rxjs/Observable";
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
// This is required for our catch call...
// I'm concerned about load time, so I'm adding observables very carefully.
import 'rxjs/add/operator/catch';
import { ServiceError } from "../classes/app-error.class";
import { environment } from '../environments/environment';
import { CONST } from '../constants';

@Injectable()
export class EmailVerificationService extends BaseService {

    constructor(protected http: Http) {
        super(http);
    }

    // Makes a request to the api to verify the email id.
    public verifyEmail(id: string): Observable<Response> {
        return super.postObject(CONST.ep.VALIDATE_EMAIL, { id: id });
    }
}