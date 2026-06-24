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
  search = '';
  filterCategory = '';
  activeFolder = 'all';

  readonly CATEGORIES = ['Drawing', 'Manual', 'Report', 'Permit', 'Safety', 'As-Built', 'Commissioning', 'Other'];
  readonly FOLDERS = [
    { key: 'all', label: 'All Documents', icon: 'fa-folder-open' },
    { key: 'deployment', label: 'Deployment Package', icon: 'fa-briefcase' },
    { key: 'field', label: 'Field Documents', icon: 'fa-clipboard' },
    { key: 'manufacturer', label: 'Manufacturer Docs', icon: 'fa-book' },
    { key: 'reports', label: 'Reports', icon: 'fa-bar-chart' },
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
        this.documents = Array.isArray(r && r.response ? r.response : r) ? (r.response || r) : [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }

  get filtered(): any[] {
    return this.documents.filter(d => {
      if (this.filterCategory && d.category !== this.filterCategory) return false;
      if (this.activeFolder !== 'all' && d.folder !== this.activeFolder) return false;
      if (this.search) {
        const q = this.search.toLowerCase();
        if (!(d.document_name || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  get drawingCount(): number { return this.documents.filter(d => d.category === 'Drawing').length; }
  get manualCount(): number  { return this.documents.filter(d => d.category === 'Manual').length; }
  get reportCount(): number  { return this.documents.filter(d => d.category === 'Report').length; }

  select(doc: any) { this.selected = doc; }

  categoryClass(cat: string): string {
    if (!cat) return 'dim';
    const c = cat.toLowerCase();
    if (c === 'drawing')   return 'blue';
    if (c === 'manual')    return 'green';
    if (c === 'report')    return 'purple';
    if (c === 'safety')    return 'red';
    if (c === 'permit')    return 'amber';
    if (c === 'as-built')  return 'teal';
    return 'dim';
  }

  docIcon(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c === 'drawing' || c === 'as-built') return 'fa-file-image-o';
    if (c === 'manual')   return 'fa-book';
    if (c === 'report')   return 'fa-bar-chart';
    if (c === 'safety')   return 'fa-shield';
    if (c === 'permit')   return 'fa-certificate';
    return 'fa-file-text-o';
  }

  openDoc(doc: any) {
    if (doc.file_url) window.open(doc.file_url, '_blank');
  }
}
