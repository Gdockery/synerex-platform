import { Component, OnInit, OnDestroy, Inject, ViewChild, ViewChildren, QueryList } from '@angular/core';
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
import { ClientService } from "../../admin/client/client.service";
import { SldService } from "./sld.service";
import { MyJobsService, MyJob } from "./my-jobs.service";
import { ProposalService } from "./proposal.service";

let moment = require('moment');
const { PDFDocument } = require('pdf-lib');

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
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:0.75em; flex-wrap:wrap;">
          <h3 style="margin:0; flex:1;">EM&amp;V Program Pre-fill <small style="font-size:0.7em; color:#888; font-weight:normal;">Fill in the fields below then click "Send to EM&amp;V Program"</small></h3>
          <button type="button" class="btn btn-primary btn-sm"
                  [disabled]="emvAutoFillAllFetching"
                  (click)="autoFillAll()"
                  style="white-space:nowrap; font-weight:600;">
            {{ emvAutoFillAllFetching ? '⏳ Filling…' : '⚡ Auto-fill from Bill + SLD' }}
          </button>
          <span *ngIf="emvAutoFillAllStatus" style="font-size:0.85em; white-space:nowrap;"
                [style.color]="emvAutoFillAllError ? '#c00' : '#2a7a2a'">{{ emvAutoFillAllStatus }}</span>
        </div>

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
          <div class="col-md-3">
            <div class="form-group">
              <label>City</label>
              <input class="form-control" [(ngModel)]="emvClientCity" placeholder="Dallas" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>State</label>
              <input class="form-control" [(ngModel)]="emvClientState" placeholder="TX" />
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
        <h4 style="margin:1em 0 0.5em; color:#555; font-size:1em; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #dee2e6; padding-bottom:4px;">Project / Facility Information</h4>
        <div class="row">
          <div class="col-md-5">
            <div class="form-group">
              <label>Facility Address</label>
              <input class="form-control" [(ngModel)]="emvFacilityAddress" placeholder="123 Main St" />
            </div>
          </div>
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
              <label>Zip</label>
              <input class="form-control" [(ngModel)]="emvFacilityZip" placeholder="75001" />
            </div>
          </div>
        </div>

        <!-- FACILITY NARRATIVE -->
        <div style="display:flex; align-items:center; gap:12px; margin:1em 0 0.5em; border-bottom:1px solid #dee2e6; padding-bottom:4px;">
          <h4 style="margin:0; color:#555; font-size:1em; text-transform:uppercase; letter-spacing:.05em; flex:1;">Facility Narrative <small style="font-size:0.75em; font-weight:normal; color:#888;">(used in proposal &amp; network assessment reports)</small></h4>
          <button type="button" class="btn btn-sm btn-default" [disabled]="emvNarrativeFetching" (click)="autoFillFacilityNarrative()"
                  style="white-space:nowrap; font-size:0.82em;">
            {{ emvNarrativeFetching ? 'Looking up…' : '&#128269; Auto-fill' }}
          </button>
          <span *ngIf="emvNarrativeStatus" style="font-size:0.82em; white-space:nowrap;"
                [style.color]="emvNarrativeError ? '#c00' : '#2a7a2a'">{{ emvNarrativeStatus }}</span>
        </div>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label>Facility Type</label>
              <input class="form-control" [(ngModel)]="emvFacilityType" placeholder="e.g. Electronics Contract Manufacturing" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>Site Label</label>
              <input class="form-control" [(ngModel)]="emvFacilitySiteLabel" placeholder="e.g. Campus" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Billing Period Label</label>
              <input class="form-control" [(ngModel)]="emvBillingMonthsLabel" placeholder="e.g. Apr–May 2026" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>SLD Drawing Reference</label>
              <input class="form-control" [(ngModel)]="emvSldSource" placeholder="e.g. Dwg 22276.059" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label>Overview Paragraph (facility description for reports)</label>
              <textarea class="form-control" rows="3" [(ngModel)]="emvOverviewPara" placeholder="Describe facility operations, major loads, switchgear, utility supply..."></textarea>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label>Capacitor Bank / Resonance Note <small style="font-weight:normal; color:#888;">(equipment note for reports)</small></label>
              <textarea class="form-control" rows="2" [(ngModel)]="emvCapacitorBankBullet" placeholder="Note any capacitor banks, resonance risks, or power-conditioning equipment..."></textarea>
            </div>
          </div>
        </div>

        <!-- POWER FACTOR -->
        <h4 style="margin:1em 0 0.5em; color:#555; font-size:1em; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #dee2e6; padding-bottom:4px;">Power Factor</h4>
        <div class="row">
          <div class="col-md-2">
            <div class="form-group">
              <label>Est. PF (0–1)</label>
              <input class="form-control" type="number" step="0.01" min="0" max="1" [(ngModel)]="emvPfReference" placeholder="0.88" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>PF Reference Month</label>
              <input class="form-control" [(ngModel)]="emvPfReferenceMonth" placeholder="e.g. Apr–May 2026" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>Worst PF (0–1)</label>
              <input class="form-control" type="number" step="0.01" min="0" max="1" [(ngModel)]="emvPfWorst" placeholder="0.85" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>PF Penalty?</label>
              <div style="padding-top:8px;"><label style="font-weight:normal;"><input type="checkbox" [(ngModel)]="emvHasPfPenalty" style="margin-right:4px;" /> Yes</label></div>
            </div>
          </div>
          <div class="col-md-3" *ngIf="emvHasPfPenalty">
            <div class="form-group">
              <label>PF Penalty Value ($/mo)</label>
              <input class="form-control" type="number" [(ngModel)]="emvPfPenaltyUsd" placeholder="0" />
            </div>
          </div>
        </div>

        <!-- BILLING INFORMATION -->
        <h4 style="margin:1em 0 0.5em; color:#555; font-size:1em; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #dee2e6; padding-bottom:4px;">Billing Information</h4>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label>Utility</label>
              <input class="form-control" [(ngModel)]="emvUtility" placeholder="e.g. Oncor Electric" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label>Tariff / Rate Schedule</label>
              <input class="form-control" [(ngModel)]="emvTariff" placeholder="e.g. TOU-GS-3-B" />
            </div>
          </div>
          <div class="col-md-4">
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
              <input class="form-control" type="number" step="0.0001" [(ngModel)]="emvEnergyRate" (ngModelChange)="scheduleBillAnalyticSave()" placeholder="0.0000" />
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
        </div>

        <!-- COMMERCIAL / BOM -->
        <h4 style="margin:1em 0 0.5em; color:#555; font-size:1em; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #dee2e6; padding-bottom:4px;">Commercial / BOM</h4>
        <div class="row">
          <div class="col-md-2">
            <div class="form-group">
              <label>Savings % (default 6%)</label>
              <input class="form-control" type="number" step="0.1" [(ngModel)]="proposalSavingsPct" placeholder="6" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>Qualifying Meters</label>
              <input class="form-control" type="number" step="1" [(ngModel)]="proposalNMeters" placeholder="1" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>Engineering Fee ($)</label>
              <input class="form-control" type="number" [(ngModel)]="emvEngineeringFee" placeholder="0" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>Yr 1 Software ($)</label>
              <input class="form-control" type="number" [(ngModel)]="emvSwYr1" placeholder="0" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>Discount ($)</label>
              <input class="form-control" type="number" [(ngModel)]="emvDiscount" placeholder="0" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>Shipping ($)</label>
              <input class="form-control" type="number" [(ngModel)]="emvShipping" placeholder="0" />
            </div>
          </div>
        </div>
        <div class="row" style="margin-bottom:0.5em;">
          <div class="col-md-12" style="display:flex; gap:24px; align-items:center; padding-top:4px;">
            <label style="font-weight:normal; margin:0;"><input type="checkbox" [(ngModel)]="emvCustomerOwnsMeters" style="margin-right:5px;" /> Customer owns meters (exclude from BOM)</label>
            <label style="font-weight:normal; margin:0;"><input type="checkbox" [(ngModel)]="emvIsUpgrade" style="margin-right:5px;" /> Upgrade / Add-on (uses upgrade contract language)</label>
          </div>
        </div>

        <!-- EQUIPMENT OVERRIDE COUNTS -->
        <div style="display:flex; align-items:center; gap:10px; margin:1em 0 0.5em; border-bottom:1px solid #dee2e6; padding-bottom:4px;">
          <h4 style="margin:0; color:#555; font-size:1em; text-transform:uppercase; letter-spacing:.05em; flex:1;">Equipment Counts <small style="font-size:0.75em; font-weight:normal; color:#888;">(leave blank = auto from topology or peak kW)</small></h4>
          <span *ngIf="emvEquipSource === 'sld_confirmed'" style="font-size:0.8em; color:#2a7a2a; white-space:nowrap;">&#10003; SLD confirmed</span>
          <span *ngIf="emvEquipSource && emvEquipSource !== 'sld_confirmed'" style="font-size:0.8em; color:#b8860b; white-space:nowrap;">&#9888; estimated ({{ emvEquipSource }})</span>
        </div>
        <div class="row">
          <div class="col-md-2">
            <div class="form-group">
              <label>ECBS-600</label>
              <input class="form-control" type="number" [(ngModel)]="emvS600Override" placeholder="auto" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>APF-100</label>
              <input class="form-control" type="number" [(ngModel)]="emvApf100Override" placeholder="auto" />
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label>APF-50</label>
              <input class="form-control" type="number" [(ngModel)]="emvApf50Override" placeholder="auto" />
            </div>
          </div>
        </div>

        <!-- ELECTRICAL TOPOLOGY TREE -->
        <h4 style="margin:1em 0 0.5em; color:#555; font-size:1em; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #dee2e6; padding-bottom:4px;">Electrical Topology <small style="font-size:0.75em; font-weight:normal; color:#888;">(auto-populated from SLD if available; edit or build manually)</small></h4>
        <div *ngFor="let meter of topoMeters; let mi = index"
             style="border:1px solid #ced4da; border-radius:6px; padding:0.8em 1em; margin-bottom:1em; background:#fff;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:0.6em;">
            <strong style="white-space:nowrap;">Meter {{ mi + 1 }}</strong>
            <input class="form-control" [(ngModel)]="meter.meterNo" style="width:180px;" placeholder="Meter #" />
            <button type="button" class="btn btn-xs btn-danger" (click)="removeMeter(mi)" *ngIf="topoMeters.length > 1">Remove</button>
          </div>

          <!-- Buses for this meter -->
          <div *ngFor="let bus of meter.buses; let bi = index"
               style="border:1px solid #dee2e6; border-radius:4px; padding:0.7em 0.8em; margin:0 0 0.5em 1em; background:#f8f9fa;">
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:0.5em; align-items:flex-end;">
              <div>
                <label style="font-size:0.82em; margin-bottom:2px; display:block;">Switchgear Label</label>
                <input class="form-control input-sm" [(ngModel)]="bus.badge" style="width:110px;" placeholder="MSB-1" />
              </div>
              <div>
                <label style="font-size:0.82em; margin-bottom:2px; display:block;">Transformer kVA</label>
                <input class="form-control input-sm" [(ngModel)]="bus.xfKva" style="width:130px;" placeholder="2500 kVA" />
              </div>
              <div>
                <label style="font-size:0.82em; margin-bottom:2px; display:block;">Main Amps</label>
                <input class="form-control input-sm" type="number" [(ngModel)]="bus.mainA" style="width:90px;" placeholder="3600" />
              </div>
              <div>
                <label style="font-size:0.82em; margin-bottom:2px; display:block;">% Load</label>
                <input class="form-control input-sm" type="number" [(ngModel)]="bus.pctLoad" style="width:65px;" placeholder="14" />
              </div>
              <div>
                <label style="font-size:0.82em; margin-bottom:2px; display:block;">Drawing Ref</label>
                <input class="form-control input-sm" [(ngModel)]="bus.dwg" style="width:170px;" placeholder="22276.059 · E.01" />
              </div>
              <button type="button" class="btn btn-xs btn-danger" (click)="removeBus(meter, bi)">Remove Bus</button>
            </div>

            <!-- Circuits table -->
            <div *ngIf="bus.circuits && bus.circuits.length > 0" style="overflow-x:auto; margin-bottom:0.4em;">
              <table style="width:100%; min-width:600px; font-size:0.82em; border-collapse:collapse;">
                <thead>
                  <tr style="background:#e9ecef; text-align:left;">
                    <th style="padding:4px 6px;">Circuit / Load</th>
                    <th style="padding:4px 6px;">Amps</th>
                    <th style="padding:4px 6px; text-align:center;">ECBS-600</th>
                    <th style="padding:4px 6px; text-align:center;">APF-50</th>
                    <th style="padding:4px 6px; text-align:center;">APF-100</th>
                    <th style="padding:4px 4px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let circuit of bus.circuits; let ci = index" style="border-top:1px solid #dee2e6;">
                    <td style="padding:2px 4px;"><input class="form-control input-sm" [(ngModel)]="circuit.name" placeholder="Circuit name" style="min-width:160px;" /></td>
                    <td style="padding:2px 4px;"><input class="form-control input-sm" type="number" [(ngModel)]="circuit.amps" style="width:70px;" placeholder="0" /></td>
                    <td style="padding:2px 4px; text-align:center;"><input class="form-control input-sm" type="number" [(ngModel)]="circuit.nEcbs" style="width:55px;" placeholder="0" /></td>
                    <td style="padding:2px 4px; text-align:center;"><input class="form-control input-sm" type="number" [(ngModel)]="circuit.nApf50" style="width:55px;" placeholder="0" /></td>
                    <td style="padding:2px 4px; text-align:center;"><input class="form-control input-sm" type="number" [(ngModel)]="circuit.nApf100" style="width:55px;" placeholder="0" /></td>
                    <td style="padding:2px 4px;"><button type="button" class="btn btn-xs btn-danger" (click)="removeCircuit(bus, ci)">×</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" class="btn btn-xs btn-default" (click)="addCircuit(bus)">+ Circuit</button>
          </div>

          <button type="button" class="btn btn-xs btn-default" (click)="addBus(meter)" style="margin-left:1em;">+ Switchgear / Bus</button>
        </div>
        <button type="button" class="btn btn-xs btn-default" (click)="addMeter()" style="margin-bottom:0.5em;">+ Meter</button>

        <div class="row" style="margin-top:0.75em;">
          <div class="col-md-12" style="display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
            <button class="default-button" (click)="saveAll()"
                    style="background:#0a6e3f; border-color:#0a6e3f; color:#fff; font-weight:600; padding:8px 20px;">
              &#128190; Save All
            </button>
            <button class="default-button green-button" (click)="sendToEmv()" style="background:#1a6eb5; border-color:#1a6eb5;">
              Save for EM&amp;V Analysis
            </button>
            <span *ngIf="emvSendStatus" style="font-size:0.9em;" [style.color]="emvSendError ? '#c00' : '#2a7a2a'">{{emvSendStatus}}</span>
          </div>
        </div>
      </div>

      <!-- ───────────────────────────────────────────────────────────────── -->
      <!-- Scan Bill for Bill Analytic                                      -->
      <!-- ───────────────────────────────────────────────────────────────── -->
      <div id="bill-scan-section" style="background:#f0fff4; border:1px solid #b0d8b8; border-radius:6px; padding:1.25em 1.5em; margin-bottom:1.25em;">
        <h3 style="margin-top:0; margin-bottom:0.4em; color:#1a6a1a;">
          <span *ngIf="billScanSuccess || userService.user.selectedProject?.electricBillAnalysis?.totalKwh"
                style="color:#2a7a2a; margin-right:0.15em;">&#10003;</span>Scan Bill for Bill Analytic
          <small style="font-size:0.65em; color:#555; font-weight:normal;">— auto-fill Bill Analytic fields and EM&amp;V billing rates from a scanned PDF</small>
        </h3>
        <div style="display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:0.5em;">
          <input type="file" accept=".pdf" (change)="onBillScanFileSelect($event)" style="max-width:340px;" />
          <input type="text" [(ngModel)]="billScanMeterNumber" [ngModelOptions]="{standalone: true}"
                 placeholder="Meter # (optional, comma-sep for multi-meter)" style="width:240px;" />
          <input type="text" [(ngModel)]="billScanPageRange" [ngModelOptions]="{standalone: true}"
                 placeholder="Page range e.g. 1-3 (optional)" style="width:180px;" />
          <button type="button" class="default-button green-button" (click)="scanBillForAnalytic()" [disabled]="!billScanFile || billScanning">
            {{ billScanning ? 'Scanning...' : 'Scan Bill' }}
          </button>
          <span *ngIf="billScanSuccess" style="color:#2a7a2a; font-size:0.9em;">&#10003; Scanned — {{ billScanLineItemCount }} line item(s) loaded. Review fields below before generating.</span>
        </div>
        <div *ngIf="billScanError" style="color:#c00; font-size:0.9em;">{{ billScanError }}</div>
      </div>

      <!-- ───────────────────────────────────────────────────────────────── -->
      <!-- Upload Single-Line Drawing                                       -->
      <!-- ───────────────────────────────────────────────────────────────── -->
      <div id="sld-upload-section" *ngIf="userService.user.role === 8 || userService.user.role === 9 || userService.user.role === 10"
           style="background:#f0f4ff; border:1px solid #b0c4e0; border-radius:6px; padding:1.25em 1.5em; margin-bottom:1.25em;">
        <h3 style="margin-top:0; margin-bottom:0.4em; color:#1a3a6a;">
          <span *ngIf="userService.user.selectedProject?.sldAnalysis?.status === 'accepted'"
                style="color:#155724; margin-right:0.15em;">&#10003;</span>Upload Single-Line Drawing
          <small style="font-size:0.65em; color:#555; font-weight:normal;">— AI identifies equipment placement recommendations from your electrical SLD</small>
        </h3>

        <!-- Already-accepted banner -->
        <div *ngIf="userService.user.selectedProject?.sldAnalysis?.status === 'accepted' && !sldShowRescan"
             style="margin-bottom:0.75em; padding:0.6em 1em; background:#d4edda; border-radius:4px; color:#155724; font-size:0.9em;">
          &#10003; SLD accepted — {{ userService.user.selectedProject?.sldAnalysis?.summary }}
          <button type="button" class="btn btn-xs btn-default" style="margin-left:1em;" (click)="sldShowRescan = true">Re-scan</button>
        </div>

        <div *ngIf="!userService.user.selectedProject?.sldAnalysis || userService.user.selectedProject?.sldAnalysis?.status !== 'accepted' || sldShowRescan">
          <div style="display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:0.5em;">
            <div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple (change)="onSldFileSelect($event)" style="max-width:380px;" />
              <div *ngIf="sldMergeStatus" style="font-size:0.82em; color:#555; margin-top:3px;">{{ sldMergeStatus }}</div>
            </div>
            <div class="form-group" style="margin:0; display:flex; align-items:center; gap:6px;">
              <label style="margin:0; white-space:nowrap; font-weight:normal; font-size:0.9em;">Bill peak kW <span class="text-muted" style="font-weight:normal;">(optional):</span></label>
              <input type="number" class="form-control" [(ngModel)]="sldPeakKw" [ngModelOptions]="{standalone: true}"
                     [placeholder]="kwPeak ? kwPeak : 'e.g. 450'" style="width:110px;" />
            </div>
            <button type="button" class="default-button green-button" (click)="analyzeSldDrawing()" [disabled]="!sldFile || sldScanning || sldMerging">
              {{ sldScanning ? sldScanStatus : (sldMerging ? 'Merging PDFs…' : 'Analyze Drawing') }}
            </button>
          </div>
          <div *ngIf="sldError" style="color:#c00; font-size:0.9em; margin-bottom:0.5em;">{{ sldError }}</div>

          <!-- Review card -->
          <div id="sld-review-card" *ngIf="sldResult && !sldSaved"
               style="margin-top:1em; border:1px solid #b0c4e0; border-radius:5px; background:#fff; padding:1em 1.25em;">
            <div style="display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:0.75em;">
              <div>
                <strong>{{ sldResult.summary }}</strong>
                <span *ngIf="sldResult.extraction?.vfdsFound"
                      style="margin-left:0.75em; padding:2px 9px; border-radius:10px; background:#d4edda; color:#155724; font-size:0.82em; font-weight:bold;">VFDs Present</span>
                <span *ngIf="sldResult.extraction && !sldResult.extraction.vfdsFound"
                      style="margin-left:0.75em; padding:2px 9px; border-radius:10px; background:#e9ecef; color:#495057; font-size:0.82em;">No VFDs</span>
              </div>
              <div style="white-space:nowrap;">
                <a *ngIf="sldGpuJobId" [href]="'/api/sld/' + sldGpuJobId + '/diagram?fmt=pdf'" target="_blank"
                   class="btn btn-default btn-sm" style="margin-right:6px;">&#128196; Diagram PDF</a>
                <button type="button" class="btn btn-success btn-sm" (click)="acceptSldRecommendations()" style="margin-right:6px;">Accept Recommendations</button>
                <button type="button" class="btn btn-default btn-sm" (click)="dismissSldRecommendations()">Dismiss</button>
              </div>
            </div>

            <!-- Rendered SLD diagram -->
            <div *ngIf="sldGpuJobId" style="margin-bottom:1em;text-align:center;">
              <img [src]="'/api/sld/' + sldGpuJobId + '/diagram?fmt=png'"
                   style="max-width:100%;border:1px solid #d0d8e4;border-radius:4px;"
                   alt="Single-Line Diagram" />
            </div>

            <!-- Placements table -->
            <div *ngIf="sldResult.placements?.length > 0" style="margin-bottom:1em;">
              <h5 style="margin:0 0 0.4em; font-size:0.92em; color:#333; text-transform:uppercase; letter-spacing:.04em;">Placement Recommendations</h5>
              <table class="table table-condensed table-bordered" style="font-size:0.88em; margin-bottom:0;">
                <thead style="background:#f0f4ff;">
                  <tr>
                    <th>Panel</th>
                    <th>Equipment Type</th>
                    <th>kVA Band</th>
                    <th>VFD</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let pl of sldResult.placements">
                    <td>{{ pl.panelName }}</td>
                    <td>{{ pl.equipmentType }}</td>
                    <td>{{ pl.ratingBand }}</td>
                    <td>
                      <span *ngIf="pl.vfdPresent" style="color:#155724;">&#10003;</span>
                      <span *ngIf="!pl.vfdPresent" style="color:#aaa;">—</span>
                    </td>
                    <td style="color:#666; font-size:0.9em;">{{ pl.notes }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Power quality / code issue warnings -->
            <div *ngIf="sldResult.extraction?.powerQualityRisks?.length > 0"
                 style="margin-bottom:0.75em; padding:0.5em 0.75em; background:#fff3cd; border-radius:4px; font-size:0.87em;">
              <strong style="color:#856404;">&#9888; Power Quality Risks</strong>
              <ul style="margin:0.3em 0 0 1em; padding:0;">
                <li *ngFor="let r of sldResult.extraction.powerQualityRisks" style="color:#856404;">
                  <span *ngIf="r?.label; else pqrStr"><strong>{{ r.label }}</strong><span *ngIf="r.location"> — {{ r.location }}</span></span>
                  <ng-template #pqrStr>{{ r }}</ng-template>
                </li>
              </ul>
            </div>
            <div *ngIf="sldResult.extraction?.codeIssues?.length > 0"
                 style="margin-bottom:0.75em; padding:0.5em 0.75em; background:#f8d7da; border-radius:4px; font-size:0.87em;">
              <strong style="color:#721c24;">&#9888; Code Issues</strong>
              <ul style="margin:0.3em 0 0 1em; padding:0;">
                <li *ngFor="let c of sldResult.extraction.codeIssues" style="color:#721c24;">
                  <span *ngIf="c?.label; else ciStr"><strong>{{ c.label }}</strong><span *ngIf="c.location"> — {{ c.location }}</span></span>
                  <ng-template #ciStr>{{ c }}</ng-template>
                </li>
              </ul>
            </div>
            <div *ngIf="sldResult.extraction?.nonStandardConfigurations?.length > 0"
                 style="margin-bottom:0.5em; padding:0.5em 0.75em; background:#d1ecf1; border-radius:4px; font-size:0.87em;">
              <strong style="color:#0c5460;">&#8505; Non-Standard Configurations</strong>
              <ul style="margin:0.3em 0 0 1em; padding:0;">
                <li *ngFor="let n of sldResult.extraction.nonStandardConfigurations" style="color:#0c5460;">
                  <span *ngIf="n?.label; else nscStr"><strong>{{ n.label }}</strong><span *ngIf="n.location"> — {{ n.location }}</span></span>
                  <ng-template #nscStr>{{ n }}</ng-template>
                </li>
              </ul>
            </div>

            <!-- VFD findings -->
            <div *ngIf="sldResult.extraction?.vfdFindings?.length > 0"
                 style="margin-bottom:0.75em; padding:0.5em 0.75em; background:#d4edda; border-radius:4px; font-size:0.87em;">
              <strong style="color:#155724;">&#9889; VFDs Identified</strong>
              <ul style="margin:0.3em 0 0 1em; padding:0;">
                <li *ngFor="let v of sldResult.extraction.vfdFindings" style="color:#155724;">
                  <strong>{{ v.label }}</strong><span *ngIf="v.location"> — {{ v.location }}</span>
                </li>
              </ul>
            </div>

            <!-- Generators -->
            <div *ngIf="sldResult.extraction?.generatorsFound?.length > 0"
                 style="margin-bottom:0.75em; padding:0.5em 0.75em; background:#e2d9f3; border-radius:4px; font-size:0.87em;">
              <strong style="color:#4b2c7a;">&#9889; Generators / ATS</strong>
              <ul style="margin:0.3em 0 0 1em; padding:0;">
                <li *ngFor="let g of sldResult.extraction.generatorsFound" style="color:#4b2c7a;">
                  <strong>{{ g.label }}</strong><span *ngIf="g.location"> — {{ g.location }}</span>
                </li>
              </ul>
            </div>

            <!-- UPS -->
            <div *ngIf="sldResult.extraction?.upsFound?.length > 0"
                 style="margin-bottom:0.75em; padding:0.5em 0.75em; background:#d1ecf1; border-radius:4px; font-size:0.87em;">
              <strong style="color:#0c5460;">&#128268; UPS Units</strong>
              <ul style="margin:0.3em 0 0 1em; padding:0;">
                <li *ngFor="let u of sldResult.extraction.upsFound" style="color:#0c5460;">
                  <strong>{{ u.label }}</strong><span *ngIf="u.location"> — {{ u.location }}</span>
                </li>
              </ul>
            </div>

            <!-- Cap banks / PFC -->
            <div *ngIf="sldResult.extraction?.pfcOrCapacitorBanks?.length > 0"
                 style="margin-bottom:0.75em; padding:0.5em 0.75em; background:#f3e8ff; border-radius:4px; font-size:0.87em;">
              <strong style="color:#6a0dad;">&#9672; Capacitor Banks / PFC</strong>
              <ul style="margin:0.3em 0 0 1em; padding:0;">
                <li *ngFor="let cb of sldResult.extraction.pfcOrCapacitorBanks" style="color:#6a0dad;">
                  <strong>{{ cb.label }}</strong><span *ngIf="cb.location"> — {{ cb.location }}</span>
                </li>
              </ul>
            </div>

            <!-- Per-panel flags + feedSource -->
            <div *ngIf="hasPanelFlags(sldResult)" style="font-size:0.85em; color:#555; margin-top:0.25em;">
              <strong>Panel Flags:</strong>
              <ng-container *ngFor="let pan of sldResult.extraction?.panels">
                <span *ngFor="let flag of pan.flags"
                      style="display:inline-block; margin:2px 4px; padding:1px 7px; background:#ffeeba; border-radius:10px; color:#856404; font-size:0.85em;">
                  {{ pan.panelName }}<span *ngIf="pan.feedSource"> (fed from {{ pan.feedSource }})</span>: {{ flag }}
                </span>
              </ng-container>
            </div>
          </div>

          <!-- Saved confirmation -->
          <div *ngIf="sldSaved" style="margin-top:0.75em; padding:0.5em 0.75em; background:#d4edda; border-radius:4px; color:#155724; font-size:0.9em;">
            &#10003; Recommendations saved to project.
          </div>
        </div>
      </div>

      <!-- ───────────────────────────────────────────────────────────────── -->
      <!-- My Jobs                                                          -->
      <!-- ───────────────────────────────────────────────────────────────── -->
      <div *ngIf="userService.user.role === 8 || userService.user.role === 9 || userService.user.role === 10"
           style="background:#f5f0ff; border:1px solid #c8b4e0; border-radius:6px; padding:1.25em 1.5em; margin-bottom:1.25em;">
        <h3 style="margin-top:0; margin-bottom:0.75em; color:#4a1a5c;">My Jobs
          <small style="font-size:0.65em; color:#777; font-weight:normal;">— AI analysis running in the background</small>
          <a *ngIf="userService.user.role === 8" [routerLink]="['/billing/gpu-queue']"
             style="font-size:0.58em; margin-left:1.25em; color:#4a1a5c; text-decoration:underline; font-weight:normal;">View all active jobs ›</a>
        </h3>

        <!-- Toast -->
        <div *ngIf="myJobsToast"
             style="padding:0.5em 1em; background:#4a1a5c; color:#fff; border-radius:4px; margin-bottom:0.75em; font-size:0.9em;">
          {{ myJobsToast }}
        </div>

        <div *ngIf="myJobs.length === 0" style="color:#888; font-style:italic; font-size:0.9em;">
          No jobs in progress. Submit a bill scan or SLD above to get started.
        </div>

        <!-- Job cards -->
        <div *ngFor="let job of myJobs"
             style="border:1px solid #d4c0e8; border-radius:4px; background:#fff; padding:0.75em 1em; margin-bottom:0.5em;">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div>
              <span style="font-weight:bold; color:#4a1a5c;">{{ job.job_type === 'bill' ? 'Bill Scan' : 'SLD Analysis' }}</span>
              <span style="margin-left:0.5em; color:#555; font-size:0.9em;">{{ job.filename }}</span>

              <!-- Pending / processing -->
              <span *ngIf="!job._status || job._status === 'pending'"
                    style="margin-left:0.75em; padding:2px 8px; border-radius:10px; background:#e9ecef; color:#555; font-size:0.8em;">
                Processing&#8230; ({{ getElapsedMin(job) }} min elapsed, est. {{ job.estimated_minutes }} min)
              </span>
              <!-- Retrying -->
              <span *ngIf="job._status && job._status.startsWith('retrying_')"
                    style="margin-left:0.75em; padding:2px 8px; border-radius:10px; background:#fff3cd; color:#856404; font-size:0.8em; font-weight:bold;">
                &#x21BA; Retrying (attempt {{ getRetryAttempt(job._status) }}/3)&#8230;
              </span>
              <!-- Ready -->
              <span *ngIf="job._status === 'done'"
                    style="margin-left:0.75em; padding:2px 8px; border-radius:10px; background:#d4edda; color:#155724; font-size:0.8em; font-weight:bold;">
                &#10003; Ready
              </span>
              <!-- Failed -->
              <span *ngIf="job._status === 'error'"
                    style="margin-left:0.75em; padding:2px 8px; border-radius:10px; background:#f8d7da; color:#721c24; font-size:0.8em; font-weight:bold;">
                &#10007; Failed
              </span>
            </div>

            <!-- Action buttons -->
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
              <button *ngIf="job._status === 'done'" type="button"
                      class="btn btn-success btn-sm" (click)="viewJobResult(job)">View Result</button>
              <button *ngIf="job._status === 'error' && isRecoverableError(job)" type="button"
                      class="btn btn-warning btn-sm" (click)="retryJob(job)">Retry</button>
              <button *ngIf="job._status === 'error'" type="button"
                      class="btn btn-default btn-sm" (click)="dismissJob(job)">Dismiss</button>
            </div>
          </div>

          <!-- Error details -->
          <div *ngIf="job._status === 'error'" style="margin-top:0.4em;">
            <div style="color:#721c24; font-size:0.85em;">{{ job._errorMsg }}</div>
            <a *ngIf="job._errorNotes" href="javascript:void(0)"
               style="font-size:0.8em; color:#888;" (click)="job._showError = !job._showError">
              {{ job._showError ? 'Hide details' : 'Show details' }}
            </a>
            <pre *ngIf="job._showError && job._errorNotes"
                 style="font-size:0.75em; background:#f8f8f8; padding:0.5em; border-radius:3px; overflow:auto; max-height:120px; margin-top:4px; white-space:pre-wrap;">{{ job._errorNotes }}</pre>
          </div>
        </div>
      </div>

      <!-- Bill Analytic Data Fields (populated from scan, editable before generating report) -->
      <div id="bill-analytic-section" style="background:#fff; border:1px solid #dee2e6; border-radius:6px; padding:1.25em 1.5em; margin-bottom:1.5em;">
        <h3 style="margin-top:0; margin-bottom:0.75em; color:#333;">Bill Analytic Data
          <small style="font-size:0.65em; color:#888; font-weight:normal;">Review and adjust before generating the report</small>
        </h3>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label>Bill Reference</label>
              <input class="form-control" [(ngModel)]="baBillReference" (ngModelChange)="scheduleBillAnalyticSave()" placeholder="e.g. January 2025 Electric Bill" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label>Electric Company</label>
              <input class="form-control" [(ngModel)]="baElectricCompanyName" (ngModelChange)="scheduleBillAnalyticSave()" placeholder="e.g. Oncor" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label>Account Number</label>
              <input class="form-control" [(ngModel)]="baAccountNumber" (ngModelChange)="scheduleBillAnalyticSave()" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label>Tariff / Rate Schedule</label>
              <input class="form-control" [(ngModel)]="baTariff" (ngModelChange)="scheduleBillAnalyticSave()" placeholder="e.g. TOU-GS-3-B" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label>Meter Number</label>
              <input class="form-control" [(ngModel)]="baMeterNumber" />
            </div>
          </div>
        </div>

        <!-- Tariff Lookup -->
        <div class="row" style="margin-bottom:0.5em;">
          <div class="col-md-3">
            <div class="form-group">
              <label>Country</label>
              <input class="form-control" [(ngModel)]="baCountry" placeholder="e.g. USA, UK, Australia" />
            </div>
          </div>
          <div class="col-md-9" style="display:flex; align-items:flex-end; padding-bottom:15px;">
            <button type="button" class="default-button blue-button"
              (click)="lookupTariffRates()"
              [disabled]="tariffLookupLoading || (!baElectricCompanyName && !baTariff)"
              style="margin-right:0.75em;">
              <span *ngIf="!tariffLookupLoading">🔍 Look Up Tariff Rates</span>
              <span *ngIf="tariffLookupLoading">⏳ Looking up rates...</span>
            </button>
            <span *ngIf="tariffLookupStatus" [style.color]="tariffLookupError ? '#c00' : '#2a6e2a'" style="font-size:0.88em;">
              {{ tariffLookupStatus }}
            </span>
          </div>
        </div>
        <div *ngIf="tariffLookupSource" style="background:#f0f7ff; border:1px solid #b8d4f0; border-radius:5px; padding:0.6em 1em; margin-bottom:1em; font-size:0.85em; color:#1a4a7a;">
          <strong>Source:</strong> {{ tariffLookupSource }}
          <span *ngIf="tariffLookupConfidence" style="margin-left:1em; padding:2px 7px; border-radius:10px; font-size:0.88em;"
            [style.background]="tariffLookupConfidence === 'high' ? '#d4edda' : tariffLookupConfidence === 'medium' ? '#fff3cd' : '#f8d7da'"
            [style.color]="tariffLookupConfidence === 'high' ? '#155724' : tariffLookupConfidence === 'medium' ? '#856404' : '#721c24'">
            {{ tariffLookupConfidence === 'high' ? '✓ High confidence' : tariffLookupConfidence === 'medium' ? '~ Medium confidence' : '⚠ AI estimate — verify with utility' }}
          </span>
          <span *ngIf="tariffLookupNotes" style="display:block; margin-top:4px; color:#555;">{{ tariffLookupNotes }}</span>
        </div>

        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>Total KWH</label>
              <input class="form-control" type="number" step="any" [(ngModel)]="baTotalKwh" (ngModelChange)="scheduleBillAnalyticSave()" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>KW Peak</label>
              <input class="form-control" type="number" step="any" [(ngModel)]="baKwPeak" (ngModelChange)="scheduleBillAnalyticSave()" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Total Bill Amount ($)</label>
              <input class="form-control" type="number" step="0.01" [(ngModel)]="baBillAmount" (ngModelChange)="scheduleBillAnalyticSave()" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label>Days Billed</label>
              <input class="form-control" type="number" step="1" [(ngModel)]="baDaysBilled" (ngModelChange)="scheduleBillAnalyticSave()" />
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>Voltage</label>
              <select class="form-control" [(ngModel)]="baVoltage" (ngModelChange)="scheduleBillAnalyticSave()">
                <option value="480">480</option>
                <option value="240">240</option>
                <option value="208">208</option>
              </select>
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label>KW Rate per Tariff</label>
              <input class="form-control" type="number" step="any" [(ngModel)]="baKwRatePerTariff" (ngModelChange)="scheduleBillAnalyticSave()" />
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
              <td><input class="form-control input-sm" [(ngModel)]="baLineItems[i].name" (ngModelChange)="scheduleBillAnalyticSave()" /></td>
              <td style="padding:6px 8px;">{{ item.type }}</td>
              <td><input class="form-control input-sm" type="number" [(ngModel)]="baLineItems[i].cost" (ngModelChange)="scheduleBillAnalyticSave()" /></td>
              <td><input class="form-control input-sm" type="number" [(ngModel)]="baLineItems[i].billingRate" (ngModelChange)="scheduleBillAnalyticSave()" /></td>
              <td><input class="form-control input-sm" type="number" [(ngModel)]="baLineItems[i].meterReading" (ngModelChange)="scheduleBillAnalyticSave()" /></td>
            </tr>
            <tr *ngIf="baLineItems.length === 0">
              <td colspan="5" style="text-align:center; color:#888; font-style:italic;">No line items — scan a bill or add manually.</td>
            </tr>
          </tbody>
        </table>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:0.75em; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <button type="button" class="default-button" (click)="saveBillAnalyticFields()"
                    style="background:#0a6e3f; border-color:#0a6e3f; color:#fff; font-weight:600; padding:8px 20px;">
              &#128190; Save
            </button>
            <span *ngIf="saveAllStatus" style="font-size:0.9em;" [style.color]="saveAllError ? '#c00' : '#2a7a2a'">{{ saveAllStatus }}</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <button type="button" class="default-button green-button" (click)="generateBillAnalytic()" [disabled]="!baTotalKwh || baGenerating">
              {{ baGenerating ? 'Saving...' : 'Generate Bill Analytic Report' }}
            </button>
            <span *ngIf="baGenerateStatus" style="font-size:0.9em;" [style.color]="baGenerateError ? '#c00' : '#2a7a2a'">{{ baGenerateStatus }}</span>
          </div>
          <div *ngIf="userService.user.role === 9 || userService.user.role === 8 || userService.user.role === 7" style="display:flex; align-items:center; gap:10px;">
            <a class="default-button green-button" [routerLink]="['/billing/bill-analytic/equipments']" style="text-decoration:none;">
              Confirm Equipment Totals
            </a>
          </div>
        </div>
      </div>

      <!-- ── Bill Analytic Section ─────────────────────────────────────────── -->
      <div style="margin-top:1.5em; padding:1.25em; background:#0f1e35; border:1px solid #1c3a5e; border-radius:8px;">
        <h3 style="color:#00aaff; margin-bottom:0.75em; font-size:1.15em; font-weight:700;">
          &#128196; Bill Analytic
        </h3>
        <p style="color:#6b8099; font-size:0.9em; margin-bottom:1em;">
          Automatically size equipment, calculate ROI, and generate a professional proposal PDF based on the scanned bill data above.
        </p>

        <!-- Generate button -->
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <button type="button" class="default-button green-button" [disabled]="proposalGenerating || !baTotalKwh"
            (click)="generateEcbsProposal()"
            style="background:#006633; border-color:#006633; font-weight:700; padding:9px 22px;">
            {{ proposalGenerating ? 'Generating PDF...' : '&#128196; Generate Bill Analytic PDF' }}
          </button>
          <span *ngIf="proposalStatus" style="font-size:0.88em;"
            [style.color]="proposalError ? '#c00' : '#00e5a0'">{{ proposalStatus }}</span>
        </div>
        <div *ngIf="!baTotalKwh" style="font-size:0.82em; color:#6b8099; margin-top:6px;">
          &#9432; Scan a bill above first to populate bill data for the proposal.
        </div>
        <div *ngIf="userService.user.selectedProject.sldAnalysis" style="font-size:0.82em; color:#00e5a0; margin-top:4px;">
          &#10003; SLD topology loaded &mdash; set equipment counts in the pre-fill panel above.
        </div>

        <!-- Proposal Contract (no SLD required) -->
        <div style="margin-top:14px; border-top:1px solid #1c3a5e; padding-top:14px;">
          <div style="font-size:0.88em; color:#a8c8f0; font-weight:600; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;">
            Proposal Contract
          </div>
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <button type="button" class="default-button" [disabled]="reportPcGenerating"
              (click)="openProposalContract()"
              style="background:#1a3a6b; border-color:#005fa3; color:#fff; font-weight:700; padding:9px 20px;">
              {{ reportPcGenerating ? 'Generating...' : '&#128196; Proposal Contract PDF' }}
            </button>
            <span *ngIf="reportStatus && !reportNaGenerating" style="font-size:0.88em;"
              [style.color]="reportError ? '#c00' : '#00e5a0'">{{ reportStatus }}</span>
          </div>
          <div style="font-size:0.80em; color:#a8c8f0; margin-top:6px;">
            &#9432; Uses bill data. If no SLD has been accepted, equipment mix defaults to 30% APF.
          </div>
        </div>

        <!-- Network Assessment (requires accepted SLD) -->
        <div style="margin-top:14px; border-top:1px solid #1c3a5e; padding-top:14px;">
          <div style="font-size:0.88em; color:#a8c8f0; font-weight:600; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;">
            SLD-Based Engineering Report
          </div>
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <button type="button" class="default-button" [disabled]="reportNaGenerating"
              (click)="openNetworkAssessment()"
              style="background:#005fa3; border-color:#005fa3; color:#fff; font-weight:700; padding:9px 20px;">
              {{ reportNaGenerating ? 'Generating...' : '&#128202; Network Assessment PDF' }}
            </button>
            <span *ngIf="reportStatus && !reportPcGenerating" style="font-size:0.88em;"
              [style.color]="reportError ? '#c00' : '#00e5a0'">{{ reportStatus }}</span>
          </div>
          <div style="font-size:0.80em; color:#a8c8f0; margin-top:6px;">
            &#9432; Requires an accepted Single-Line Drawing analysis (SLD topology).
          </div>
        </div>
      </div>

      <div *ngIf="billAnalytic===false">
        <h3>Electric Bill Analytics</h3>
        <p>Create a new monthly cost savings report for this project or review reports from this client past electric bills.</p>
        <button *ngIf="userService.user.role === 9 || userService.user.role === 8 || userService.user.role === 7" class="default-button green-button" [routerLink]="['/billing/bill-analytic/create']">Create Initial Analytic</button>
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
                click <a *ngIf="userService.user.role === 9 || userService.user.role === 8 || userService.user.role === 7 || userService.user.role === 2" [routerLink]="['/billing/bill-analytic/list']"><strong>here</strong></a> to review or edit.
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
export class ListSavingsReportComponent implements OnInit, OnDestroy {

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
  public emvClientCity: string = '';
  public emvClientState: string = '';
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
  public emvTariff: string = '';
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
  public saveAllStatus: string = '';
  public saveAllError: boolean = false;

  // Facility Narrative
  public emvFacilityType: string = '';
  public emvFacilitySiteLabel: string = '';
  public emvSldSource: string = '';
  public emvBillingMonthsLabel: string = '';
  public emvOverviewPara: string = '';
  public emvCapacitorBankBullet: string = '';

  // Power Factor
  public emvPfReference: string = '';
  public emvPfReferenceMonth: string = '';
  public emvPfWorst: string = '';
  public emvHasPfPenalty: boolean = false;
  public emvPfPenaltyUsd: string = '';

  // Commercial / BOM flags
  public emvCustomerOwnsMeters: boolean = false;
  public emvIsUpgrade: boolean = false;
  public emvEngineeringFee: string = '';
  public emvSwYr1: string = '';
  public emvDiscount: string = '';
  public emvShipping: string = '';

  // Equipment override counts (blank = auto)
  public emvS600Override: string = '';
  public emvApf100Override: string = '';
  public emvApf50Override: string = '';
  public emvEquipSource: string = '';   // e.g. "peak_kw_formula" or "sld_confirmed"

  // Electrical topology tree: Meter → Buses → Circuits
  public topoMeters: any[] = [];

  // Bill scan state (for Bill Analytic generation)
  public billScanFile: File | null = null;
  public billScanning = false;
  public billScanError: string | null = null;
  public billScanSuccess = false;
  public billScanLineItemCount = 0;
  public billScanMeterNumber: string = '';
  public billScanPageRange: string = '';

  // SLD (Single-Line Drawing) scan state
  public sldFile: File | null = null;
  public sldPeakKw: number | null = null;
  public sldScanning = false;
  public sldMerging = false;
  public sldMergeStatus: string | null = null;
  public sldScanStatus = 'Analyzing drawing…';
  public sldError: string | null = null;
  public sldResult: any = null;
  public sldGpuJobId: number | null = null;
  public sldSaved = false;
  public sldShowRescan = false;

  // My Jobs state
  public myJobs: MyJob[] = [];
  public myJobsToast: string | null = null;
  private _myJobsPollInterval: any = null;
  private _myJobsToastTimer: any = null;

  // Bill Analytic fields (populated from scan, drive report generation)
  public baBillReference: string = '';
  public baElectricCompanyName: string = '';
  public baAccountNumber: string = '';
  public baMeterNumber: string = '';
  public baTariff: string = '';
  public baCountry: string = 'USA';
  // Tariff lookup state
  public tariffLookupLoading   = false;
  public tariffLookupStatus    = '';
  public tariffLookupError     = false;
  public tariffLookupSource    = '';
  public tariffLookupConfidence= '';
  public tariffLookupNotes     = '';
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

  private _billAnalyticSaveTimeout: any = null;
  private readonly _billAnalyticSaveDebounceMs = 1500;

  // ── ECBS Proposal ─────────────────────────────────────────────────────────
  public proposalGenerating = false;
  public proposalSaving = false;
  public proposalStatus = '';
  public proposalError = false;

  // ── SLD-Based Engineering Reports ─────────────────────────────────────────
  public reportNaGenerating = false;
  public reportPcGenerating = false;
  public reportStatus = '';
  public reportError = false;
  public proposalFacilityContext = '';
  public proposalFetchingContext = false;
  public proposalContextStatus = '';
  public proposalContextError = false;
  public proposalSavingsPct: number = 6;
  public proposalNMeters: number = 1;

  // Facility Narrative auto-fill state
  public emvNarrativeFetching = false;
  public emvNarrativeStatus = '';
  public emvNarrativeError = false;

  // Global "Auto-fill All" state
  public emvAutoFillAllFetching = false;
  public emvAutoFillAllStatus = '';
  public emvAutoFillAllError = false;

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
    private clientService: ClientService,
    private sldService: SldService,
    private myJobsService: MyJobsService,
    private proposalService: ProposalService,
  ) { }

  ngOnDestroy() {
    if (this._billAnalyticSaveTimeout) clearTimeout(this._billAnalyticSaveTimeout);
    if (this._myJobsPollInterval) clearInterval(this._myJobsPollInterval);
    if (this._myJobsToastTimer) clearTimeout(this._myJobsToastTimer);
  }

  ngOnInit() {
    this.hasRunTest = this.userService.user.selectedProject.hasRunTest;
    this.pdfLinkService.getLinks().subscribe(links => {
      this.links = links;
    });
    this.billAnalyticService.getAnalytic().subscribe((analytic: any) => {
      this.billAnalytic = analytic || false;
    });

    // Restore last scanned bill data from the project so fields persist across page visits.
    const proj: any = this.userService.user.selectedProject;
    const eba = proj && proj.electricBillAnalysis;
    if (eba && typeof eba === 'object' && Object.keys(eba).length > 0) {
      const merged: any = Object.assign({}, eba);
      const rf = proj.reportFields;
      if (rf && typeof rf === 'object') {
        if (rf['energy_rate']      && !merged.kwhRate)           { merged.kwhRate           = rf['energy_rate']; }
        if (rf['demand_rate']      && !merged.kwRatePerTariff)   { merged.kwRatePerTariff   = rf['demand_rate']; }
        if (rf['utility']          && !merged.electricCompanyName){ merged.electricCompanyName = rf['utility']; }
        if (rf['account']          && !merged.accountNumber)     { merged.accountNumber     = rf['account']; }
        if (rf['facility_address'] && !merged.serviceAddress)    { merged.serviceAddress    = rf['facility_address']; }
        if (rf['facility_city']    && !merged.serviceCity)       { merged.serviceCity       = rf['facility_city']; }
        if (rf['facility_state']   && !merged.serviceState)      { merged.serviceState      = rf['facility_state']; }
        if (rf['facility_zip']     && !merged.serviceZip)        { merged.serviceZip        = rf['facility_zip']; }
        if (rf['tariff']           && !merged.tariff)            { merged.tariff            = rf['tariff']; }
      }
      this.populateFromScan(merged);
      // Pre-fill SLD peak kW from the bill analysis so the user doesn't have to retype it.
      if (eba.kwPeak) { this.sldPeakKw = parseFloat(eba.kwPeak) || null; }
    }

    // Restore all EM&V Pre-fill fields from project.reportFields so they show on every page load.
    const rf: any = (proj && proj.reportFields) || {};
    if (rf && typeof rf === 'object' && Object.keys(rf).length > 0) {
      // Client Information
      if (rf['company'])            this.emvClientName        = rf['company'];
      if (rf['cp_address'])         this.emvClientAddress     = rf['cp_address'];
      if (rf['cp_city'])            this.emvClientCity        = rf['cp_city'];
      if (rf['cp_state'])           this.emvClientState       = rf['cp_state'];
      // Legacy: parse cp_city_state into city and state
      if (!this.emvClientCity && !this.emvClientState && rf['cp_city_state']) {
        const parts = String(rf['cp_city_state']).split(',').map((s: string) => s.trim());
        if (parts[0]) this.emvClientCity = parts[0];
        if (parts[1]) this.emvClientState = parts[1];
      }
      if (rf['cp_zip'])             this.emvClientZip         = rf['cp_zip'];
      if (rf['contact'])            this.emvContactName       = rf['contact'];
      if (rf['phone'])              this.emvContactPhone      = rf['phone'];
      if (rf['email'])              this.emvContactEmail      = rf['email'];
      // Project Information
      if (rf['project_type'])       this.emvProjectType       = rf['project_type'];
      if (rf['facility_address'])   this.emvFacilityAddress   = rf['facility_address'];
      if (rf['facility_city'])     this.emvFacilityCity      = rf['facility_city'];
      if (rf['facility_state'])     this.emvFacilityState     = rf['facility_state'];
      if (rf['facility_zip'])       this.emvFacilityZip       = rf['facility_zip'];
      // Billing Information
      if (rf['project_cost'])       this.emvProjectCost       = rf['project_cost'];
      if (rf['utility'])            { this.emvUtility = rf['utility']; this.emvUtilityName = rf['utility']; }
      if (rf['utility_name'])       this.emvUtilityName       = rf['utility_name'];
      if (rf['utility_program'])    this.emvUtilityProgram    = rf['utility_program'];
      if (rf['tariff'])             this.emvTariff            = rf['tariff'];
      if (rf['account'])            this.emvAccountNumber     = rf['account'];
      if (rf['energy_rate'])        this.emvEnergyRate        = String(rf['energy_rate']);
      if (rf['demand_rate'])        this.emvDemandRate        = String(rf['demand_rate']);
      if (rf['capacity_rate'])      this.emvCapacityRate      = String(rf['capacity_rate']);
      if (rf['billing_model'])      this.emvBillingModel      = rf['billing_model'];
      if (rf['kva_demand_rate'])    this.emvKvaDemandRate     = String(rf['kva_demand_rate']);
      if (rf['reactive_adder'])     this.emvReactiveAdder     = String(rf['reactive_adder']);
      if (rf['ncp_demand_rate'])    this.emvNcpDemandRate     = String(rf['ncp_demand_rate']);
      if (rf['cp_demand_rate'])     this.emvCpDemandRate      = String(rf['cp_demand_rate']);
      if (rf['coincident_peak'])    this.emvCoincidentPeakRate= String(rf['coincident_peak']);
      if (rf['target_pf'])          this.emvTargetPF          = String(rf['target_pf']);
      if (rf['discount_rate'])      this.emvDiscountRate      = String(rf['discount_rate']);
      if (rf['escalation_rate'])    this.emvEscalationRate    = String(rf['escalation_rate']);
      if (rf['analysis_period'])    this.emvAnalysisPeriod    = String(rf['analysis_period']);
      if (rf['tou_on_peak'])        this.emvTouOnPeak         = String(rf['tou_on_peak']);
      if (rf['tou_off_peak'])       this.emvTouOffPeak        = String(rf['tou_off_peak']);
      if (rf['summer_fraction_pct'])this.emvSummerFraction    = String(rf['summer_fraction_pct']);
      if (rf['summer_on_peak'])     this.emvSummerOnPeak      = String(rf['summer_on_peak']);
      if (rf['summer_off_peak'])    this.emvSummerOffPeak     = String(rf['summer_off_peak']);
      if (rf['winter_on_peak'])     this.emvWinterOnPeak      = String(rf['winter_on_peak']);
      if (rf['winter_off_peak'])    this.emvWinterOffPeak     = String(rf['winter_off_peak']);
      if (rf['onpeak_fraction_pct'])this.emvOnPeakShare       = String(rf['onpeak_fraction_pct']);
      if (rf['ratchet_percent'])    this.emvRatchetPct        = String(rf['ratchet_percent']);
      if (rf['ratchet_ref_peak'])   this.emvRatchetRefPeak    = String(rf['ratchet_ref_peak']);
    }

    // Restore ECBS Proposal settings from proposalData
    const pd = proj && proj.proposalData;
    if (pd && typeof pd === 'object') {
      if (pd['facilityContext'] != null)       this.proposalFacilityContext  = pd['facilityContext'];
      if (pd['savingsPct'] != null)            this.proposalSavingsPct       = parseFloat(pd['savingsPct']) * 100 || 6;
      if (pd['nMeters'] != null)               this.proposalNMeters           = parseInt(pd['nMeters'], 10) || 1;
      // Facility Narrative
      if (pd['facilityType'] != null)          this.emvFacilityType          = pd['facilityType'];
      if (pd['facilitySiteLabel'] != null)     this.emvFacilitySiteLabel     = pd['facilitySiteLabel'];
      if (pd['sldSource'] != null)             this.emvSldSource             = pd['sldSource'];
      if (pd['billingMonthsLabel'] != null)    this.emvBillingMonthsLabel    = pd['billingMonthsLabel'];
      if (pd['overviewPara'] != null)          this.emvOverviewPara          = pd['overviewPara'];
      if (pd['capacitorBankBullet'] != null)   this.emvCapacitorBankBullet   = pd['capacitorBankBullet'];
      // Power Factor
      if (pd['pfReference'] != null)           this.emvPfReference           = String(pd['pfReference']);
      if (pd['pfReferenceMonth'] != null)      this.emvPfReferenceMonth      = pd['pfReferenceMonth'];
      if (pd['pfWorst'] != null)               this.emvPfWorst               = String(pd['pfWorst']);
      if (pd['hasPfPenalty'] != null)          this.emvHasPfPenalty          = !!pd['hasPfPenalty'];
      if (pd['pfPenaltyUsd'] != null)          this.emvPfPenaltyUsd          = String(pd['pfPenaltyUsd']);
      // Commercial / BOM
      if (pd['customerOwnsMeters'] != null)    this.emvCustomerOwnsMeters    = !!pd['customerOwnsMeters'];
      if (pd['isUpgrade'] != null)             this.emvIsUpgrade             = !!pd['isUpgrade'];
      if (pd['engineeringFee'] != null)        this.emvEngineeringFee        = String(pd['engineeringFee']);
      if (pd['swYr1'] != null)                 this.emvSwYr1                 = String(pd['swYr1']);
      if (pd['discount'] != null)              this.emvDiscount              = String(pd['discount']);
      if (pd['shipping'] != null)              this.emvShipping              = String(pd['shipping']);
      // Equipment overrides
      if (pd['s600Override'] != null)          this.emvS600Override          = String(pd['s600Override']);
      if (pd['apf100Override'] != null)        this.emvApf100Override        = String(pd['apf100Override']);
      if (pd['apf50Override'] != null)         this.emvApf50Override         = String(pd['apf50Override']);
      if (pd['equipSource'])                   this.emvEquipSource           = pd['equipSource'];
      // Topology
      if (pd['topoMeters'] != null && Array.isArray(pd['topoMeters']) && pd['topoMeters'].length) {
        this.topoMeters = pd['topoMeters'];
      }
    }

    // Auto-init topology if not yet saved
    if (!this.topoMeters.length) {
      const sldBuses: any[] = (proj && proj.sldAnalysis && proj.sldAnalysis.buses) || [];
      if (sldBuses.length) {
        this.topoMeters = [{
          meterNo: this.baMeterNumber || '',
          buses: sldBuses.map((b: any) => ({
            badge: b.badge || '',
            dwg: b.dwg || '',
            xfKva: b.xf_kva || '',
            mainA: b.main_a || '',
            pctLoad: b.pct_load || '',
            varc: b.varc || '',
            circuits: (b.circuits || []).map((c: any) => ({
              name: c.name || '',
              amps: c.amps || '',
              nEcbs: c.n_ecbs || 0,
              nApf50: c.n_apf50 || 0,
              nApf100: c.n_apf100 || 0,
              note: c.note || ''
            }))
          }))
        }];
      } else {
        const meterNos = (this.baMeterNumber || '').split(',').map((m: string) => m.trim()).filter((m: string) => m);
        this.topoMeters = (meterNos.length ? meterNos : ['']).map((m: string) => ({
          meterNo: m,
          buses: []
        }));
      }
    }

    // If client information fields are still empty (no saved reportFields), fetch from client record.
    const clientId = proj && (typeof proj.client === 'object' ? proj.client.id : proj.client);
    if (clientId && !this.emvClientName) {
      this.clientService.get(clientId).subscribe((res: any) => {
        const c = res.response || res;
        if (!c) return;
        if (!this.emvClientName)    this.emvClientName    = c.legalName || c.name || '';
        if (!this.emvClientAddress) this.emvClientAddress = c.address || '';
        if (!this.emvClientCity)    this.emvClientCity    = c.city || '';
        if (!this.emvClientState)   this.emvClientState   = c.state || '';
        if (!this.emvClientZip)     this.emvClientZip     = c.zip || '';
        if (!this.emvContactName)   this.emvContactName   = c.contactName || '';
        if (!this.emvContactPhone)  this.emvContactPhone  = c.contactPhone || '';
        if (!this.emvContactEmail)  this.emvContactEmail  = c.financeEmail || '';
      }, () => {});
    }

    // My Jobs — load from localStorage and start 30s polling
    this._loadMyJobs();
    this._myJobsPollInterval = setInterval(() => this._pollMyJobs(), 30000);
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
      this.recordCount = (data && data.meta) ? data.meta.total : 0;
      this.savingsReports = (data && data.response) ? data.response : [];
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
    // Reset SLD state when switching bills so the peak kW re-populates correctly
    this.sldFile = null;
    this.sldPeakKw = null;
    this.sldResult = null;
    this.sldSaved = false;
    this.sldError = null;
    this.sldShowRescan = false;

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
    // Support both new (client_city, client_state) and legacy (client_city_state) formats
    const cityState = rd.client_city_state || '';
    const [legacyCity, legacyState] = cityState ? cityState.split(',').map((s: string) => s.trim()) : ['', ''];
    this.emvClientCity        = rd.client_city || legacyCity || '';
    this.emvClientState       = rd.client_state || legacyState || '';
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
    this.emvTariff            = rd.tariff || '';
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
    newData.client_city         = this.emvClientCity;
    newData.client_state        = this.emvClientState;
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
    newData.tariff              = this.emvTariff;
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

  saveAll() {
    this.saveAllStatus = 'Saving...';
    this.saveAllError = false;
    this.emvSendStatus = 'Saving...';
    this.emvSendError = false;

    // Persist Bill Analytic fields to project.electricBillAnalysis
    if (this.selectedSavingsReport) {
      const analyticData: any = {
        billReference:       this.baBillReference,
        electricCompanyName: this.baElectricCompanyName,
        accountNumber:       this.baAccountNumber,
        meterNumber:         this.baMeterNumber,
        tariff:              this.baTariff,
        totalKwh:            parseFloat(this.baTotalKwh)         || 0,
        kwPeak:              parseFloat(this.baKwPeak)           || 0,
        billAmount:          parseFloat(this.baBillAmount)       || 0,
        daysBilled:          parseFloat(this.baDaysBilled)       || 30,
        voltage:             this.baVoltage,
        kwRatePerTariff:     parseFloat(this.baKwRatePerTariff)  || 0,
        kwhRate:             parseFloat(this.emvEnergyRate)      || 0,
        lineItems:           this.baLineItems,
      };
      this.billAnalyticService.updateAnalytic(analyticData).subscribe(() => {}, () => {});

      // Persist all EM&V + bill metric fields to savings report reportData
      const newData = ObjectHelpers.deepCopy(this.selectedSavingsReport.reportData);
      newData.pfc              = this.powerFactor;
      newData.usageKWH         = this.kwhUsage;
      newData.kwPeak           = this.kwPeak;
      newData.totalBill        = this.totalBill;
      newData.kwhSavings       = this.kwhSavings;
      newData.kwPeakSavings    = this.peakSavings;
      newData.multiplier       = this.selectedMultiplier;
      // Client Info
      newData.client_name         = this.emvClientName;
      newData.client_address      = this.emvClientAddress;
      newData.client_city         = this.emvClientCity;
      newData.client_state        = this.emvClientState;
      newData.client_zip          = this.emvClientZip;
      newData.contact_name        = this.emvContactName;
      newData.contact_email       = this.emvContactEmail;
      newData.contact_phone       = this.emvContactPhone;
      // Project Info
      newData.project_type        = this.emvProjectType;
      newData.facility_address    = this.emvFacilityAddress;
      newData.facility_city       = this.emvFacilityCity;
      newData.facility_state      = this.emvFacilityState;
      newData.facility_zip        = this.emvFacilityZip;
      // Billing Info
      newData.project_cost        = this.emvProjectCost;
      newData.utility             = this.emvUtility;
      newData.utility_name        = this.emvUtilityName;
      newData.utility_program     = this.emvUtilityProgram;
      newData.tariff              = this.emvTariff || this.baTariff;
      newData.account_number      = this.emvAccountNumber || this.baAccountNumber;
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
        this.saveAllStatus = 'All fields saved.';
        this.saveAllError = false;
        this.emvSendStatus = 'All fields saved.';
        this.emvSendError = false;
      }, () => {
        this.saveAllStatus = 'Error saving fields.';
        this.saveAllError = true;
        this.emvSendStatus = 'Error saving fields.';
        this.emvSendError = true;
      });
    }

    // Also persist all EM&V Pre-fill fields to project.reportFields so they restore on every page load.
    const proj2: any = this.userService.user.selectedProject;
    const orgId2   = proj2 ? (proj2.orgId  || '') : '';
    const projId2  = proj2 ? (proj2.id     || '') : '';
    if (orgId2 && projId2) {
      const rfFields: any = {};
      if (this.emvClientName)          rfFields['company']            = this.emvClientName;
      if (this.emvClientAddress)       rfFields['cp_address']         = this.emvClientAddress;
      if (this.emvClientCity)         rfFields['cp_city']             = this.emvClientCity;
      if (this.emvClientState)        rfFields['cp_state']             = this.emvClientState;
      if (this.emvClientZip)           rfFields['cp_zip']             = this.emvClientZip;
      if (this.emvContactName)         rfFields['contact']            = this.emvContactName;
      if (this.emvContactPhone)        rfFields['phone']              = this.emvContactPhone;
      if (this.emvContactEmail)        rfFields['email']              = this.emvContactEmail;
      if (this.emvProjectType)         rfFields['project_type']       = this.emvProjectType;
      if (this.emvFacilityAddress)     rfFields['facility_address']   = this.emvFacilityAddress;
      if (this.emvFacilityCity)        rfFields['facility_city']     = this.emvFacilityCity;
      if (this.emvFacilityState)       rfFields['facility_state']     = this.emvFacilityState;
      if (this.emvFacilityZip)         rfFields['facility_zip']       = this.emvFacilityZip;
      if (this.emvProjectCost)         rfFields['project_cost']       = this.emvProjectCost;
      if (this.emvUtility)             rfFields['utility']            = this.emvUtility;
      if (this.emvUtilityName)         rfFields['utility_name']       = this.emvUtilityName;
      if (this.emvUtilityProgram)      rfFields['utility_program']    = this.emvUtilityProgram;
      if (this.emvTariff || this.baTariff) rfFields['tariff']         = this.emvTariff || this.baTariff;
      if (this.emvAccountNumber || this.baAccountNumber) rfFields['account'] = this.emvAccountNumber || this.baAccountNumber;
      if (this.emvEnergyRate)          rfFields['energy_rate']        = this.emvEnergyRate;
      if (this.emvDemandRate)          rfFields['demand_rate']        = this.emvDemandRate;
      if (this.emvCapacityRate)        rfFields['capacity_rate']      = this.emvCapacityRate;
      if (this.emvBillingModel)        rfFields['billing_model']      = this.emvBillingModel;
      if (this.emvKvaDemandRate)       rfFields['kva_demand_rate']    = this.emvKvaDemandRate;
      if (this.emvReactiveAdder)       rfFields['reactive_adder']     = this.emvReactiveAdder;
      if (this.emvNcpDemandRate)       rfFields['ncp_demand_rate']    = this.emvNcpDemandRate;
      if (this.emvCpDemandRate)        rfFields['cp_demand_rate']     = this.emvCpDemandRate;
      if (this.emvCoincidentPeakRate)  rfFields['coincident_peak']    = this.emvCoincidentPeakRate;
      if (this.emvTargetPF)            rfFields['target_pf']          = this.emvTargetPF;
      if (this.emvDiscountRate)        rfFields['discount_rate']      = this.emvDiscountRate;
      if (this.emvEscalationRate)      rfFields['escalation_rate']    = this.emvEscalationRate;
      if (this.emvAnalysisPeriod)      rfFields['analysis_period']    = this.emvAnalysisPeriod;
      if (this.emvTouOnPeak)           rfFields['tou_on_peak']        = this.emvTouOnPeak;
      if (this.emvTouOffPeak)          rfFields['tou_off_peak']       = this.emvTouOffPeak;
      if (this.emvSummerFraction)      rfFields['summer_fraction_pct']= this.emvSummerFraction;
      if (this.emvSummerOnPeak)        rfFields['summer_on_peak']     = this.emvSummerOnPeak;
      if (this.emvSummerOffPeak)       rfFields['summer_off_peak']    = this.emvSummerOffPeak;
      if (this.emvWinterOnPeak)        rfFields['winter_on_peak']     = this.emvWinterOnPeak;
      if (this.emvWinterOffPeak)       rfFields['winter_off_peak']    = this.emvWinterOffPeak;
      if (this.emvOnPeakShare)         rfFields['onpeak_fraction_pct']= this.emvOnPeakShare;
      if (this.emvRatchetPct)          rfFields['ratchet_percent']    = this.emvRatchetPct;
      if (this.emvRatchetRefPeak)      rfFields['ratchet_ref_peak']   = this.emvRatchetRefPeak;
      if (Object.keys(rfFields).length > 0) {
        fetch('/tracking/api/emv/save-prefill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ orgId: orgId2, projectId: projId2, clientId: proj2.client || '', fields: rfFields }),
        }).then(() => {
          // Update the in-memory project so a page reload reads the new values immediately
          if (proj2.reportFields) { Object.assign(proj2.reportFields, rfFields); }
          else { proj2.reportFields = rfFields; }
          if (!this.selectedSavingsReport) {
            this.saveAllStatus = 'EM\u0026V fields saved.';
            this.saveAllError = false;
            this.emvSendStatus = 'EM\u0026V fields saved.';
            this.emvSendError = false;
          }
        }).catch(() => {
          if (!this.selectedSavingsReport) {
            this.saveAllStatus = 'Error saving EM\u0026V fields.';
            this.saveAllError = true;
          }
        });
      }
    }

    // Also save new proposal-specific fields (topology, narrative, PF, BOM flags)
    this._saveProposalDataFields();
  }

  saveBillAnalyticFields() {
    const proj: any = this.userService.user.selectedProject;
    const analyticData: any = {
      billReference:       this.baBillReference,
      electricCompanyName: this.baElectricCompanyName,
      accountNumber:       this.baAccountNumber,
      meterNumber:         this.baMeterNumber,
      tariff:              this.baTariff,
      totalKwh:            parseFloat(this.baTotalKwh)        || 0,
      kwPeak:              parseFloat(this.baKwPeak)          || 0,
      billAmount:          parseFloat(this.baBillAmount)      || 0,
      daysBilled:          parseFloat(this.baDaysBilled)      || 30,
      voltage:             this.baVoltage,
      kwRatePerTariff:     parseFloat(this.baKwRatePerTariff) || 0,
      lineItems:           this.baLineItems,
    };
    // Preserve existing gpuJobId if already stored, or pull from most recent bill job in localStorage
    const existingGpuJobId = proj && proj.electricBillAnalysis && proj.electricBillAnalysis.gpuJobId;
    if (existingGpuJobId) {
      analyticData.gpuJobId = existingGpuJobId;
    } else if (proj && proj.id) {
      const billJobs = this.myJobsService.getJobs(proj.id).filter((j: any) => j.job_type === 'bill');
      if (billJobs.length) {
        analyticData.gpuJobId = billJobs[billJobs.length - 1].gpu_job_id;
      }
    }
    this.saveAllStatus = 'Saving...';
    this.saveAllError = false;
    this.billAnalyticService.updateAnalytic(analyticData).subscribe(
      () => { this.saveAllStatus = 'Bill data saved.'; this.saveAllError = false; },
      () => { this.saveAllStatus = 'Error saving bill data.'; this.saveAllError = true; }
    );
  }

  sendToEmv() {
    const bootstrap = (window as any)['BOOTSTRAP_DATA'] || {};
    const emvBase = bootstrap.emvUrl || '/emv';
    const proj: any = this.userService.user.selectedProject;
    const orgId = proj ? (proj.orgId || '') : '';
    const projectId = proj ? (proj.id || '') : '';
    const clientId = proj ? (proj.client || '') : '';

    const fields: any = {};
    // Client Information
    if (this.emvClientName)         fields['company']            = this.emvClientName;
    if (this.emvClientAddress)      fields['cp_address']         = this.emvClientAddress;
    if (this.emvClientCity)         fields['cp_city']             = this.emvClientCity;
    if (this.emvClientState)        fields['cp_state']             = this.emvClientState;
    if (this.emvClientZip)          fields['cp_zip']             = this.emvClientZip;
    if (this.emvContactName)        fields['contact']            = this.emvContactName;
    if (this.emvContactPhone)       fields['phone']              = this.emvContactPhone;
    if (this.emvContactEmail)       fields['email']              = this.emvContactEmail;
    // Project Information
    if (this.emvProjectType)        fields['project_type']       = this.emvProjectType;
    if (this.emvFacilityAddress)    fields['facility_address']   = this.emvFacilityAddress;
    if (this.emvFacilityCity)       fields['facility_city']       = this.emvFacilityCity;
    if (this.emvFacilityState)      fields['facility_state']     = this.emvFacilityState;
    if (this.emvFacilityZip)        fields['facility_zip']       = this.emvFacilityZip;
    // Billing Information
    if (this.emvProjectCost)        fields['project_cost']       = this.emvProjectCost;
    if (this.emvUtility)            fields['utility']            = this.emvUtility;
    if (this.emvUtilityName)        fields['utility_name']       = this.emvUtilityName;
    if (this.emvUtilityProgram)     fields['utility_program']    = this.emvUtilityProgram;
    if (this.emvTariff || this.baTariff) fields['tariff'] = this.emvTariff || this.baTariff;
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
      return fetch('/tracking/api/emv/save-prefill', {
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
    const newFile = (input && input.files && input.files[0]) ? input.files[0] : null;
    if (!newFile) { this.billScanFile = null; return; }

    const alreadyScanned = this.billScanSuccess ||
      !!(this.userService.user.selectedProject?.electricBillAnalysis?.totalKwh ||
         this.userService.user.selectedProject?.electricBillAnalysis?.kwPeak);

    if (alreadyScanned) {
      const ok = confirm('A bill has already been scanned for this project. Scanning a new one will replace the current data. Continue?');
      if (!ok) {
        input.value = '';
        return;
      }
      this.billScanSuccess = false;
    }

    this.billScanFile = newFile;
    this.billScanError = null;
  }

  scanBillForAnalytic() {
    if (!this.billScanFile) { this.billScanError = 'Please select a PDF file.'; return; }
    if (!this.billScanFile.name.toLowerCase().endsWith('.pdf')) { this.billScanError = 'File must be a PDF.'; return; }
    if (this.billScanFile.size > 50 * 1024 * 1024) { this.billScanError = 'File must be 50 MB or smaller.'; return; }
    this.billScanning = true;
    this.billScanError = null;
    this.billScanSuccess = false;
    this.createFromBillService.submitBillAnalysis(
      this.billScanFile,
      this.billScanMeterNumber || undefined,
      this.billScanPageRange || undefined
    ).subscribe(
      (res: any) => {
        this.billScanning = false;
        if (res && res.success && res.job_id) {
          const proj: any = this.userService.user.selectedProject;
          if (proj && proj.id) {
            this.myJobsService.addJob(proj.id, {
              job_type: 'bill',
              gpu_job_id: res.job_id,
              filename: res.filename || this.billScanFile.name,
              estimated_minutes: res.estimated_minutes || 10,
            });
            this._loadMyJobs();
            this._pollMyJobs();
          }
          this._showToast(`Bill scan submitted — estimated ${res.estimated_minutes || 10} min. Find it in My Jobs below when ready.`);
          this.billScanFile = null;
        } else {
          this.billScanError = (res && res.error) || 'Submission failed. Please try again.';
        }
      },
      (err: any) => {
        this.billScanning = false;
        const status = err && err.status;
        if (status === 413) {
          this.billScanError = 'File is too large for the server (max 50 MB).';
        } else {
          this.billScanError = (err && err.error && (err.error.error || err.error.message)) || 'Upload failed. Please try again.';
        }
      }
    );
  }

  private populateFromScan(d: any) {
    // Bill Analytic fields — the bill metrics used by the calculation engine
    this.baBillReference       = d.billReference || '';
    this.baElectricCompanyName = d.electricCompanyName || '';
    this.baAccountNumber       = d.accountNumber || '';
    this.baMeterNumber         = d.meterNumber || '';
    this.baTariff              = d.tariff || '';
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
    if (d.tariff)              { this.emvTariff        = d.tariff; }
    if (d.kwhRate)             { this.emvEnergyRate = String(d.kwhRate); }
    if (d.kwRatePerTariff)     { this.emvDemandRate = String(d.kwRatePerTariff); }
    if (d.serviceAddress)      { this.emvFacilityAddress = d.serviceAddress; }
    if (d.serviceCity)         { this.emvFacilityCity = d.serviceCity; }
    if (d.serviceState)        { this.emvFacilityState = d.serviceState; }
    if (d.serviceZip)          { this.emvFacilityZip = d.serviceZip; }
    if (d.kwPeak != null)        { this.sldPeakKw = parseFloat(String(d.kwPeak)) || null; }

    const proj: any = this.userService.user.selectedProject;
    if (proj && proj.id && this.billScanSuccess === true) {
      this.persistBillAnalytic();
    }
  }

  // ── My Jobs ──────────────────────────────────────────────────────────────

  private _loadMyJobs() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) { this.myJobs = []; return; }
    const stored = this.myJobsService.getJobs(proj.id);
    // Restore runtime state from previous poll if the same GPU ID is already in myJobs
    const existing = new Map(this.myJobs.map(j => [`${j.job_type}_${j.gpu_job_id}`, j]));
    this.myJobs = stored.map(j => {
      const prev = existing.get(`${j.job_type}_${j.gpu_job_id}`);
      return prev ? { ...j, _status: prev._status, _errorMsg: prev._errorMsg, _errorNotes: prev._errorNotes, _showError: prev._showError } : { ...j };
    });
  }

  private _pollMyJobs() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;
    this.myJobs.forEach(job => {
      // Don't re-poll terminal states that the user hasn't dismissed yet
      if (job._status === 'done' || job._status === 'error') return;
      const obs = job.job_type === 'bill'
        ? this.myJobsService.pollBill(job.gpu_job_id)
        : this.myJobsService.pollSld(job.gpu_job_id);
      obs.subscribe(
        (res: any) => {
          job._status = res.status || 'pending';
          if (res.status === 'error') {
            job._errorNotes = res.error_notes || '';
            const isNonRec = this.myJobsService.isNonRecoverableError(job._errorNotes);
            job._errorMsg = isNonRec
              ? 'Could not extract data — try manual entry.'
              : 'Analysis failed — you can retry or enter data manually.';
          }
        },
        () => { /* network error — will retry on next tick */ }
      );
    });
  }

  viewJobResult(job: MyJob) {
    const obs = job.job_type === 'bill'
      ? this.myJobsService.pollBill(job.gpu_job_id)
      : this.myJobsService.pollSld(job.gpu_job_id);
    obs.subscribe(
      (res: any) => {
        if (job.job_type === 'bill' && res.status === 'done' && res.data) {
          // Stamp gpuJobId BEFORE populateFromScan so persistBillAnalytic picks it up
          const _projForGpu: any = this.userService.user.selectedProject;
          if (_projForGpu) {
            _projForGpu.electricBillAnalysis = Object.assign(_projForGpu.electricBillAnalysis || {}, { gpuJobId: job.gpu_job_id });
          }
          this.billScanSuccess = true;
          this.populateFromScan(res.data);
          this._removeMyJob(job);
          this._showToast('Bill data loaded and pre-filled below.');
          setTimeout(() => {
            const el = document.getElementById('bill-analytic-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else if (job.job_type === 'sld' && res.status === 'done') {
          this.sldResult = res.result || {};
          this.sldGpuJobId = job.gpu_job_id || null;
          this.sldSaved = false;
          this._removeMyJob(job);
          this._showToast('SLD analysis loaded — review and accept below.');
          setTimeout(() => {
            const el = document.getElementById('sld-review-card');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else if (res.status !== 'done') {
          this._showToast('Result not ready yet — try again in a moment.');
        }
      },
      () => this._showToast('Could not load result. Please try again.')
    );
  }

  retryJob(job: MyJob) {
    this._removeMyJob(job);
    if (job.job_type === 'bill') {
      this.billScanFile = null;
      this._showToast('Removed from queue — select the bill PDF again to re-submit.');
      setTimeout(() => {
        const el = document.getElementById('bill-scan-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      this.sldFile = null;
      this.sldMergeStatus = null;
      this._showToast('Removed from queue — select the SLD file again to re-submit.');
      setTimeout(() => {
        const el = document.getElementById('sld-upload-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  dismissJob(job: MyJob) {
    this._removeMyJob(job);
  }

  getElapsedMin(job: MyJob): number {
    return this.myJobsService.getElapsedMin(job);
  }

  getRetryAttempt(status: string): string {
    return status.replace('retrying_', '') || '?';
  }

  isRecoverableError(job: MyJob): boolean {
    return this.myJobsService.isRecoverableError(job._errorNotes || '');
  }

  private _removeMyJob(job: MyJob) {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;
    this.myJobsService.removeJob(proj.id, job.gpu_job_id, job.job_type);
    this._loadMyJobs();
  }

  private _showToast(msg: string) {
    this.myJobsToast = msg;
    if (this._myJobsToastTimer) clearTimeout(this._myJobsToastTimer);
    this._myJobsToastTimer = setTimeout(() => { this.myJobsToast = null; }, 7000);
  }

  lookupTariffRates() {
    if (!this.baElectricCompanyName && !this.baTariff) {
      this.tariffLookupStatus = 'Please provide a Utility name and/or Tariff code first.';
      this.tariffLookupError  = true;
      return;
    }

    this.tariffLookupLoading    = true;
    this.tariffLookupStatus     = '';
    this.tariffLookupError      = false;
    this.tariffLookupSource     = '';
    this.tariffLookupConfidence = '';
    this.tariffLookupNotes      = '';

    const body = {
      utility: this.baElectricCompanyName || '',
      tariff:  this.baTariff              || '',
      state:   this.emvFacilityState      || '',
      country: this.baCountry             || 'USA',
      sector:  'Commercial',
    };

    fetch('/tracking/api/tariff-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    .then(r => r.json())
    .then((resp: any) => {
      this.tariffLookupLoading = false;
      if (resp && resp.error) {
        this.tariffLookupStatus = 'Error: ' + resp.error;
        this.tariffLookupError  = true;
        return;
      }
      const d = (resp && resp.response) ? resp.response : resp;
      if (!d || (!d.energy_rate && !d.demand_rate)) {
        this.tariffLookupStatus = 'No rate data found. Try entering more details or fill manually.';
        this.tariffLookupError  = true;
        return;
      }

      // --- Populate EM&V billing fields from lookup result ---
      let filled = 0;

      const set = (current: string, val: any): string => {
        if (val !== undefined && val !== null && val !== '') {
          filled++;
          return String(val);
        }
        return current;
      };

      // Core rates
      if (d.energy_rate)    { this.emvEnergyRate    = set(this.emvEnergyRate,    d.energy_rate);    }
      if (d.demand_rate)    { this.emvDemandRate    = set(this.emvDemandRate,    d.demand_rate);    }
      if (d.capacity_rate)  { this.emvCapacityRate  = set(this.emvCapacityRate,  d.capacity_rate);  }
      if (d.billing_model)  { this.emvBillingModel  = set(this.emvBillingModel,  d.billing_model);  }

      // Demand variants
      if (d.kva_demand_rate)  { this.emvKvaDemandRate    = set(this.emvKvaDemandRate,    d.kva_demand_rate);  }
      if (d.reactive_adder)   { this.emvReactiveAdder    = set(this.emvReactiveAdder,    d.reactive_adder);   }
      if (d.ncp_demand_rate)  { this.emvNcpDemandRate    = set(this.emvNcpDemandRate,    d.ncp_demand_rate);  }
      if (d.cp_demand_rate)   { this.emvCpDemandRate     = set(this.emvCpDemandRate,     d.cp_demand_rate);   }
      if (d.coincident_peak)  { this.emvCoincidentPeakRate = set(this.emvCoincidentPeakRate, d.coincident_peak); }

      // Financial parameters
      if (d.target_pf)         { this.emvTargetPF        = set(this.emvTargetPF,        d.target_pf);        }
      if (d.discount_rate)     { this.emvDiscountRate    = set(this.emvDiscountRate,    d.discount_rate);    }
      if (d.escalation_rate)   { this.emvEscalationRate  = set(this.emvEscalationRate,  d.escalation_rate);  }
      if (d.analysis_period)   { this.emvAnalysisPeriod  = set(this.emvAnalysisPeriod,  d.analysis_period);  }

      // TOU
      if (d.tou_on_peak)      { this.emvTouOnPeak       = set(this.emvTouOnPeak,       d.tou_on_peak);       }
      if (d.tou_off_peak)     { this.emvTouOffPeak      = set(this.emvTouOffPeak,      d.tou_off_peak);      }
      if (d.onpeak_fraction_pct) { this.emvOnPeakShare  = set(this.emvOnPeakShare,     d.onpeak_fraction_pct); }

      // Seasonal
      if (d.summer_fraction_pct) { this.emvSummerFraction = set(this.emvSummerFraction, d.summer_fraction_pct); }
      if (d.summer_on_peak)    { this.emvSummerOnPeak    = set(this.emvSummerOnPeak,    d.summer_on_peak);    }
      if (d.summer_off_peak)   { this.emvSummerOffPeak   = set(this.emvSummerOffPeak,   d.summer_off_peak);   }
      if (d.winter_on_peak)    { this.emvWinterOnPeak    = set(this.emvWinterOnPeak,    d.winter_on_peak);    }
      if (d.winter_off_peak)   { this.emvWinterOffPeak   = set(this.emvWinterOffPeak,   d.winter_off_peak);   }

      // Ratchet
      if (d.ratchet_percent)   { this.emvRatchetPct      = set(this.emvRatchetPct,      d.ratchet_percent);  }
      if (d.ratchet_ref_peak)  { this.emvRatchetRefPeak  = set(this.emvRatchetRefPeak,  d.ratchet_ref_peak); }

      // Also update Bill Analytic demand rate field
      if (d.demand_rate)       { this.baKwRatePerTariff  = set(this.baKwRatePerTariff,  d.demand_rate);      }

      // Source badge
      this.tariffLookupSource     = d.source_label || d.source || 'Unknown';
      this.tariffLookupConfidence = d.confidence   || 'low';
      this.tariffLookupNotes      = d.notes        || '';
      this.tariffLookupStatus     = `✓ Populated ${filled} field${filled !== 1 ? 's' : ''} from tariff lookup.`;
      this.tariffLookupError      = false;
      this.persistBillAnalytic();
    })
    .catch(() => {
      this.tariffLookupLoading = false;
      this.tariffLookupStatus  = 'Network error — could not reach tariff lookup service.';
      this.tariffLookupError   = true;
    });
  }

  /** Persist current Bill Analytic fields to project.electricBillAnalysis */
  persistBillAnalytic() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;
    const analyticData: any = {
      billReference:       this.baBillReference,
      electricCompanyName:  this.baElectricCompanyName,
      accountNumber:       this.baAccountNumber,
      meterNumber:         this.baMeterNumber,
      tariff:              this.baTariff,
      totalKwh:            parseFloat(this.baTotalKwh)      || 0,
      kwPeak:              parseFloat(this.baKwPeak)       || 0,
      billAmount:          parseFloat(this.baBillAmount)   || 0,
      daysBilled:          parseFloat(this.baDaysBilled)   || 30,
      voltage:             this.baVoltage,
      kwRatePerTariff:     parseFloat(this.baKwRatePerTariff) || 0,
      kwhRate:             parseFloat(this.emvEnergyRate) || 0,
      lineItems:           this.baLineItems,
    };
    // Always carry gpuJobId forward so autofill can use it
    const existingGpuJobId = proj.electricBillAnalysis && proj.electricBillAnalysis.gpuJobId;
    if (existingGpuJobId) {
      analyticData.gpuJobId = existingGpuJobId;
    } else {
      const billJobs = this.myJobsService.getJobs(proj.id).filter((j: any) => j.job_type === 'bill');
      if (billJobs.length) { analyticData.gpuJobId = billJobs[billJobs.length - 1].gpu_job_id; }
    }
    this.billAnalyticService.updateAnalytic(analyticData).subscribe(() => {}, () => {});
  }

  /** Schedule a debounced save of Bill Analytic fields (called on field edits) */
  scheduleBillAnalyticSave() {
    if (this._billAnalyticSaveTimeout) clearTimeout(this._billAnalyticSaveTimeout);
    this._billAnalyticSaveTimeout = setTimeout(() => {
      this._billAnalyticSaveTimeout = null;
      this.persistBillAnalytic();
    }, this._billAnalyticSaveDebounceMs);
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

    // Count meters from the meter number field (may be comma-separated for multi-meter bills)
    const meterNumberStr = (this.baMeterNumber || '').trim();
    const meterCount = meterNumberStr
      ? meterNumberStr.split(',').map(s => s.trim()).filter(s => s.length > 0).length
      : 1;

    const meterBill: any = {
      billReference:       this.baBillReference,
      electricCompanyName: this.baElectricCompanyName,
      accountNumber:       this.baAccountNumber,
      meterNumber:         this.baMeterNumber,
      tariff:              this.baTariff,
      totalKwh:            totalKwh,
      kwPeak:              kwPeak,
      billAmount:          parseFloat(this.baBillAmount) || 0,
      daysBilled:          daysBilled,
      voltage:             parseFloat(this.baVoltage) || 480,
      kwRatePerTariff:     parseFloat(this.baKwRatePerTariff) || 0,
      switchGearCount:     meterCount,
      lineItems:           lineItemsWithSavings,
      totalSavings:        totalSavings,
    };

    // Build/update meterBills array so list-billAnalytic can count completed bills
    const existing: any = this.userService.user.selectedProject.electricBillAnalysis || {};
    const meterBills: any[] = existing.meterBills ? [...existing.meterBills] : [];
    const meterNumber = meterBill.meterNumber;
    const idx = meterNumber
      ? meterBills.findIndex(b => b.meterNumber === meterNumber)
      : -1;
    if (idx >= 0) {
      meterBills[idx] = meterBill;
    } else {
      meterBills.push(meterBill);
    }

    // Merge top-level scalar fields from the meter bill into the analytic (for PDF, backward compat)
    const analyticData: any = Object.assign({}, existing, meterBill, { meterBills });

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

  // ────────── SLD (Single-Line Drawing) methods ──────────

  onSldFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input && input.files ? Array.from(input.files) : [];

    if (files.length === 0) {
      this.sldFile = null;
      return;
    }

    const alreadyAnalyzed = !!(this.sldResult) ||
      this.userService.user.selectedProject?.sldAnalysis?.status === 'accepted';

    if (alreadyAnalyzed) {
      const ok = confirm('An SLD has already been analyzed for this project. Uploading a new one will replace the current result. Continue?');
      if (!ok) {
        input.value = '';
        return;
      }
    }

    this.sldError = null;
    this.sldResult = null;
    this.sldSaved = false;
    this.sldMergeStatus = null;

    if (this.sldPeakKw == null && this.kwPeak) {
      this.sldPeakKw = parseFloat(String(this.kwPeak)) || null;
    }

    const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const nonPdfs = files.filter(f => !f.name.toLowerCase().endsWith('.pdf'));

    // Single file or non-PDF: no merging needed
    if (files.length === 1 || pdfs.length <= 1) {
      this.sldFile = files[0];
      if (files.length > 1) {
        this.sldMergeStatus = `${files.length} files selected`;
      }
      return;
    }

    // Multiple PDFs: merge them with pdf-lib
    this.sldMerging = true;
    this.sldFile = null;
    this.sldMergeStatus = `Merging ${pdfs.length} PDFs…`;

    this._mergePdfs(pdfs).then(merged => {
      this.sldFile = merged;
      const names = pdfs.map(f => f.name).join(', ');
      this.sldMergeStatus = `Merged ${pdfs.length} PDFs — ready to analyze`;
      this.sldMerging = false;
    }).catch(err => {
      this.sldError = 'Failed to merge PDFs. Try combining them manually first.';
      this.sldFile = pdfs[0]; // fallback: just use the first one
      this.sldMergeStatus = null;
      this.sldMerging = false;
    });
  }

  private async _mergePdfs(files: File[]): Promise<File> {
    const merged = await PDFDocument.create();
    for (const file of files) {
      const buf = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e: any) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
      const doc = await PDFDocument.load(buf);
      const pageIndices = doc.getPageIndices();
      const copied = await merged.copyPages(doc, pageIndices);
      copied.forEach((page: any) => merged.addPage(page));
    }
    const mergedBytes = await merged.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const baseName = files[0].name.replace(/\.pdf$/i, '');
    return new File([blob], `${baseName} + ${files.length - 1} others.pdf`, { type: 'application/pdf' });
  }

  analyzeSldDrawing() {
    if (!this.sldFile) return;
    const MAX_BYTES = 50 * 1024 * 1024;
    if (this.sldFile.size > MAX_BYTES) {
      this.sldError = `File is too large (${(this.sldFile.size / 1024 / 1024).toFixed(1)} MB). Maximum upload size is 50 MB. Try selecting fewer pages or splitting the SLD.`;
      return;
    }
    this.sldScanning = true;
    this.sldError = null;
    this.sldResult = null;
    this.sldGpuJobId = null;
    this.sldSaved = false;

    const peakKw = (this.sldPeakKw != null && !isNaN(Number(this.sldPeakKw))) ? Number(this.sldPeakKw) : undefined;

    this.sldService.submitSldAnalysis(this.sldFile, peakKw).subscribe(
      (res: any) => {
        this.sldScanning = false;
        if (res && res.success && res.job_id) {
          const proj: any = this.userService.user.selectedProject;
          if (proj && proj.id) {
            this.myJobsService.addJob(proj.id, {
              job_type: 'sld',
              gpu_job_id: res.job_id,
              filename: res.filename || this.sldFile.name,
              estimated_minutes: res.estimated_minutes || 30,
            });
            this._loadMyJobs();
            this._pollMyJobs();
          }
          this._showToast(`SLD submitted — estimated ${res.estimated_minutes || 30} min. Find it in My Jobs below when ready.`);
          this.sldFile = null;
          this.sldMergeStatus = null;
        } else {
          this.sldError = (res && res.error) || 'Submission failed. Please try again.';
        }
      },
      (err: any) => {
        this.sldScanning = false;
        const status = err && err.status;
        if (status === 413) {
          this.sldError = 'File is too large for the server (max 50 MB). Try selecting fewer SLD sheets or splitting the file.';
        } else {
          this.sldError = (err && err.error && err.error.error) || 'SLD submission failed. Please try again.';
        }
      }
    );
  }

  acceptSldRecommendations() {
    const proj: any = this.userService.user.selectedProject;
    const projectId = proj && proj.id;
    if (!projectId || !this.sldResult) return;

    const ext = this.sldResult.extraction || {};
    const sldAnalysis = {
      status: 'accepted',
      summary: this.sldResult.summary || '',
      vfdsFound: ext.vfdsFound || false,
      vfdFindings: ext.vfdFindings || [],
      generatorsFound: ext.generatorsFound || [],
      upsFound: ext.upsFound || [],
      pfcOrCapacitorBanks: ext.pfcOrCapacitorBanks || [],
      powerQualityRisks: ext.powerQualityRisks || [],
      codeIssues: ext.codeIssues || [],
      nonStandardConfigurations: ext.nonStandardConfigurations || [],
      panels: ext.panels || [],
      facilityName: ext.facilityName || '',
      billPeakKw: ext.billPeakKw || null,
      peakKvaUsed: ext.peakKvaUsed || null,
      gpuJobId: this.sldGpuJobId || null,
    };

    this.sldService.acceptSld(projectId, this.sldResult.placements || [], sldAnalysis).subscribe(
      () => {
        this.sldSaved = true;
        // Update local project state so the "already accepted" banner shows on next visit
        proj.placements = this.sldResult.placements || [];
        proj.sldAnalysis = sldAnalysis;
      },
      (err: any) => {
        this.sldError = 'Failed to save recommendations. Please try again.';
      }
    );
  }

  dismissSldRecommendations() {
    this.sldResult = null;
    this.sldError = null;
    this.sldSaved = false;
  }

  hasPanelFlags(result: any): boolean {
    if (!result || !result.extraction || !result.extraction.panels) return false;
    return result.extraction.panels.some((p: any) => p.flags && p.flags.length > 0);
  }

  // ── ECBS Proposal methods ──────────────────────────────────────────────────

  fetchFacilityContext() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;
    this.proposalFetchingContext = true;
    this.proposalContextStatus  = 'Searching online for facility description...';
    this.proposalContextError   = false;
    this.proposalService.fetchFacilityContext(proj.id).subscribe(
      (res: any) => {
        this.proposalFetchingContext = false;
        const ctx = (res && (res.facilityContext || res.facility_context)) || '';
        if (ctx) {
          this.proposalFacilityContext = ctx;
          this.proposalContextStatus   = 'Facility description found.';
          this.proposalContextError    = false;
        } else {
          this.proposalContextStatus = 'No description returned. Enter manually.';
          this.proposalContextError  = true;
        }
      },
      (err: any) => {
        this.proposalFetchingContext = false;
        this.proposalContextStatus  = (err && err.error && err.error.error) || 'Could not fetch facility context.';
        this.proposalContextError   = true;
      }
    );
  }

  saveProposalSettings() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;
    this.proposalSaving = true;
    const body = {
      facilityContext: this.proposalFacilityContext,
      savingsPct:      this.proposalSavingsPct / 100,
      nMeters:         this.proposalNMeters,
    };
    this.proposalService.saveProposalData(proj.id, body).subscribe(
      (res: any) => {
        this.proposalSaving = false;
        if (res && res.proposalData) { proj.proposalData = res.proposalData; }
        this.proposalStatus = 'Settings saved.';
        this.proposalError  = false;
        setTimeout(() => { this.proposalStatus = ''; }, 3000);
      },
      () => {
        this.proposalSaving = false;
        this.proposalStatus = 'Failed to save settings.';
        this.proposalError  = true;
      }
    );
  }

  generateEcbsProposal() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;
    this.proposalGenerating = true;
    this.proposalStatus     = 'Saving settings...';
    this.proposalError      = false;

    const body = {
      facilityContext: this.proposalFacilityContext,
      savingsPct:      this.proposalSavingsPct / 100,
      nMeters:         this.proposalNMeters,
    };
    this.proposalService.saveProposalData(proj.id, body).subscribe(
      (res: any) => {
        if (res && res.proposalData) { proj.proposalData = res.proposalData; }
        window.open(this.proposalService.getPdfUrl(proj.id), '_blank');
        this.proposalGenerating = false;
        this.proposalStatus     = 'Proposal opened in new tab.';
        this.proposalError      = false;
        setTimeout(() => { this.proposalStatus = ''; }, 4000);
      },
      () => {
        this.proposalGenerating = false;
        this.proposalStatus     = 'Failed to save settings before generating.';
        this.proposalError      = true;
      }
    );
  }

  openNetworkAssessment() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;
    this.reportNaGenerating = true;
    this.reportStatus = '';
    this.reportError  = false;
    const url = `/api/project/${proj.id}/report/network-assessment?inline=1`;
    window.open(url, '_blank');
    this.reportNaGenerating = false;
    this.reportStatus = 'Network Assessment opened in new tab.';
    setTimeout(() => { this.reportStatus = ''; }, 4000);
  }

  openProposalContract() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;
    this.reportPcGenerating = true;
    this.reportStatus = '';
    this.reportError  = false;
    const url = `/api/project/${proj.id}/report/proposal-contract?inline=1`;
    window.open(url, '_blank');
    this.reportPcGenerating = false;
    this.reportStatus = 'Proposal Contract opened in new tab.';
    setTimeout(() => { this.reportStatus = ''; }, 4000);
  }

  // ── Global "Auto-fill All" ─────────────────────────────────────────────────
  autoFillAll() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;

    this.emvAutoFillAllFetching = true;
    this.emvAutoFillAllStatus   = 'Filling from Bill + SLD…';
    this.emvAutoFillAllError    = false;

    // Bill GPU job ID — most recent 'bill' job stored in localStorage
    const billJobs: any[] = this.myJobsService.getJobs(proj.id).filter((j: any) => j.job_type === 'bill');
    const billId: number | null = billJobs.length ? billJobs[billJobs.length - 1].gpu_job_id : null;

    // SLD GPU job ID — stored in project.sldAnalysis.gpuJobId
    const sldId: number | null = (proj.sldAnalysis && proj.sldAnalysis.gpuJobId) ? proj.sldAnalysis.gpuJobId : null;

    // Customer + address from current UI fields or bill data
    const bill: any = proj.electricBillAnalysis || {};
    const customer = this.emvClientName || bill.customerName || '';
    const address = [
      this.emvFacilityAddress || bill.serviceAddress || '',
      this.emvFacilityZip     || bill.serviceZip     || '',
    ].filter(Boolean).join(' ');

    this.proposalService.autoFill(proj.id, billId, sldId, customer, address).subscribe(
      (res: any) => {
        this.emvAutoFillAllFetching = false;

        // ── Identity / Client fields ───────────────────────────────────────
        if (res.customer)      this.emvClientName       = res.customer;
        if (res.addressStreet) this.emvFacilityAddress  = res.addressStreet;
        if (res.addressCity)   this.emvFacilityCity     = res.addressCity;
        if (res.coverLocation) {
          // Split "City, State ZIP" into parts if possible
          const loc = res.coverLocation;
          const m = loc.match(/^(.*),\s*([A-Z]{2})\s*(\d{5}(-\d{4})?)?$/);
          if (m) {
            if (!this.emvFacilityCity)  this.emvFacilityCity  = m[1].trim();
            if (!this.emvFacilityState) this.emvFacilityState = m[2].trim();
            if (m[3] && !this.emvFacilityZip) this.emvFacilityZip = m[3].trim();
          }
        }

        // ── Facility Narrative ─────────────────────────────────────────────
        if (res.facilityType)        this.emvFacilityType        = res.facilityType;
        if (res.facilitySiteLabel)   this.emvFacilitySiteLabel   = res.facilitySiteLabel;
        if (res.overviewPara)        this.emvOverviewPara         = res.overviewPara;
        if (res.billingMonthsLabel)  this.emvBillingMonthsLabel  = res.billingMonthsLabel;
        if (res.sldSource)           this.emvSldSource           = res.sldSource;
        if (res.capacitorBankBullet) this.emvCapacitorBankBullet = res.capacitorBankBullet;

        // ── Utility / Billing ──────────────────────────────────────────────
        if (res.utilityName)    { this.emvUtility = res.utilityName; this.emvUtilityName = res.utilityName; }
        if (res.utilityTariff)  this.baTariff       = res.utilityTariff;
        if (res.utilityAccount) this.baAccountNumber = res.utilityAccount;
        if (res.meterNumbers)   this.baMeterNumber   = res.meterNumbers;

        // ── Power Factor ───────────────────────────────────────────────────
        if (res.pfCurrent != null)       this.emvPfReference      = String(res.pfCurrent);
        if (res.pfWorst != null)         this.emvPfWorst          = String(res.pfWorst);
        if (res.pfReferenceMonth)        this.emvPfReferenceMonth = res.pfReferenceMonth;
        if (res.pfPenaltyUsd != null) {
          this.emvPfPenaltyUsd = String(res.pfPenaltyUsd);
          if (res.pfPenaltyUsd > 0 && !this.emvHasPfPenalty) { this.emvHasPfPenalty = true; }
        }

        // ── Equipment Counts ───────────────────────────────────────────────
        if (res.s600 != null && res.s600 !== '')    this.emvS600Override   = String(res.s600);
        if (res.apf100 != null && res.apf100 !== '') this.emvApf100Override = String(res.apf100);
        if (res.apf50 != null && res.apf50 !== '')   this.emvApf50Override  = String(res.apf50);
        if (res.equipSource)                         this.emvEquipSource    = res.equipSource;

        // ── Electrical Topology ────────────────────────────────────────────
        if (res.topoMeters && res.topoMeters.length) {
          this.topoMeters = res.topoMeters.map((m: any) => ({
            meterNo: m.meterNo || m.meter_no || '',
            buses: (m.buses || []).map((b: any) => ({
              badge:    b.badge    || b.bus_id   || '',
              dwg:      b.dwg      || '',
              xfKva:    b.xfKva    || b.xf_kva   || '',
              mainA:    b.mainA    || b.main_a    || '',
              pctLoad:  b.pctLoad  || b.pct_load  || '',
              varc:     b.varc     || '',
              circuits: (b.circuits || []).map((c: any) => ({
                name:    c.name    || '',
                amps:    c.amps    || '',
                nEcbs:   c.nEcbs   || c.n_ecbs   || 0,
                nApf50:  c.nApf50  || c.n_apf50  || 0,
                nApf100: c.nApf100 || c.n_apf100 || 0,
                note:    c.note    || '',
              })),
            })),
          }));
        }

        // Update in-memory project.proposalData
        if (proj.proposalData) { Object.assign(proj.proposalData, res); }
        else { proj.proposalData = res; }

        // Build sources status label
        const src = res.sources || {};
        const used: string[] = [];
        if (src.has_bill)       used.push('Bill ✓');
        if (src.has_sld)        used.push('SLD ✓');
        if (src.has_context_ai) used.push('AI Context ✓');
        const sourceStr = used.length ? ` (${used.join(' | ')})` : '';
        this.emvAutoFillAllStatus = `Filled${sourceStr} — review and adjust as needed.`;
        this.emvAutoFillAllError  = false;
        setTimeout(() => { this.emvAutoFillAllStatus = ''; }, 8000);
      },
      (err: any) => {
        this.emvAutoFillAllFetching = false;
        const msg = (err && err.error && err.error.error) || 'Auto-fill failed. Try again.';
        this.emvAutoFillAllStatus = msg;
        this.emvAutoFillAllError  = true;
      }
    );
  }

  // ── Facility Narrative auto-fill ─────────────────────────────────────────
  autoFillFacilityNarrative() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;

    this.emvNarrativeFetching = true;
    this.emvNarrativeStatus   = 'Looking up facility…';
    this.emvNarrativeError    = false;

    // Build customer + address from bill scan data and pre-fill fields
    const bill: any = proj.electricBillAnalysis || {};
    const customer = this.emvClientName
      || bill.customerName
      || bill.electricCompanyName
      || '';
    const address = [
      this.emvFacilityAddress || bill.serviceAddress || '',
      this.emvFacilityZip     || bill.serviceZip     || '',
    ].filter(Boolean).join(' ');

    this.proposalService.fetchFacilityNarrative(proj.id, customer, address).subscribe(
      (res: any) => {
        this.emvNarrativeFetching = false;
        if (res.facilityType)         this.emvFacilityType         = res.facilityType;
        if (res.overviewPara)         this.emvOverviewPara         = res.overviewPara;
        if (res.billingMonthsLabel)   this.emvBillingMonthsLabel   = res.billingMonthsLabel;
        if (res.sldSource)            this.emvSldSource            = res.sldSource;
        if (res.capacitorBankBullet)  this.emvCapacitorBankBullet  = res.capacitorBankBullet;
        // Also seed the legacy facilityContext for the Bill Analytic proposal
        if (res.facilityContext)      this.proposalFacilityContext = res.facilityContext;
        // Update in-memory proposalData
        if (res && proj.proposalData) { Object.assign(proj.proposalData, res); }
        else if (res) { proj.proposalData = res; }
        this.emvNarrativeStatus = 'Filled in — review and adjust as needed.';
        this.emvNarrativeError  = false;
        setTimeout(() => { this.emvNarrativeStatus = ''; }, 5000);
      },
      (err: any) => {
        this.emvNarrativeFetching = false;
        const msg = (err && err.error && err.error.error) || 'Auto-fill failed. Try again.';
        this.emvNarrativeStatus = msg;
        this.emvNarrativeError  = true;
      }
    );
  }

  // ── Topology tree helpers ─────────────────────────────────────────────────
  addMeter() {
    this.topoMeters.push({ meterNo: '', buses: [] });
  }

  removeMeter(idx: number) {
    this.topoMeters.splice(idx, 1);
  }

  addBus(meter: any) {
    meter.buses.push({ badge: '', dwg: '', xfKva: '', mainA: '', pctLoad: '', varc: '', circuits: [] });
  }

  removeBus(meter: any, busIdx: number) {
    meter.buses.splice(busIdx, 1);
  }

  addCircuit(bus: any) {
    bus.circuits.push({ name: '', amps: '', nEcbs: 0, nApf50: 0, nApf100: 0, note: '' });
  }

  removeCircuit(bus: any, circuitIdx: number) {
    bus.circuits.splice(circuitIdx, 1);
  }

  // ── Save topology + new proposal fields to proposalData ──────────────────
  private _saveProposalDataFields() {
    const proj: any = this.userService.user.selectedProject;
    if (!proj || !proj.id) return;

    // Flatten topology into snake_case bus array for report consumption
    const flatBuses: any[] = [];
    for (const meter of this.topoMeters) {
      for (const bus of (meter.buses || [])) {
        flatBuses.push({
          badge:    bus.badge || '',
          dwg:      bus.dwg || '',
          xf_kva:   bus.xfKva || '',
          main_a:   parseFloat(bus.mainA) || 0,
          pct_load: parseFloat(bus.pctLoad) || 0,
          varc:     bus.varc || null,
          circuits: (bus.circuits || []).map((c: any) => ({
            name:     c.name || '',
            amps:     parseFloat(c.amps) || 0,
            n_ecbs:   parseInt(c.nEcbs, 10) || 0,
            n_apf50:  parseInt(c.nApf50, 10) || 0,
            n_apf100: parseInt(c.nApf100, 10) || 0,
            note:     c.note || ''
          }))
        });
      }
    }

    const body: any = {
      facilityContext:       this.proposalFacilityContext,
      savingsPct:            this.proposalSavingsPct / 100,
      nMeters:               this.proposalNMeters,
      facilityType:          this.emvFacilityType,
      facilitySiteLabel:     this.emvFacilitySiteLabel,
      sldSource:             this.emvSldSource,
      billingMonthsLabel:    this.emvBillingMonthsLabel,
      overviewPara:          this.emvOverviewPara,
      capacitorBankBullet:   this.emvCapacitorBankBullet,
      pfReference:           this.emvPfReference !== '' ? parseFloat(this.emvPfReference) : null,
      pfReferenceMonth:      this.emvPfReferenceMonth,
      pfWorst:               this.emvPfWorst !== '' ? parseFloat(this.emvPfWorst) : null,
      hasPfPenalty:          this.emvHasPfPenalty,
      pfPenaltyUsd:          this.emvPfPenaltyUsd !== '' ? parseFloat(this.emvPfPenaltyUsd) : null,
      customerOwnsMeters:    this.emvCustomerOwnsMeters,
      isUpgrade:             this.emvIsUpgrade,
      engineeringFee:        this.emvEngineeringFee !== '' ? parseFloat(this.emvEngineeringFee) : null,
      swYr1:                 this.emvSwYr1 !== '' ? parseFloat(this.emvSwYr1) : null,
      discount:              this.emvDiscount !== '' ? parseFloat(this.emvDiscount) : null,
      shipping:              this.emvShipping !== '' ? parseFloat(this.emvShipping) : null,
      s600Override:          this.emvS600Override !== '' ? parseInt(this.emvS600Override, 10) : null,
      apf100Override:        this.emvApf100Override !== '' ? parseInt(this.emvApf100Override, 10) : null,
      apf50Override:         this.emvApf50Override !== '' ? parseInt(this.emvApf50Override, 10) : null,
      equipSource:           this.emvEquipSource || null,
      topoMeters:            this.topoMeters,
    };
    if (flatBuses.length) { body['buses'] = flatBuses; }

    this.proposalService.saveProposalData(proj.id, body).subscribe(
      (res: any) => { if (res && res.proposalData) { proj.proposalData = res.proposalData; } },
      () => {}
    );
  }

}
