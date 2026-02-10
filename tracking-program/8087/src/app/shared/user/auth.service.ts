import {Injectable, Inject} from '@angular/core';

import { User } from "./user";
import {IAppConfig, APP_CONFIG} from "../../config/app.config";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class AuthService {
  constructor (protected http: HttpClient) {}

  logout() {
    return this.http.get('/logout', {responseType: 'text'});
  }
}
