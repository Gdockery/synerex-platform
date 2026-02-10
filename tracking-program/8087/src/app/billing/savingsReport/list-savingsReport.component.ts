import { Component, OnInit, Inject, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { SavingsReportService } from "./savingsReport.service";
import { BillAnalyticService } from "../billAnalytic/billAnalytic.service";
import { CurrentUserService } from "../../shared/user/currentUser.service";
import { ObjectHelpers } from "../../shared/helpers/objectHelpers.service";
import { ApiHelpers } from "../../shared/helpers/apiHelpers.service";
import { ConfirmationService } from "primeng/primeng";
import { PdfLinkService } from "../../shared/pdfLink.service";
import { FileUpload } from "primeng/components/fileupload/fileupload";
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

let moment = require('moment');

@Component({
  template: `
    <style>
      .disable-container {
        color: rgba(51, 51, 51, 0.5);
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 1;
        background-color: rgba(250, 250, 250, 0.75);
        text-align: center;
        padding-top: 30%;
        font-size: 1.5em;
        font-weight: bold;
        animation: fadeIn 0.1s;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      iframe {
        width: 100%;
        height: 635px;
      }
      #pdfContainer > div {
        display: none;
        position: absolute;
        left: 1em;
        top: 0;
        background-color: white;
        padding: 0.3em;
      }
      #pdfContainer:hover > div {
        display: block;
      }
    </style>
    
    <div class="content-box">
      <div *ngIf="billAnalytic===false">
        <h3>Electric Bill Analytics</h3>
        <p>Create a new monthly cost savings report for this project or review reports from this client past electric bills.</p>
        <button *ngIf="userService.user.role === 8 || userService.user.role === 7" class="default-button green-button" [routerLink]="['/billing/bill-analytic/create']">Create Initial Analytic</button>
      </div>
      
      <div *ngIf="billAnalytic">
        <div class="row">
          <div class="col-md-6">
            <p>
              You can create a new monthly cost savings report for this project here, or
              review/manage reports from this client project's past electric bills.
            </p>
            <div>
              <button *ngIf="userService.user.role === 8 || userService.user.role === 7 || userService.user.role === 4 || userService.user.role === 2" class="default-button green-button" [routerLink]="['/billing/savings-report/create']">Enter New Month's Electric Bill</button>
              <p style="font-size: 18px">
                The initial billing analytic was created {{(billAnalytic.date | projectTzMoment) | amDateFormat:'MMMM D, YYYY'}}
                click <a *ngIf="userService.user.role === 8 || userService.user.role === 7 || userService.user.role === 2" [routerLink]="['/billing/bill-analytic/list']"><strong>here</strong></a> to review or edit.
              </p>
            </div>
          </div>
          <div class="col-md-6 text-right" style="padding-left: 30px" *ngIf="hasRunTest && savingsReports">
            <a target="_blank" *ngIf="hasRunTest>0" href="{{links.costSavings}}"><strong>Generate ESR</strong></a>
          </div>
          <div class="col-md-6 text-right" style="padding-left: 30px" *ngIf="!hasRunTest">
            <a *ngIf="!hasRunTest" class="default-button green-button" target="_blank">Run test to get ESR</a>
          </div>
        </div>

        <div class="row">
          <hr />
          <h3>Monthly Savings Reports</h3>
          <div class="col-md-6">
            <a class="ss-refresh glyph pull-right" (click)="refreshTable()"></a>
            <div class="clearfix"></div>


            <p-dataTable #table tableStyleClass="table dataTable table-striped table-bordered"
                        [value]="savingsReports" [lazy]="true" [rows]="15" [paginator]="true"
                        [totalRecords]="recordCount"
                        scrollable="false"
                        (onLazyLoad)="refreshData($event)">
              <p-column field="" header="" [style]="{'width':'5%'}" styleClass="text-center">
                <ng-template let-row="rowData" pTemplate="body">
                  <a class="ss-trash" *ngIf="userService.user.role === 8 || userService.user.role === 2" (click)="confirmDelete(row.month)"></a>
                </ng-template>
              </p-column>
              <p-column field="month" header="Bill Date" [sortable]="true">
                <ng-template let-col let-row="rowData" pTemplate="body">
                  {{(row.month | momentFormat:'YYYY-M') | amDateFormat:'MMM YYYY'}}
                </ng-template>
              </p-column>
              <p-column field="createdAt" header="Report Generated" [sortable]="true">
                <ng-template let-col let-row="rowData" pTemplate="body">
                  {{(row.createdAt | momentFormat:'x') | amTimeAgo}}
                </ng-template>
              </p-column>
              <p-column field="" header="Bill PDF" [style]="" styleClass="text-center">
                <ng-template let-row="rowData" let-index="rowIndex" pTemplate="body">
                  <p-fileUpload *ngIf="!row.billURL" #uploaders mode="basic" auto="true" url="{{savingsReportService.getBillURL(row.month)}}"
                        (onBeforeUpload)="uploadStarted(index)" (onUpload)="uploadComplete(index)" (onError)="uploadFailed(index)"
                        name="bill" accept="application/pdf" [style]="{'display':'none'}">
                  </p-fileUpload>
                  <a *ngIf="!row.billURL && !inProgress[index]" class="ss-plus" (click)="addBill($event, index)">add PDF</a>
                  <a *ngIf="row.billURL && !inProgress[index]" class="ss-redirect" [href]="row.billURL" target="_blank">open PDF</a>
                  <a *ngIf="row.billURL && !inProgress[index]" class="ss-delete" (click)="confirmDeletePdf($event, row, index)">delete PDF</a>
                  <span *ngIf="inProgress[index]" >please wait...</span>
                  <span *ngIf="failedUploading[index]" >error</span>
                </ng-template>
              </p-column>
              <p-column field="" header="" [style]="{'width':'5%'}" styleClass="text-center">
                <ng-template let-col let-row="rowData" pTemplate="body">
                  <!-- @todo: update this button to link to bill analytic-->
                  <button class="green-button sm" (click)="displaySavingsReport($event, row)"><span class="ss-play"></span></button>
                </ng-template>
              </p-column>
            </p-dataTable>

            <div *ngIf="selectedSavingsReport" style="font-size:0.8em;">
              <h3>
                Xeco Data for {{ (selectedSavingsReport.month | momentFormat:'YYYY-M') | amDateFormat:'MMM YYYY' }}
                <small>(savings % based on most recent test)</small>
              </h3>
              <table style="width:100%;">
                <tr>
                  <td>
                    <label>Usage (KWH)</label><br/>
                    <input [(ngModel)]="kwhUsage">
                  </td>
                  <td>
                    <label>KW Peak</label><br/>
                    <input [(ngModel)]="kwPeak">
                  </td>
                  <td>
                    <label>KWH Savings</label><br/>
                    <input [(ngModel)]="kwhSavings" [value]=" selectedSavingsReport.reportData.kwhSavings | number : '1.2-2'">%
                  </td>
                  <td>
                    <label>KW Peak Savings</label><br/>
                    <input [(ngModel)]="peakSavings" [value]="selectedSavingsReport.reportData.kwPeakSavings | number : '1.2-2'">%
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Total Bill</label><br/>
                    <input [(ngModel)]="totalBill" [value]="( selectedSavingsReport.reportData.totalBill | number : '1.2-2') || '--'">
                  </td>
                  <td>
                    <label>Power Factor Charge</label><br/>
                    <input [(ngModel)]="powerFactor" [value]="( selectedSavingsReport.reportData.pfc | number : '1.0-0') || '--'">
                  </td> 
                  <td>
                    <label for="multiplier">kwh Multiplier</label><br/>
                    <p-dropdown id="selectedMultiplier" name="selectedMultiplier" [options]="multiplier"
                                [(ngModel)]="selectedMultiplier"></p-dropdown>
                  </td>
                  <td></td>             
                </tr>
              </table>

              <h3>Line Items</h3>
              <div *ngIf="isSavingData" class="disable-container"></div>
              <p-dataTable #table2 tableStyleClass="table dataTable table-striped table-bordered" [value]="selectedSavingsReport.reportData.lineItems" [lazy]="false" [editable]="true" (onEdit)="checkChange($event)">
                <p-column field="name" header="Label" [editable]="true">
                  <ng-template let-col let-row="rowData" pTemplate="body">
                    <input [value]="row.name">
                  </ng-template>
                </p-column>
                <p-column field="cost" header="Cost" [editable]="true">
                  <ng-template let-col let-row="rowData" pTemplate="body">
                    <input [value]="row.cost">
                  </ng-template>
                </p-column>
                <p-column field="type" header="Type">
                  <ng-template let-col let-row="rowData" let-index="rowIndex" pTemplate="body">
                    <select (change)="changeType($event.target.value, index)">
                      <option *ngFor="let type of keys(ELECTRICITY_CHARGE_TYPES)" value="{{type}}" [selected]="type==row.type">{{type}}</option>
                    </select>
                  </ng-template>
                </p-column>
                <p-column field="tierHours" header="Tier Hours">
                  <ng-template let-col let-row="rowData" let-index="rowIndex" pTemplate="body">
                    <select (change)="changeTierHours($event.target.value, index)">
                      <option *ngFor="let tierHours of keys(TIER_HOURS)" value="{{tierHours}}" [selected]="tierHours==row.tierHours">{{tierHours}}</option>
                    </select>
                  </ng-template>
                </p-column>
                <p-column field="meterReading" header="Meter reading from bill" [editable]="true">
                  <ng-template let-col let-row="rowData" pTemplate="body">
                    <input [value]="row.meterReading">
                  </ng-template>
                </p-column>
                <p-column field="billingRate" header="Billing rate/unit" [editable]="true">
                  <ng-template let-col let-row="rowData" pTemplate="body">
                    <input [value]="row.billingRate">
                  </ng-template>
                </p-column>
                <p-column field="isDirty" header="">
                  <ng-template let-col let-row="rowData" let-index="rowIndex" pTemplate="body">
                    <button *ngIf="isDirty[index]" class="green-button sm" (click)="saveBillingRate(index)">Save</button>
                  </ng-template>
                </p-column>
              </p-dataTable>
              <button class="green-button" (click)="saveBillInfo()">Save Bill</button>
            </div>
          </div>

          <div class="col-md-6" *ngIf="pdfSource" id="pdfContainer">
            <iframe [src]="pdfSource" frameborder="0"></iframe>
            <div><a class="ss-delete" (click)="hidePDF()">close</a></div>
          </div>

        </div>
          
      </div>
    </div>
  `
})
export class ListSavingsReportComponent implements OnInit {

  @ViewChild('table', {static: false}) table;
  @ViewChild('table2', {static: false}) table2;
  @ViewChildren('uploaders') uploaders: QueryList<FileUpload>;

  public savingsReports: any;
  private keys = Object.keys;
  public selectedSavingsReport;

  public isSavingData;
  protected peakSavings;
  protected totalBill;
  protected powerFactor;
  protected kwhUsage;
  protected kwhSavings;
  protected kwPeak;
  protected originalData;
  protected selectedMultiplier;

  protected isDirty = [];

  protected inProgress = [];
  protected failedUploading = [];

  protected pdfSource: SafeResourceUrl;

  /**
   * The bill analytic for the current project.
   */
  public billAnalytic = null;

  protected recordCount = 0;

  public hasRunTest;

  public links;
  public type;
  public tierHours;

  public multiplier = [
                      {label: '0.91', value: 0.91},
                      {label: '0.92', value: 0.92},
                      {label: '0.93', value: 0.93},
                      {label: '0.94', value: 0.94},
                      {label: '0.95', value: 0.95},
                      {label: '0.96', value: 0.96},
                      {label: '0.97', value: 0.97},
                      {label: '0.98', value: 0.98},
                      {label: '0.99', value: 0.99}, 
                      {label: 'None', value: 1.00},
                      {label: '1.01', value: 1.01},
                      {label: '1.02', value: 1.02},
                      {label: '1.03', value: 1.03},
                      {label: '1.04', value: 1.04},
                      {label: '1.05', value: 1.05},
                      {label: '1.06', value: 1.06},
                      {label: '1.07', value: 1.07},
                      {label: '1.08', value: 1.08},
                      {label: '1.09', value: 1.09}];

  constructor(private savingsReportService: SavingsReportService, @Inject('ELECTRICITY_CHARGE_TYPES') private ELECTRICITY_CHARGE_TYPES, @Inject('TIER_HOURS') private TIER_HOURS, private billAnalyticService: BillAnalyticService, private apiHelpers: ApiHelpers, private confirmationService: ConfirmationService, private userService: CurrentUserService, private pdfLinkService: PdfLinkService, private sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.hasRunTest = this.userService.user.selectedProject.hasRunTest;
    this.pdfLinkService.getLinks().subscribe(links => {
      this.links = links;
    });
    this.billAnalyticService.getAnalytic().subscribe((analytic: any) => {
      this.billAnalytic = analytic || false;
    });
  }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refreshData(params) {
    if(!params.sortField) {
      params.sortField = 'month';
      params.sortOrder = 1;
    }
    let requestParameters = this.apiHelpers.parsePaginationParams(params);
    this.savingsReportService.getSavingsReports(requestParameters).subscribe(data => {
      this.recordCount = data.meta.total;
      this.savingsReports = data.response;
    });
    
  }

  confirmDelete(id) {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to delete this electrical bill? Once deleted it will not be recovered.',
      accept: () => {
        this.savingsReportService.remove(id).subscribe(result => {
          this.refreshTable();
        });
      }
    });
  }

  confirmDeletePdf(event, row, rowIndex) {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to delete this PDF',
      accept: () => {
        this.removeBill(event, row, rowIndex);
      }
    });
  }

  displaySavingsReport(event, savingsReport) {
    this.selectedSavingsReport = savingsReport;

    this.kwhUsage = this.selectedSavingsReport.reportData.usageKWH ;
    this.kwPeak = this.selectedSavingsReport.reportData.kwPeak ;
    this.kwhSavings = this.selectedSavingsReport.reportData.kwhSavings;
    this.peakSavings = this.selectedSavingsReport.reportData.kwPeakSavings;
    this.totalBill = this.selectedSavingsReport.reportData.totalBill;
    this.powerFactor = this.selectedSavingsReport.reportData.pfc;
    this.selectedMultiplier = this.selectedSavingsReport.reportData.multiplier;
    this.pdfSource = this.sanitizer.bypassSecurityTrustResourceUrl(savingsReport.billURL);
    this.originalData = ObjectHelpers.deepCopy(savingsReport.reportData);
    //overlayPanel.toggle(event);
    console.log("report", this.selectedSavingsReport);
  }

  checkChange(event) {
    let newCost = parseFloat(event.data.cost);
    let newMeterReading = parseFloat(event.data.meterReading);
    let newRate = parseFloat(event.data.cost) / parseFloat(event.data.meterReading);
    this.selectedSavingsReport.reportData.lineItems[event.index].billingRate = newRate.toFixed(5);
    this.isDirty[event.index] = (newRate != this.originalData.lineItems[event.index].billingRate || event.data.type != this.originalData.lineItems[event.index].type || event.data.tierHours != this.originalData.lineItems[event.index].tierHours || event.data.name != this.originalData.lineItems[event.index].name || newCost != this.originalData.lineItems[event.index].cost || newMeterReading != this.originalData.lineItems[event.index].meterReading);
  }

  changeType(newType, rowIndex) {
    this.isDirty[rowIndex] = newType != this.originalData.lineItems[rowIndex].type;
    this.type = newType;
  }

  changeTierHours(newTierHours, rowIndex) {
    this.isDirty[rowIndex] = newTierHours != this.originalData.lineItems[rowIndex].tierHours;
    this.tierHours = newTierHours;
  }

  saveBillingRate(rowIndex) {

    let newData = ObjectHelpers.deepCopy(this.originalData);
    newData.pfc = this.powerFactor;
    newData.usageKWH = this.kwhUsage;
    newData.kwPeak = this.kwPeak;
    newData.totalBill = this.totalBill;
    newData.multiplier = this.selectedMultiplier;
    newData.lineItems[rowIndex] = this.selectedSavingsReport.reportData.lineItems[rowIndex];
    newData.lineItems[rowIndex].type  = this.type;
    newData.lineItems[rowIndex].tierHours  = this.tierHours;
    this.isSavingData = true;

    this.savingsReportService.update(this.selectedSavingsReport.month, {
      reportData: newData
    }).subscribe(response => {
      this.isSavingData = false;
      this.isDirty[rowIndex] = false;
      this.originalData.lineItems[rowIndex] = ObjectHelpers.deepCopy(this.selectedSavingsReport.reportData.lineItems[rowIndex]);
    }, error => {
      console.log('error saving the new billing rate', error);

      this.isSavingData = false;
      this.isDirty[rowIndex] = false;
      this.selectedSavingsReport.reportData.lineItems[rowIndex].billingRate
        = this.originalData.lineItems[rowIndex].billingRate;
    });
  }

  saveBillInfo() {

    let newData = ObjectHelpers.deepCopy(this.originalData);
    newData.pfc = this.powerFactor;
    newData.usageKWH = this.kwhUsage;
    newData.kwPeak = this.kwPeak;
    newData.totalBill = this.totalBill;
    newData.kwhSavings = this.kwhSavings;
    newData.kwPeakSavings = this.peakSavings;
    newData.multiplier = this.selectedMultiplier;
    console.log(newData);
    this.savingsReportService.update(this.selectedSavingsReport.month, {
      reportData: newData
    }).subscribe(response => {
      
    }, error => {
      console.log('error saving the new billing rate', error);
    });
  }

  addBill(event, rowIndex) {
    let index = 0

    /*for(let i=0; i<rowIndex; i++) {
      if(!this.savingsReports[i].billURL) {
        index++
      }
    }*/

    this.uploaders.toArray()[index].basicFileInput.nativeElement.click()
  }

  uploadStarted(rowIndex) {
    console.log('uploadStarted', rowIndex)
    this.failedUploading[rowIndex] = false
    this.inProgress[rowIndex] = true
  }
  
  uploadComplete(rowIndex) {
    console.log('uploadComplete', rowIndex)
    this.failedUploading[rowIndex] = false
    this.inProgress[rowIndex] = false
    this.savingsReports = null
    this.refreshTable()
  }

  uploadFailed(rowIndex) {
    console.log('uploadFailed', rowIndex)
    this.failedUploading[rowIndex] = true
    this.inProgress[rowIndex] = false
  }

  removeBill(event, row, rowIndex) {
    this.inProgress[rowIndex] = true
    this.savingsReportService.removeBill(row.month).subscribe(data => {
      this.inProgress[rowIndex] = false
      this.savingsReports = null
      this.refreshTable()
    }, error => {})
  }

  hidePDF() {
    this.pdfSource = null
  }

}
