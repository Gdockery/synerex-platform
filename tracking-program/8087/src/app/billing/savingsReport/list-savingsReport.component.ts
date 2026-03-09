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
import { CreateFromBillService } from "../../project/create-from-bill/create-from-bill.service";

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

      <!-- EM&V Pre-fill Panel — always visible once a project is selected -->
      <div style="background:#f8f9fa; border:1px solid #dee2e6; border-radius:6px; padding:1.25em 1.5em; margin-bottom:1.5em;">
        <h3 style="margin-top:0; margin-bottom:0.25em;">EM&amp;V Program Pre-fill <small style="font-size:0.7em; color:#888; font-weight:normal;">Fill in the fields below then click "Send to EM&amp;V Program"</small></h3>

        <!-- CLIENT INFORMATION -->
        <h4 style="margin:1em 0 0.5em; color:#555; font-size:1em; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #dee2e6; padding-bottom:4px;">Client Information</h4>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label>Company</label>
              <input class="form-control" [(ngModel)]="emvClientName" placeholder="e.g. Acme Corp" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label>Address</label>
              <input class="form-control" [(ngModel)]="emvClientAddress" placeholder="123 Main St" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label>Location</label>
              <input class="form-control" [(ngModel)]="emvClientLocation" placeholder="Suite 100" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label>City, State</label>
              <input class="form-control" [(ngModel)]="emvClientCityState" placeholder="Dallas, TX" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>ZIP / Postal Code</label>
              <input class="form-control" [(ngModel)]="emvClientZip" placeholder="75001" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Contact Name</label>
              <input class="form-control" [(ngModel)]="emvContactName" placeholder="Jane Smith" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Email</label>
              <input class="form-control" [(ngModel)]="emvContactEmail" placeholder="jane@company.com" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>Phone</label>
              <input class="form-control" [(ngModel)]="emvContactPhone" placeholder="+1 (555) 123-4567" />
            </div>
          </div>
        </div>

        <!-- PROJECT INFORMATION -->
        <h4 style="margin:1em 0 0.5em; color:#555; font-size:1em; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #dee2e6; padding-bottom:4px;">Project Information</h4>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label>Project Name</label>
              <input class="form-control" [(ngModel)]="emvClientName" placeholder="e.g. Acme Corp Phase 1" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label>Project Type</label>
              <input class="form-control" [(ngModel)]="emvProjectType" placeholder="e.g. Commercial, Industrial" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label>Facility Address</label>
              <input class="form-control" [(ngModel)]="emvFacilityAddress" placeholder="123 Main St" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>City</label>
              <input class="form-control" [(ngModel)]="emvFacilityCity" placeholder="Dallas" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>State</label>
              <input class="form-control" [(ngModel)]="emvFacilityState" placeholder="TX" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>Zip Code</label>
              <input class="form-control" [(ngModel)]="emvFacilityZip" placeholder="75001" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Point of Contact</label>
              <input class="form-control" [(ngModel)]="emvContactName" placeholder="Jane Smith" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>Phone</label>
              <input class="form-control" [(ngModel)]="emvContactPhone" placeholder="555-1234" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label>Email</label>
              <input class="form-control" [(ngModel)]="emvContactEmail" placeholder="jane@company.com" />
            </div>
          </div>
        </div>

        <!-- BILLING INFORMATION -->
        <h4 style="margin:1em 0 0.5em; color:#555; font-size:1em; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #dee2e6; padding-bottom:4px;">Billing Information</h4>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>Project Cost ($)</label>
              <input class="form-control" type="number" [(ngModel)]="emvProjectCost" placeholder="0.00" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Utility</label>
              <input class="form-control" [(ngModel)]="emvUtility" placeholder="e.g. Oncor Electric" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Utility Program Name</label>
              <input class="form-control" [(ngModel)]="emvUtilityProgram" placeholder="e.g. DR Program" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Account #</label>
              <input class="form-control" [(ngModel)]="emvAccountNumber" placeholder="Account number" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>Energy Rate ($/kWh)</label>
              <input class="form-control" type="number" step="0.0001" [(ngModel)]="emvEnergyRate" placeholder="0.0000" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Demand Rate ($/kW-month)</label>
              <input class="form-control" type="number" step="0.01" [(ngModel)]="emvDemandRate" placeholder="0.00" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Capacity Rate</label>
              <input class="form-control" type="number" step="0.01" [(ngModel)]="emvCapacityRate" placeholder="0.00" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Billing Model</label>
              <input class="form-control" [(ngModel)]="emvBillingModel" placeholder="e.g. TOU, Flat" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>kVA Demand Rate ($/kVA-month)</label>
              <input class="form-control" type="number" step="0.01" [(ngModel)]="emvKvaDemandRate" placeholder="0.00" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Reactive Adder ($/kVAR-month)</label>
              <input class="form-control" type="number" step="0.01" [(ngModel)]="emvReactiveAdder" placeholder="0.00" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>NCP Demand Rate ($/kW-month)</label>
              <input class="form-control" type="number" step="0.01" [(ngModel)]="emvNcpDemandRate" placeholder="0.00" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>CP Demand Rate ($/kW-month)</label>
              <input class="form-control" type="number" step="0.01" [(ngModel)]="emvCpDemandRate" placeholder="0.00" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>Coincident Peak Demand Rate</label>
              <input class="form-control" type="number" step="0.01" [(ngModel)]="emvCoincidentPeakRate" placeholder="0.00" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Target Power Factor (0-1)</label>
              <input class="form-control" type="number" step="0.01" min="0" max="1" [(ngModel)]="emvTargetPF" placeholder="0.95" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Discount Rate (%)</label>
              <input class="form-control" type="number" step="0.1" [(ngModel)]="emvDiscountRate" placeholder="3.0" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Escalation Rate (%)</label>
              <input class="form-control" type="number" step="0.1" [(ngModel)]="emvEscalationRate" placeholder="2.0" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>Analysis Period (years)</label>
              <input class="form-control" type="number" [(ngModel)]="emvAnalysisPeriod" placeholder="20" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>TOU On-Peak Rate ($/kWh)</label>
              <input class="form-control" type="number" step="0.0001" [(ngModel)]="emvTouOnPeak" placeholder="0.0000" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>TOU Off-Peak Rate ($/kWh)</label>
              <input class="form-control" type="number" step="0.0001" [(ngModel)]="emvTouOffPeak" placeholder="0.0000" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Summer Fraction of Year (%)</label>
              <input class="form-control" type="number" step="0.1" [(ngModel)]="emvSummerFraction" placeholder="50" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>Summer On-Peak ($/kWh)</label>
              <input class="form-control" type="number" step="0.0001" [(ngModel)]="emvSummerOnPeak" placeholder="0.0000" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Summer Off-Peak ($/kWh)</label>
              <input class="form-control" type="number" step="0.0001" [(ngModel)]="emvSummerOffPeak" placeholder="0.0000" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Winter On-Peak ($/kWh)</label>
              <input class="form-control" type="number" step="0.0001" [(ngModel)]="emvWinterOnPeak" placeholder="0.0000" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Winter Off-Peak ($/kWh)</label>
              <input class="form-control" type="number" step="0.0001" [(ngModel)]="emvWinterOffPeak" placeholder="0.0000" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>On-Peak Share of Hours (%)</label>
              <input class="form-control" type="number" step="0.1" [(ngModel)]="emvOnPeakShare" placeholder="0" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Ratchet % of Prior Peak</label>
              <input class="form-control" type="number" step="0.1" [(ngModel)]="emvRatchetPct" placeholder="0" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Ratchet Reference Peak (kW)</label>
              <input class="form-control" type="number" step="0.1" [(ngModel)]="emvRatchetRefPeak" placeholder="0" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Electric Utility / Company</label>
              <input class="form-control" [(ngModel)]="emvUtilityName" placeholder="e.g. Oncor Electric" />
            </div>
          </div>
        </div>

        <div class="row" style="margin-top:0.5em;">
          <div class="col-md-12">
            <button class="default-button green-button" (click)="sendToEmv()" style="background:#1a6eb5; border-color:#1a6eb5;">
              Save for EM&amp;V Analysis
            </button>
            <span *ngIf="emvSendStatus" style="margin-left:10px; font-size:0.9em;" [style.color]="emvSendError ? '#c00' : '#2a7a2a'">{{emvSendStatus}}</span>
          </div>
        </div>
      </div>

      <!-- ───────────────────────────────────────────────────────────────── -->
      <!-- Scan Bill for Bill Analytic                                      -->
      <!-- ───────────────────────────────────────────────────────────────── -->
      <div style="background:#f0fff4; border:1px solid #b0d8b8; border-radius:6px; padding:1.25em 1.5em; margin-bottom:1.25em;">
        <h3 style="margin-top:0; margin-bottom:0.4em; color:#1a6a1a;">Scan Bill for Bill Analytic
          <small style="font-size:0.65em; color:#555; font-weight:normal;">— auto-fill Bill Analytic fields and EM&amp;V billing rates from a scanned PDF</small>
        </h3>
        <div style="display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:0.5em;">
          <input type="file" accept=".pdf" (change)="onBillScanFileSelect($event)" style="max-width:340px;" />
          <button type="button" class="default-button green-button" (click)="scanBillForAnalytic()" [disabled]="!billScanFile || billScanning">
            {{ billScanning ? 'Scanning...' : 'Scan Bill' }}
          </button>
          <span *ngIf="billScanSuccess" style="color:#2a7a2a; font-size:0.9em;">&#10003; Scanned — {{ billScanLineItemCount }} line item(s) loaded. Review fields below before generating.</span>
        </div>
        <div *ngIf="billScanError" style="color:#c00; font-size:0.9em;">{{ billScanError }}</div>
      </div>

      <!-- Bill Analytic Data Fields (populated from scan, editable before generating report) -->
      <div *ngIf="billScanSuccess || baTotalKwh" style="background:#fff; border:1px solid #dee2e6; border-radius:6px; padding:1.25em 1.5em; margin-bottom:1.5em;">
        <h3 style="margin-top:0; margin-bottom:0.75em; color:#333;">Bill Analytic Data
          <small style="font-size:0.65em; color:#888; font-weight:normal;">Review and adjust before generating the report</small>
        </h3>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label>Bill Reference</label>
              <input class="form-control" [(ngModel)]="baBillReference" placeholder="e.g. January 2025 Electric Bill" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label>Electric Company</label>
              <input class="form-control" [(ngModel)]="baElectricCompanyName" placeholder="e.g. Oncor" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label>Account Number</label>
              <input class="form-control" [(ngModel)]="baAccountNumber" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>Meter Number</label>
              <input class="form-control" [(ngModel)]="baMeterNumber" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Total KWH</label>
              <input class="form-control" type="number" step="any" [(ngModel)]="baTotalKwh" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>KW Peak</label>
              <input class="form-control" type="number" step="any" [(ngModel)]="baKwPeak" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Total Bill Amount ($)</label>
              <input class="form-control" type="number" step="0.01" [(ngModel)]="baBillAmount" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>Days Billed</label>
              <input class="form-control" type="number" step="1" [(ngModel)]="baDaysBilled" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Voltage</label>
              <select class="form-control" [(ngModel)]="baVoltage">
                <option value="480">480</option>
                <option value="240">240</option>
                <option value="208">208</option>
              </select>
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>KW Rate per Tariff</label>
              <input class="form-control" type="number" step="any" [(ngModel)]="baKwRatePerTariff" />
            </div>
          </div>
        </div>

        <!-- Line Items -->
        <h4 style="margin-top:0.5em; margin-bottom:0.5em;">Line Items</h4>
        <table class="table table-bordered table-striped" style="font-size:0.88em;">
          <thead>
            <tr>
              <th>Label</th>
              <th>Type</th>
              <th>Cost ($)</th>
              <th>Billing Rate</th>
              <th>Meter Reading</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of baLineItems; let i = index">
              <td><input class="form-control input-sm" [(ngModel)]="baLineItems[i].name" /></td>
              <td style="padding:6px 8px;">{{ item.type }}</td>
              <td><input class="form-control input-sm" type="number" [(ngModel)]="baLineItems[i].cost" /></td>
              <td><input class="form-control input-sm" type="number" [(ngModel)]="baLineItems[i].billingRate" /></td>
              <td><input class="form-control input-sm" type="number" [(ngModel)]="baLineItems[i].meterReading" /></td>
            </tr>
            <tr *ngIf="baLineItems.length === 0">
              <td colspan="5" style="text-align:center; color:#888; font-style:italic;">No line items — scan a bill or add manually.</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align:right; margin-top:0.75em;">
          <button type="button" class="default-button green-button" (click)="generateBillAnalytic()" [disabled]="!baTotalKwh || baGenerating">
            {{ baGenerating ? 'Saving...' : 'Generate Bill Analytic Report' }}
          </button>
          <span *ngIf="baGenerateStatus" style="margin-left:12px; font-size:0.9em;" [style.color]="baGenerateError ? '#c00' : '#2a7a2a'">{{ baGenerateStatus }}</span>
        </div>
      </div>

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

  // EM&V Pre-fill fields
  // Client Information
  public emvClientName: string = '';
  public emvClientAddress: string = '';
  public emvClientLocation: string = '';
  public emvClientCityState: string = '';
  public emvClientZip: string = '';
  public emvContactName: string = '';
  public emvContactEmail: string = '';
  public emvContactPhone: string = '';
  // Project Information
  public emvProjectType: string = '';
  public emvFacilityAddress: string = '';
  public emvFacilityCity: string = '';
  public emvFacilityState: string = '';
  public emvFacilityZip: string = '';
  // Billing Information
  public emvProjectCost: string = '';
  public emvUtility: string = '';
  public emvUtilityName: string = '';
  public emvUtilityProgram: string = '';
  public emvAccountNumber: string = '';
  public emvEnergyRate: string = '';
  public emvDemandRate: string = '';
  public emvCapacityRate: string = '';
  public emvBillingModel: string = '';
  public emvKvaDemandRate: string = '';
  public emvReactiveAdder: string = '';
  public emvNcpDemandRate: string = '';
  public emvCpDemandRate: string = '';
  public emvCoincidentPeakRate: string = '';
  public emvTargetPF: string = '';
  public emvDiscountRate: string = '';
  public emvEscalationRate: string = '';
  public emvAnalysisPeriod: string = '';
  public emvTouOnPeak: string = '';
  public emvTouOffPeak: string = '';
  public emvSummerFraction: string = '';
  public emvSummerOnPeak: string = '';
  public emvSummerOffPeak: string = '';
  public emvWinterOnPeak: string = '';
  public emvWinterOffPeak: string = '';
  public emvOnPeakShare: string = '';
  public emvRatchetPct: string = '';
  public emvRatchetRefPeak: string = '';
  public emvSendStatus: string = '';
  public emvSendError: boolean = false;

  // Bill scan state (for Bill Analytic generation)
  public billScanFile: File | null = null;
  public billScanning = false;
  public billScanError: string | null = null;
  public billScanSuccess = false;
  public billScanLineItemCount = 0;

  // Bill Analytic fields (populated from scan, drive report generation)
  public baBillReference: string = '';
  public baElectricCompanyName: string = '';
  public baAccountNumber: string = '';
  public baMeterNumber: string = '';
  public baTotalKwh: string = '';
  public baKwPeak: string = '';
  public baBillAmount: string = '';
  public baDaysBilled: string = '30';
  public baVoltage: string = '480';
  public baKwRatePerTariff: string = '';
  public baLineItems: any[] = [];
  public baGenerating = false;
  public baGenerateStatus: string = '';
  public baGenerateError: boolean = false;

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

  constructor(
    private savingsReportService: SavingsReportService,
    @Inject('ELECTRICITY_CHARGE_TYPES') private ELECTRICITY_CHARGE_TYPES,
    @Inject('TIER_HOURS') private TIER_HOURS,
    private billAnalyticService: BillAnalyticService,
    private apiHelpers: ApiHelpers,
    private confirmationService: ConfirmationService,
    private userService: CurrentUserService,
    private pdfLinkService: PdfLinkService,
    private sanitizer: DomSanitizer,
    private createFromBillService: CreateFromBillService,
  ) { }

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

    this.kwhUsage = this.selectedSavingsReport.reportData.usageKWH;
    this.kwPeak = this.selectedSavingsReport.reportData.kwPeak;
    this.kwhSavings = this.selectedSavingsReport.reportData.kwhSavings;
    this.peakSavings = this.selectedSavingsReport.reportData.kwPeakSavings;
    this.totalBill = this.selectedSavingsReport.reportData.totalBill;
    this.powerFactor = this.selectedSavingsReport.reportData.pfc;
    this.selectedMultiplier = this.selectedSavingsReport.reportData.multiplier;
    this.pdfSource = this.sanitizer.bypassSecurityTrustResourceUrl(savingsReport.billURL);
    this.originalData = ObjectHelpers.deepCopy(savingsReport.reportData);

    // Populate all EM&V pre-fill fields from saved reportData
    const rd = savingsReport.reportData || {};
    // Client Information
    this.emvClientName        = rd.client_name || '';
    this.emvClientAddress     = rd.client_address || '';
    this.emvClientLocation    = rd.client_location || '';
    this.emvClientCityState   = rd.client_city_state || '';
    this.emvClientZip         = rd.client_zip || '';
    this.emvContactName       = rd.contact_name || '';
    this.emvContactEmail      = rd.contact_email || '';
    this.emvContactPhone      = rd.contact_phone || '';
    // Project Information
    this.emvProjectType       = rd.project_type || '';
    this.emvFacilityAddress   = rd.facility_address || '';
    this.emvFacilityCity      = rd.facility_city || '';
    this.emvFacilityState     = rd.facility_state || '';
    this.emvFacilityZip       = rd.facility_zip || '';
    // Billing Information
    this.emvProjectCost       = rd.project_cost || '';
    this.emvUtility           = rd.utility || '';
    this.emvUtilityName       = rd.utility_name || '';
    this.emvUtilityProgram    = rd.utility_program || '';
    this.emvAccountNumber     = rd.account_number || '';
    this.emvEnergyRate        = rd.energy_rate || '';
    this.emvDemandRate        = rd.demand_rate || '';
    this.emvCapacityRate      = rd.capacity_rate || '';
    this.emvBillingModel      = rd.billing_model || '';
    this.emvKvaDemandRate     = rd.kva_demand_rate || '';
    this.emvReactiveAdder     = rd.reactive_adder || '';
    this.emvNcpDemandRate     = rd.ncp_demand_rate || '';
    this.emvCpDemandRate      = rd.cp_demand_rate || '';
    this.emvCoincidentPeakRate= rd.coincident_peak_rate || '';
    this.emvTargetPF          = rd.target_pf || '';
    this.emvDiscountRate      = rd.discount_rate || '';
    this.emvEscalationRate    = rd.escalation_rate || '';
    this.emvAnalysisPeriod    = rd.analysis_period || '';
    this.emvTouOnPeak         = rd.tou_on_peak || '';
    this.emvTouOffPeak        = rd.tou_off_peak || '';
    this.emvSummerFraction    = rd.summer_fraction_pct || '';
    this.emvSummerOnPeak      = rd.summer_on_peak || '';
    this.emvSummerOffPeak     = rd.summer_off_peak || '';
    this.emvWinterOnPeak      = rd.winter_on_peak || '';
    this.emvWinterOffPeak     = rd.winter_off_peak || '';
    this.emvOnPeakShare       = rd.onpeak_fraction_pct || '';
    this.emvRatchetPct        = rd.ratchet_percent || '';
    this.emvRatchetRefPeak    = rd.ratchet_ref_peak || '';
    this.emvSendStatus = '';
    this.emvSendError = false;
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

  saveClientInfo() {
    if (!this.selectedSavingsReport) return;
    const newData = ObjectHelpers.deepCopy(this.selectedSavingsReport.reportData);
    // Client Information
    newData.client_name         = this.emvClientName;
    newData.client_address      = this.emvClientAddress;
    newData.client_location     = this.emvClientLocation;
    newData.client_city_state   = this.emvClientCityState;
    newData.client_zip          = this.emvClientZip;
    newData.contact_name        = this.emvContactName;
    newData.contact_email       = this.emvContactEmail;
    newData.contact_phone       = this.emvContactPhone;
    // Project Information
    newData.project_type        = this.emvProjectType;
    newData.facility_address    = this.emvFacilityAddress;
    newData.facility_city       = this.emvFacilityCity;
    newData.facility_state      = this.emvFacilityState;
    newData.facility_zip        = this.emvFacilityZip;
    // Billing Information
    newData.project_cost        = this.emvProjectCost;
    newData.utility             = this.emvUtility;
    newData.utility_name        = this.emvUtilityName;
    newData.utility_program     = this.emvUtilityProgram;
    newData.account_number      = this.emvAccountNumber;
    newData.energy_rate         = this.emvEnergyRate;
    newData.demand_rate         = this.emvDemandRate;
    newData.capacity_rate       = this.emvCapacityRate;
    newData.billing_model       = this.emvBillingModel;
    newData.kva_demand_rate     = this.emvKvaDemandRate;
    newData.reactive_adder      = this.emvReactiveAdder;
    newData.ncp_demand_rate     = this.emvNcpDemandRate;
    newData.cp_demand_rate      = this.emvCpDemandRate;
    newData.coincident_peak_rate= this.emvCoincidentPeakRate;
    newData.target_pf           = this.emvTargetPF;
    newData.discount_rate       = this.emvDiscountRate;
    newData.escalation_rate     = this.emvEscalationRate;
    newData.analysis_period     = this.emvAnalysisPeriod;
    newData.tou_on_peak         = this.emvTouOnPeak;
    newData.tou_off_peak        = this.emvTouOffPeak;
    newData.summer_fraction_pct = this.emvSummerFraction;
    newData.summer_on_peak      = this.emvSummerOnPeak;
    newData.summer_off_peak     = this.emvSummerOffPeak;
    newData.winter_on_peak      = this.emvWinterOnPeak;
    newData.winter_off_peak     = this.emvWinterOffPeak;
    newData.onpeak_fraction_pct = this.emvOnPeakShare;
    newData.ratchet_percent     = this.emvRatchetPct;
    newData.ratchet_ref_peak    = this.emvRatchetRefPeak;
    this.savingsReportService.update(this.selectedSavingsReport.month, { reportData: newData }).subscribe(() => {
      this.selectedSavingsReport.reportData = newData;
      this.originalData = ObjectHelpers.deepCopy(newData);
      this.emvSendStatus = 'Data saved.';
      this.emvSendError = false;
    }, () => {
      this.emvSendStatus = 'Error saving data.';
      this.emvSendError = true;
    });
  }

  sendToEmv() {
    const bootstrap = (window as any)['BOOTSTRAP_DATA'] || {};
    const emvBase = bootstrap.emvUrl || 'http://localhost:8082';
    const proj: any = this.userService.user.selectedProject;
    const orgId = proj ? (proj.orgId || '') : '';
    const projectId = proj ? (proj.id || '') : '';
    const clientId = proj ? (proj.client || '') : '';

    const fields: any = {};
    // Client Information
    if (this.emvClientName)         fields['company']            = this.emvClientName;
    if (this.emvClientAddress)      fields['cp_address']         = this.emvClientAddress;
    if (this.emvClientLocation)     fields['cp_location']        = this.emvClientLocation;
    if (this.emvClientCityState)    fields['cp_city_state']      = this.emvClientCityState;
    if (this.emvClientZip)          fields['cp_zip']             = this.emvClientZip;
    if (this.emvContactName)        fields['contact']            = this.emvContactName;
    if (this.emvContactPhone)       fields['phone']              = this.emvContactPhone;
    if (this.emvContactEmail)       fields['email']              = this.emvContactEmail;
    // Project Information
    if (this.emvProjectType)        fields['project_type']       = this.emvProjectType;
    if (this.emvFacilityAddress)    fields['facility_address']   = this.emvFacilityAddress;
    if (this.emvFacilityCity)       fields['location']           = this.emvFacilityCity;
    if (this.emvFacilityState)      fields['facility_state']     = this.emvFacilityState;
    if (this.emvFacilityZip)        fields['facility_zip']       = this.emvFacilityZip;
    // Billing Information
    if (this.emvProjectCost)        fields['project_cost']       = this.emvProjectCost;
    if (this.emvUtility)            fields['utility']            = this.emvUtility;
    if (this.emvUtilityName)        fields['utility_name']       = this.emvUtilityName;
    if (this.emvUtilityProgram)     fields['utility_program']    = this.emvUtilityProgram;
    if (this.emvAccountNumber)      fields['account']            = this.emvAccountNumber;
    if (this.emvEnergyRate)         fields['energy_rate']        = this.emvEnergyRate;
    if (this.emvDemandRate)         fields['demand_rate']        = this.emvDemandRate;
    if (this.emvCapacityRate)       fields['capacity_rate']      = this.emvCapacityRate;
    if (this.emvBillingModel)       fields['billing_model']      = this.emvBillingModel;
    if (this.emvKvaDemandRate)      fields['kva_demand_rate']    = this.emvKvaDemandRate;
    if (this.emvReactiveAdder)      fields['reactive_adder']     = this.emvReactiveAdder;
    if (this.emvNcpDemandRate)      fields['ncp_demand_rate']    = this.emvNcpDemandRate;
    if (this.emvCpDemandRate)       fields['cp_demand_rate']     = this.emvCpDemandRate;
    if (this.emvCoincidentPeakRate) fields['coincident_peak']    = this.emvCoincidentPeakRate;
    if (this.emvTargetPF)           fields['target_pf']          = this.emvTargetPF;
    if (this.emvDiscountRate)       fields['discount_rate']      = this.emvDiscountRate;
    if (this.emvEscalationRate)     fields['escalation_rate']    = this.emvEscalationRate;
    if (this.emvAnalysisPeriod)     fields['analysis_period']    = this.emvAnalysisPeriod;
    if (this.emvTouOnPeak)          fields['tou_on_peak']        = this.emvTouOnPeak;
    if (this.emvTouOffPeak)         fields['tou_off_peak']       = this.emvTouOffPeak;
    if (this.emvSummerFraction)     fields['summer_fraction_pct']= this.emvSummerFraction;
    if (this.emvSummerOnPeak)       fields['summer_on_peak']     = this.emvSummerOnPeak;
    if (this.emvSummerOffPeak)      fields['summer_off_peak']    = this.emvSummerOffPeak;
    if (this.emvWinterOnPeak)       fields['winter_on_peak']     = this.emvWinterOnPeak;
    if (this.emvWinterOffPeak)      fields['winter_off_peak']    = this.emvWinterOffPeak;
    if (this.emvOnPeakShare)        fields['onpeak_fraction_pct']= this.emvOnPeakShare;
    if (this.emvRatchetPct)         fields['ratchet_percent']    = this.emvRatchetPct;
    if (this.emvRatchetRefPeak)     fields['ratchet_ref_peak']   = this.emvRatchetRefPeak;

    this.emvSendStatus = 'Saving fields...';
    this.emvSendError = false;

    const savePrefill = () => {
      if (!orgId || !projectId) { return Promise.resolve(null); }
      return fetch('/api/emv/save-prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, projectId, clientId, fields }),
        credentials: 'include',
      }).then(r => r.json()).catch(() => null);
    };

    savePrefill().then((result) => {
      if (result && result.error) {
        this.emvSendStatus = 'Error: ' + result.error;
        this.emvSendError = true;
      } else if (!orgId || !projectId) {
        this.emvSendStatus = 'No project selected — please select a project first.';
        this.emvSendError = true;
      } else {
        this.emvSendStatus = 'Data saved. An EM\u0026V analyst can now import this project from the EM\u0026V Program.';
        this.emvSendError = false;
      }
    });
  }

  onBillScanFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    this.billScanFile = (input && input.files && input.files[0]) ? input.files[0] : null;
    this.billScanError = null;
    this.billScanSuccess = false;
  }

  scanBillForAnalytic() {
    if (!this.billScanFile) { this.billScanError = 'Please select a PDF file.'; return; }
    if (!this.billScanFile.name.toLowerCase().endsWith('.pdf')) { this.billScanError = 'File must be a PDF.'; return; }
    if (this.billScanFile.size > 10 * 1024 * 1024) { this.billScanError = 'File must be 10 MB or smaller.'; return; }
    this.billScanning = true;
    this.billScanError = null;
    this.billScanSuccess = false;
    this.createFromBillService.analyzeBill(this.billScanFile).subscribe(
      (res: any) => {
        this.billScanning = false;
        const data = res.data || res;
        if (res.success !== false && data && Object.keys(data).length > 0) {
          this.populateFromScan(data);
          this.billScanSuccess = true;
        } else {
          this.billScanError = res.error || 'Could not extract bill data. Please enter fields manually.';
        }
      },
      (err: any) => {
        this.billScanning = false;
        this.billScanError = (err && err.error && (err.error.error || err.error.message)) || 'Upload failed. Please try again.';
      }
    );
  }

  private populateFromScan(d: any) {
    // Bill Analytic fields — the bill metrics used by the calculation engine
    this.baBillReference       = d.billReference || '';
    this.baElectricCompanyName = d.electricCompanyName || '';
    this.baAccountNumber       = d.accountNumber || '';
    this.baMeterNumber         = d.meterNumber || '';
    this.baTotalKwh            = d.totalKwh != null ? String(d.totalKwh) : '';
    this.baKwPeak              = d.kwPeak != null ? String(d.kwPeak) : '';
    this.baBillAmount          = d.billAmount != null ? String(d.billAmount) : '';
    this.baDaysBilled          = d.daysBilled != null ? String(d.daysBilled) : '30';
    this.baVoltage             = d.voltage ? String(d.voltage) : '480';
    this.baKwRatePerTariff     = d.kwRatePerTariff != null ? String(d.kwRatePerTariff) : '';
    this.baLineItems           = (d.lineItems && d.lineItems.length > 0) ? d.lineItems : [
      { name: 'KWH Charges', type: 'kwh', cost: 0, billingRate: d.kwhRate || 0, meterReading: d.totalKwh || 0, savings: 0 },
      { name: 'KW Charges',  type: 'kw',  cost: 0, billingRate: d.kwRatePerTariff || 0, meterReading: d.kwPeak || 0, savings: 0 },
    ];
    this.billScanLineItemCount = this.baLineItems.length;

    // EM&V fields — billing rate and address info from the same scan
    if (d.electricCompanyName) { this.emvUtility = d.electricCompanyName; this.emvUtilityName = d.electricCompanyName; }
    if (d.accountNumber)       { this.emvAccountNumber = d.accountNumber; }
    if (d.kwRatePerTariff)     { this.emvEnergyRate = String(d.kwRatePerTariff); }
    if (d.serviceAddress)      { this.emvFacilityAddress = d.serviceAddress; }
    if (d.serviceCity)         { this.emvFacilityCity = d.serviceCity; }
    if (d.serviceState)        { this.emvFacilityState = d.serviceState; }
    if (d.serviceZip)          { this.emvFacilityZip = d.serviceZip; }
  }

  generateBillAnalytic() {
    const totalKwh   = parseFloat(this.baTotalKwh)   || 0;
    const kwPeak     = parseFloat(this.baKwPeak)     || 1;
    const daysBilled = parseFloat(this.baDaysBilled) || 30;

    // Same load-factor savings formula as billAnalytic-form.component.ts
    const loadFactor     = (totalKwh / (daysBilled * 24)) / kwPeak;
    const savCalc        = 0.3225 - (((0.9 - loadFactor) * 100) * 0.0031011);
    const savingsPct     = (1000 - (loadFactor * 1000)) * savCalc / 1000;

    const lineItemsWithSavings = this.baLineItems.map(item => ({
      ...item,
      savings: item.savings || ((parseFloat(item.cost) || 0) * savingsPct),
    }));
    const totalSavings = lineItemsWithSavings.reduce((sum, item) => sum + (parseFloat(item.savings) || 0), 0);

    const analyticData: any = {
      billReference:       this.baBillReference,
      electricCompanyName: this.baElectricCompanyName,
      accountNumber:       this.baAccountNumber,
      meterNumber:         this.baMeterNumber,
      totalKwh:            totalKwh,
      kwPeak:              kwPeak,
      billAmount:          parseFloat(this.baBillAmount) || 0,
      daysBilled:          daysBilled,
      voltage:             parseFloat(this.baVoltage) || 480,
      kwRatePerTariff:     parseFloat(this.baKwRatePerTariff) || 0,
      lineItems:           lineItemsWithSavings,
      totalSavings:        totalSavings,
    };

    this.baGenerating     = true;
    this.baGenerateStatus = 'Saving bill analytic data...';
    this.baGenerateError  = false;

    this.billAnalyticService.updateAnalytic(analyticData).subscribe(
      () => {
        this.baGenerating     = false;
        this.baGenerateStatus = '';
        // Refresh the links so billAnalytic token is current, then open PDF
        this.pdfLinkService.getLinks().subscribe(links => {
          this.links = links;
          window.open(this.links.billAnalytic, '_blank');
        });
      },
      () => {
        this.baGenerating     = false;
        this.baGenerateStatus = 'Error saving data. Please try again.';
        this.baGenerateError  = true;
      }
    );
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
