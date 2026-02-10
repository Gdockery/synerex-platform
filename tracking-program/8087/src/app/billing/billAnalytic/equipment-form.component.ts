import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {ItemService} from "../equipment/items.service";
import {PartService} from "../equipment/parts.service";
import {BillAnalyticService} from "./billAnalytic.service";
import {Router, ActivatedRoute} from "@angular/router";
import {BillAnalyticCalculationsService} from "./billAnalytic-calculation.service";
import {CustomValidators} from "ng2-validation";
import {CurrentUserService} from "../../shared/user/currentUser.service";

@Component({
  selector: 'equipment-form',
  styles: [`
    table {
      width: 100%;
    }
    table td {
      padding: 10px;
    }
  `],
  template: `
    <form [formGroup]="form">
      <div class="content-box">
        <div class="box">
          <table>
            <tr>
              <td width="50%">XECO Equipment Models</td>
              <td>Qty</td>
              <td>Price Each</td>
              <td class="text-right">Cost</td>
            </tr>
            <tr *ngFor="let item of form.get('items').controls;" [formGroup]="item">
              <td class="purple">{{item.value.name}}</td>
              <td><input type="number" (change)="calculateTotals(); fillPartTotals()" class="form-control" id="count" name="count" formControlName="count"></td>
              <td><input type="text" (change)="calculateTotals()" class="form-control" id="price" name="price" formControlName="price"></td>
              <td class="text-right">{{item.value.count * item.value.price | projectCurrency:"symbol":'1.2-2'}}</td>
            </tr>
          </table>
        </div>
        <div class="box">
          <button class="default-button green-button" (click)="fillPartTotals()">Fill part totals</button>
          <table>
            <tr>
              <td width="50%">Parts</td>
              <td>Qty</td>
              <td>Price Each</td>
              <td class="text-right">Cost</td>
            </tr>
            <tr *ngFor="let part of form.get('parts').controls; let i=index" [formGroup]="part">
              <td class="purple">
                <button *ngIf="part.value.addedPart" type="button" class="red-button round-button" style="width:40px;height:40px;" (click)="removePart(i)">
                  <span class="ss-hyphen" style="vertical-align:middle;"></span>
                </button>
                <input style="width:75%;display:inline-block;" *ngIf="part.value.addedPart" type="text" class="form-control" id="name" name="name" formControlName="name">
                <span *ngIf="!part.value.addedPart">{{part.value.name}}</span>
              </td>
              <td><input type="number" (change)="calculateTotals()" class="form-control" id="count" name="count" formControlName="count"></td>
              <td><input type="text" (change)="calculateTotals()" class="form-control" id="price" name="price" formControlName="price"></td>
              <td class="text-right">{{part.value.count * part.value.price | projectCurrency:"symbol":'1.2-2'}}</td>
            </tr>
          </table>
          <div class="text-center">
            <button type="button" class="green-button round-button" style="width:40px;height:40px;" (click)="addPart()">
              <span class="ss-plus" style="vertical-align:middle;"></span>
            </button>
          </div>
        </div>
        <div class="box">
          <table>
            <tr>
              <td width="50%">Services</td>
              <td></td>
              <td>Price</td>
              <td class="text-right">Cost</td>
            </tr>
            <tr *ngFor="let service of form.get('services').controls; let i=index" [formGroup]="service">
              <td class="purple">{{service.value.name}}</td>
             
              <td><input type="text" (change)="calculateTotals()" class="form-control" id="price" name="price" formControlName="price"></td>
              <td class="text-right">{{service.value.price | projectCurrency:"symbol":'1.2-2'}}</td>
            </tr>
          </table>
        </div>
        <div class="box">
          <table>
            <tr>
              <td width="80%"><button class="default-button green-button" (click)="calculateTotals()">Recalculate</button></td>
              <td width="15%" class="green text-right"><strong>Total:</strong></td>
              <td style="text-align:right;">{{totals?.subtotal | projectCurrency:"symbol":'1.2-2'}}</td>
            </tr>
            <tr>
              <td width="80%"></td>
              <td width="15%" class="green text-right"><strong>Sales Tax:</strong></td>
              <td style="text-align:right;">{{totals?.tax | projectCurrency:"symbol":'1.2-2'}}</td>
            </tr>
          </table>
          <div class="clearfix"></div>
          <hr />
         <table>
          <tr>
            <td class="green" width="30%">Total Identified MAIN Circuits:</td>
            <td width="50%">{{this.analytic.mainCircuitCount}}</td>
            <td width="15%" class="green text-right">Equipment Discount:</td>
            <td style="text-align:right;">{{totals?.discount | projectCurrency:"symbol":'1.2-2'}}</td>
          </tr>
          <tr>
            <td class="green" width="30%">Total circuits on SGs or MCCs:</td>
            <td width="50%">{{this.analytic.switchGearCount}}</td>
            <td width="15%" class="green text-right">Final Project Cost:</td>
            <td style="text-align:right;">{{totals?.total | projectCurrency:"symbol":'1.2-2'}}</td>
          </tr>
          </table>
          <div class="clearfix"></div>
        </div>
      </div>

      <div class="row content-box-white">
        <div class="col-md-12 text-right">
          <button class="default-button gray-button" type="button" (click)="back()">Back</button>
          <button class="default-button green-button" type="button" (click)="submit()">Submit</button>
        </div>
      </div>
    </form>
  `
})
export class EquipmentFormComponent implements OnInit {

