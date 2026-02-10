import { Component, ViewChild, OnInit } from '@angular/core';
import { BillAnalyticService } from "../billAnalytic/billAnalytic.service";
import { CurrentUserService } from "../../shared/user/currentUser.service";
import { ConfirmationService } from "primeng/primeng";
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {PdfLinkService} from "../../shared/pdfLink.service";

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
    </style>
    
    <div class="content-box">
      <div>
        <h3>Electric Bill Analytics</h3>
        <p>A bill analytic needs to be entered for each meter in building.</p>
        
      </div>
      
      <div>
        <div class="row">
          <div class="col-md-6">
            <strong *ngIf ="billsNeeded!=0">
              You will need to enter <strong style="color: red; font-size: 20px">{{billsNeeded}}</strong> more bills to generate an accurate bill analytics report since there are {{metersInProject}} meters for this project. 
            </strong>
            <strong *ngIf ="billsNeeded==0">
              You have entered bill analytics for all utility meters in project.
            </strong>
            <div>
              <button *ngIf="!viewEquipments && (userService.user.role === 8 || userService.user.role === 7)" class="default-button green-button" [routerLink]="['/billing/bill-analytic/create']">Add Bill Analytic</button>
            </div>
            
          </div>
        </div>
          
        <div class="row" *ngIf="meterBills">
          <hr />
          <div class="col-md-10">
            <div *ngIf="metersInReport.length > 0" class="pull-right" style="margin-bottom: 10px">
              <a class="btn btn-primary" href="{{links.selectedBillAnalytic}}" target="_blank" #proposal>Bill Analytic</a>&nbsp;&nbsp;&nbsp;
              <a class="btn btn-primary" href="{{links.selectedProposal}}" target="_blank">Proposal</a>
              &nbsp;&nbsp;&nbsp;
              <a class="btn btn-primary" href="{{links.selectedShippingDocuments}}" target="_blank">Shipping Documents</a>
            </div>
            <a class="ss-refresh glyph pull-left" (click)="refreshTable()"></a>
            <div class="clearfix"></div>


            <p-dataTable #table tableStyleClass="table dataTable table-striped table-bordered"
                        [value]="meterBills" [lazy]="true" [totalRecords]="recordCount"
                        (onLazyLoad)="refreshData($event)">
              <p-column field="billReference" header="Bill Reference">
                <ng-template let-col let-row="rowData" pTemplate="body">
                  {{row.billReference}}
                </ng-template>
              </p-column>
              <p-column field="meterNumber" header="Meter Number">
                <ng-template let-col let-row="rowData" pTemplate="body">
                  {{row.meterNumber}}
                </ng-template>
              </p-column>
              <p-column field="" header="Edit Bill" [style]="" styleClass="text-center">
                <ng-template let-row="rowData" let-index="rowIndex" pTemplate="body">
                  <a *ngIf="row.billReference" class="button-icon ss-write" [routerLink]="['/billing/bill-analytic/edit', index]"> Edit Bill</a>
            
                </ng-template>
              </p-column>
              <p-column field="" header="Equipments" [style]="" styleClass="text-center">
                <ng-template let-row="rowData" let-index="rowIndex" pTemplate="body">
                  <a class="btn btn-primary" [routerLink]="['/billing/bill-analytic/equipments', row.meterNumber]">View/Edit</a>
                </ng-template>
              </p-column>
              <p-column field="" header="Generate Docs" [style]="" styleClass="text-center">
                <ng-template let-row="rowData" let-index="rowIndex" pTemplate="body">
                  <input type="checkbox" id="{{row.meterNumber}}" name="{{row.meterNumber}}" value="{{row.meterNumber}}" (change)="addToReport($event)">
                </ng-template>
              </p-column>
            </p-dataTable>
          </div>
        </div>

        <div> 
          <button *ngIf="viewEquipments && (userService.user.role === 8 || userService.user.role === 7)" class="default-button green-button" [routerLink]="['/billing/bill-analytic/equipments']">Please Confirm Equipment Totals</button>
          <strong *ngIf="viewEquipments && (userService.user.role === 8 || userService.user.role === 7)">
              Your bill analytic & proposal will NOT be generated without confirming the total equipment list.
            </strong>
        </div>
        
      </div>
    </div>
  `
})
export class ListBillAnalyticComponent implements OnInit {

  @ViewChild('table', {static: false}) table;

  public meterBills: any;

  protected recordCount = 0;
  public links;
  public metersInProject;
  public billsNeeded;
  public hasBill = false;
  public viewEquipments = false;
  public metersInReport = [];
  public canGenerateReports = false;
  private analytic;


  constructor(private pdfLinkService: PdfLinkService, private billAnalyticService: BillAnalyticService, private userService: CurrentUserService, private sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.billAnalyticService.getAnalytic().subscribe(billAnalytic => {
      this.analytic = billAnalytic;
    });
    this.metersInProject = this.userService.user.selectedProject.reportFields.numberOfMeters;
    this.meterBills = this.userService.user.selectedProject.electricBillAnalysis.meterBills;
    if (this.meterBills) {
      this.recordCount = this.meterBills.length;
      this.hasBill = true;
    } else {
      this.recordCount = 0;
    }

    this.billsNeeded = this.metersInProject - this.recordCount;
    if (this.billsNeeded == 0) { // if all bills analytics are entered
      this.viewEquipments = true;
    }
  }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refreshData(params) {
    this.meterBills = this.userService.user.selectedProject.electricBillAnalysis.meterBills;
  }

  addToReport(event) {
    if ( event.target.checked ) {
      this.metersInReport.push('\"' + event.target.value + '\"');
    } else {
      let index = this.metersInReport.indexOf(event.target.value);
      this.metersInReport.splice(index, 1);
    }
    if (this.metersInReport.length > 0) {
      this.canGenerateReports = true;

      this.pdfLinkService.getLinks(this.metersInReport).subscribe(links => {
        this.links = links; 
      });
    } 
  }

  generateBillAnalytics() {

  }

  generateProposal() {

  }


}
