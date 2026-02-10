import {Inject, Injectable}              from '@angular/core';


import {APP_CONFIG, IAppConfig} from "../../config/app.config";
import {BaseTypeService} from "../../shared/baseTypeService";

@Injectable()
export class CsvDataTypesService extends BaseTypeService {
  public types;
  protected typeKey = 'reportType';

  constructor(@Inject(APP_CONFIG) private config: IAppConfig) {
    super();
    this.types = [
      {id:config.constants.METER_CSV_TYPES.DETAILED_METER,name:"Detailed Meter",description:"Generate a detailed CSV for selected electricity meters within a given date range grouped by duration.", count:0},
    ];
  }
}
