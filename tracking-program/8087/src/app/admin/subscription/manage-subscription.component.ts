import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CurrentUserService } from '../../shared/user/currentUser.service';

interface UpgradePlan {
  plan: string;
  base_price: string;
  per_meter: string;
  max_users: number | null;
  description: string;
}

interface SubscriptionInfo {
  active: boolean;
  current_plan: string;
  seat_limit: number;
  seats_used: number;
  seats_available: number;
  meter_limit: number;
  license_id: string;
  expires_at: string;
  upgrade_plans: UpgradePlan[];
}

@Component({
  template: `
<div class="container-fluid" style="padding: 30px;">
  <h2><span class="fa fa-credit-card"></span> Manage Subscription</h2>
  <hr/>

  <div *ngIf="loading" class="text-center" style="padding: 40px;">
    <span class="fa fa-spinner fa-spin fa-2x"></span>
    <p class="text-muted" style="margin-top: 10px;">Loading subscription info...</p>
  </div>

  <div *ngIf="error && !loading" class="alert alert-danger">
    <strong>Error:</strong> {{ error }}
  </div>

  <div *ngIf="!loading && !error && info">

    <!-- Current Plan Card -->
    <div class="row" style="margin-bottom: 24px;">
      <div class="col-md-6">
        <div class="panel panel-default">
          <div class="panel-heading"><strong>Current Plan</strong></div>
          <div class="panel-body">
            <table class="table table-condensed" style="margin-bottom:0">
              <tbody>
                <tr>
                  <td class="text-muted">Plan</td>
                  <td><span class="label label-primary" style="font-size:13px;text-transform:capitalize;">{{ info.current_plan }}</span></td>
                </tr>
                <tr>
                  <td class="text-muted">Users</td>
                  <td>
                    <strong>{{ info.seats_used }}</strong> / {{ info.seat_limit > 0 ? info.seat_limit : 'Unlimited' }}
                    <span *ngIf="info.seat_limit > 0 && info.seats_available === 0" class="label label-danger" style="margin-left:8px;">Full</span>
                    <span *ngIf="info.seat_limit > 0 && info.seats_available > 0" class="label label-success" style="margin-left:8px;">{{ info.seats_available }} available</span>
                  </td>
                </tr>
                <tr>
                  <td class="text-muted">Meters</td>
                  <td><strong>{{ info.meter_limit }}</strong></td>
                </tr>
                <tr *ngIf="info.expires_at">
                  <td class="text-muted">Renews</td>
                  <td>{{ info.expires_at | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Seat limit warning -->
      <div class="col-md-6" *ngIf="info.seat_limit > 0 && info.seats_available === 0">
        <div class="alert alert-warning" style="margin-top:0;">
          <span class="fa fa-exclamation-triangle"></span>
          <strong> Seat limit reached.</strong><br/>
          You've used all {{ info.seat_limit }} seats. Upgrade your plan to add more users.
        </div>
      </div>
    </div>

    <!-- Upgrade Plans -->
    <div *ngIf="info.upgrade_plans && info.upgrade_plans.length > 0">
      <h4>Available Upgrades</h4>
      <div class="row">
        <div class="col-md-4" *ngFor="let plan of info.upgrade_plans" style="margin-bottom:20px;">
          <div class="panel panel-default" [class.panel-primary]="selectedPlan === plan.plan"
               style="cursor:pointer;transition:box-shadow 0.2s;"
               (click)="selectPlan(plan)">
            <div class="panel-heading" style="text-transform:capitalize;">
              <strong>{{ plan.plan }}</strong>
              <span *ngIf="selectedPlan === plan.plan" class="pull-right fa fa-check-circle"></span>
            </div>
            <div class="panel-body">
              <p class="text-muted" style="min-height:40px;">{{ plan.description }}</p>
              <table class="table table-condensed" style="margin-bottom:0;">
                <tr>
                  <td class="text-muted">Base price</td>
                  <td><strong>\${{ plan.base_price }}/yr</strong></td>
                </tr>
                <tr>
                  <td class="text-muted">Per meter</td>
                  <td><strong>\${{ plan.per_meter }}/yr</strong></td>
                </tr>
                <tr>
                  <td class="text-muted">Max users</td>
                  <td><strong>{{ plan.max_users != null ? plan.max_users : 'Unlimited' }}</strong></td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Meter count input + upgrade button -->
      <div *ngIf="selectedPlan" class="well" style="max-width:480px;">
        <h5>Upgrade to <strong style="text-transform:capitalize;">{{ selectedPlan }}</strong></h5>
        <div class="form-group">
          <label>Number of meters</label>
          <input type="number" class="form-control" [(ngModel)]="meterCount" min="1" style="max-width:180px;" />
          <p class="help-block">Enter the number of meters for your subscription.</p>
        </div>
        <div *ngIf="upgradeError" class="alert alert-danger" style="padding:8px 12px;">{{ upgradeError }}</div>
        <button class="btn btn-primary" (click)="startUpgrade()" [disabled]="upgrading || meterCount < 1">
          <span *ngIf="upgrading" class="fa fa-spinner fa-spin"></span>
          <span *ngIf="!upgrading" class="fa fa-arrow-circle-up"></span>
          {{ upgrading ? 'Creating order...' : 'Proceed to Payment' }}
        </button>
        <button class="btn btn-default" (click)="selectedPlan = null" style="margin-left:8px;">Cancel</button>
      </div>
    </div>

    <div *ngIf="!info.upgrade_plans || info.upgrade_plans.length === 0">
      <div class="alert alert-info">
        <span class="fa fa-info-circle"></span>
        You are on the <strong style="text-transform:capitalize;">{{ info.current_plan }}</strong> plan — the highest available tier. 
        Contact support to discuss custom options.
      </div>
    </div>

  </div>

  <div *ngIf="!loading && !error && !info">
    <div class="alert alert-info">
      <span class="fa fa-info-circle"></span>
      No active subscription found. Please contact your administrator.
    </div>
  </div>
</div>
  `
})
export class ManageSubscriptionComponent implements OnInit {
  loading = true;
  error: string = null;
  info: SubscriptionInfo = null;
  selectedPlan: string = null;
  meterCount: number = 1;
  upgrading = false;
  upgradeError: string = null;

