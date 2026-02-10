import {InjectionToken} from "@angular/core";

export let APP_CONFIG = new InjectionToken('app.config');
let constants = require('../../../config/constants.js');

export interface IAppConfig {
  locals: any,
  constants: any
}

export const AppConfig: IAppConfig = {
  locals: window["SAILS_LOCALS"],
  constants: constants.constants
};
