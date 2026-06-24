import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-photos',
  templateUrl: './deployment-photos.component.html',
  styleUrls: ['./deployment-photos.component.scss'],
})
export class DeploymentPhotosComponent implements OnInit {
  depId: number = 0;
  photos: any[] = [];
  loading = true;
  uploading = false;
  filterType = '';
  filterDevice = '';
  filterStatus = '';
  search = '';
  lightbox: any = null;
  dep: any = null;
  summary: any = {};
  syncedAt = '';

  readonly PHOTO_TYPES = [
    'Before Installation', 'After Installation', 'Nameplate',
    'CT Installation', 'Wiring', 'Breaker', 'Panel Interior',
    'Transformer', 'Issue', 'Commissioning'
  ];

  // Mock photo albums
  albums = [
    { name: 'Installation Photos', count: 56, date: 'May 17, 2025' },
    { name: 'Device Close-Ups', count: 28, date: 'May 16, 2025' },
    { name: 'Panel Photos', count: 18, date: 'May 16, 2025' },
    { name: 'CT Installations', count: 12, date: 'May 16, 2025' },
    { name: 'Commissioning', count: 10, date: 'May 14, 2025' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
  ) {}

  ngOnInit() {
    this.route.parent!.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId).subscribe({
      next: (r: any) => {
        this.dep = r && r.response ? r.response : r;
        this.summary = this.dep.summary || {};
        this.syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      },
      error: () => {}
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/photos').subscribe({
      next: (r: any) => {
        this.photos = (r && r.response) ? r.response : [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }

  get filtered(): any[] {
    return this.photos.filter(p => {
      if (this.filterType && p.photo_type !== this.filterType) return false;
      if (this.filterDevice && p.device_name !== this.filterDevice) return false;
      if (this.filterStatus && p.status !== this.filterStatus) return false;
      if (this.search) {
        const q = this.search.toLowerCase();
        const name = (p.description || p.device_name || '').toLowerCase();
        if (name.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  get totalPhotos(): number { return this.photos.length; }
  get verifiedPhotos(): number { return this.photos.filter(p => p.status === 'Verified' || p.verified).length; }
  get pendingReview(): number { return this.photos.filter(p => p.status === 'Pending' || !p.status).length; }
  get missingPhotos(): number { return (this.summary && this.summary.missing_photos) || 0; }
  get lastUploaded(): string {
    if (!this.photos.length) return '—';
    const last = this.photos[0];
    return last.uploaded_at ? new Date(last.uploaded_at).toLocaleString() : '—';
  }

  statusBadge(status: string): string {
    const s = (status || 'Pending').toUpperCase();
    return s;
  }
  statusClass(status: string): string {
    if (!status) return 'pending';
    const sl = status.toLowerCase();
    if (sl === 'verified') return 'verified';
    if (sl === 'missing info' || sl === 'missing_info') return 'missing';
    return 'pending';
  }

  openLightbox(photo: any) { this.lightbox = photo; }
  closeLightbox() { this.lightbox = null; }

  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || !files.length) return;
    this._uploadFiles(files);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer && event.dataTransfer.files;
    if (!files || !files.length) return;
    this._uploadFiles(files);
  }
  onDragOver(event: DragEvent) { event.preventDefault(); }

  private _uploadFiles(files: FileList) {
    this.uploading = true;
    let done = 0;
    const total = files.length;
    for (let i = 0; i < total; i++) {
      const file = files.item(i);
      if (!file) { done++; if (done === total) { this.uploading = false; this.load(); } continue; }
      const form = new FormData();
      form.append('file', file);
      form.append('deployment_id', String(this.depId));
      form.append('photo_type', 'Installation');
      form.append('description', file.name);
      this.api.post('/api/dep/photos/upload', form).subscribe({
        next: () => { done++; if (done === total) { this.uploading = false; this.load(); } },
        error: () => { done++; if (done === total) { this.uploading = false; } },
      });
    }
  }

  goIssues() { this.router.navigate(['/ecbs/deployment', this.depId, 'issues']); }
}
