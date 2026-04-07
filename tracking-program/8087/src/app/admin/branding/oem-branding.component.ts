import {Component, OnInit} from '@angular/core';
import {Injector} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CurrentUserService} from '../../shared/user/currentUser.service';
import {WhitelabelService} from '../../shared/services/whitelabel.service';

@Component({
  template: `
    <div class="container-fluid">
      <h3 style="text-align:center; margin-bottom: 1.5em;">{{brandName}} Branding Settings</h3>
      <p class="text-muted">Customize how your clients see your portal. Your logo and brand name will appear throughout the client-facing portal instead of any platform defaults.</p>
      <hr/>

      <!-- Success/Error messages -->
      <div *ngIf="successMsg" class="alert alert-success">{{successMsg}}</div>
      <div *ngIf="errorMsg" class="alert alert-danger">{{errorMsg}}</div>

      <!-- Logo Upload -->
      <h4>Your Logos</h4>
      <p class="text-muted">
        Upload two versions of your logo. The <strong>Color Logo</strong> appears in the navigation bar and login page.
        The <strong>White Logo</strong> is used on dark backgrounds such as PDF cover pages.
        Recommended: PNG, at least 200px wide.
      </p>
      <div class="row" style="margin-bottom: 2em;">

        <!-- Color Logo -->
        <div class="col-md-5" style="border-right: 1px solid #e0e0e0; padding-right: 2em;">
          <h5 style="font-weight:bold;"><span class="glyphicon glyphicon-picture"></span> Color Logo</h5>
          <p class="text-muted" style="font-size:0.9em;">Shown in the navbar and login page. Use your full-color version with a transparent background.</p>

          <div style="margin-bottom: 1em; padding: 1em; background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; min-height: 80px; display:flex; align-items:center; justify-content:center;">
            <img *ngIf="logoUrl" [src]="logoUrl + '?t=' + cacheBust" alt="Color Logo" style="max-height: 60px; max-width: 220px;" (error)="logoUrl = null"/>
            <span *ngIf="!logoUrl" class="text-muted" style="font-size:0.85em;"><em>No color logo uploaded yet</em></span>
          </div>

          <div>
            <label class="btn btn-default btn-sm" style="cursor:pointer;">
              <span class="glyphicon glyphicon-upload"></span> Choose File
              <input type="file" style="display:none;" accept="image/png,image/jpeg,image/svg+xml,image/gif"
                     (change)="onLogoSelected($event)"/>
            </label>
            <span *ngIf="selectedFile" style="margin-left:0.75em; font-size:0.9em;">{{selectedFile.name}}</span>
          </div>
          <div *ngIf="selectedFile" style="margin-top:0.8em;">
            <button class="btn btn-primary btn-sm" (click)="uploadLogo()" [disabled]="uploading">
              <span *ngIf="uploading"><span class="glyphicon glyphicon-refresh"></span> Uploading...</span>
              <span *ngIf="!uploading"><span class="glyphicon glyphicon-cloud-upload"></span> Upload Color Logo</span>
            </button>
            <button class="btn btn-default btn-sm" style="margin-left:0.5em;" (click)="selectedFile = null">Cancel</button>
          </div>
        </div>

        <!-- White Logo -->
        <div class="col-md-5 col-md-offset-1">
          <h5 style="font-weight:bold;"><span class="glyphicon glyphicon-adjust"></span> White Logo</h5>
          <p class="text-muted" style="font-size:0.9em;">Used on dark backgrounds such as PDF report covers. Use an all-white version of your logo with a transparent background.</p>

          <div style="margin-bottom: 1em; padding: 1em; background: #1a1a2e; border-radius: 6px; min-height: 80px; display:flex; align-items:center; justify-content:center;">
            <img *ngIf="whiteLogoUrl" [src]="whiteLogoUrl + '?t=' + cacheBust" alt="White Logo" style="max-height: 60px; max-width: 220px;" (error)="whiteLogoUrl = null"/>
            <span *ngIf="!whiteLogoUrl" style="color: rgba(255,255,255,0.4); font-size:0.85em;"><em>No white logo uploaded yet</em></span>
          </div>

          <div>
            <label class="btn btn-default btn-sm" style="cursor:pointer;">
              <span class="glyphicon glyphicon-upload"></span> Choose File
              <input type="file" style="display:none;" accept="image/png,image/jpeg,image/svg+xml,image/gif"
                     (change)="onWhiteLogoSelected($event)"/>
            </label>
            <span *ngIf="selectedWhiteFile" style="margin-left:0.75em; font-size:0.9em;">{{selectedWhiteFile.name}}</span>
          </div>
          <div *ngIf="selectedWhiteFile" style="margin-top:0.8em;">
            <button class="btn btn-primary btn-sm" (click)="uploadWhiteLogo()" [disabled]="uploadingWhite">
              <span *ngIf="uploadingWhite"><span class="glyphicon glyphicon-refresh"></span> Uploading...</span>
              <span *ngIf="!uploadingWhite"><span class="glyphicon glyphicon-cloud-upload"></span> Upload White Logo</span>
            </button>
            <button class="btn btn-default btn-sm" style="margin-left:0.5em;" (click)="selectedWhiteFile = null">Cancel</button>
          </div>
        </div>

      </div>

      <hr/>

      <!-- Branding Fields -->
      <h4>Brand Details</h4>
      <p class="text-muted">These details replace platform defaults throughout the portal for your clients.</p>

      <div class="row">
        <div class="col-md-4">
          <div class="form-group">
            <label>Brand / Company Name <span class="text-danger">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="form.brand_name"
                   placeholder="e.g. Acme Energy Solutions"/>
            <p class="help-block">Shown in page titles, nav, and emails.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-group">
            <label>Portal Title</label>
            <input type="text" class="form-control" [(ngModel)]="form.portal_title"
                   placeholder="e.g. Acme Energy Portal"/>
            <p class="help-block">Browser tab title your clients see.</p>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-4">
          <div class="form-group">
            <label>Support Email</label>
            <input type="email" class="form-control" [(ngModel)]="form.support_email"
                   placeholder="support@yourcompany.com"/>
            <p class="help-block">Shown on error pages and emails to clients.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-group">
            <label>Company Website</label>
            <input type="text" class="form-control" [(ngModel)]="form.website_url"
                   placeholder="https://www.yourcompany.com"/>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-3">
          <div class="form-group">
            <label>Primary Color</label>
            <div style="display:flex; align-items:center; gap:0.5em;">
              <input type="color" class="form-control" [(ngModel)]="form.primary_color"
                     style="width:60px; height:38px; padding:2px; cursor:pointer;"/>
              <input type="text" class="form-control" [(ngModel)]="form.primary_color"
                     placeholder="#1a73e8" style="flex:1;"/>
            </div>
            <p class="help-block">Used for buttons and highlights.</p>
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <label>Secondary Color</label>
            <div style="display:flex; align-items:center; gap:0.5em;">
              <input type="color" class="form-control" [(ngModel)]="form.secondary_color"
                     style="width:60px; height:38px; padding:2px; cursor:pointer;"/>
              <input type="text" class="form-control" [(ngModel)]="form.secondary_color"
                     placeholder="#34a853" style="flex:1;"/>
            </div>
          </div>
        </div>
      </div>

      <div class="row" style="margin-top: 1em;">
        <div class="col-md-12 text-right">
          <button class="btn btn-primary btn-lg" (click)="saveSettings()" [disabled]="saving">
            <span *ngIf="saving"><span class="glyphicon glyphicon-refresh"></span> Saving...</span>
            <span *ngIf="!saving"><span class="glyphicon glyphicon-floppy-disk"></span> Save Branding Settings</span>
          </button>
        </div>
      </div>

      <hr/>

      <!-- Email delivery note -->
      <div class="alert alert-info" style="margin-top: 1em;">
        <span class="glyphicon glyphicon-envelope" style="margin-right: 0.5em;"></span>
        <strong>Email Delivery:</strong>
        Invite and password-reset emails are sent automatically using your
        <strong>{{form.brand_name || brandName}}</strong> branding and logo — your clients will only see your brand
        in any email they receive.
      </div>

      <hr/>

      <!-- Preview box -->
      <div *ngIf="form.brand_name || logoUrl || whiteLogoUrl">
        <h4>Preview</h4>
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5em; background: #f9f9f9;">
          <!-- Navbar preview (color logo on dark) -->
          <p class="text-muted" style="font-size:0.8em; margin-bottom:0.4em;">Navigation bar (dark background):</p>
          <div style="background: #1a1a2e; padding: 0.75em 1.5em; border-radius: 6px; display: flex; align-items: center; gap: 1em; margin-bottom: 1em;">
            <img *ngIf="logoUrl" [src]="logoUrl + '?t=' + cacheBust" style="height:40px; max-width:160px;" alt="logo"/>
            <span *ngIf="!logoUrl" style="color:white; font-size:1.2em; font-weight:bold;">{{form.brand_name || 'Your Brand'}}</span>
            <span style="color:rgba(255,255,255,0.6); font-size:0.9em;">— Navigation Bar</span>
          </div>
          <!-- PDF cover preview (white logo on dark) -->
          <p class="text-muted" style="font-size:0.8em; margin-bottom:0.4em;">PDF cover page (dark image + color overlay):</p>
          <div style="background: #2a3a5c; padding: 0.75em 1.5em; border-radius: 6px; display: flex; align-items: center; gap: 1em; margin-bottom: 1em;">
            <img *ngIf="whiteLogoUrl" [src]="whiteLogoUrl + '?t=' + cacheBust" style="height:40px; max-width:160px;" alt="white logo"/>
            <span *ngIf="!whiteLogoUrl" style="color:rgba(255,255,255,0.5); font-size:1em;">No white logo uploaded yet</span>
          </div>
          <p class="text-muted" style="font-size:0.9em;">
            Clients logging in will see "<strong>{{form.brand_name || 'Your Brand'}}</strong>" throughout the portal.
            <span *ngIf="form.support_email"> Support contact: <strong>{{form.support_email}}</strong>.</span>
          </p>
        </div>
      </div>
    </div>
  `
})
export class OemBrandingComponent implements OnInit {

