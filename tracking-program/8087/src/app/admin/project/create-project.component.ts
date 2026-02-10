import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {FormBuilder,FormControl} from "@angular/forms";
import {IMyOptions} from "mydatepicker";
import {AdminProjectService} from "./admin-project.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {CustomValidators} from "ng2-validation";
import {ClientService} from "../client/client.service";
import {UserService} from "../../shared/user/user.service";
import {WhitelabelService} from '../../shared/services/whitelabel.service';

var _ = require('lodash');
 
var VALIDATIONS = require('./project.validations').default;

@Component({
  templateUrl: 'create-project.component.html'
})
export class ProjectCreateComponent implements OnInit {

  private clientId;
  private syncingSubmit;
  private form;
  public reportFields;
  private xecoAccountManagers:any = [];
  public clients:any = [];
  private projectCreated;
  private newProject;
  public users;
  private paymentPlan;
  private financePercent;
  private projectsToAccess;
  public brandName: string = 'Synerex';


  public datePickerOptions: IMyOptions = {
    dateFormat: 'yyyy-mm-dd',
    showClearDateBtn: false
  };

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    @Inject('TIMEZONES') private timezones,
    @Inject('CURRENCIES') private currencyCodes,
    @Inject('COUNTRIES') private countries,
    private timeHelpers: TimeHelpers,
    private userService: CurrentUserService,
    private usrService: UserService,
    private projectService: AdminProjectService,
    private clientService: ClientService,
    private whitelabelService: WhitelabelService

  ) {
    this.clientId = route.snapshot.queryParams['clientId'] || '';
  }

  ngOnInit() {
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
    });
    var hydratedValidations = _.cloneDeep(VALIDATIONS);
    _.each(hydratedValidations, (def, fieldName)=>{
      def[0].disabled = this.syncingSubmit;
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
      showI2RLoss: [{value: 1, disabled: false}, []],
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

  updateSlug() {
    return this.form.patchValue({slug:_.kebabCase(this.form.get('name').value)});
  }


  fetch() {
    this.syncingSubmit = true;

    this.clients = window['SAILS_LOCALS'].clients;
    this.xecoAccountManagers = window['SAILS_LOCALS'].xecoUsersAndAdmins;
  }

  submitCreateProjectForm() {
    for (let i in this.form.controls) {
      this.form.controls[i].markAsDirty();
    }

    // If client-side validation fails, don't even try to send it to the cloud.
    if(!this.form.valid) { return; }

    //set interest rate and downpayment rate

    var formData = this.form.value;

    if(formData.paymentPlan == '2') {
      formData.reportFields.paymentPlan = '2';
      formData.reportFields.downPaymentPercent = formData.downPaymentPercent;
      formData.reportFields.interestRate = formData.interestRate;
    } else {
      formData.reportFields.paymentPlan = '1'; 
      formData.reportFields.downPaymentPercent = 30;
      formData.reportFields.interestRate = 4.25;
      formData.reportFields.depositInvoicePercent = 30;
      formData.reportFields.installationInvoicePercent = 30;
      formData.reportFields.finalInvoicePercent = 40;
    }

    formData.reportFields.numberOfMeters = formData.numberOfMeters;

    delete formData.paymentPlan;
    delete formData.downPaymentPercent;
    delete formData.interestRate;
    delete formData.numberOfMeters;

    // Format the date

    formData.startDate = this.timeHelpers.formatDatepickerDictionary(formData.startDate.date, 'YYYY-MM-DD', false);
    formData.reportFields.depositInvoiceDate = this.timeHelpers.formatDatepickerDictionary(formData.reportFields.depositInvoiceDate.date, 'YYYY-MM-DD', false);
    formData.reportFields.finalInvoiceDate = this.timeHelpers.formatDatepickerDictionary(formData.reportFields.finalInvoiceDate.date, 'YYYY-MM-DD', false);
    formData.reportFields.installationInvoiceDate = this.timeHelpers.formatDatepickerDictionary(formData.reportFields.installationInvoiceDate.date, 'YYYY-MM-DD', false);
    formData.reportFields.billAnalyticDate = this.timeHelpers.formatDatepickerDictionary(formData.reportFields.billAnalyticDate.date, 'YYYY-MM-DD', false);
    formData.reportFields.proposalDate = this.timeHelpers.formatDatepickerDictionary(formData.reportFields.proposalDate.date, 'YYYY-MM-DD', false);
    formData.subStartDate = this.timeHelpers.formatDatepickerDictionary(formData.subStartDate.date, 'YYYY-MM-DD', false);

    this.syncingSubmit = true;
    this.projectService.create({valuesToSet: formData}).subscribe(responseData=>{
      let newProjectId = responseData.response.id;
      let invoiceBase = 2143835 + parseInt(newProjectId);
      formData.invoiceNumber = {'deposit': invoiceBase.toString() + '1', 'installation': invoiceBase.toString() + '2', 'final': invoiceBase.toString() + '3', 'total': invoiceBase.toString() + '4'};
      this.projectService.update(newProjectId, {
        valuesToSet: formData
      }).subscribe(resData => {
        formData.id = newProjectId;
        // Now update the information stored on the window.
        this.userService.user.projects.unshift(formData);
        if (this.userService.user.role == 7) {
          this.projectsToAccess = _.pluck(this.userService.user.projects, 'id');
          this.projectsToAccess.push(formData.id);
          this.usrService.update(this.userService.user.id, {projects: this.projectsToAccess}).subscribe(data =>{
          }, error => {});
        }
      
        this.syncingSubmit = false;
        this.newProject = formData;
        this.projectCreated = true;
      });
    });

    
  }

}
