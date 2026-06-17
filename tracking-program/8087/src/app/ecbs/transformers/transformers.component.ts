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
  assets: any[] = [];
  selected: any = null;
  selectedDetail: any = null;
  detailLoading = false;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAssets();
  }

  loadAssets() {
    this.api.get(`/api/capacity/assets?project_id=${this.projectId}`).subscribe({
      next: (r: any) => {
        this.assets = r?.assets || r || [];
        this.loading = false;
        if (this.assets.length > 0) { this.selectAsset(this.assets[0]); }
      },
      error: () => { this.loading = false; }
    });
  }

  selectAsset(asset: any) {
    this.selected = asset;
    this.selectedDetail = null;
    if (asset?.id) {
      this.detailLoading = true;
      this.api.get(`/api/capacity/transformer/${asset.id}`).subscribe({
        next: (r: any) => { this.selectedDetail = r; this.detailLoading = false; },
        error: () => { this.detailLoading = false; }
      });
    }
  }

  healthClass(pct: number): string {
    if (pct >= 90) return 'badge-critical';
    if (pct >= 75) return 'badge-warning';
    return 'badge-healthy';
  }

  barColor(pct: number): string {
    if (pct >= 90) return '#f44336';
    if (pct >= 75) return '#ffd740';
    return '#00e676';
  }
}
