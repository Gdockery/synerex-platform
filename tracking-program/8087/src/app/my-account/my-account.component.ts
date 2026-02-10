import {Component, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {HttpClient} from '@angular/common/http';
import {CurrentUserService} from "../shared/user/currentUser.service";
import {AccountService} from "./account.service";
import { PaymentComponent } from '../payment/payment.component';
import { FileUpload } from "primeng/components/fileupload/fileupload";


@Component({
  template: `
    <style>
      welcome-payment {
        display: block;
        margin-top: 2em;
      }
    </style>
    <div class="container-fluid">
      <h1>My Account</h1>
      <hr/>

      <div [hidden]="!isEmailFormHidden || !isPasswordFormHidden">
        <div class="row">
          <div class="col-md-2" *ngIf="currentUserService.user.role !== 1"><strong>Role</strong></div>
          <div class="col-md-10" *ngIf="currentUserService.user.role !== 1">{{currentUserService.user.roleFriendlyName}}</div>
          <div class="col-md-2" *ngIf="currentUserService.user.role === 1"><strong>Organization</strong></div>
          <div class="col-md-10" *ngIf="currentUserService.user.role === 1">{{currentUserService.user.client.name}}</div>
        </div>
        <div class="row">
          <div class="col-md-2"><strong>Full name</strong></div>
          <div class="col-md-10">{{currentUserService.user.firstName}} {{currentUserService.user.lastName}}</div>
        </div>
        <div class="row">
          <div class="col-md-2"><strong>Email address</strong></div>
          <div class="col-md-10">{{currentUserService.user.email}}&nbsp;&nbsp;<button class="btn btn-xs btn-primary pull-right" (click)="clickChangeEmailButton()">Change email</button></div>
        </div>
        <div class="row">
          <div class="col-md-2"><strong>Password</strong></div>
          <div class="col-md-10">••••••••••••••&nbsp;&nbsp;<button class="btn btn-xs btn-primary pull-right" (click)="clickChangePasswordButton()">Change password</button></div>
        </div>
        <welcome-payment></welcome-payment>
      </div>
      

      <form [hidden]="isEmailFormHidden" [formGroup]="emailForm" (ngSubmit)="submitEmailForm()">
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="email">Email address</label>
              <input type="email" class="form-control" id="email" name="email" formControlName="email">
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="confirmEmail">Confirm email address</label>
              <input type="email" class="form-control" id="confirmEmail" name="confirmEmail" formControlName="confirmEmail">
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 text-right">
            <button class="btn btn-primary">Submit</button>
            <span class="btn btn-default" (click)="clickCancelChangeEmailButton()">Cancel</span>
          </div>
        </div>
      </form>

      <form [hidden]="isPasswordFormHidden" [formGroup]="passwordForm" (ngSubmit)="submitPasswordForm()">
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="password">New password</label>
              <input type="password" class="form-control" id="password" name="password" formControlName="password">
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="confirmPassword">Confirm password</label>
              <input type="password" class="form-control" id="confirmPassword" name="confirmPassword" formControlName="confirmPassword">
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 text-right">
            <button class="btn btn-primary">Submit</button>
            <span class="btn btn-default" (click)="clickCancelChangePasswordButton()">Cancel</span>
          </div>
        </div>
      </form>
    </div>

  `
})
export class MyAccountComponent {

  // When this is enabled, the email form is not shown.
  private isEmailFormHidden = true;

  // When this is enabled, the password form is not shown.
  private isPasswordFormHidden = true;

  // Our FormBuilder instances
  private emailForm;
  private passwordForm;
  private selectedFile : File;
  private imagePreview: string;
  @ViewChildren('uploaders') uploaders: QueryList<FileUpload>;
  protected inProgress = [];
  protected failedUploading = [];
  private url;
  private logoPath;


  constructor(private formBuilder: FormBuilder, private currentUserService: CurrentUserService, private accountService: AccountService, private http: HttpClient) {}

  ngOnInit() {

    let email = new FormControl('', [Validators.required, CustomValidators.email]);
    let confirmEmail = new FormControl('', [Validators.required, CustomValidators.equalTo(email)]);
    this.emailForm = this.formBuilder.group({
      email: email,
      confirmEmail: confirmEmail,
    });

    this.url = '/api/account/' + this.currentUserService.user.id + '/upload-logo';

    if (this.currentUserService.user.userLogo) {
      this.logoPath = '/images/user_company_logo/' + this.currentUserService.user.id + '-user-logo';
    }

    let password = new FormControl('', [Validators.required, Validators.minLength(6)]);
    let confirmPassword = new FormControl('', [Validators.required, CustomValidators.equalTo(password)]);
    this.passwordForm = this.formBuilder.group({
      password: password,
      confirmPassword: confirmPassword,
    });

  }

  
  clickChangeEmailButton() {
    this.isEmailFormHidden = false;
  }

  clickCancelChangeEmailButton() {
    this.isEmailFormHidden = true;
  }

  clickChangePasswordButton() {
    this.isPasswordFormHidden = false;
  }

  clickCancelChangePasswordButton() {
    this.isPasswordFormHidden = true;
  }



  submitEmailForm() {
    if(this.emailForm.valid) {
      this.accountService.updateAccount({email: this.emailForm.value.email}).subscribe(response => {
        this.isEmailFormHidden = true;
      })
    }

    // Dirty fields to force required validation errors to actually be rendered.
    for (let i in this.emailForm.controls) { this.emailForm.controls[i].markAsDirty(); }
  }

  submitPasswordForm() {
    if(this.passwordForm.valid) {
      // (@mike/scott we need an endpoint for this)
      this.accountService.updateAccount({password: this.passwordForm.value.password}).subscribe(response => {
        this.isPasswordFormHidden = true;
      });
    }

    // Dirty fields to force required validation errors to actually be rendered.
    for (let i in this.passwordForm.controls) { this.passwordForm.controls[i].markAsDirty(); }
  }

}
