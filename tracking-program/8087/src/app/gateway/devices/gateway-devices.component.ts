import {Component, ViewChild} from '@angular/core';

import {GatewayService} from "./gateway-device.service";
import { SessionStorage } from '../../shared/helpers/sessionStorage.service';

@Component({
  templateUrl: 'gateway-devices.component.html',
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
    this.gatewayService.getPaginated(params).subscribe(responseData =>{
      this.recordCount = responseData.meta.total;
      this.devices = responseData.response;
    });
  }
}
