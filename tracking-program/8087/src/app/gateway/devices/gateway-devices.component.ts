import {Component, ViewChild} from '@angular/core';

import {GatewayService} from "./gateway-device.service";
import { SessionStorage } from '../../shared/helpers/sessionStorage.service';

@Component({
  templateUrl: './gateway-devices.component.html',
})
export class GatewayDevicesComponent {

  @ViewChild('table', {static: false}) table;

  public devices;

  public recordCount = 0;
	public perPage = 15;
	
	private tableFirst;

  constructor(storage: SessionStorage, private gatewayService: GatewayService) {
		this.tableFirst = storage.tableFirstHandler()
	}

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refresh(params) {
    const safeParams = (params && params.rows != null && params.first != null)
      ? params : { first: 0, rows: this.perPage, sortField: null, sortOrder: null };
    this.gatewayService.getPaginated(safeParams).subscribe(
      responseData => {
        this.recordCount = (responseData && responseData.meta && responseData.meta.total != null)
          ? responseData.meta.total : 0;
        this.devices = (responseData && responseData.response) ? responseData.response : [];
      },
      () => {
        this.recordCount = 0;
        this.devices = [];
      }
    );
  }
}
