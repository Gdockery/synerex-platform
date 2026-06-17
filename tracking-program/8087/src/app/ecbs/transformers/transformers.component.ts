import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-transformers',
  templateUrl: './transformers.component.html',
  styleUrls: ['./transformers.component.scss'],
})
export class TransformersComponent implements OnInit {
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
    this.api.get('/api/capacity/assets?project_id=' + this.projectId).subscribe({
      next: (r: any) => { this.data = r; this.loading = false; },
      error: (e) => { this.error = e?.error?.error || 'Failed to load data.'; this.loading = false; }
    });
  }
}
