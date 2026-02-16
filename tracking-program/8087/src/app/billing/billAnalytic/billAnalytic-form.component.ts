import {Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {FormArray, FormBuilder, FormControl, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {IMyOptions} from "mydatepicker";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {AdminProjectService} from "../../admin/project/admin-project.service";
import {BillAnalyticService} from "./billAnalytic.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {ItemService} from "../equipment/items.service";

@Component({
  selector: 'bill-analytic-form',
  template: `
    <form [formGroup]="form">
      <div class="content-box-white">
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label for="date">Enter Date</label>
              <my-date-picker
                name="date"
                id="date"
                [options]="datePickerOptions"
                formControlName="date">
              </my-date-picker>
              <div *ngIf="form.controls.date.errors && (form.controls.date.dirty || form.controls.date.touched)" class="alert alert-danger">
                A valid date must be provided.
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="facilitySqFeet">Sq. Foot of facility</label>
              <input type="number" step="any" class="form-control" id="facilitySqFeet" name="facilitySqFeet" formControlName="facilitySqFeet" >
            </div>
          </div>
        </div>
      </div>
      <div class="content-box">
        <div class="row">
          <div class="col-md-3">  
            <h2>Bill Info</h2>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label for="billReference">Bill Reference</label>
              <input type="text" class="form-control" id="billReference" name="billReference" formControlName="billReference" placeholder="December 2016 Electrical Charges" title="Enter the monthf of electric bill being analyzed">
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="date">Bill Date</label>
              <my-date-picker
                name="billDate"
                id="billDate"
                [options]="datePickerOptions"
                formControlName="billDate">
              </my-date-picker>
              <div *ngIf="form.controls.billDate.errors && (form.controls.billDate.dirty || form.controls.billDate.touched)" class="alert alert-danger">
                A valid date must be provided.
              </div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label for="electricCompanyName">Electric Company</label>
              <input formControlName="electricCompanyName" type="text" class="form-control" id="electricCompanyName" name="electricCompanyName">
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label for="electricCompanyAddress">Address</label>
              <input type="text" class="form-control" id="electricCompanyAddress" name="electricCompanyAddress" formControlName="electricCompanyAddress">
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="electricCompanyCity">City</label>
              <input type="text" class="form-control" id="electricCompanyCity" name="electricCompanyCity" formControlName="electricCompanyCity">
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label for="electricCompanyState">State</label>
              <input type="text" class="form-control" id="electricCompanyState" name="electricCompanyState" formControlName="electricCompanyState">
            </div>
          </div>
          <div class="col-md-1">
            <div class="form-group">
              <label for="electricCompanyZip">Zip</label>
              <input type="text" class="form-control" id="electricCompanyZip" name="electricCompanyZip" formControlName="electricCompanyZip">
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="electricCompanyCountry">Country</label>
              <input type="text" class="form-control" id="electricCompanyCountry" name="electricCompanyCountry" formControlName="electricCompanyCountry" placeholder="Electric Company">
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label for="accountNumber">Account Number</label>
              <input type="text" class="form-control" id="accountNumber" name="accountNumber" formControlName="accountNumber"  placeholder="62724256">
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="voltage">Voltage</label>
              <select formControlName="voltage" class="form-control">
                <option value=480>480</option>
                <option value=240>240</option>
                <option value=208>208</option>
              </select>
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="kWPerUnit">kW Per Unit (Default 75)</label>
              <input type="text" class="form-control" id="kWPerUnit" name="kWPerUnit" formControlName="kWPerUnit" placeholder="75">
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label for="totalBill">Total KWH</label>
              <input type="number" step="any" class="form-control" id="totalKwh" name="totalKwh" formControlName="totalKwh"  placeholder="3047357">
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="meterNumber">Meter Number</label>
              <input type="text" class="form-control" id="meterNumber" name="meterNumber" formControlName="meterNumber"  placeholder="8372478345">
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label for="switchGearCount">Switch Gears in Facility</label>
              <input type="number" step="1" class="form-control" id="switchGearCount" name="switchGearCount" formControlName="switchGearCount"  placeholder="1">
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label for="mainCircuitCount">Main Circuits</label>
              <input type="number" step="1" class="form-control" id="mainCircuitCount" name="mainCircuitCount" formControlName="mainCircuitCount"  placeholder="5">
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label for="xecoUnitType">Xeco Unit Type</label>
              <select formControlName="xecoUnitType" class="form-control">
                <option *ngFor="let unit of xecoUnits" value={{unit.id}}>{{unit.name}}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label for="totalKwh">Total Bill Amount</label>
              <input type="number" step="0.01" class="form-control" id="billAmount" name="billAmount" formControlName="billAmount" placeholder="30000">
            </div>
            <div *ngIf="totalCost != form.controls.billAmount && (form.controls.billAmount.dirty || form.controls.billAmount.touched)" class="alert alert-danger">
                Total Bill must equal to total of line item costs
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="daysBilled">Days Billed</label>
              <input type="number" step="1" class="form-control" id="daysBilled" name="daysBilled" formControlName="daysBilled" placeholder="30">
            </div>
          </div>
          
        </div>
        <div class="row">
          <div class="col-md-3">
            <div class="form-group">
              <label for="kwRatePerTariff">KW rate as per tariff</label>
              <input type="number" step="any" class="form-control" id="kwRatePerTariff" name="kwRatePerTariff" formControlName="kwRatePerTariff">
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="kvarTariffRate">KVAR Tariff Rate</label>
              <input type="number" step="any" class="form-control" id="kvarTariffRate" name="kvarTariffRate" formControlName="kvarTariffRate">
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="tariff">Tariff</label>
              <input type="text" class="form-control" id="tariff" name="tariff" formControlName="tariff"  placeholder="Electricity company primary voltage > 3MW < 30MW">
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="kwPeak">KW Peak</label>
              <input type="number" step="any" class="form-control" id="kwPeak" name="kwPeak" formControlName="kwPeak"  placeholder="4700" title="Enter the Kw's supplied as shown on the electric bill. If the kW is not shown, or is listed as kWh, then divide the kWh by the billing hours for the month. (i.e. 30 billing days = 720 hours; 31 billing days = 744)">
            </div>
          </div>
          <div class="col-md-3">
            <div class="form-group">
              <label for="kwhTariffRate">Customer Charge</label>
              <input type="number" step="any" class="form-control" id="customerCharge" name="customerCharge" formControlName="customerCharge"  placeholder="2000">
            </div>
          </div>
        </div>
        <h3>Line Items</h3>
        <line-item-form 
          [items]="items"
          [projectSavings]="savingsPercent"
          [itemArray]="form.get('lineItems')">
        </line-item-form>
      </div>
      
      <div class="row content-box-white">
        <div class="col-md-12 text-right">
          <button *ngIf="projectId" class="default-button grey-button" type="button" (click)="back()">Back</button>
          <button class="default-button green-button" type="button" (click)="submit()">Save and Identify Equipment</button>
        </div>
      </div>
    </form>
  `
})
export class BillAnalyticFormComponent implements OnInit, OnChanges {

  @Output() submitEvent = new EventEmitter<any>();

  /**
   * If user clicks back (to go back to project)
   * @type {EventEmitter<any>}
   */
  @Output() backEvent = new EventEmitter<any>();

  @Input() billAnalytic;
  @Input() billIndex;
  @Input() scanData: any = null;
  private form;
  private projects;
  private items;
  private xecoUnits;
  private voltage;
  private kWPerUnit;
  private keys = Object.keys;
  private totalCost;
  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  constructor(private formBuilder: FormBuilder,
              private timeHelpers: TimeHelpers,
              private itemService: ItemService,
              private currentUserService: CurrentUserService,
              private billAnalyticService: BillAnalyticService,
              @Inject('ELECTRICITY_CHARGE_TYPES') private ELECTRICITY_CHARGE_TYPES) {}

  ngOnInit() {
    this.itemService.getAll().subscribe(data => {
      this.xecoUnits = data;
    });
    this.initializeForm();
    if (this.scanData && this.form) {
      this.prefillFromScanData(this.scanData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['scanData'] && this.scanData && this.form) {
      this.prefillFromScanData(this.scanData);
    }
  }

  private prefillFromScanData(d: any) {
    if (!this.form || !d) return;
    const billDateVal = d.billDate ? this.epochToDatepicker(Number(d.billDate)) : null;
    this.form.patchValue({
      billReference: d.billReference || '',
      billDate: billDateVal,
      electricCompanyName: d.electricCompanyName || '',
      electricCompanyAddress: d.electricCompanyAddress || '',
      electricCompanyCity: d.electricCompanyCity || '',
      electricCompanyState: d.electricCompanyState || '',
      electricCompanyZip: d.electricCompanyZip || '',
      electricCompanyCountry: d.electricCompanyCountry || 'USA',
      accountNumber: d.accountNumber || '',
      meterNumber: d.meterNumber || '',
      totalKwh: d.totalKwh || '',
      kwPeak: d.kwPeak || '',
      billAmount: d.billAmount || '',
      daysBilled: d.daysBilled || '',
      voltage: d.voltage ? Number(d.voltage) : '',
      kwRatePerTariff: d.kwRatePerTariff || '',
      customerCharge: d.customerCharge || '',
      tariff: d.tariff || ''
    });
    if (billDateVal) {
      this.form.controls.date.setValue(billDateVal);
    }
    const lineItems = d.lineItems || [
      { name: 'KWH Charges', type: 'kwh', cost: 0, billingRate: 0, tierHours: '24', meterReading: d.totalKwh, savings: 0 },
      { name: 'KW Charges', type: 'kw', cost: 0, billingRate: d.kwRatePerTariff || 0, tierHours: '24', meterReading: d.kwPeak, savings: 0 }
    ];
    this.items = lineItems;
    const lineItemsArray = this.form.get('lineItems') as FormArray;
    while (lineItemsArray.length) {
      lineItemsArray.removeAt(0);
    }
    lineItems.forEach((item: any) => {
      lineItemsArray.push(this.formBuilder.group({
        name: new FormControl(item.name),
        tierHours: new FormControl(item.tierHours || '24'),
        type: new FormControl(item.type || 'kwh'),
        cost: new FormControl(item.cost, [CustomValidators.number]),
        billingRate: new FormControl(item.billingRate, [CustomValidators.number]),
        meterReading: new FormControl(item.meterReading, [CustomValidators.number]),
        savings: new FormControl(item.savings || 0, [CustomValidators.number]),
      }));
    });
  }

  private epochToDatepicker(ms: number): { date: { year: number; month: number; day: number } } | null {
    if (!ms) return null;
    try {
      const dt = new Date(ms);
      return { date: { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() } };
    } catch (_) {
      return null;
    }
  }

  initializeForm() {
	console.log("billAnalytic-form Initialize");
    this.form = this.formBuilder.group({
      date: ['', [Validators.required]],
      facilitySqFeet: ['', [CustomValidators.number]],
      billReference: ['', [Validators.required]],
      billDate: ['', [Validators.required]],
      accountNumber: ['', [Validators.required]],
      billAmount: ['', [Validators.required, CustomValidators.number]],
      meterNumber: ['', [Validators.required]],
      switchGearCount: ['', [Validators.required, CustomValidators.number]],
      mainCircuitCount: ['', [Validators.required, CustomValidators.number]],
      xecoUnitType: [3, [Validators.required]],
      totalKwh: ['', [Validators.required, CustomValidators.number]],
      daysBilled: ['', [Validators.required, CustomValidators.number]],
      kwRatePerTariff: ['', [Validators.required, CustomValidators.number]],
      kvarTariffRate: ['', [CustomValidators.number]],
      tariff: ['', [Validators.required]],
      voltage: ['', [Validators.required]],
      kWPerUnit: ['', [Validators.required]],
      kwPeak: ['', [Validators.required, CustomValidators.number]],
      customerCharge: ['', [Validators.required, CustomValidators.number]],
      electricCompanyName: new FormControl('', [Validators.required]),
      electricCompanyCountry: new FormControl('', [Validators.required]),
      electricCompanyAddress: new FormControl('', [Validators.required]),
      electricCompanyCity: new FormControl('', [Validators.required]),
      electricCompanyState: new FormControl('', [Validators.required]),
      electricCompanyZip: new FormControl('', [Validators.required]),
      lineItems: this.formBuilder.array([]),
      meterBills: this.formBuilder.array([]),
    });

    if(this.billAnalytic) {
      if (this.billIndex) {
        this.items = this.billAnalytic.meterBills[this.billIndex].lineItems;
        this.form.patchValue(this.billAnalytic.meterBills[this.billIndex]);
        this.form.controls.date.setValue(this.timeHelpers.getDatepickerDictionaryFromString(this.billAnalytic.meterBills[this.billIndex].date, 'x'));
        this.form.controls.billDate.setValue(this.timeHelpers.getDatepickerDictionaryFromString(this.billAnalytic.meterBills[this.billIndex].billDate, 'x'));
      } else if (this.billAnalytic.meterBills) {
        this.items = [{}, {}, {}];
      } else {
        this.form.patchValue(this.billAnalytic);
        this.items = this.billAnalytic.lineItems;
        this.form.controls.date.setValue(this.timeHelpers.getDatepickerDictionaryFromString(this.billAnalytic.date, 'x'));
        this.form.controls.billDate.setValue(this.timeHelpers.getDatepickerDictionaryFromString(this.billAnalytic.billDate, 'x'));
      }
    } else {
      this.items = [{}, {}, {}];
    }
  }

  submit() {
    this.totalCost = 0;
    this.form.get('lineItems').controls.forEach(lineItem => {
        this.totalCost += parseFloat(lineItem.value.cost);
    });

    if(this.form.valid) {

      let loadfactor = (this.form.value.totalKwh / (this.form.value.daysBilled * 24)) / this.form.value.kwPeak;
      let savCalc;

      //if (loadfactor >= .7)
        savCalc = .3225 - (((.9-loadfactor)*100)*.0031011);
      //else
      //  savCalc = .35 - (20*.0008) - (((.7-loadfactor)*100)*.004);

      //let savingsPercent = ((0.9 - (loadFactor > 0.5 ? loadFactor : 0.5)) * 0.07 + 0.07);
      let savingsPercent = (1000-(loadfactor*1000))*(savCalc)/1000;
	console.log("loadFactor:" , loadfactor);
	console.log("savCalc: " , savCalc);
	console.log("savingsPercent: " , savingsPercent);

      this.form.value.date = this.timeHelpers.getUnixTimeFromDatepickerDictionary(this.form.value.date.date);
      this.form.value.billDate = this.timeHelpers.getUnixTimeFromDatepickerDictionary(this.form.value.billDate.date);
      this.form.value.totalSavings = this.form.value.lineItems.reduce((totalSavings, lineItem) => {
	console.log('lineItem.savings' , lineItem.savings);
	console.log('round.lineItem.savings2' , Math.round(lineItem.savings*100)/100);
        totalSavings += Math.round(lineItem.savings*100) / 100;
        return totalSavings;
      }, 0);

      let meterAnalytic = this.form.getRawValue();
      meterAnalytic.totalSavings = this.form.value.lineItems.reduce((totalSavings, lineItem) => {
        totalSavings += lineItem.savings;
        return totalSavings; 
      }, 0);
      
      let analytic;
      if (this.billAnalytic) {
        analytic = this.billAnalytic;
        if (analytic.meterBills) {
        } else { analytic.meterBills = []}

        analytic.date = this.form.value.date;
        analytic.billDate = this.form.value.billDate;

      } else {
        analytic = this.form.value;
      }

      meterAnalytic.date = this.form.value.date;
      meterAnalytic.billDate = this.form.value.billDate;
      delete meterAnalytic.meterBills;
 
      if (this.billIndex) {
        analytic.meterBills[this.billIndex] = meterAnalytic;
      } else {
        analytic.meterBills.push(meterAnalytic);
      }

      // add all meter bill analytics together;
      let sumBillAmount = 0, sumKwh = 0, kWPerUnit = 0, voltage = 0, sumPeak = 0, sumCustomerCharge = 0, sumSwitchGear = 0, sumMainCircuit = 0, sumTotalSavings = 0, sumKwRatePerTariff = 0, sumPowerFactor = 0;
      let sumLineItems = [{'name': 'KWH Charges', 'type': 'kwh', 'cost': 0, 'billingRate': 0, 'savings': 0}, {'name': 'KW Charges', 'type': 'kw', 'cost': 0, 'billingRate': 0, 'savings': 0}, {'name': 'Tax Charges', 'type': 'tax', 'cost': 0, 'savings': 0}, {'name': 'Miscellaneous Charges', 'type': 'm', 'cost': 0, 'savings': 0}, {'name': 'X Charges', 'type': 'x', 'cost': 0, 'savings': 0}];
        analytic.meterBills.forEach((bill) => {
          sumKwh += parseFloat(bill.totalKwh);
          analytic.daysBilled = bill.daysBilled;
          sumPowerFactor += parseFloat(bill.powerFactor);
          sumPeak += parseFloat(bill.kwPeak);
          sumBillAmount += parseFloat(bill.billAmount);
	  voltage = parseFloat(bill.voltage); // voltage same for all bills
	  kWPerUnit = parseFloat(bill.kwPerUnit); // voltage same for all bills
          sumTotalSavings += parseFloat(bill.totalSavings);
          sumCustomerCharge += parseFloat(bill.customerCharge);
          sumSwitchGear += parseInt(bill.switchGearCount);
          sumMainCircuit += parseInt(bill.mainCircuitCount);
          sumKwRatePerTariff += parseFloat(bill.kwRatePerTariff); 
          let billBillingRate = 0, billAvgRate = 0, kwhSaving = 0, kwSaving = 0, kwhCost = 0, kwCost = 0, mSaving = 0, mCost = 0, taxSaving = 0, taxCost = 0, xSaving = 0, xCost = 0;
          bill.lineItems.forEach((lineItem) => {
            if (lineItem.type == "kwh") {
              billBillingRate += parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
              kwhSaving += lineItem.savings * (this.currentUserService.user.selectedProject.reportFields.effectivePercent / 100);
              kwhCost+= parseFloat(lineItem.cost);
            } else if (lineItem.type == "kw") {
              billAvgRate += parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
              kwSaving += lineItem.savings;
              kwCost += parseFloat(lineItem.cost);
            } else if (lineItem.type == "m") {
              mSaving += lineItem.savings;
              mCost += parseFloat(lineItem.cost);
            } else if (lineItem.type == "tax") {
              taxSaving += lineItem.savings;
              taxCost += parseFloat(lineItem.cost);
            } else if (lineItem.type == "x") {
              xSaving += lineItem.savings;
              xCost += parseFloat(lineItem.cost);
            }
          });

          sumLineItems.forEach((sumLineItem) => {
            if (sumLineItem.type == "kwh") {
              sumLineItem.billingRate += billBillingRate;
              sumLineItem.cost += kwhCost;
              sumLineItem.savings += kwhSaving;
            } else if (sumLineItem.type == "kw") {
              sumLineItem.billingRate += billAvgRate;
              sumLineItem.cost += kwCost;
              sumLineItem.savings += kwSaving;
            } else if (sumLineItem.type == "m") {
              sumLineItem.cost += mCost;
              sumLineItem.savings += mSaving;
            } else if (sumLineItem.type == "tax") {
              sumLineItem.cost += taxCost;
              sumLineItem.savings += taxSaving;
            } else if (sumLineItem.type == "x") {
              sumLineItem.cost += xCost;
              sumLineItem.savings += xSaving;
            }
          });
        });
        // get average rate of bills for meters;
        sumLineItems.forEach((sumLineItem) => {
            if (sumLineItem.type == "kwh" || sumLineItem.type == "kw") {
              sumLineItem.billingRate = sumLineItem.billingRate / analytic.meterBills.length;
            } 
        });

        analytic.kwRatePerTariff = sumKwRatePerTariff / analytic.meterBills.length;
        analytic.powerFactor = sumPowerFactor / analytic.meterBills.length;
        analytic.billAmount = sumBillAmount;
        analytic.totalKwh = sumKwh;
        analytic.kwPeak = sumPeak;
	analytic.voltage = voltage;
	analytic.kWPerUnit = kWPerUnit;
        analytic.customerCharge = sumCustomerCharge;
        analytic.switchGearCount = sumSwitchGear;
        analytic.mainCircuitCount = sumMainCircuit;
        analytic.lineItems = sumLineItems;
        analytic.totalSavings = sumTotalSavings;
        analytic.xecoUnitType = this.form.value.xecoUnitType;
        analytic.meterNumber = this.form.value.meterNumber;

      analytic.lineItems = analytic.lineItems.filter(item => {
        return item.name;
      });

      this.billAnalyticService.updateAnalytic(analytic).subscribe(result => {});

      this.submitEvent.emit(analytic);
    } else {
      for (let i in this.form.controls) {
        this.form.controls[i].markAsDirty();
      }
      this.form.controls.lineItems.controls.forEach(lineItem => {
        for (let i in lineItem.controls) {
          lineItem.controls[i].markAsDirty();
        }
      });
    }
  }

  back() {
    this.backEvent.emit();
  }
  
}
