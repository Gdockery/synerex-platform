import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {IMyOptions} from "mydatepicker";
import {FormBuilder, Validators} from "@angular/forms";
import {TimeHelpers} from "../shared/helpers/timeHelpers.service";
import {DateTimeValidators} from "../shared/validation/dateTime.validators";
import {CurrentUserService} from "../shared/user/currentUser.service";
import {PdfLinkService} from "../shared/pdfLink.service";

@Component({
  selector: 'co2-savings-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="submit(form)">
      <div class="col-md-3">
        <div class="form-group">
          <label for="fromDate">From Date</label>
          <my-date-picker
            name="fromDate"
            id="fromDate"
            [options]="datePickerOptions"
            formControlName="fromDate">
          </my-date-picker>
          <div *ngIf="form.controls.fromDate.hasError('invalidBeforeDateField') && (form.controls.fromDate.dirty || form.controls.fromDate.touched)" class="alert alert-danger">
            From date must be before to date.
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="form-group">
          <label for="toDate">To Date</label>
          <my-date-picker
            name="toDate"
            id="toDate"
            [options]="datePickerOptions"
            formControlName="toDate">
          </my-date-picker>
          <div *ngIf="form.controls.toDate.hasError('invalidAfterDateField') && (form.controls.toDate.dirty || form.controls.toDate.touched)" class="alert alert-danger">
            To date must be after from date.
          </div>
          <div *ngIf="form.controls.toDate.hasError('invalidBeforeToday') && (form.controls.toDate.dirty || form.controls.toDate.touched)" class="alert alert-danger">
            Date cannot be greater than current date.
          </div>
        </div>
      </div>
      <div class="col-md-3" style="padding-top: 22px">
        <button class="default-button green-button">Go</button>
      </div>
      <div class="col-md-3 text-right" style="padding-top: 22px">
        <a *ngIf="hasRunTest" class="default-button green-button" href="{{links.co2Savings}}" target="_blank">Detailed Report</a>
        <a *ngIf="!hasRunTest" class="default-button green-button" target="_blank">Run test to get detailed report</a>
      </div>
    </form>
  `
})
export class Co2SavingsFormComponent implements OnInit {

  @Output() submitEvent = new EventEmitter<any>();
  @Output() generateReportEvent = new EventEmitter<any>();

  private form;
  public links;
  public hasRunTest;

  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  constructor(private formBuilder: FormBuilder, private timeHelpers: TimeHelpers, private pdfLinkService: PdfLinkService, private userService: CurrentUserService) {}

  ngOnInit() {
    this.hasRunTest = this.userService.user.selectedProject.hasRunTest;
    this.pdfLinkService.getLinks().subscribe(links => {
      this.links = links;
    });
    this.initializeForm();
    this.submit();
  }

  initializeForm() {
    this.form = this.formBuilder.group({
      fromDate: [
        this.timeHelpers.getDatepickerDictionaryFromString(
          this.timeHelpers.momentForUserTzUnadjusted().subtract(12, 'months')
        ),
        [DateTimeValidators.beforeDateField('toDate')]
      ],
      toDate: [
        this.timeHelpers.getDatepickerDictionaryFromString(
          this.timeHelpers.momentForUserTzUnadjusted()
        ),
        [DateTimeValidators.afterDateField('fromDate'), DateTimeValidators.beforeTime(this.timeHelpers)]
      ],
    });
  }

  getFormData() {
    return {
      fromDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.fromDate.date).subtract(1,'month').valueOf(),
      toDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.toDate.date).valueOf()
    }
  }

  submit() {
    if(this.form.valid) {
      this.submitEvent.emit(this.getFormData());
    } else {
      for(let i in this.form.controls) {
        this.form.controls[i].markAsDirty();
      }
    }
  }
}