  public brandName: string = 'Your Brand';
  public logoUrl: string | null = null;
  public whiteLogoUrl: string | null = null;
  public selectedFile: File | null = null;
  public selectedWhiteFile: File | null = null;
  public uploading = false;
  public uploadingWhite = false;
  public saving = false;
  public successMsg: string | null = null;
  public errorMsg: string | null = null;
  public cacheBust: number = Date.now();
  public testingEmail = false;
  public testEmailMsg: string | null = null;
  public testEmailSuccess = false;
  public currentUserEmail: string = '';

  public form: any = {
    brand_name: '',
    portal_title: '',
    support_email: '',
    website_url: '',
    primary_color: '#1a73e8',
    secondary_color: '#34a853',
    smtp_server: '',
    smtp_port: 587,
    smtp_use_tls: true,
    smtp_username: '',
    smtp_password: '',
    smtp_from_address: '',
    smtp_from_name: '',
  };

  constructor(
    private http: HttpClient,
    private currentUserService: CurrentUserService,
    private whitelabelService: WhitelabelService,
  ) {}

  ngOnInit() {
    this.whitelabelService.getBrandName().subscribe(name => {
      this.brandName = name || 'Your Brand';
    });
    this.currentUserEmail = this.currentUserService.user && this.currentUserService.user.email
      ? String(this.currentUserService.user.email)
      : 'your email';
    this.loadSettings();
  }

