import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-sites',
  templateUrl: './sites.component.html',
  styleUrls: ['./sites.component.scss'],
})
export class SitesComponent implements OnInit {
  projectId: number;
  loading = true;
  data: any = null;
  error: string = null;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.error = 'No project selected.'; this.loading = false; return; }
    this.projectId = p.id;
    this.loadData();
  }

  loadData() {
    if (!this.projectId) { this.loading = false; return; }
    this.api.get('/api/current-balance/summary?project_id=' + this.projectId).subscribe({
      next: (r: any) => { this.data = r; this.loading = false; },
      error: (e) => { this.error = e?.error?.error || 'Failed to load data.'; this.loading = false; }
    });
  }
}