  /**
   * Bill analytic form data passed from previous step.
   */
  @Input() analytic;
 
  /**
   * Equipment data to edit.
   */
  @Input() equipment;

  @Input() meterNumber;

  @Output() submitEvent = new EventEmitter<any>();

  /**
   * Event triggered when user clicks back button.
   * @type {EventEmitter<any>}
   */
  @Output() backEvent = new EventEmitter<any>();

  private form;
  private items;
  private parts;
  private services;
  private totals;
  private beforeServicesTotals;
  private totalAnalytic;


  constructor(private formBuilder: FormBuilder,
              private timeHelpers: TimeHelpers,
              private itemService: ItemService,
              private partService: PartService,
              private currentUserService: CurrentUserService,
              private router: Router, private route: ActivatedRoute,
              private calculationsService: BillAnalyticCalculationsService,
              private billAnalyticService: BillAnalyticService) {}

  ngOnInit() {
    //let unitType = parseFloat(this.currentUserService.user.selectedProject.;
    let exchangeRate = parseFloat(this.currentUserService.user.selectedProject.currencyExchangeRate);

    this.itemService.getAll().subscribe(data => {
      this.items = data;
      this.items.map(function(item) {
        item.price = Math.round((item.price  * exchangeRate));
        return item;
      });
   
    });
    
    this.partService.getAllParts().subscribe(data => {
      this.parts = data;
      this.parts.map(function(part) {
        part.price = Math.round((part.price  * exchangeRate)); 
        return part;
      });
 
    });
    this.partService.getAllServices().subscribe(data => {
      this.services = data;
    });
    this.initializeForm();

  }

  initializeForm() {
    this.totalAnalytic = this.analytic;
 
    if (this.meterNumber) {
      this.analytic = this.analytic.meterBills.filter(bill => { return bill.meterNumber === this.meterNumber})[0];
      if (this.equipment.meterEquipment) {
        this.equipment = this.equipment.meterEquipment.find(meter => { return meter.meterNumber == this.meterNumber});
        
      } else {
        this.equipment = null;
      }
    } 

    this.form = this.formBuilder.group({
      items: this.formBuilder.array(this.equipment && this.equipment.items ? this.equipment.items.map(item => this.getItem(item)) : this.items.map(item => this.getItem(item))),
      parts: this.formBuilder.array(this.equipment && this.equipment.parts ? this.equipment.parts.map(part => this.getPartItem(part)) : this.parts.map(part => this.getPartItem(part))),
    });

    if (!this.equipment) {
      this.calculationsService.fillPartTotals(
        this.form.get('items').controls,
        this.form.get('parts').controls,
        this.analytic
      );
    }

    this.calculateTotalsBeforeService();
    this.form.addControl('services', this.formBuilder.array(this.equipment && this.equipment.services ? this.equipment.services.map(service => this.getServiceItem(service)) : this.services.map(service => this.getServiceItem(service))));
    this.calculateTotals(); 
    //}
  }

