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

  albums: any[] = [];

  // quick action states
  showCreateAlbum = false;
  newAlbumName = '';
  showPhotoNote = false;
  photoNoteText = '';
  savingNote = false;
  showPhotoChecklist = false;
  exportingZip = false;
  exportMsg = '';
  showRequestPhoto = false;
  requestPhotoDevice = '';
  requestPhotoType = '';
  requestPhotoNote = '';

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
    this.api.get('/api/dep/deployments/' + this.depId + '/photo-albums').subscribe({
      next: (r: any) => { this.albums = (r && r.response ? r.response : []); },
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

  openLastPhoto() {
    if (!this.photos || !this.photos.length) return;
    // Sort by upload date descending and open the newest
    const sorted = this.photos.slice().sort((a: any, b: any) => {
      const da = new Date(a.created_at || a.uploaded_at || 0).getTime();
      const db = new Date(b.created_at || b.uploaded_at || 0).getTime();
      return db - da;
    });
    this.openLightbox(sorted[0]);
  }

  showFilters = false;
  toggleFilters() { this.showFilters = !this.showFilters; }

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

  // ── KPI filter helpers ────────────────────────────────────────────────────
  filterKpi(type: string) {
    if (type === 'all')     { this.filterStatus = ''; this.filterType = ''; }
    if (type === 'verified')  { this.filterStatus = 'Verified'; }
    if (type === 'pending')   { this.filterStatus = 'Pending'; }
    if (type === 'missing')   { this.filterStatus = 'Missing'; }
    if (type === 'albums')    { /* scroll to albums section */ }
  }

  // ── Quick actions ─────────────────────────────────────────────────────────
  openCreateAlbum() { this.showCreateAlbum = true; this.newAlbumName = ''; }
  saveAlbum() {
    if (!this.newAlbumName) return;
    this.api.post('/api/dep/deployments/' + this.depId + '/photo-albums', { name: this.newAlbumName }).subscribe({
      next: () => { this.showCreateAlbum = false; this.load(); },
      error: () => {}
    });
  }

  openPhotoNote() { this.showPhotoNote = true; this.photoNoteText = ''; }
  savePhotoNote() {
    if (!this.photoNoteText || !this.lightbox) return;
    this.savingNote = true;
    this.api.post('/api/dep/photos/' + this.lightbox.id + '/note', { note: this.photoNoteText }).subscribe({
      next: () => { this.savingNote = false; this.showPhotoNote = false; this.load(); },
      error: () => { this.savingNote = false; }
    });
  }

  openRequestPhoto() { this.showRequestPhoto = true; }
  submitPhotoRequest() {
    this.api.post('/api/dep/deployments/' + this.depId + '/photo-request', {
      device: this.requestPhotoDevice,
      photo_type: this.requestPhotoType,
      note: this.requestPhotoNote
    }).subscribe({
      next: () => { this.showRequestPhoto = false; },
      error: () => {}
    });
  }

  togglePhotoChecklist() { this.showPhotoChecklist = !this.showPhotoChecklist; }

  exportZip() {
    this.exportingZip = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/photos/export', {}).subscribe({
      next: (r: any) => {
        this.exportingZip = false;
        const resp = r && r.response ? r.response : r;
        if (resp && resp.download_url) window.open(resp.download_url, '_blank');
        else { this.exportMsg = 'Export queued — check Documents for ZIP.'; setTimeout(() => this.exportMsg = '', 4000); }
      },
      error: () => { this.exportingZip = false; }
    });
  }

  viewAlbum(album: any) {
    this.filterType = album.name || '';
  }

  // ── Lightbox actions ──────────────────────────────────────────────────────
  openDeviceFromLightbox() {
    if (!this.lightbox) return;
    const devId = this.lightbox.device_id;
    this.router.navigate(['/ecbs/deployment', this.depId, 'devices'], devId ? { queryParams: { select: devId } } : {});
    this.closeLightbox();
  }

  openIssueFromLightbox() {
    if (!this.lightbox || !this.lightbox.issue_id) return;
    this.router.navigate(['/ecbs/deployment', this.depId, 'issues']);
    this.closeLightbox();
  }
}
