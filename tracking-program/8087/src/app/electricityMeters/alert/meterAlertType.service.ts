import {Inject, Injectable}              from '@angular/core';
import {APP_CONFIG, IAppConfig} from "../../config/app.config";
import {BaseTypeService} from "../../shared/baseTypeService";

@Injectable()
export class MeterAlertTypesService extends BaseTypeService {
  public types;
  protected typeKey = 'alertType';

  constructor(@Inject(APP_CONFIG) private config: IAppConfig) {
    super();
    this.types = [
      {id:config.constants.METER_ALERT_TYPES.HIGH_DEMAND,name:"High Metered Demand",description:"If an electricity meter reports wattage demand above a given threshold for more than a specified duration, trigger an alert."},
      {id:config.constants.METER_ALERT_TYPES.GATEWAY_ERROR,name:"Gateway Error",description:"When internet connection has been lost, trigger an alert."},
    ];
  }
}