  getPartItem(item:any = {}, addedPart = false) {
    return this.formBuilder.group({
      name: new FormControl(item.name, [Validators.required]),
      price: new FormControl(item.price, [Validators.required, CustomValidators.number]),
      count: new FormControl(item.count || 0, [Validators.required, CustomValidators.number]),
      factor: new FormControl(item.factor, [Validators.required, CustomValidators.number]),
      taxable: new FormControl(item.taxable),
      addedPart: new FormControl(addedPart, [Validators.required]),
    });
  }

  getItem(item:any = {}, addedPart = false) {
    if (item.id == this.analytic.xecoUnitType) {
	//unitType = this.analytic.xecoUnitType;
	console.log("kwPeak:" , this.analytic.kwPeak);
	let factor = 75;
        if (item.id == 2) 
	    factor = 40;
	//console.log("item.id:" , item.id);
	//console.log("factor:" , factor);
      let count = Math.ceil(parseFloat(this.analytic.kwPeak) / factor - (this.analytic.switchGearCount * 2));
      //let count = Math.ceil(parseFloat(this.analytic.totalKwh) / (this.analytic.daysBilled * 24) * (this.currentUserService.user.selectedProject.ILRatio / 100) / 65 - (this.analytic.switchGearCount * 2));
      return this.formBuilder.group({
        name: new FormControl(item.name, [Validators.required]),
        price: new FormControl(item.price, [Validators.required, CustomValidators.number]),
        count: new FormControl(count < 0 ? 0 : count || item.count || 0, [Validators.required, CustomValidators.number]),
        taxable: new FormControl(item.taxable),
        addedPart: new FormControl(addedPart, [Validators.required]),
      });
   } else if (item.id == 4) {
      return this.formBuilder.group({
        name: new FormControl(item.name, [Validators.required]),
        price: new FormControl(item.price, [Validators.required, CustomValidators.number]),
        count: new FormControl(this.analytic.switchGearCount || item.count || 0, [Validators.required, CustomValidators.number]),
        taxable: new FormControl(item.taxable),
        addedPart: new FormControl(addedPart, [Validators.required]),
      });
   } else {
     return this.formBuilder.group({
        name: new FormControl(item.name, [Validators.required]),
        price: new FormControl(item.price, [Validators.required, CustomValidators.number]),
        count: new FormControl(item.count || 0, [Validators.required, CustomValidators.number]),
        taxable: new FormControl(item.taxable),
        addedPart: new FormControl(addedPart, [Validators.required]),
      });
    }
  }

  getServiceItem(item:any = {}, addedPart = false) {
    return this.formBuilder.group({
      name: new FormControl(item.name, [Validators.required]),
      /*discount: new FormControl(item.discount, [Validators.required]),*/
      price: new FormControl(item.price || Math.round(this.beforeServicesTotals.itemTotal * item.percent) || 0, [Validators.required, CustomValidators.number]),
    });
  }

  calculateTotalsBeforeService() {
    this.beforeServicesTotals = this.calculationsService.calculateTotalsBeforeService(
      this.form.get('items').controls,
      this.form.get('parts').controls,
    )
  }

  calculateTotals() {
    this.totals = this.calculationsService.calculateTotals(
      this.form.get('items').controls,
      this.form.get('parts').controls,
      this.form.get('services').controls
    )
  }


  fillPartTotals() {
    this.calculationsService.fillPartTotals(
      this.form.get('items').controls,
      this.form.get('parts').controls,
      this.analytic
    );
    this.calculateTotals();
  }

  addPart() {
    this.form.get('parts').push(this.getItem({}, true));
  }

  removePart(index) {
    this.form.get('parts').removeAt(index);
  }

  submit() {
    if(this.form.valid) {
      console.log ('valid form');
      let data = this.form.value;
      data.total = this.totals;
      console.log(data);
   
      if (this.meterNumber) {
        this.billAnalyticService.updateEquipment(data, this.meterNumber).subscribe(result => {
          this.router.navigate(['/billing/bill-analytic/list']);
        });
      } else {
        this.billAnalyticService.updateEquipment(data).subscribe(result => {
          this.router.navigate(['/billing/project-documents']);
        });
      }
    } else {
      console.log ('invalid form');
      for (let i in this.form.controls) {
        this.form.controls[i].markAsDirty();
      }
    }
  }

  back() {
    this.backEvent.emit();
  }
}
