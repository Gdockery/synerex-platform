import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IMyOptions} from "mydatepicker";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {DeviceService} from "../electricityMeters/devices/device.service";
import {TimeHelpers} from "../shared/helpers/timeHelpers.service";
//import {DateTimeValidators} from "../shared/validation/dateTime.validators";
import {AdditionalValidators} from "../shared/validation/additional.validator";
import {BillAnalyticService} from "../billing/billAnalytic/billAnalytic.service";
import {BudgetService} from "./budget.service";
import {EnergySavingsService} from "./energySavings.service";
import {PdfLinkService} from "../shared/pdfLink.service";
import {CurrentUserService} from "../shared/user/currentUser.service";

@Component({
  selector: 'view-budget',
  templateUrl: 'budget-savings.component.html'
})
export class BudgetSavingsComponent implements OnInit {

  private meters = [];
  public links;
  private selectMeterError = false;
  private allSelected = false;
  private kwPeakRate = 0;
  private kwhRate = 0;
  private editRate = false;
  private startDate;
  private sharedPercent;
  private endDate;
  private metersSelected = false;
  public datePickerOptions: IMyOptions = {
    dateFormat: 'yyyy-mm-dd',
    showClearDateBtn: false
  };
  public form;
  public billAnalytic;
  public budgetDetail;
  public budgetRange = 1;
  public savingsReports: any;
  public clientName;
  public clientCity;
  public clientAddress;
  public clientState;
  public clientPhone;
  public clientZip;
  public invoiceNumber;
  public invoiceDetail;
  public contactName;
  public contactPhone;

  @Output() submitEvent = new EventEmitter<any>();

  constructor( private deviceService: DeviceService, private formBuilder: FormBuilder, private timeHelpers: TimeHelpers, private billAnalyticService: BillAnalyticService, private budgetService: BudgetService, private energySavingsService: EnergySavingsService, private pdfLinkService: PdfLinkService, private userService: CurrentUserService) {}

  ngOnInit() {

    //get meters for project
    this.meters = this.userService.user.selectedProject.meters;

    this.pdfLinkService.getLinks().subscribe(links => {
      this.links = links;
    });
  
    this.selectAllMeters();
  } 
  
 selectAllMeters() {
   this.meters.forEach(function(meter) {
     meter.checked = true;
   });
   this.allSelected = true;
 }  
 
 select() {
   if (this.getSelected().length < this.meters.length) {
     this.meters.forEach(function(meter) {
       meter.checked = true;
     });
     this.allSelected = true;
   } else {
     this.meters.forEach(function(meter) {
       meter.checked = false;
     });
     this.allSelected = false;
   }  
 }  

  getSelected() {
    let result = this.meters.filter((meter) => { return meter.checked == true}).map((meter) => { return meter.id});
     return result; //returning as string since get request does not accept arrays  
  }  

  changeCheckbox(i) {
   this.meters[i].checked = !this.meters[i].checked;
   if (this.getSelected().length != this.meters.length) {
    this.allSelected = false;
   } else {
    this.allSelected = true;
   }
  } 

  submit() {
    this.metersSelected = true;
  
    let formData = {
      startDate: this.timeHelpers.formatDatepickerDictionary(this.startDate.date,'YYYY-MM-DD', false),
      endDate: this.timeHelpers.formatDatepickerDictionary(this.endDate.date,'YYYY-MM-DD', false),
      meters: this.getSelected().toString(),
      budgetRange: this.budgetRange,
      clientLogoName: '' + this.userService.user.client.id + '-client-logo',
      type: 'report',
    };

    this.budgetService.getBudgetDetail(formData).subscribe(result => {
      this.budgetDetail = result.response;
    });  
  } 

  getBudgetInvoice() {
    let data = {};
    if(!this.editRate) {
      //data without custom rates
      data = {
        clientLogoName: '' + this.userService.user.client.id + '-client-logo',
        startDate: this.timeHelpers.formatDatepickerDictionary(this.startDate.date,'YYYY-MM-DD', false),
        endDate: this.timeHelpers.formatDatepickerDictionary(this.endDate.date,'YYYY-MM-DD', false),
        meters: this.getSelected().toString(),
        budgetRange: this.budgetRange,
        sharedPercent: this.sharedPercent,
        clientName: this.clientName,
        clientCity: this.clientCity,
        clientAddress: this.clientAddress,
        clientState: this.clientState,
        clientPhone: this.clientPhone,
        clientZip: this.clientZip,
        invoiceNumber: this.invoiceNumber,
        contactName: this.contactName,
        contactPhone: this.contactPhone,
        type: 'invoice',
      };
    } else {
      data = {
        clientLogoName: '' + this.userService.user.client.id + '-client-logo',
        kwPeakRate: this.kwPeakRate,
        kwhRate: this.kwhRate,
        startDate: this.timeHelpers.formatDatepickerDictionary(this.startDate.date,'YYYY-MM-DD', false),
        endDate: this.timeHelpers.formatDatepickerDictionary(this.endDate.date,'YYYY-MM-DD', false),
        meters: this.getSelected().toString(),
        budgetRange: this.budgetRange,
        sharedPercent: this.sharedPercent,
        clientName: this.clientName,
        clientCity: this.clientCity,
        clientAddress: this.clientAddress,
        clientState: this.clientState,
        clientPhone: this.clientPhone,
        clientZip: this.clientZip,
        invoiceNumber: this.invoiceNumber,
        contactName: this.contactName,
        contactPhone: this.contactPhone,
        type: 'invoice',
      };
    }

    this.budgetService.getBudgetDetail(data).subscribe(result => {});
    setTimeout(() => 
    { 
       window.open(this.links.budgetInvoice, '_blank');
    },
    700);
  }

  getBudgetReport() {
    //uses attributes in lastBudget column
    window.open(this.links.budgetReport, '_blank');
  }
}