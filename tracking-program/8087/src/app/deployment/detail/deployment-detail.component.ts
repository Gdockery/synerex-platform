import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeploymentService } from '../deployment.service';

/**
 * Phase 4 — Deployment detail with photo capture.
 *
 * Photo capture uses:
 *  • <input type="file" accept="image/*" capture="environment"> on mobile
 *    (opens native camera app on iOS/Android)
 *  • Regular file chooser on desktop
 */
@Component({
  selector: 'app-deployment-detail',
  template: `
    <div class="container-fluid" *ngIf="deployment">
      <h3>
        <a [routerLink]="['/deployment']" class="back-btn">
          <span class="fa fa-arrow-left"></span>
        </a>
        Deployment #{{ deployment.id }}
        <span class="label" [ngClass]="{
          'label-default': deployment.status === 'draft',
          'label-info':    deployment.status === 'scheduled',
          'label-primary': deployment.status === 'in_progress',
          'label-success': deployment.status === 'activated',
          'label-warning': deployment.status === 'on_hold'
        }" style="font-size:0.65em; vertical-align:middle;">{{ deployment.status }}</span>
      </h3>
      <hr/>

      <!-- Summary -->
      <div class="row">
        <div class="col-md-6">
          <dl class="dl-horizontal">
            <dt>Project</dt><dd>{{ deployment.project_id }}</dd>
            <dt>Site</dt><dd>{{ deployment.site_id || '—' }}</dd>
            <dt>Scheduled</dt><dd>{{ deployment.scheduled_date || '—' }}</dd>
            <dt>Installer</dt><dd>{{ deployment.assigned_installer_id || '—' }}</dd>
          </dl>
        </div>
      </div>
      <hr/>

      <!-- ── Photo capture section ── -->
      <h4><span class="fa fa-camera"></span> Site Photos</h4>
      <p class="text-muted">
        Capture photos from the field — panel conditions, meter placement,
        CT installation, nameplate data, etc.
      </p>

      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="photoLabel">Photo label / description</label>
            <input type="text" id="photoLabel" class="form-control"
                   [(ngModel)]="photoLabel"
                   placeholder="e.g. Panel A — CT installation">
          </div>
        </div>
      </div>

      <div class="row" style="margin-bottom:12px;">
        <div class="col-xs-12">
          <!--
            capture="environment" opens the REAR camera on iOS/Android.
            On desktop it opens a file picker. Works in all modern browsers.
          -->
          <label class="btn btn-success" style="cursor:pointer;">
            <span class="fa fa-camera"></span>&nbsp;
            {{ isMobile ? 'Take Photo' : 'Choose Photo' }}
            <input #photoInput type="file"
                   accept="image/*"
                   capture="environment"
                   style="display:none;"
                   (change)="onFileSelected($event)">
          </label>
          &nbsp;
          <button class="btn btn-primary"
                  [disabled]="!selectedFile || uploading"
                  (click)="uploadPhoto()">
            <span [class]="uploading ? 'fa fa-spinner fa-spin' : 'fa fa-upload'"></span>
            {{ uploading ? 'Uploading…' : 'Upload' }}
          </button>
        </div>
      </div>

      <!-- Preview before upload -->
      <div *ngIf="previewUrl" class="row" style="margin-bottom:16px;">
        <div class="col-md-6">
          <div class="panel panel-default">
            <div class="panel-heading">
              Preview — {{ selectedFile?.name }}
              <button class="btn btn-xs btn-default pull-right" (click)="clearSelection()">Clear</button>
            </div>
            <div class="panel-body text-center">
              <img [src]="previewUrl" style="max-width:100%;max-height:300px;border-radius:4px;"/>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="uploadSuccess" class="alert alert-success">
        <span class="fa fa-check"></span> Photo uploaded successfully.
      </div>
      <div *ngIf="uploadError" class="alert alert-danger">
        <span class="fa fa-times"></span> {{ uploadError }}
      </div>

      <!-- Existing photos gallery -->
      <div *ngIf="photos.length > 0">
        <h5>Uploaded Photos ({{ photos.length }})</h5>
        <div class="row">
          <div *ngFor="let p of photos" class="col-md-3 col-sm-4 col-xs-6" style="margin-bottom:12px;">
            <div class="thumbnail">
              <a [href]="p.url" target="_blank">
                <img [src]="p.url" style="width:100%;height:140px;object-fit:cover;"
                     onerror="this.src='/assets/img/photo-placeholder.png'">
              </a>
              <div class="caption">
                <small class="text-muted">{{ p.label || 'No label' }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="photos.length === 0 && !loadingPhotos" class="text-muted">
        <em>No photos uploaded yet.</em>
      </div>
    </div>

    <div *ngIf="loading" class="text-center" style="padding:40px;">
      <span class="fa fa-spinner fa-spin fa-2x text-primary"></span>
    </div>
  `
})
export class DeploymentDetailComponent implements OnInit {

  @ViewChild('photoInput', { static: false }) photoInput: ElementRef<HTMLInputElement>;

  deployment: any = null;
  photos: any[] = [];
  loading = false;
  loadingPhotos = false;

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  photoLabel = '';
  uploading = false;
  uploadSuccess = false;
  uploadError: string | null = null;

  get isMobile(): boolean {
    return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  }

  constructor(
    private route: ActivatedRoute,
    private svc: DeploymentService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.svc.get(id).subscribe(
      (res: any) => {
        this.loading = false;
        this.deployment = res.data || res;
        this.photos = (this.deployment.field_entry_data?.photos || []);
      },
      () => { this.loading = false; }
    );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    this.selectedFile = input.files[0];
    this.uploadSuccess = false;
    this.uploadError = null;

    const reader = new FileReader();
    reader.onload = (e: any) => { this.previewUrl = e.target.result; };
    reader.readAsDataURL(this.selectedFile);
  }

  clearSelection() {
    this.selectedFile = null;
    this.previewUrl = null;
    if (this.photoInput) this.photoInput.nativeElement.value = '';
  }

  uploadPhoto() {
    if (!this.selectedFile || !this.deployment) return;
    this.uploading = true;
    this.uploadSuccess = false;
    this.uploadError = null;

    this.svc.uploadPhoto(this.deployment.id, this.selectedFile, this.photoLabel).subscribe(
      (res: any) => {
        this.uploading = false;
        this.uploadSuccess = true;
        const photo = res.data;
        if (photo) this.photos = [...this.photos, photo];
        this.clearSelection();
        this.photoLabel = '';
      },
      (err: any) => {
        this.uploading = false;
        this.uploadError = err?.error?.error || 'Upload failed. Please try again.';
      }
    );
  }
}
