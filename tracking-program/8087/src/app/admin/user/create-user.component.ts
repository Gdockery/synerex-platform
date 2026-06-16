import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {CustomValidators} from 'ng2-validation';
import {CurrentUserService} from '../../shared/user/currentUser.service';
import {UserService} from "../../shared/user/user.service";
import {AdditionalValidators} from "../../shared/validation/additional.validator";
import {WhitelabelService} from "../../shared/services/whitelabel.service";

var _ = require('lodash');

@Component({
  template: `
    <div class="container-fluid">
      <h3>{{brandName}} Portal User Management</h3>
      <hr/>
      <h4 [hidden]="userCreated">New user</h4>
      <form [formGroup]="form" [hidden]="userCreated" (ngSubmit)="submitNewUserForm()">
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="role" class="with-description">Role <small class="pull-right text-muted">The new user's relationship with {{brandName}}</small></label>
              <select class="form-control" id="role" name="role" formControlName="role" [(ngModel)]="selectedRole" (change)="setAvailableProjects()">
                <option disabled="disabled" value="">--</option>
                <option *ngFor="let userRole of userRoles" [ngValue]="userRole.id">{{userRole.displayName}}</option>
              </select>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="client" class="with-description">Client <small class="pull-right text-muted">The new user's company</small></label>
              <select class="form-control" id="client" name="client" formControlName="client" [(ngModel)]="selectedClient" (change)="setAvailableProjects()">
                <option disabled="disabled" value="">--</option>
                <option *ngFor="let client of clients" [ngValue]="client.id">{{client.name}}</option>
              </select>
            </div>
          </div>
        </div>

        <hr/>

        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label for="fullName" class="with-description">Full name <small class="pull-right text-muted">This new user's first and last name, separated by a space.</small></label>
              <input type="text" class="form-control" id="fullName" name="fullName" formControlName="fullName" [(ngModel)]="newUserFullName">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="email">Email address</label>
              <input type="text" class="form-control" id="email" name="email" formControlName="email" [(ngModel)]="newUserEmail">
            </div>
          </div>
          <div class="col-md-6">
            <!--<div class="form-group">
              <label for="password" class="with-description">Password <small class="pull-right text-primary">Leave blank to let the user choose their own password.</small></label>-->
              <input type="hidden" class="form-control" id="password" name="password" formControlName="password" [(ngModel)]="newUserPassword">
            <!--</div>-->
          </div>
        </div>
        <div class="row" [hidden]="!(this.form.value.client && availableProjects.length === 0)">
          <label class="with-description">Client has no projects</label>
        </div>

        <hr [hidden]="availableProjects.length === 0"/>

        <div [hidden]="availableProjects.length === 0" class="row">
          <div class="col-md-12">
            <label class="with-description">Project access</label>
          </div>
        </div>
        <div [hidden]="availableProjects.length === 0" class="row">
          <div *ngFor="let project of availableProjects" class="col-md-3 checkbox-column">
            <div class="form-group">
              <label [for]="'project_'+project.id"><input type="checkbox" [id]="'project_'+project.id" (change)="addOrRemoveProject(project.id)">&nbsp;&nbsp;{{project.name}}</label>
            </div>
          </div>
        </div>

        <hr [hidden]="availableProjects.length === 0"/>

        <div class="row">
          <div class="col-md-12 text-right">
            <a class="btn btn-default cancel-btn" [routerLink]="['/synerex-administrator/user/list']">Cancel</a>
            <button type="submit" class="btn btn-primary">
              <span [hidden]="syncing">Add user</span>
              <span [hidden]="!syncing">Adding...</span>
            </button>
          </div>
        </div>
        <div class="row"></div>
      </form>
      <div class="success" [hidden]="!userCreated">
        <h4>Success!</h4>
        <p *ngIf="reEnabledUser">The account has been re-enabled for <strong>{{newUserFullName}}</strong>.
        <p *ngIf="!reEnabledUser">A new user account has been created for <strong>{{newUserFullName}}</strong>.
        <hr/>
        <div [hidden]="newUserPassword">
          <p>An email with a special link is sent to the user to complete setting up the account</p>
          <p>The following link allows them to do just that, as well as providing a way for them to log in the very first time:</p>
          <pre><code class="credentials">{{inviteBaseUrl}}/invite/accept?token={{newUserAuthToken}}</code></pre>
        </div>
        <div [hidden]="!newUserPassword">
          <p>The user can now log in using the email address and password combination you provided:</p>
          <pre><code class="credentials">{{newUserEmail}}/{{newUserPassword}}</code></pre>
          <p><small>(If you lose these credentials, just edit this user to set a new password or email address.)</small></p>
        </div>
        <div class="clearfix">
          <a [routerLink]="['/synerex-administrator/user/list']" class="btn btn-lg btn-info pull-right">Done</a>
        </div>
      </div>
    </div>
  `
})
export class CreateUserComponent implements OnInit {

  private form;
  private syncing;
  private clients;
  private selectedRole;
  public brandName: string = 'Xeco'; // Default, will be updated
  public inviteBaseUrl: string = window.location.origin;
  private selectedClient;
  private availableProjects;
  private selectedProjects;
  private userCreated;
  private newnewUserEmail;
  private newnewUserFullName;
  private newUserPassword;
  private newUserAuthToken;
  private reEnabledUser;

