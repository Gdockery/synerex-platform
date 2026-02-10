import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

import {TestDataService} from "../test-data.service";
import {ApiHelpers} from "../../shared/helpers/apiHelpers.service";

@Component({
  selector: 'view-test-data',
  template: `
    <div class="col-md-12">
      <div class="pull-right">
        <button class="default-button green-button" [routerLink]="['/tests/view/' + testId]" style="margin-right: 10px">View Report</button>
        <button class="default-button green-button" [routerLink]="['/tests/list']">Back to Test List</button>
      </div>
    </div>
    <div class="col-md-12"> 
      <h2>{{recordCount}} Records</h2>
      <p-dataTable #table tableStyleClass="table dataTable table-striped table-bordered" [value]="testData" [lazy]="true" [rows]="perPage" [paginator]="true"
                   [totalRecords]="recordCount" (onLazyLoad)="refreshData($event)">
        <p-column field="name" header="Name" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="totalKw" header="KW Supply" [sortable]="true"></p-column>
        <p-column field="totalPf" header="Power Factor" [sortable]="true"></p-column>
        <p-column field="totalVolt" header="Voltage" [sortable]="true"></p-column>
        <p-column field="totalAmp" header="Current" [sortable]="true"></p-column>
        <p-column field="totalKva" header="KVA Demand" [sortable]="true"></p-column>
        <p-column field="totalKvar" header="Kvar" [sortable]="true"></p-column>
        <p-column field="name" header="Time" [sortable]="true">
          <ng-template let-col let-row="rowData" pTemplate="body">
            {{(row.recordedAt | projectTzMoment) | amDateFormat:'MM/DD/YYYY hh:mm:ss A'}}
          </ng-template>
        </p-column>
        <!--<p-column field="hidden" header="Hidden" [filter]="true" filterMatchMode="equals" [sortable]="true">
          <ng-template pTemplate="filter" let-col>
            <select (change)="table.filter($event.target.value,'showHidden',col.filterMatchMode)" class="ui-column-filter" style="display:block;width: 100%;">
              <option value="false">Hide Hidden</option>
              <option value="true">Show Hidden</option>
            </select>
          </ng-template>
          <ng-template let-col let-row="rowData" pTemplate="body">
            {{row.hidden ? 'Yes' : 'No'}}
          </ng-template>
        </p-column>
        <p-column field="type" header="Type" styleClass="text-center">
          <ng-template pTemplate="header">
            <div class="checkbox" style="margin:0;">
              <label><input type="checkbox" (change)="massSelect()" [(ngModel)]="massSelectValue"></label>
            </div>
            <button class="default-button red-button" (click)="massHide()">Hide</button>
            <button class="default-button green-button" (click)="massShow()">Show</button>
          </ng-template>
          <ng-template let-col let-row="rowData" pTemplate="body" let-i="rowIndex">
            <label><input type="checkbox" [(ngModel)]="row.selected"></label>
          </ng-template>
        </p-column>-->
      </p-dataTable>
    </div>
  `
})
export class ViewTestDataComponent implements OnInit {

  @ViewChild('table', {static: false}) table;

  protected testId;
  protected testData;
  protected params = {};

  protected recordCount = 0;
  protected perPage = 100;

  protected massSelectValue;

  constructor(private testDataService: TestDataService, private route: ActivatedRoute, private apiHelpers: ApiHelpers) {}

  ngOnInit() {
    this.route.params.subscribe(urlParams => {
      this.testId = +urlParams['id'];
    });
  }

  refreshData(params) {
    let requestParameters = this.apiHelpers.parsePaginationParams(params);
    this.testDataService.getForTest(this.testId, requestParameters).subscribe(data => {
      this.recordCount = data.meta.total;
      this.testData = data.response.map(meterData => {
        meterData.totalKw = meterData.totalKw.toFixed(2);
        meterData.totalVolt = meterData.totalVolt.toFixed(2);
        meterData.totalPf = meterData.totalPf.toFixed(2);
        meterData.totalAmp = meterData.totalAmp.toFixed(2);
        meterData.totalKva = meterData.totalKva.toFixed(2);
        meterData.totalKvar = meterData.totalKvar.toFixed(2);
        return meterData;
      });
    });
  }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  massHide() {
    this.testDataService.hideMultiple(this.testId, this.getSelectedData(this.testData)).subscribe(result => {
      this.refreshTable();
    });
  }

  massShow() {
    this.testDataService.showMultiple(this.testId, this.getSelectedData(this.testData)).subscribe(result => {
      this.refreshTable();
    });
  }

  massSelect() {
    this.testData.forEach(switchModel => {
      switchModel.selected = this.massSelectValue;
    });
  }

  getSelectedData(data) {
    return data.reduce((acc, dataModel) => {
      if(dataModel.selected) {
        acc.push(dataModel.id);
      }
      return acc;
    }, []);
  }
}
