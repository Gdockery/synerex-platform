import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-closeout',
  templateUrl: './deployment-closeout.component.html',
  styleUrls: ['./deployment-closeout.component.scss'],
})
export class DeploymentCloseoutComponent implements OnInit {
  depId: number = 0;
  dep: any = null;
  requirements: any[] = [];
  loading = true;
  validating = false;
  validation: any = null;
  approving = false;
  approved = false;

  // PM Sign-off
  showPmSignoff = false;
  pmSignature = '';
  pmNotes = '';
  pmSigning = false;
  pmEligibleUsers: any[] = [];
  showAssignPm = false;
  selectedPmId: number = 0;
  assigningPm = false;

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiRequestService) {}

  ngOnInit() {
    this.route.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
      this.loadDep();
      this.loadPmUsers();
    });
  }

  loadDep() {
    this.api.get('/api/dep/deployments/' + this.depId).subscribe({
      next: (r: any) => { this.dep = (r && r.response) ? r.response : null; },
    });
  }

  loadPmUsers() {
    this.api.get('/api/dep/users/pm-eligible').subscribe({
      next: (r: any) => { this.pmEligibleUsers = (r && r.response) ? r.response : []; },
      error: () => {},
    });
  }

  get pmSigned(): boolean { return !!(this.dep && this.dep.pm_signed_at); }
  get pmSignedBy(): string {
    if (!this.dep || !this.dep.pm_signed_at) return '';
    return 'Signed ' + new Date(Number(this.dep.pm_signed_at)).toLocaleString();
  }

  submitPmSignoff() {
    if (!this.pmSignature.trim()) return;
    this.pmSigning = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/pm-signoff', {
      signature: this.pmSignature.trim(),
      notes: this.pmNotes.trim(),
    }).subscribe({
      next: (r: any) => {
        this.pmSigning = false;
        this.showPmSignoff = false;
        this.dep = (r && r.response) ? r.response : this.dep;
        this.pmSignature = '';
        this.pmNotes = '';
      },
      error: () => { this.pmSigning = false; },
    });
  }

  assignPm() {
    if (!this.selectedPmId) return;
    this.assigningPm = true;
    this.api.patch('/api/dep/deployments/' + this.depId + '/assign-pm', {
      project_manager_id: this.selectedPmId,
    }).subscribe({
      next: (r: any) => {
        this.assigningPm = false;
        this.showAssignPm = false;
        this.dep = (r && r.response) ? r.response : this.dep;
      },
      error: () => { this.assigningPm = false; },
    });
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId + '/closeout').subscribe({
      next: (r: any) => {
        this.requirements = (r && r.response) ? r.response : [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get complete(): number { var n = 0; for (var i = 0; i < this.requirements.length; i++) { if (this.requirements[i].status === 'Complete') n++; } return n; }
  get total(): number { return this.requirements.length; }
  get progressPct(): number { return this.total > 0 ? Math.round(this.complete / this.total * 100) : 0; }

  toggleRequirement(req: any) {
    var newStatus = req.status === 'Complete' ? 'Pending' : 'Complete';
    this.api.patch('/api/dep/closeout/' + req.id, { status: newStatus }).subscribe({
      next: () => this.load(),
    });
  }

  validate() {
    this.validating = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/closeout/validate', {}).subscribe({
      next: (r: any) => {
        this.validation = r;
        this.validating = false;
      },
      error: () => { this.validating = false; },
    });
  }

  approve() {
    if (!confirm('Release this deployment to operations? This action cannot be undone.')) return;
    this.approving = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/closeout/approve', {}).subscribe({
      next: () => {
        this.approving = false;
        this.approved = true;
        this.validation = null;
      },
      error: (e: any) => {
        this.approving = false;
        var body = (e && e.error) ? e.error : {};
        this.validation = { can_close: false, blockers: body.blockers || [], message: body.error || 'Approval failed' };
      },
    });
  }

  catClass(cat: string): string {
    if (cat === 'Safety') return 'cat-safety';
    if (cat === 'Technical') return 'cat-tech';
    if (cat === 'Documentation') return 'cat-doc';
    return 'cat-other';
  }

  goBack() { this.router.navigate(['/ecbs/deployment', this.depId]); }
}
