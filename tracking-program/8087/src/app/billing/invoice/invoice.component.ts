import {Component, OnInit, EventEmitter, Inject, Input, Output} from '@angular/core';
import {BillAnalyticService} from "../billAnalytic/billAnalytic.service";
import {PdfLinkService} from "../../shared/pdfLink.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {IMyOptions} from "mydatepicker";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {AdminProjectService} from "../../admin/project/admin-project.service";

@Component({
  selector: 'invoice',
  templateUrl: 'invoice.component.html'
})
export class InvoiceComponent implements OnInit { 

  public links;
  public vewOwnerManuals = false;
  public hasAnalytic = null;
  public reportFields;
  public depositInvoiceDate;
  public finalInvoiceDate;
  public installationInvoiceDate;
  public invoiceDateUpdated = false;
  public datePickerOptions: IMyOptions = {
    dateFormat: 'yyyy-mm-dd',
    showClearDateBtn: false
  };
  public invoiceDate;
  public invoiceType;
  public invoiceLink;
  private form;
  @Input() data;

  constructor(private pdfLinkService: PdfLinkService, private billAnalyticService: BillAnalyticService, private userService: CurrentUserService, private formBuilder: FormBuilder,
              private timeHelpers: TimeHelpers, private projectService: AdminProjectService) {}

  ngOnInit() {
    this.pdfLinkService.getLinks().subscribe(links => {
      this.links = links;
    });
    this.billAnalyticService.getAnalytic().subscribe((analytic:any) => {
      this.billAnalyticService.getEquipment().subscribe((equipment:any) => {
        this.hasAnalytic = !!analytic && !!equipment.items;
      });
    });

    this.form = this.formBuilder.group({
      invoiceDate: ['', [Validators.required]],
    });

    this.depositInvoiceDate = this.userService.user.selectedProject.reportFields.depositInvoiceDate;
    this.finalInvoiceDate = this.userService.user.selectedProject.reportFields.finalInvoiceDate;
    this.installationInvoiceDate = this.userService.user.selectedProject.reportFields.installationInvoiceDate;


  }

  uploadStarted() {
    console.log('uploadStarted')
  }
  
  uploadComplete() {
    console.log('uploadComplete')
  }

  uploadFailed() {
    console.log('uploadFailed');
  }

  showModal(type) {
    this.invoiceType = type;
    if (type == 1){
      this.invoiceDate = this.depositInvoiceDate;
    } else if (type == 2) {
      this.invoiceDate = this.installationInvoiceDate;
    } else if (type == 3) {
      this.invoiceDate = this.finalInvoiceDate;
    }

    this.form.patchValue({
        invoiceDate: this.invoiceDate ? this.timeHelpers.getDatepickerDictionaryFromString(this.invoiceDate, 'YYYY-MM-DD') : '',
    });
  }

  updateInvoiceDate(){
    if (this.invoiceType == 1) {
      this.userService.user.selectedProject.reportFields.depositInvoiceDate = this.timeHelpers.formatDatepickerDictionary(this.form.value.invoiceDate.date, 'YYYY-MM-DD', false);
      this.invoiceLink = this.links.depositInvoice;
    } else if (this.invoiceType == 2) {
      this.userService.user.selectedProject.reportFields.installationInvoiceDate = this.timeHelpers.formatDatepickerDictionary(this.form.value.invoiceDate.date, 'YYYY-MM-DD', false);
      this.invoiceLink = this.links.installationInvoice;
    } else if (this.invoiceType == 3) {
      this.userService.user.selectedProject.reportFields.finalInvoiceDate = this.timeHelpers.formatDatepickerDictionary(this.form.value.invoiceDate.date, 'YYYY-MM-DD', false);
      this.invoiceLink = this.links.finalInvoice;
    }


    this.projectService.update(this.userService.user.selectedProject.id, {
      valuesToSet: {reportFields: this.userService.user.selectedProject.reportFields}
    }).subscribe(responseData => {
      this.invoiceDateUpdated = true;
      console.log("responseData", responseData);
    });


  }

}
