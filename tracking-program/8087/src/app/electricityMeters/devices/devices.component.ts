import {timer as observableTimer, Observable} from 'rxjs';
import {Component, OnInit, ViewChild} from '@angular/core';
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {DeviceService} from "./device.service";
import {CsvExportService} from "../../shared/csvExport.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {ConfirmationService} from "primeng/primeng";
import { SessionStorage } from '../../shared/helpers/sessionStorage.service';

let _ = require('lodash');

@Component({
  templateUrl: 'devices.component.html',
})
export class DevicesComponent implements OnInit {
  @ViewChild('table', {static: false}) table;
	public devices:Array<any> = [];
	private timer;
  private subscription;
	private tableFirst;
  private totalKw;
  private totalAmp;
  private totalKva;
  private totalKvar;
  private avgPf;
  private outputAmp;


  constructor(storage: SessionStorage, private deviceService: DeviceService, private csvExport: CsvExportService, private timeHelpers: TimeHelpers, private confirmationService: ConfirmationService, private userService: CurrentUserService) {
		this.tableFirst = storage.tableFirstHandler()
	}

  ngOnInit() {
    this.timer = observableTimer(5,60000);
    this.subscription = this.timer.subscribe(energySavingsData => {
      this.refreshTable();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }


  confirmExport() {
    this.confirmationService.confirm({
      header: 'Confirm Export',
      message: 'Would you like to export a snapshot of the current meter data?',
      accept: () => {
        this.export();
      }
    });
  }

  private export() {
    let exportData = _.cloneDeep(this.devices).map(device => {
      device.lastCommunicatedAt = this.timeHelpers.momentForUserTz(device.lastCommunicatedAt, 'x').format('MM/DD/YYYY hh:mm:ss');
      return device;
    });
    this.csvExport.downloadCsv(
      exportData,
      ["name", "lastCommunicatedAt","lastL1Volt","lastL1Amp","lastL1Kw","lastL1Kva","lastL1Pf","lastL1THD","lastL1Kvar","lastL2Volt","lastL2Amp","lastL2Kw","lastL2Kva","lastL2Pf","lastL2THD","lastL2Kvar","lastL3Volt","lastL3Amp","lastL3Kw","lastL3Kva","lastL3Pf","lastL3THD","lastL3Kvar","lastTotalVolt","lastTotalAmp","lastTotalKw","lastTotalKva","lastTotalPf","lastTotalTHD","lastTotalKvar","lastOutputAmp","rawData"],
      'meter data export ('+this.timeHelpers.moment().format('MM-DD-YYYY')+').csv'
    );
   }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  private refresh(params) {
    params.project = this.userService.user.selectedProject.id;
    this.deviceService.getDevicesWithData(params).subscribe(data => {
      this.devices = data.response;
      this.devices.map(device => {
        device.lastTimestamp = this.timeHelpers.momentForUserTz(device.lastTimestamp, 'x').format('MM/DD/YYYY hh:mm:ss');
        return device;
      });
      this.totalKw = this.devices.reduce((accumulator, object) => {return accumulator + object.lastTotalKw;}, 0);
      this.totalAmp = this.devices.reduce((accumulator, object) => {return accumulator + object.lastTotalAmp;}, 0);
      this.totalKva = this.devices.reduce((accumulator, object) => {return accumulator + object.lastTotalKva;}, 0);
      this.totalKvar = this.devices.reduce((accumulator, object) => {return accumulator + object.lastTotalKvar;}, 0);
      this.avgPf = this.devices.reduce((accumulator, object) => {return accumulator + (object.lastTotalPf * (object.lastTotalAmp / this.totalAmp));}, 0);
      this.outputAmp = this.devices.reduce((accumulator, object) => {return accumulator + (object.lastOutputAmp / 30);}, 0);
    });
  }

}
