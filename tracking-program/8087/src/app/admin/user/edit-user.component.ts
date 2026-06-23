import {Component, OnInit} from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {ActivatedRoute} from "@angular/router";
import {CustomValidators} from "ng2-validation";
import {UserService} from "../../shared/user/user.service";
import {WhitelabelService} from "../../shared/services/whitelabel.service";

var _ = require('lodash');

@Component({
  template: `
    <div class="container-fluid">
      <h3>{{brandName}} Portal User Management</h3>
      <hr/>
      <div [hidden]="!syncingUser" class="row">
        <div class="col-xs-12">
          <h4 class="text-primary"><span class="fa fa-spinner"></span>&nbsp;&nbsp;Loading user info...</h4>
        </div>
      </div>
      <div [class]="syncingUser ? 'invisible' : ''">
        <h4 [hidden]="!isNameFormHidden || !isEmailFormHidden || !isPasswordFormHidden">
          <a class="back-btn" [routerLink]="['/synerex-administrator/user/list']"><span class="ss-navigateleft"></span></a>
          {{user.fullName}}
          <button *ngIf="!user.isDeleted" class="btn btn-primary pull-right" (click)="clickChangeNameButton()">Rename</button>
        </h4>
        <form [hidden]="isNameFormHidden" [formGroup]="nameForm" (ngSubmit)="submitChangeNameForm()">
          <div class="form-group rename-form">
            <input type="fullName" class="form-control" id="fullName" name="fullName" formControlName="fullName">
            <button class="btn btn-primary save-button">Save</button>
            <span class="btn btn-default cancel-button" (click)="clickCancelChangeNameButton()">Cancel</span>
          </div>
        </form>

        <hr [hidden]="!isEmailFormHidden || !isPasswordFormHidden"/>

        <div [hidden]="!isEmailFormHidden || !isPasswordFormHidden">
          <div class="row">
            <div class="col-md-2"><strong>Role:</strong></div>
            <div class="col-md-10">{{user.roleFriendlyName}}</div>
          </div>
          <div class="row" *ngIf="user.role === 1">
            <div class="col-md-2"><strong>Client:</strong></div>
            <div class="col-md-10">{{user.client.name}}</div>
          </div>
          <hr/>
          <div class="row">
            <div class="col-md-2"><strong>Email address:</strong></div>
            <div class="col-md-8">{{user.email}}</div>
            <div class="col-md-2"><button *ngIf="!user.isDeleted" class="btn btn-sm btn-primary pull-right" (click)="clickChangeEmailButton()">Change email</button></div>
          </div>
          <div class="row" *ngIf="user.hasPassword">
            <div class="col-md-2"><strong>Password:</strong></div>
            <div class="col-md-8">••••••••••••••</div>
            <div class="col-md-2"><button *ngIf="!user.isDeleted" class="btn btn-sm btn-primary pull-right" (click)="clickChangePasswordButton()">Change password</button></div>
          </div>
          <div *ngIf="!user.hasPassword && !user.isDeleted">
            <div class="row" >
              <div class="col-md-2"><strong>Password:</strong></div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <p>Since no password was explicitly defined, this user must currently visit a special link to choose their own password:</p>
                <pre><code>{{inviteBaseUrl}}/tracking/invite/accept?token={{user.resetPasswordToken}}</code></pre>
                <p><em>This user has not logged in yet.</em></p>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <p>You can also set an explicit password for this user instead. <button class="btn btn-sm btn-primary pull-right" (click)="clickChangePasswordButton()">Set password</button></p>
              </div>
            </div>
          </div>
        </div>


        <div [hidden]="availableProjects.length === 0 || !isEmailFormHidden || !isPasswordFormHidden || user.isDeleted">
          <hr/>
          <div class="row">
            <div class="col-md-2"><strong>Project access:</strong></div>
            <div class="col-md-10" *ngIf="!projectsEditable"><button class="btn btn-sm btn-primary pull-right" (click)="clickChangeProjectAccessButton()">Change project access</button></div>
            <div class="col-md-10  text-right" *ngIf="projectsEditable">
              <button class="btn btn-sm btn-primary" (click)="changeProjectAccess()">
                <span [hidden]="syncingSubmit">Save</span>
                <span [hidden]="!syncingSubmit">Saving...</span>
              </button>
              <button class="btn btn-sm btn-default" (click)="clickCancelChangeProjectAccessButton()">Cancel</button>
            </div>
          </div>
          <div class="row">
            <div *ngFor="let project of availableProjects" class="col-md-3 checkbox-column">
              <div class="form-group">
                <label [for]="'project_'+project.id" [class]="projectsEditable ? '' : 'text-muted'"><input type="checkbox" [id]="'project_'+project.id" (change)="addOrRemoveProject(project.id)" [checked]="getIsProjectSelected(project.id)" [disabled]="!projectsEditable">&nbsp;&nbsp;{{project.name}}</label>
              </div>
            </div>
          </div>
        </div>

        <hr [hidden]="!isEmailFormHidden || !isPasswordFormHidden"/>

        <div class="row" [hidden]="!isEmailFormHidden || !isPasswordFormHidden">
          <div class="col-md-2"><strong>Account status:</strong></div>
          <div class="col-md-8">
            <span class="status-label status-active" *ngIf="!user.isDeleted">Active</span>
            <span class="status-label status-inactive" *ngIf="user.isDeleted">Disabled</span>
          </div>
          <div class="col-md-2">
            <button *ngIf="!user.isDeleted" class="btn btn-sm btn-danger pull-right" (click)="clickDeleteUserButton()">
              <span [hidden]="syncingSubmit">Disable account</span>
              <span [hidden]="!syncingSubmit">Disabling...</span>
            </button>
          </div>
        </div>



        <form [hidden]="isEmailFormHidden" [formGroup]="emailForm" (ngSubmit)="submitChangeEmailForm()">
          <h4>Changing email for: <strong>{{user.fullName}}</strong></h4>
          <hr/>
          <div class="row">
            <div class="col-md-12">
              <div class="form-group">
                <label for="email">Email address</label>
                <input type="email" class="form-control" id="email" name="email" formControlName="email">
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-12 text-right">
              <button class="btn btn-primary">
                <span [hidden]="syncingSubmit">Submit</span>
                <span [hidden]="!syncingSubmit">Updating...</span>
              </button>
              <span class="btn btn-default" (click)="clickCancelChangeEmailButton()">Cancel</span>
            </div>
          </div>
        </form>

        <form [hidden]="isPasswordFormHidden" [formGroup]="passwordForm" (ngSubmit)="submitChangePasswordForm()">
          <h4>{{!user.password ? 'Setting' : 'Changing'}} password for: <strong>{{user.fullName}}</strong></h4>
          <hr/>
          <div class="row">
            <div class="col-md-12">
              <div class="form-group">
                <label for="password">New password</label>
                <input type="text" class="form-control" id="password" name="password" formControlName="password">
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-12 text-right">
              <button class="btn btn-primary">
                <span [hidden]="syncingSubmit">Submit</span>
                <span [hidden]="!syncingSubmit">Updating...</span>
              </button>
              <span class="btn btn-default" (click)="clickCancelChangePasswordButton()">Cancel</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
})
export class EditUserComponent implements OnInit {
  // Syncing states
  private syncingUser:boolean;
  private syncingSubmit:boolean;
  private archivingUser:boolean;
  public brandName: string = 'Synerex'; // Default, will be updated
  public inviteBaseUrl: string = window.location.origin;

  // Our user data
  private selectedUserId;
  private user;

  // For selecting projects
  private availableProjects = [];
  private selectedProjects = [];
  private allProjects;

  // When this is enabled, the name form is not shown.
  private isNameFormHidden = true;

  // When this is enabled, the email form is not shown.
  private isEmailFormHidden = true;

  // When this is enabled, the password form is not shown.
  private isPasswordFormHidden = true;

  // When this is enabled, the list of projects is editable.
  private projectsEditable = false;

  // Our FormBuilder instances
  private nameForm;
  private emailForm;
  private passwordForm;

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    protected userService: UserService,
    private whitelabelService: WhitelabelService
  ) {
    this.selectedUserId = route.snapshot.params['id'];
  }


  ngOnInit() {
    // Load brand name
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
    });

    this.user = {};
    this.allProjects = window['BOOTSTRAP_DATA'].user.projects;

    // Initialize change name form:
    this.nameForm = this.formBuilder.group({
      fullName: [{value: '', disabled: this.syncingSubmit}, [Validators.required]],
    });

    // Initialize change email form:
    this.emailForm = this.formBuilder.group({
      email: [{value: '', disabled: this.syncingSubmit}, [Validators.required, CustomValidators.email]]
    });

    // Initialize change password form:
    this.passwordForm = this.formBuilder.group({
      password: [{value: '', disabled: this.syncingSubmit}, [Validators.required, Validators.minLength(6)]],
    });

    this.fetch();
  }

  fetch() {
    this.syncingUser = true;
    this.userService.get(this.selectedUserId).subscribe(responseData =>{
        this.syncingUser = false;
        this.user = responseData.response;

        // Update form data
        this.nameForm.patchValue({fullName: this.user.fullName});
        this.emailForm.patchValue({email: this.user.email});
        if (this.user.role == 7 || this.user.role === 7) {
          this.availableProjects = this.allProjects;
        } else if (this.user.role == 8 || this.user.role === 8) {
          this.availableProjects = [];
        } else {
          this.availableProjects = this.user.client
            ? _.filter(this.allProjects, (project) => project.client === this.user.client.id)
            : [];
        } 

        // Set the values of the project checkboxes.
        _.each(this.user.projects, (project)=>{
          // $('#project_'+project.id).attr('checked',true);  // todo: replace this
          this.selectedProjects.push(project.id);
        });

    });
  }

  getIsProjectSelected(projectId) {
    if(_.contains(this.selectedProjects, projectId)) {
      return true;
    }
    else {
      return false;
    }
  }

  addOrRemoveProject(projectId) {
    if(_.contains(this.selectedProjects, projectId)) {
      this.selectedProjects = _.without(this.selectedProjects, projectId);
    }
    else {
      this.selectedProjects.push(projectId);
    }
  }

  clickChangeNameButton() {
    if(this.syncingSubmit || this.archivingUser) { return; }
    this.isNameFormHidden = false;
    this.projectsEditable = false;
  }

  clickCancelChangeNameButton() {
    if(this.syncingSubmit) { return; }
    this.isNameFormHidden = true;
  }

  submitChangeNameForm() {
    if(this.syncingSubmit) { return; }

    for (let i in this.nameForm.controls) {
      this.nameForm.controls[i].markAsDirty();
    }

    // Set loading state
    this.syncingSubmit = true;
    // Harvest form values & submit
    var formData = this.nameForm.value;
    this.userService.update(this.selectedUserId, formData).subscribe(responseData =>{
        // Clear loading state
        this.syncingSubmit = false;

        // Update name in the UI.
        this.user.fullName = formData.fullName;
        // Hide form
        this.isNameFormHidden = true;

    }, error => {this.syncingSubmit = false});
  }

  clickChangeEmailButton() {
    if(this.syncingSubmit || this.archivingUser) { return; }
    this.nameForm.patchValue({fullName: this.user.fullName});
    this.isNameFormHidden = true;
    this.projectsEditable = false;
    this.isEmailFormHidden = false;
  }

  clickCancelChangeEmailButton() {
    if(this.syncingSubmit) { return; }
    this.isEmailFormHidden = true;
  }

  submitChangeEmailForm() {
    if(this.syncingSubmit) { return; }

    for (let i in this.emailForm.controls) {
      this.emailForm.controls[i].markAsDirty();
    }

    // Set loading state
    this.syncingSubmit = true;
    // Harvest form values & submit
    var formData = this.emailForm.value;
    this.userService.update(this.selectedUserId, formData).subscribe(responseData =>{
        // Clear loading state
        this.syncingSubmit = false;

        // Update email in the UI.
        this.user.email = formData.email;
        // Hide form
        this.isEmailFormHidden = true;
    }, error => {
      if(error.code == 409) {
        alert('User with this email already exists.');
      }
      this.syncingSubmit = false;
    });
  }


  clickChangePasswordButton() {
    if(this.syncingSubmit || this.archivingUser) { return; }
    this.nameForm.patchValue({fullName: this.user.fullName});
    this.isNameFormHidden = true;
    this.projectsEditable = false;
    this.isPasswordFormHidden = false;
  }

  clickCancelChangePasswordButton() {
    if(this.syncingSubmit) { return; }
    this.isPasswordFormHidden = true;
  }

  submitChangePasswordForm() {
    if(this.syncingSubmit) { return; }

    for (let i in this.passwordForm.controls) {
      this.passwordForm.controls[i].markAsDirty();
    }

    // Set loading state
    this.syncingSubmit = true;
    // Harvest form values & submit
    var formData = this.passwordForm.value;
    this.userService.update(this.selectedUserId, formData).subscribe(responseData =>{
        // Clear loading state
        this.syncingSubmit = false;

        // Update password in the UI (in case there wasn't one before.)
        this.user.password = formData.password;
        // Hide form
        this.isPasswordFormHidden = true;
    }, error => {this.syncingSubmit = false});
  }

  clickChangeProjectAccessButton() {
    if(this.archivingUser) { return; }
    this.projectsEditable = true;
  }

  clickCancelChangeProjectAccessButton() {
    if(this.syncingSubmit || this.archivingUser) { return; }

    // Reset the selected projects to match the actual user data.
    this.selectedProjects = [];
    _.each(this.user.projects, (project)=>{
      this.selectedProjects.push(project.id);
    });

    this.projectsEditable = false;
  }

  changeProjectAccess() {
    if(this.syncingSubmit) { return; }

    // Set loading state
    this.syncingSubmit = true;
    // Harvest form values & submit
    var formData = {projects: this.selectedProjects};
    this.userService.update(this.selectedUserId, formData).subscribe(responseData =>{
        // Clear loading state
        this.syncingSubmit = false;

        // Update the user's projects for the UI.
        this.user.projects = [];
        _.each(this.selectedProjects, (projectId)=> {
          this.user.projects.push({
            id: projectId
          });
        });

        // Disable editing
        this.projectsEditable = false;
    }, error => {this.syncingSubmit = false});
  }


  clickDeleteUserButton() {
    if(this.syncingSubmit || this.archivingUser || this.user.isDeleted) { return; }

    this.isNameFormHidden = true;
    this.projectsEditable = false;

    if(window.confirm('Are you sure you want to disable this user\'s account?')) {

      this.archivingUser = true;

      this.userService.remove(this.selectedUserId).subscribe(responseData => {
        this.archivingUser = false;

        // Update the user's `isDeleted` status in the UI
        this.user.isDeleted = true;
      }, error => {this.syncingSubmit = false});
    }
  }

}
