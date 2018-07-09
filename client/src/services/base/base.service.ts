import { Http, Response, Headers, RequestOptions } from '@angular/http';
import {MimeType} from '../../enumerations';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';

import { ServiceError } from '../../classes/app-error.class'
import { BaseModel } from '../../models';
import { environment } from "../../environments/environment";


export class BaseService {

    protected requestOptions: RequestOptions;
    protected identityApiBaseV1: string = `${environment.IdentityAPIBase}${environment.IdentityAPIVersion}`;

    public constructor(protected http: Http){
        this.requestOptions = new RequestOptions({
            headers: new Headers({ 'Content-Type': MimeType.JSON })
        });
    }

    protected postObject(endpoint: string, object: any): Observable<Response>{
        return this.http.post(`${this.identityApiBaseV1}${endpoint}`, object, this.requestOptions)
            .map((res: Response) => {
                return res;
            }).catch(this.handleError);
    }

    // The server will be sending this back:
    // response.json({
    //     message: error.message || 'Server Error',
    //     status: error.status || 500,
    //     URL: request.url,
    //     method: request.method,
    //     stack: Config.active.get('returnCallStackOnError') ? error.stack : '',
    //     requestBody: request.body
    // });
    protected handleError(errorResponse: Response | any) {
        // TODO: Implement Real Logging infrastructure.
        // Might want to log to remote server (Fire and forget style)
        const appError = new ServiceError();
        if (errorResponse instanceof Response) {
            const body = errorResponse.json() || '';
            appError.message = body.message ? body.message : 'no message provided';
            appError.description = body.description ? body.description : 'no description provided';
            appError.stack = body.stack ? body.stack : 'no stack provided';
            appError.statusCode = errorResponse.status;
            appError.statusText = errorResponse.statusText;
            return Observable.throw(appError);
        } else {
            appError.message = typeof errorResponse.message !== 'undefined' ? errorResponse.message : errorResponse.toString();
            return Observable.throw(appError);
        }
    }
}

