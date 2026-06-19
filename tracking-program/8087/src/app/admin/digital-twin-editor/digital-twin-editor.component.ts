import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'admin-digital-twin-editor',
  templateUrl: './digital-twin-editor.component.html',
  styleUrls: ['./digital-twin-editor.component.scss'],
})
export class DigitalTwinEditorComponent implements OnInit {
  projectId: number = 0;
  projectName = '';
  twinNodes: any[] = [];
  loading = true;
  activeTool = 'select';
  selectedNode: any = null;
  activeTab = 'one-line view';

  readonly tools = [
    { id: 'select',     label: 'Select',     icon: 'fa-mouse-pointer' },
    { id: 'pan',        label: 'Pan',         icon: 'fa-hand-paper-o' },
    { id: 'add-node',   label: 'Add Node',    icon: 'fa-plus-circle' },
    { id: 'add-bus',    label: 'Add Bus',     icon: 'fa-minus' },
    { id: 'add-feeder', label: 'Add Feeder',  icon: 'fa-bolt' },
    { id: 'add-panel',  label: 'Add Panel',   icon: 'fa-th-large' },
    { id: 'add-load',   label: 'Add Load',    icon: 'fa-cog' },
    { id: 'add-device', label: 'Add Device',  icon: 'fa-microchip' },
    { id: 'add-meter',  label: 'Add Meter',   icon: 'fa-tachometer' },
  ];

  readonly tabs = ['One-Line View', 'Network Hierarchy', 'Assets', 'Loads', 'ECBS Devices', 'Meters', 'Calculations'];

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user ? (this.userService.user as any).selectedProject : null;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.projectName = p.name ? String(p.name) : '';

    this.api.get(`/api/capacity/assets?project_id=${this.projectId}`).subscribe(
      (r: any) => {
        this.twinNodes = r && r.data ? r.data : (r && r.assets ? r.assets : []);
        this.loading = false;
        if (this.twinNodes.length > 0) { this.selectedNode = this.twinNodes[0]; }
      },
      () => { this.loading = false; }
    );
  }

  get transformer(): any {
    return this.twinNodes.find(n => (n.asset_type || '').toLowerCase().includes('transform')) || null;
  }

  get modelSummary() {
    return {
      total: this.twinNodes.length,
      measured: this.twinNodes.filter(n => n.used_kva > 0).length,
      verified: this.twinNodes.filter(n => n.rated_kva > 0 || n.kva_rating > 0).length,
    };
  }

  selectTool(id: string) { this.activeTool = id; }
  selectNode(n: any) { this.selectedNode = n; }

  nodeColor(n: any): string {
    const t = (n.asset_type || n.type || '').toLowerCase();
    if (t.includes('utility')) { return '#29b6f6'; }
    if (t.includes('transform')) { return '#00e676'; }
    if (t.includes('panel') || t.includes('switchgear')) { return '#ffd740'; }
    if (t.includes('mcc')) { return '#ce93d8'; }
    return '#546e7a';
  }

  isValid(): boolean { return this.twinNodes.length > 0; }
}
