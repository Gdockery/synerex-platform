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
  requirements: any[] = [];
  loading = true;
  validating = false;
  validation: any = null;
  approving = false;
  approved = false;

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiRequestService) {}

  ngOnInit() {
    this.route.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
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
