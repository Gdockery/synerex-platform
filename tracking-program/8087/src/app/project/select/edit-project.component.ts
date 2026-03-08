import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import { IMyOptions } from "mydatepicker";
import { TimeHelpers } from "../../shared/helpers/timeHelpers.service";
import {AdminProjectService} from "./admin-project.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {CustomValidators} from "ng2-validation";
import {WhitelabelService} from '../../shared/services/whitelabel.service';

var _ = require('lodash');

var VALIDATIONS = require('./project.validations').default;

@Component({
  templateUrl: './edit-project.component.html',
  styles: ['.edit-project-header { text-align: center !important; } .edit-project-header h3 { text-align: center !important; }']
})
export class ProjectEditComponent implements OnInit {

  public selectedProjectId;
  private syncingFormData;
  private syncingSubmit;
  private archivingProject;
  private project;
  private form;
  public reportFields;
  private xecoAccountManagers;
  private clients;
  private projectCreated;
  public datePickerOptions: IMyOptions = {
    dateFormat: 'yyyy-mm-dd',
    showClearDateBtn: false
  };
  private paymentPlan;
  private numberOfMeters;
  public brandName: string = 'Synerex';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    @Inject('TIMEZONES') private timezones,
    @Inject('CURRENCIES') private currencyCodes,
    private projectService: AdminProjectService,
    private timeHelpers: TimeHelpers,
    private userService: CurrentUserService,
    private whitelabelService: WhitelabelService
  ) {
    this.selectedProjectId = route.snapshot.params['id'];
  }

  ngOnInit() {
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
    });
    this.project = {};

    var hydratedValidations = _.cloneDeep(VALIDATIONS);
    _.each(hydratedValidations, (def, fieldName) => {
      def[0].disabled = fieldName === 'slug' ? true : (this.archivingProject || this.syncingSubmit || this.project.isDeleted);
    });
    hydratedValidations.reportFields = this.formBuilder.group({
      depositInvoicePercent: [{value: '0', disabled: false}, [CustomValidators.range([0,100])]],
      finalInvoicePercent: [{value: '', disabled: false}, [CustomValidators.range([0,100])]],
      installationInvoicePercent: [{value: '', disabled: false}, [CustomValidators.range([0,100])]],
      rfcCode: [{value: '', disabled: false}],
      depositInvoiceDate: [{value: '', disabled: false}, []],
      finalInvoiceDate: [{value: '', disabled: false}, []],
      installationInvoiceDate: [{value: '', disabled: false}, []],
      invoiceContactName: [{value: '', disabled: false}, []],
      invoiceContactPhone: [{value: '', disabled: false}, []],
      billToAddress: [{value: '', disabled: false}, []],
      billToCity: [{value: '', disabled: false}, []],
      billToState: [{value: '', disabled: false}, []],
      billToZip: [{value: '', disabled: false}, []],
      billToCountry: [{value: '', disabled: false}, []],
      shipToAddress: [{value: '', disabled: false}, []],
      shipToCity: [{value: '', disabled: false}, []],
      shipToState: [{value: '', disabled: false}, []],
      shipToZip: [{value: '', disabled: false}, []],
      shipToCountry: [{value: '', disabled: false}, []],
      billAnalyticDate: [{value: '', disabled: false}, []],
      recommendedReserveAdjustment: [{value: '', disabled: false}, [CustomValidators.range([0,100])]],
      proposalDate: [{value: '', disabled: false}, []],
      altEnergyRatio: [{value: 0, disabled: false}, []],
      showI2RLoss: [{value: true, disabled: false}, []],
      effectivePercent: [{value: 100, disabled: false}, []],
    });
    this.form = this.formBuilder.group(hydratedValidations);
    this.form.addControl('paymentPlan', new FormControl('', []));
    this.form.addControl('downPaymentPercent', new FormControl('', []));
    this.form.addControl('interestRate', new FormControl('', []));
    this.form.addControl('subNeeded', new FormControl('', []));
    this.form.addControl('subStartDate', new FormControl('', []));
    this.form.addControl('numberOfMeters', new FormControl(1, []));
    this.reportFields = this.form.get('reportFields');

    this.fetch();
  }

  fetch() {
    this.syncingFormData = true;
    this.projectService.get(this.selectedProjectId).subscribe(currentProjectData => {
      this.syncingFormData = false;

      this.clients = window['BOOTSTRAP_DATA'].clients;
      this.xecoAccountManagers = window['BOOTSTRAP_DATA'].xecoUsersAndAdmins;
      this.project = currentProjectData.response;
      this.project.client = currentProjectData.response.client;
      this.project.xecoManager = currentProjectData.response.xecoManager;
      this.form.patchValue(this.project);
      if(this.project.startDate) {
        this.form.patchValue({startDate: this.timeHelpers.getDatepickerDictionaryFromString(this.project.startDate, 'YYYY-MM-DD')});
      }
      this.form.patchValue({paymentPlan: this.project.reportFields.paymentPlan});
      this.form.patchValue({numberOfMeters: this.project.reportFields.numberOfMeters});
      if (this.project.reportFields.paymentPlan == '2') {
        this.form.patchValue({downPaymentPercent: this.project.reportFields.downPaymentPercent});
        this.form.patchValue({interestRate: this.project.reportFields.interestRate});
      }
      this.form.patchValue({reportFields:{
        depositInvoiceDate: this.project.reportFields.depositInvoiceDate ? this.timeHelpers.getDatepickerDictionaryFromString(this.project.reportFields.depositInvoiceDate, 'YYYY-MM-DD') : '',
        finalInvoiceDate: this.project.reportFields.finalInvoiceDate ? this.timeHelpers.getDatepickerDictionaryFromString(this.project.reportFields.finalInvoiceDate, 'YYYY-MM-DD') : '',
        installationInvoiceDate: this.project.reportFields.installationInvoiceDate ? this.timeHelpers.getDatepickerDictionaryFromString(this.project.reportFields.installationInvoiceDate, 'YYYY-MM-DD') : '',
        billAnalyticDate: this.project.reportFields.billAnalyticDate ? this.timeHelpers.getDatepickerDictionaryFromString(this.project.reportFields.billAnalyticDate, 'YYYY-MM-DD') : '',
        proposalDate: this.project.reportFields.proposalDate ? this.timeHelpers.getDatepickerDictionaryFromString(this.project.reportFields.proposalDate, 'YYYY-MM-DD') : '',
      }});
    });
  }

  submitEditProjectForm() {
    if (this.syncingSubmit || this.archivingProject || this.project.isDeleted) {
      return;
    }

    for (let i in this.form.controls) {
      this.form.controls[i].markAsDirty();
    }

    // If client-side validation fails, don't even try to send it to the cloud.
    if (!this.form.valid) {
      return;
    }

    var formData = this.form.value;
    if(formData.reportFields.paymentPlan == '1') {
      formData.reportFields.paymentPlan = '1';
      formData.reportFields.downPaymentPercent = 30;
      formData.reportFields.interestRate = 4.25;
      formData.reportFields.depositInvoicePercent = 30;
      formData.reportFields.installationInvoicePercent = 30;
      formData.reportFields.finalInvoicePercent = 40;
    } else {
      formData.reportFields.paymentPlan = '2';
      formData.reportFields.downPaymentPercent = formData.downPaymentPercent;
      formData.reportFields.interestRate = formData.interestRate;
    }

    formData.reportFields.numberOfMeters = formData.numberOfMeters;

    delete formData.paymentPlan;
    delete formData.downPaymentPercent;
    delete formData.interestRate;
    delete formData.numberOfMeters;

    // Format the dates
    formData.startDate = this.timeHelpers.formatDatepickerDictionary(formData.startDate.date, 'YYYY-MM-DD', false);
    formData.reportFields.depositInvoiceDate = this.timeHelpers.formatDatepickerDictionary(formData.reportFields.depositInvoiceDate.date, 'YYYY-MM-DD', false);
    formData.reportFields.finalInvoiceDate = this.timeHelpers.formatDatepickerDictionary(formData.reportFields.finalInvoiceDate.date, 'YYYY-MM-DD', false);
    formData.reportFields.installationInvoiceDate = this.timeHelpers.formatDatepickerDictionary(formData.reportFields.installationInvoiceDate.date, 'YYYY-MM-DD', false);
    formData.reportFields.billAnalyticDate = this.timeHelpers.formatDatepickerDictionary(formData.reportFields.billAnalyticDate.date, 'YYYY-MM-DD', false);
    formData.reportFields.proposalDate = this.timeHelpers.formatDatepickerDictionary(formData.reportFields.proposalDate.date, 'YYYY-MM-DD', false);
    this.syncingSubmit = true;
    formData.reportFields.savingsDetail = this.project.reportFields.savingsDetail;

    let invoiceBase = 1843806 + parseInt(this.selectedProjectId);
    formData.invoiceNumber = {'deposit': invoiceBase.toString() + '1', 'installation': invoiceBase.toString() + '2', 'final': invoiceBase.toString() + '3', 'total': invoiceBase.toString() + '4'};

    this.projectService.update(this.selectedProjectId, {
      valuesToSet: formData
    }).subscribe(responseData => {
        this.syncingSubmit = false;
        this.projectCreated = true;
        this.router.navigate(['/project/select']);

        // Now update the information stored on the window.
        var projectOnWindow = _.find(this.userService.user.projects, project => { return project.id == this.selectedProjectId});
        _.extend(projectOnWindow, formData);
    });

  }

  clickDeleteProjectButton() {
    if (this.syncingSubmit || this.archivingProject || this.project.isDeleted) {
      return;
    }

    if (window.confirm('Are you sure you want to archive this project and all of its meters?')) {

      this.archivingProject = true;
      this.projectService.remove(this.selectedProjectId).subscribe(responseData => {
         this.archivingProject = false;
          var projectOnWindow = _.find(this.userService.user.projects, project => { return project.id == this.selectedProjectId});
          projectOnWindow.isDeleted = true;
          this.userService.user.projects = _.filter(this.userService.user.projects, project => { return project.id != this.selectedProjectId});
          this.router.navigate(['/project/select']);
      });
    }
  }
}
