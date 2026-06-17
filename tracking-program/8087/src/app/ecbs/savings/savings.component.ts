import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-savings',
  templateUrl: './savings.component.html',
  styleUrls: ['./savings.component.scss'],
})
export class SavingsComponent implements OnInit {
  projectId: number;
  loading = true;
  intelligence: any = null;
  roi: any = null;
  payback: any = null;
  waterfall: any = null;
  utilityData: any = null;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
  }

  loadAll() {
    const pid = this.projectId;
    this.api.get(`/api/savings/intelligence?project_id=${pid}`).subscribe({ next: (r: any) => { this.intelligence = r?.latest || r; this.loading = false; }, error: () => { this.loading = false; }});
    this.api.get(`/api/roi?project_id=${pid}`).subscribe({ next: (r: any) => { this.roi = r; }, error: () => {}});
    this.api.get(`/api/payback?project_id=${pid}`).subscribe({ next: (r: any) => { this.payback = r; }, error: () => {}});
    this.api.get(`/api/utility/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.utilityData = r; }, error: () => {}});
  }
}
