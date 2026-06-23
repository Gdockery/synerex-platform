import {Inject, Injectable}              from '@angular/core';
import {BaseTypeService} from "../shared/baseTypeService";
import {APP_CONFIG, IAppConfig} from "../config/app.config";

@Injectable()
export class DeviceTypeService extends BaseTypeService {
  public types;
  protected typeKey = 'deviceType';

  constructor(@Inject(APP_CONFIG) private config: IAppConfig) {
    super();
    this.types = [
      {id:config.constants.DEVICE_TYPES.XECO_UNIT,name:"Synerex Unit"},
    ];
  }
}
