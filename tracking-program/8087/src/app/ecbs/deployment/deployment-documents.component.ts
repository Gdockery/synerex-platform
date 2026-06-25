import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-documents',
  templateUrl: './deployment-documents.component.html',
  styleUrls: ['./deployment-documents.component.scss'],
})
export class DeploymentDocumentsComponent implements OnInit {
  depId = 0;
  dep: any = null;
  documents: any[] = [];
  selected: any = null;
  loading = true;
  syncedAt = '';

  // filters
  search = '';
  filterCategory = '';
  filterDevice = '';
  filterStatus = '';
  activeFolder = 'all';
  activeTab = 'details'; // details | preview | related | history
  page = 1;
  pageSize = 10;

  readonly CATEGORIES = ['Drawing', 'Manual', 'Report', 'Permit', 'Safety', 'As-Built', 'Commissioning', 'Other'];
  readonly FIELD_CRITICAL_TAGS = ['One-Line Drawing', 'CT Guide', 'APF Installation', 'Shutdown Approval', 'Site Access'];

  readonly FOLDERS = [
    { key: 'all',          label: 'All Documents',         icon: 'fa-folder-open',    countKey: 'all' },
    { key: 'deployment',   label: 'Deployment Package',    icon: 'fa-briefcase',      countKey: 'deployment' },
    { key: 'field',        label: 'Field Documents',       icon: 'fa-clipboard',      countKey: 'field' },
    { key: 'manufacturer', label: 'Manufacturer Documents',icon: 'fa-book',           countKey: 'manufacturer' },
    { key: 'reports',      label: 'Reports',               icon: 'fa-bar-chart',      countKey: 'reports' },
    { key: 'other',        label: 'Other',                 icon: 'fa-folder-o',       countKey: 'other' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
  ) {}

  ngOnInit() {
    this.route.parent!.params.subscribe(p => {
      this.depId = +p['id'];
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId).subscribe({
      next: (r: any) => {
        this.dep = r && r.response ? r.response : r;
        this.syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }, error: () => {}
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/documents').subscribe({
      next: (r: any) => {
        const raw = r && r.response ? r.response : r;
        this.documents = Array.isArray(raw) ? raw : [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Header data ──────────────────────────────────────────────────────────
  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }
  get voltage(): string { return (this.dep && this.dep.site_info && this.dep.site_info.service_voltage) || '—'; }
  get transformer(): string { return (this.dep && this.dep.site_info && this.dep.site_info.transformer) || '—'; }

  // ── KPI getters ──────────────────────────────────────────────────────────
  get totalDocs(): number { return this.documents.length; }
  get drawingCount(): number { return this.documents.filter(d => d.category === 'Drawing' || d.category === 'As-Built').length; }
  get manualCount(): number  { return this.documents.filter(d => d.category === 'Manual').length; }
  get reportCount(): number  { return this.documents.filter(d => d.category === 'Report').length; }
  get otherCount(): number   { return this.documents.filter(d => ['Drawing','As-Built','Manual','Report'].indexOf(d.category) < 0).length; }
  get favoritesCount(): number { return this.documents.filter(d => d.is_favorite).length; }

  // ── Folder counts ────────────────────────────────────────────────────────
  folderCount(key: string): number {
    if (key === 'all') return this.documents.length;
    return this.documents.filter(d => (d.folder || 'other') === key).length;
  }

  // ── Filtered list ────────────────────────────────────────────────────────
  get filtered(): any[] {
    return this.documents.filter(d => {
      if (this.activeFolder !== 'all' && (d.folder || 'other') !== this.activeFolder) return false;
      if (this.filterCategory && d.category !== this.filterCategory) return false;
      if (this.filterStatus && d.status !== this.filterStatus) return false;
      if (this.search) {
        const q = this.search.toLowerCase();
        if ((d.document_name || d.name || '').toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  get paged(): any[] {
    const s = (this.page - 1) * this.pageSize;
    return this.filtered.slice(s, s + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(this.totalPages, 5); i++) pages.push(i);
    return pages;
  }

  // ── Styling helpers ──────────────────────────────────────────────────────
  catClass(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c === 'drawing' || c === 'as-built') return 'dc-cat--blue';
    if (c === 'manual')        return 'dc-cat--green';
    if (c === 'report')        return 'dc-cat--purple';
    if (c === 'safety')        return 'dc-cat--red';
    if (c === 'permit')        return 'dc-cat--amber';
    if (c === 'commissioning') return 'dc-cat--teal';
    return 'dc-cat--dim';
  }

  docIcon(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c === 'drawing' || c === 'as-built') return 'fa-file-image-o';
    if (c === 'manual')   return 'fa-book';
    if (c === 'report')   return 'fa-bar-chart';
    if (c === 'safety')   return 'fa-shield';
    if (c === 'permit')   return 'fa-certificate';
    return 'fa-file-pdf-o';
  }

  statusBadgeClass(s: string): string {
    const sl = (s || '').toLowerCase();
    if (sl === 'approved' || sl === 'current') return 'dc-st--green';
    if (sl === 'pending')  return 'dc-st--amber';
    if (sl === 'rejected') return 'dc-st--red';
    return 'dc-st--dim';
  }

  select(doc: any) { this.selected = doc; this.activeTab = 'details'; }

  filterByTag(tag: string) {
    this.search = tag;
    this.activeFolder = 'all';
  }

  openDoc(doc: any) { if (doc && doc.file_url) window.open(doc.file_url, '_blank'); }

  fileSizeStr(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
