import {Inject, Injectable}              from '@angular/core';


import {APP_CONFIG, IAppConfig} from "../../config/app.config";
import {BaseTypeService} from "../../shared/baseTypeService";

@Injectable()
export class RepeaterAlertTypesService extends BaseTypeService{
  public types;
  protected typeKey = 'alertType';

  constructor(@Inject(APP_CONFIG) private config: IAppConfig) {
    super();
    this.types = [
      {id:1,name:"Lost Communication",description:"If a repeater has lost communication for greater than a specified duration.", count: 0},
    ];
  }
}
