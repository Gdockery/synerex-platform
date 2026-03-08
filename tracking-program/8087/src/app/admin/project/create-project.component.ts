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
  templateUrl: './create-project.component.html'
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
  /** For "X Account Manager" label - uses oemDisplayName for OEM users, else brandName */
  public accountManagerLabel: string = 'Synerex';

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
    const bootstrap = (typeof window !== 'undefined' && window['BOOTSTRAP_DATA']) || {};
    this.accountManagerLabel = (bootstrap['oemDisplayName'] || this.brandName || 'Synerex').trim();
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
      this.accountManagerLabel = (bootstrap['oemDisplayName'] || brandName || 'Synerex').trim();
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
    if (this.clientId) {
      const cid = parseInt(this.clientId, 10);
      if (!isNaN(cid)) {
        this.form.patchValue({ client: cid });
      }
    }
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

    this.clients = window['BOOTSTRAP_DATA'].clients;
    this.xecoAccountManagers = window['BOOTSTRAP_DATA'].xecoUsersAndAdmins;
  }

  submitCreateProjectForm() {
    for (let i in this.form.controls) {
      this.form.controls[i].markAsDirty();
    }

    // If client-side validation fails, don't even try to send it to the cloud.
    if (!this.form.valid) {
      alert('Please fill in all required fields: Client, Project Name, Slug, Timezone, Currency, Initial Pf, Multiplier, Peak Multiplier, Inductive Load Ratio.');
      return;
    }

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

    // Format the date (safely when date fields are empty)
    const fmt = (d) => this.timeHelpers.formatDatepickerDictionary(d && d.date ? d.date : d, 'YYYY-MM-DD', false);
    formData.startDate = fmt(formData.startDate);
    if (formData.reportFields) {
      formData.reportFields.depositInvoiceDate = fmt(formData.reportFields.depositInvoiceDate);
      formData.reportFields.finalInvoiceDate = fmt(formData.reportFields.finalInvoiceDate);
      formData.reportFields.installationInvoiceDate = fmt(formData.reportFields.installationInvoiceDate);
      formData.reportFields.billAnalyticDate = fmt(formData.reportFields.billAnalyticDate);
      formData.reportFields.proposalDate = fmt(formData.reportFields.proposalDate);
    }
    formData.subStartDate = fmt(formData.subStartDate);

    if (!formData.client) {
      alert('Please select a client.');
      return;
    }

    this.syncingSubmit = true;
    this.projectService.create({valuesToSet: formData}).subscribe(responseData=>{
      let newProjectId = responseData.response.id;
      let invoiceBase = 2143835 + parseInt(newProjectId);
      formData.invoiceNumber = {'deposit': invoiceBase.toString() + '1', 'installation': invoiceBase.toString() + '2', 'final': invoiceBase.toString() + '3', 'total': invoiceBase.toString() + '4'};
      formData.id = newProjectId;

      // Add to user.projects immediately (real-time visibility without logout)
      const projectToAdd = { ...formData, ...(responseData.response || {}) };
      const existing = this.userService.user.projects || [];
      this.userService.user.projects = [projectToAdd, ...existing];
      if (typeof window !== 'undefined' && window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].user) {
        window['BOOTSTRAP_DATA'].user.projects = this.userService.user.projects;
      }
      if (this.userService.user.role == 7) {
        this.projectsToAccess = _.pluck(this.userService.user.projects, 'id');
        this.usrService.update(this.userService.user.id, {projects: this.projectsToAccess}).subscribe(data =>{}, error => {});
      }

      this.projectService.update(newProjectId, {
        valuesToSet: formData
      }).subscribe(resData => {
        Object.assign(projectToAdd, formData);
        this.syncingSubmit = false;
        this.newProject = formData;
        this.projectCreated = true;
      }, err => {
        this.syncingSubmit = false;
        const msg = (err && err.error && err.error.error) || (err && err.message) || 'Update failed';
        alert('Project update failed: ' + msg + '. The project was created and appears in your list.');
      });
    }, err => {
      this.syncingSubmit = false;
      const msg = (err && err.error && err.error.error) || (err && err.message) || 'Project creation failed';
      alert('Project creation failed: ' + msg);
    });

    
  }

}
