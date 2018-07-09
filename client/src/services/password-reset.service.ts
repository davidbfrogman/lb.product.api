import { BaseService } from "./";
import { Observable } from "rxjs/Observable";
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
// This is required for our catch call...
// I'm concerned about load time, so I'm adding observables very carefully.
import 'rxjs/add/operator/catch';
import { ServiceError } from "../classes/app-error.class";
import { CONST } from '../constants';

@Injectable()
export class PasswordResetService extends BaseService {

    constructor(protected http: Http) {
        super(http);
    }

    public requestPasswordReset(email: string): Observable<Response> {
        return super.postObject(CONST.ep.PASSWORD_RESET_REQUEST, {
            email: email
        });
    }

    public resetPassword(passwordResetTokenId: string, password: string): Observable<Response> {
        return super.postObject(CONST.ep.PASSWORD_RESET, {
            passwordResetTokenId: passwordResetTokenId,
            password: password
        });
    }
}