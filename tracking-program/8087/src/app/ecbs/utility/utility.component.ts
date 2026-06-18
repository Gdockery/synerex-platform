import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-utility',
  templateUrl: './utility.component.html',
  styleUrls: ['./utility.component.scss'],
})
export class UtilityComponent implements OnInit {
  projectId: number;
  loading = true;
  bills: any[] = [];
  summary: any = null;
  forecast: any = null;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.api.get(`/api/utility/summary?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.summary = r; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/utility/bills?project_id=${this.projectId}&limit=12`).subscribe({
      next: (r: any) => { this.bills = r?.bills || r || []; }, error: () => {}
    });
    this.api.get(`/api/utility/forecast?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.forecast = r; }, error: () => {}
    });
  }
}
