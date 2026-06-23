import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-materials',
  templateUrl: './deployment-materials.component.html',
  styleUrls: ['./deployment-materials.component.scss'],
})
export class DeploymentMaterialsComponent implements OnInit {
  depId: number = 0;
  materials: any[] = [];
  loading = true;
  showAdd = false;
  newMat: any = { item_type: 'APF Unit', item_label: '', expected_qty: 1 };
  saving = false;

  readonly ITEM_TYPES = ['APF Unit', 'Gateway', 'Meter', 'CT (100A)', 'CT (200A)', 'CT (400A)', 'CT (600A)', 'Conduit Kit', 'Wire Harness', 'Mounting Hardware', 'Load Controller', 'Line Filter'];

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiRequestService) {}

  ngOnInit() {
    this.route.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId + '/materials').subscribe({
      next: (r: any) => {
        this.materials = (r && r.response) ? r.response : [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  addMaterial() {
    if (!this.newMat.item_label) return;
    this.saving = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/materials', {
      item_type: this.newMat.item_type,
      item_label: this.newMat.item_label,
      expected_qty: Number(this.newMat.expected_qty) || 1,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showAdd = false;
        this.newMat = { item_type: 'APF Unit', item_label: '', expected_qty: 1 };
        this.load();
      },
      error: () => { this.saving = false; },
    });
  }

  updateQty(mat: any, field: string, val: number) {
    var update: any = {};
    update[field] = val;
    var delivered = field === 'delivered_qty' ? val : mat.delivered_qty;
    var expected = mat.expected_qty;
    update['status'] = delivered >= expected ? 'Delivered' : delivered > 0 ? 'Partial' : 'Pending';
    this.api.patch('/api/dep/materials/' + mat.id, update).subscribe({
      next: () => this.load(),
    });
  }

  get totalDelivered(): number { var n = 0; for (var i = 0; i < this.materials.length; i++) n += (this.materials[i].delivered_qty || 0); return n; }
  get totalExpected(): number { var n = 0; for (var i = 0; i < this.materials.length; i++) n += (this.materials[i].expected_qty || 0); return n; }

  statusClass(s: string): string {
    if (s === 'Delivered') return 'sts-ok';
    if (s === 'Partial') return 'sts-warn';
    if (s === 'Installed') return 'sts-installed';
    return 'sts-pending';
  }

  goBack() { this.router.navigate(['/ecbs/deployment', this.depId]); }
}
