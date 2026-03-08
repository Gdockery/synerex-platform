import {Component, ViewChild} from '@angular/core';

import {RepeaterService} from "./repeater-device.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import { SessionStorage } from '../../shared/helpers/sessionStorage.service';

@Component({
  templateUrl: './repeater-devices.component.html',
})
export class RepeaterDevicesComponent {

  @ViewChild('table', {static: false}) table;

  public devices;

  public recordCount = 0;
	public perPage = 10;
	
	private tableFirst;

  constructor(storage: SessionStorage, private repeaterService: RepeaterService, private userService: CurrentUserService) {
		this.tableFirst = storage.tableFirstHandler()
	}

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refresh(params) {
    this.repeaterService.getPaginated(params).subscribe(
      responseData => {
        this.recordCount = (responseData && responseData.meta) ? responseData.meta.total : 0;
        this.devices = (responseData && responseData.response) ? responseData.response : [];
      },
      () => {
        this.recordCount = 0;
        this.devices = [];
      }
    );
  }

  colorFromComStatus(item) {
    let now = (new Date).getTime(),
      recentGateway = (now - item.meshLastCommunicatedAt) < 2 * 60000,
      recentStatus = (now - item.lastCommunicatedAt) < 2 * 60000

    if (recentStatus) {
      return 'green'
    }
    if (recentGateway) {
      return 'yellow'
    }
    return 'red'
  }
}