  constructor(private http: HttpClient, private userService: CurrentUserService) {}

  ngOnInit() {
    this.loadSubscription();
  }

  loadSubscription() {
    this.loading = true;
    this.error = null;
    const base = (window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].apiBasePath) || '';
    this.http.get(`${base}/api/subscription`).subscribe(
      (data: any) => {
        this.loading = false;
        if (data && data.active) {
          this.info = data as SubscriptionInfo;
          // Pre-fill meter count from current subscription
          if (this.info.meter_limit > 0) {
            this.meterCount = this.info.meter_limit;
          }
        } else {
          this.info = null;
        }
      },
      (err) => {
        this.loading = false;
        this.error = (err.error && err.error.error) || 'Failed to load subscription info.';
      }
    );
  }

  selectPlan(plan: UpgradePlan) {
    this.selectedPlan = plan.plan;
    this.upgradeError = null;
  }

  startUpgrade() {
    if (!this.selectedPlan || this.meterCount < 1) return;
    this.upgrading = true;
    this.upgradeError = null;
    const base = (window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].apiBasePath) || '';
    const returnUrl = window.location.origin + (base || '') + '/#/subscription';
    this.http.post(`${base}/api/subscription/upgrade`, {
      new_plan: this.selectedPlan,
      meter_count: this.meterCount,
      return_url: returnUrl,
    }).subscribe(
      (result: any) => {
        this.upgrading = false;
        if (result && result.payment_url) {
          // Redirect to license service payment page
          window.location.href = result.payment_url;
        } else {
          this.upgradeError = 'Unexpected response from server.';
        }
      },
      (err) => {
        this.upgrading = false;
        this.upgradeError = (err.error && err.error.error) || 'Failed to create upgrade order.';
      }
    );
  }
}
