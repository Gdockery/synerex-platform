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
            <tr *ngFor="let item of form.get('items').controls; let i=index" [formGroup]="item">
              <td class="purple">{{item.value.name}}</td>
              <td><input type="number" (change)="calculateTotals(); fillPartTotals()" class="form-control" [id]="'item-count-' + i" [name]="'item-count-' + i" formControlName="count"></td>
              <td><input type="text" (change)="calculateTotals()" class="form-control" [id]="'item-price-' + i" [name]="'item-price-' + i" formControlName="price"></td>
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
                <input style="width:75%;display:inline-block;" *ngIf="part.value.addedPart" type="text" class="form-control" [id]="'part-name-' + i" [name]="'part-name-' + i" formControlName="name">
                <span *ngIf="!part.value.addedPart">{{part.value.name}}</span>
              </td>
              <td><input type="number" (change)="calculateTotals()" class="form-control" [id]="'part-count-' + i" [name]="'part-count-' + i" formControlName="count"></td>
              <td><input type="text" (change)="calculateTotals()" class="form-control" [id]="'part-price-' + i" [name]="'part-price-' + i" formControlName="price"></td>
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
             
              <td><input type="text" (change)="calculateTotals()" class="form-control" [id]="'service-price-' + i" [name]="'service-price-' + i" formControlName="price"></td>
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
    let exchangeRate = parseFloat(this.currentUserService.user.selectedProject.currencyExchangeRate) || 1;

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
      const meterBills = this.analytic && this.analytic.meterBills;
      if (meterBills) {
        // Use == (loose equality) to handle string/number meterNumber mismatch from route params
        this.analytic = meterBills.find(bill => bill.meterNumber == this.meterNumber);
      }
      if (!this.analytic) {
        // Fallback: no matching meter bill found — use the total analytic
        this.analytic = this.totalAnalytic;
      }
      if (this.equipment && this.equipment.meterEquipment) {
        this.equipment = this.equipment.meterEquipment.find(meter => meter.meterNumber == this.meterNumber) || null;
      } else {
        this.equipment = null;
      }
    }

    const hasSavedItems = this.equipment && this.equipment.items && this.equipment.items.length > 0;
    const hasSavedParts = this.equipment && this.equipment.parts && this.equipment.parts.length > 0;

    this.form = this.formBuilder.group({
      items: this.formBuilder.array(hasSavedItems ? this.equipment.items.map(item => this.getItem(item)) : this.items.map(item => this.getItem(item))),
      parts: this.formBuilder.array(hasSavedParts ? this.equipment.parts.map(part => this.getPartItem(part)) : this.parts.map(part => this.getPartItem(part))),
    });

    // Auto-fill part quantities when there is no previously saved equipment data.
    // kwPeak may be at top level or inside meterBills[0]; the service handles the lookup.
    const firstBill = this.analytic && this.analytic.meterBills && this.analytic.meterBills[0];
    const hasKwPeak = this.analytic && (parseFloat(this.analytic.kwPeak) || parseFloat(firstBill && firstBill.kwPeak));
    if (!hasSavedParts && hasKwPeak) {
      this.calculationsService.fillPartTotals(
        this.form.get('items').controls,
        this.form.get('parts').controls,
        this.analytic
      );
    }

    this.calculateTotalsBeforeService();
    const hasSavedServices = this.equipment && this.equipment.services && this.equipment.services.length > 0;
    this.form.addControl('services', this.formBuilder.array(hasSavedServices ? this.equipment.services.map(service => this.getServiceItem(service)) : this.services.map(service => this.getServiceItem(service))));
    this.calculateTotals();
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
    // If xecoUnitType is not set (e.g. from scan workflow), default to XPS600 (id=3)
    const effectiveUnitType = this.analytic.xecoUnitType || 3;

    if (item.id == effectiveUnitType) {
      let factor = 75;
      if (item.id == 2)
        factor = 40;
      let count = Math.ceil(parseFloat(this.analytic.kwPeak) / factor - ((parseInt(this.analytic.switchGearCount) || 0) * 2));
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
        count: new FormControl(parseInt(this.analytic.switchGearCount) || item.count || 0, [Validators.required, CustomValidators.number]),
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