  loadSettings() {
    this.http.get<any>('/api/whitelabel/oem-branding').subscribe(
      res => {
        const b = res && res.response;
        if (b) {
          this.form.brand_name = b.brand_name || '';
          this.form.portal_title = b.portal_title || '';
          this.form.support_email = b.support_email || '';
          this.form.website_url = b.website_url || '';
          this.form.primary_color = b.primary_color || '#1a73e8';
          this.form.secondary_color = b.secondary_color || '#34a853';
          this.form.smtp_server = b.smtp_server || '';
          this.form.smtp_port = b.smtp_port || 587;
          this.form.smtp_use_tls = b.smtp_use_tls !== false;
          this.form.smtp_username = b.smtp_username || '';
          this.form.smtp_from_address = b.smtp_from_address || '';
          this.form.smtp_from_name = b.smtp_from_name || '';
          // Never pre-fill the password field — leave blank so existing password is preserved
          this.form.smtp_password = '';
          if (b.logo_url) {
            this.logoUrl = b.logo_url;
          }
          if (b.white_logo_url) {
            this.whiteLogoUrl = b.white_logo_url;
          }
        }
      },
      err => { /* not yet saved - ignore */ }
    );
  }

  onLogoSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) { this.selectedFile = file; }
  }

  onWhiteLogoSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) { this.selectedWhiteFile = file; }
  }

  uploadLogo() {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.successMsg = null;
    this.errorMsg = null;
    const formData = new FormData();
    formData.append('logo', this.selectedFile);
    formData.append('logo_type', 'color');
    this.http.post<any>('/api/whitelabel/oem-logo', formData).subscribe(
      res => {
        this.uploading = false;
        this.selectedFile = null;
        this.cacheBust = Date.now();
        const logoPath = (res && (res.logo_url || res.response)) || null;
        if (logoPath) { this.logoUrl = logoPath; }
        this.successMsg = 'Color logo uploaded successfully!';
        setTimeout(() => this.successMsg = null, 5000);
      },
      err => {
        this.uploading = false;
        this.errorMsg = (err.error && err.error.error) || 'Logo upload failed. Please try again.';
      }
    );
  }

  uploadWhiteLogo() {
    if (!this.selectedWhiteFile) return;
    this.uploadingWhite = true;
    this.successMsg = null;
    this.errorMsg = null;
    const formData = new FormData();
    formData.append('logo', this.selectedWhiteFile);
    formData.append('logo_type', 'white');
    this.http.post<any>('/api/whitelabel/oem-logo', formData).subscribe(
      res => {
        this.uploadingWhite = false;
        this.selectedWhiteFile = null;
        this.cacheBust = Date.now();
        const logoPath = (res && (res.logo_url || res.response)) || null;
        if (logoPath) { this.whiteLogoUrl = logoPath; }
        this.successMsg = 'White logo uploaded successfully! It will appear on PDF cover pages.';
        setTimeout(() => this.successMsg = null, 5000);
      },
      err => {
        this.uploadingWhite = false;
        this.errorMsg = (err.error && err.error.error) || 'White logo upload failed. Please try again.';
      }
    );
  }

  saveSettings() {
    if (!this.form.brand_name) {
      this.errorMsg = 'Brand name is required.';
      return;
    }
    this.saving = true;
    this.successMsg = null;
    this.errorMsg = null;

    // Build payload — only send smtp_password if the user typed something
    const payload: any = { ...this.form };
    if (!payload.smtp_password) {
      delete payload.smtp_password;
    }

    this.http.post<any>('/api/whitelabel/oem-branding', payload).subscribe(
      res => {
        this.saving = false;
        this.brandName = this.form.brand_name;
        this.form.smtp_password = ''; // Clear after save — don't store in memory
        this.successMsg = 'Settings saved! Your clients will see your brand and emails will come from your address.';
        setTimeout(() => this.successMsg = null, 6000);
      },
      err => {
        this.saving = false;
        this.errorMsg = (err.error && err.error.error) || 'Save failed. Please try again.';
      }
    );
  }

  testEmail() {
    this.testingEmail = true;
    this.testEmailMsg = null;
    this.http.post<any>('/api/whitelabel/oem-branding-test-email', {}).subscribe(
      res => {
        this.testingEmail = false;
        this.testEmailSuccess = true;
        this.testEmailMsg = `Test email sent to ${this.currentUserEmail}. Check your inbox!`;
        setTimeout(() => this.testEmailMsg = null, 8000);
      },
      err => {
        this.testingEmail = false;
        this.testEmailSuccess = false;
        this.testEmailMsg = (err.error && err.error.error) || 'Test email failed. Check your SMTP settings.';
      }
    );
  }
}