  constructor(private formBuilder: FormBuilder, private currentUserService: CurrentUserService, protected userService: UserService, @Inject('USER_ROLES') private userRoles, private whitelabelService: WhitelabelService) {
    this.availableProjects = [];
    this.userCreated = false;
  }


  ngOnInit() {
    // Load brand name
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
      // Update the admin role display name - Synerex Admin for role 8
      var adminRole = this.userRoles.find(role => role.id === 8);
      if (adminRole) {
        adminRole.displayName = 'Platform Admin';
      }
    });

    // Filter available roles based on the logged-in user's role:
    // - Synerex Admin (8): all roles
    // - OEM Admin (9): OEM User (10) + Client roles (1-4). NOT Synerex Admin (8) or OEM Admin (9)
    // - OEM User (10): Client roles (1,3,4) only. NOT Client Admin (2) — only OEM Admin can promote to Client Admin
    // - Client Admin (2) and below: client-level roles (1,3,4) — Client Admin cannot create another Client Admin
    const myRole = Number(this.currentUserService.user.role);
    this.userRoles = this.userRoles.filter(r => {
      if (myRole === 8) return true;                                              // Platform Admin: all roles
      if (myRole === 9) return r.id !== 8 && r.id !== 9;                         // OEM Admin: all except Platform/OEM Admin
      if (myRole === 10) return [1, 3, 4, 5, 6, 11, 12, 13].includes(r.id);     // OEM User: no Client Admin (2)
      // Client Admin (2) and below: client-level roles only
      return [1, 3, 4, 5, 6, 12, 13].includes(r.id);
    });

    this.clients = window['BOOTSTRAP_DATA'].clients;
    this.form = this.formBuilder.group({
      role: ['', [Validators.required]],
      client: [''],
      fullName: ['', [Validators.required, AdditionalValidators.fullName]],
      email: ['', [Validators.required, CustomValidators.email]],
      password: ['', Validators.minLength(6)],
    });

    // Client Admin and below: lock client dropdown to their own client only
    if (myRole >= 1 && myRole <= 6) {
      const myClient = this.currentUserService.user.client;
      const myClientId = myClient && (typeof myClient === 'object' ? myClient.id : myClient);
      if (myClientId) {
        this.clients = (this.clients || []).filter((c: any) => c.id == myClientId);
        this.form.patchValue({ client: myClientId });
        this.selectedClient = myClientId;
        this.setAvailableProjects();
      }
    }

  }

  setAvailableProjects() {
    var isClientRoleSelected = this.selectedRole && this.selectedRole != 8;
    var isAdminRoleSelected = this.selectedRole && this.selectedRole === 8;
    var clientId = this.selectedClient;
    var allProjects = window['BOOTSTRAP_DATA'].user.projects;

    // Clear out selected projects.
    this.selectedProjects = [];

    // If the user role is for a client user, and the specific client has been selected,
    // populate the list of projects that a user can be added to based on the client.
    if(isClientRoleSelected && clientId) {
      this.availableProjects = _.filter(allProjects, function(project) {
        return project.client === clientId;
      });
    }
    // Otherwise, if the user role is for a client user, and NO specific client has been selected,
    // clear out the available projects.
    else if (isClientRoleSelected) {
      this.availableProjects = [];
    }
    // Otherwise, if the user role is for a Synerex admin user, clear out the available projects.
    // (Admins always have access to ALL projects.)
    else if (isAdminRoleSelected) {
      this.availableProjects = [];
    }
    // Otherwise, all projects are available to select.
    else {
      this.availableProjects = [];
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

  validateForm() {
    for (let i in this.form.controls) {
      this.form.controls[i].markAsDirty();
    }

    if(!this.form.value.client) {
      alert('Users must be assigned to a client.');
      return false;
    }

    // If client-side validation fails, don't even try to send it to the cloud.
    if(!this.form.valid) { return false; }

    return true;
  }

  submitNewUserForm() {


    if(this.validateForm()) {
      // Harvest form
      var formData = _.extend({
        projects: this.selectedProjects
      }, this.form.value);

      if (!formData.client && !_.isUndefined(formData.client)) {
        delete formData.client;
      }

      // Send VR
      this.syncing = true;
      this.userService.create(formData).subscribe(responseData =>{
        this.syncing = false;
        this.newUserAuthToken = responseData.response.uriEncodedToken;
        this.reEnabledUser = responseData.response.reEnabledUser;
        this.userCreated = true;
      }, error => {
        this.syncing = false;
        if (error.code == 402) {
          // Seat limit reached — show actionable popup
          const myAccountUrl = (window['SYNEREX_MY_ACCOUNT_URL'] || window.location.origin) + '/my-account';
          const msg = (error.error && error.error.error)
            ? error.error.error
            : 'All user seats are in use.';
          const goNow = window.confirm(
            msg + '\n\nTo add more users, you need to purchase additional seats.\n\nClick OK to go to your My Account page and add seats now.'
          );
          if (goNow) {
            window.open(myAccountUrl, '_blank');
          }
        } else if (error.code == 409) {
          alert('User with this email already exists.');
        } else {
          alert('An error occurred creating the user. Please try again.');
        }
      });
    }
  }
}
