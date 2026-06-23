import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

interface DeviceRow {
  id: string;
  name: string;
  deviceTypeName: string;
  location: string;
  status: string;
  healthScore: number;
  lastSeenMs: number;
  firmware: string;
  sourceType: string;
}

@Component({
  selector: 'ecbs-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
})
export class DevicesComponent implements OnInit {
  projectId: number;
  projectName = '';
  loading = true;

  allDevices: DeviceRow[] = [];
  searchQuery = '';
  currentPage = 1;
  readonly pageSize = 10;

  private readonly circumference = 2 * Math.PI * 42;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user && this.userService.user.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.projectName = p.name ? p.name.toString() : '';
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.allDevices = [];
    const collected: DeviceRow[] = [];
    let pending = 3;

    const done = () => {
      pending--;
      if (pending === 0) {
        this.allDevices = collected.slice().sort((a, b) => a.name.localeCompare(b.name));
        this.loading = false;
      }
    };

    // PQ Meters — use /data endpoint which returns all columns including lastCommunicatedAt
    this.api.get('/api/meter/data?project=' + this.projectId + '&pageSize=500').subscribe({
      next: (r: any) => {
        const raw: any[] = (r && r.response) ? r.response : (Array.isArray(r) ? r : []);
        const items: any[] = raw.filter((m: any) => m.isDeleted === 0 || m.isDeleted === false);
        const now = Date.now();
        items.forEach((m: any) => {
          const lastMs = m.lastCommunicatedAt || m.meshLastCommunicatedAt || 0;
          const status = this._meterStatus(m, now);
          collected.push({
            id: 'meter-' + m.id,
            name: m.name || ('Meter #' + m.id),
            deviceTypeName: 'Power Quality Meter',
            location: m.location || this._meterLocation(m),
            status: status,
            healthScore: this._healthScore(status),
            lastSeenMs: lastMs,
            firmware: m.firmwareVersion || '—',
            sourceType: 'meter',
          });
        });
        done();
      },
      error: () => done(),
    });

    // Gateways
    this.api.get('/api/gateway?project=' + this.projectId + '&pageSize=500').subscribe({
      next: (r: any) => {
        const raw: any[] = (r && r.response) ? r.response : (Array.isArray(r) ? r : []);
        const items: any[] = raw.filter((g: any) => g.isDeleted === 0 || g.isDeleted === false);
        const now = Date.now();
        items.forEach((g: any) => {
          const lastMs = g.lastCommunicatedAt || 0;
          const status = this._commStatus(lastMs, now);
          collected.push({
            id: 'gw-' + g.id,
            name: g.name || ('Gateway #' + g.id),
            deviceTypeName: 'Gateway',
            location: '—',
            status: status,
            healthScore: this._healthScore(status),
            lastSeenMs: lastMs,
            firmware: g.softwareVersion || '—',
            sourceType: 'gateway',
          });
        });
        done();
      },
      error: () => done(),
    });

    // Switches / APF units — correct endpoint, replaces broken /api/devices/apf
    this.api.get('/api/switch?project=' + this.projectId + '&pageSize=500').subscribe({
      next: (r: any) => {
        const raw: any[] = (r && r.response) ? r.response : (Array.isArray(r) ? r : []);
        const items: any[] = raw.filter((s: any) => s.isDeleted === 0 || s.isDeleted === false);
        const now = Date.now();
        items.forEach((s: any) => {
          const lastMs = s.meshLastCommunicatedAt || s.lastCommunicatedAt || 0;
          const swStatus = this._commStatus(lastMs, now);
          const typeName = s.deviceType === 0 ? 'APF Unit' : 'Switch';
          collected.push({
            id: 'sw-' + s.id,
            name: s.name || ('Switch #' + s.id),
            deviceTypeName: typeName,
            location: '—',
            status: swStatus,
            healthScore: this._healthScore(swStatus),
            lastSeenMs: lastMs,
            firmware: '—',
            sourceType: 'switch',
          });
        });
        done();
      },
      error: () => done(),
    });
  }

  private _meterStatus(m: any, now: number): string {
    if (m.isReporting === false) return 'Offline';
    const lastMs = m.lastCommunicatedAt || m.meshLastCommunicatedAt || 0;
    return this._commStatus(lastMs, now);
  }

  private _commStatus(lastMs: number, now: number): string {
    if (!lastMs) return 'Offline';
    const diffMin = (now - lastMs) / 60000;
    if (diffMin < 10) return 'Online';
    if (diffMin < 120) return 'Warning';
    return 'Offline';
  }

  private _healthScore(status: string): number {
    if (status === 'Online') return 92;
    if (status === 'Warning') return 72;
    return 0;
  }

  private _meterLocation(m: any): string {
    if (m.isMain) return 'Main';
    if (m.isSub) return 'Sub-panel';
    if (m.meshIp) return 'Network Node';
    return '—';
  }

  // ── KPIs ────────────────────────────────────────────────────────────────────

  get totalDevices(): number { return this.allDevices.length; }

  get onlineCount(): number {
    let n = 0;
    for (let i = 0; i < this.allDevices.length; i++) {
      if (this.allDevices[i].status === 'Online') n++;
    }
    return n;
  }

  get warningCount(): number {
    let n = 0;
    for (let i = 0; i < this.allDevices.length; i++) {
      if (this.allDevices[i].status === 'Warning') n++;
    }
    return n;
  }

  get offlineCount(): number {
    let n = 0;
    for (let i = 0; i < this.allDevices.length; i++) {
      if (this.allDevices[i].status === 'Offline') n++;
    }
    return n;
  }

  get onlinePct(): number {
    return this.totalDevices > 0 ? Math.round(this.onlineCount / this.totalDevices * 100) : 0;
  }

  get warningPct(): number {
    return this.totalDevices > 0 ? Math.round(this.warningCount / this.totalDevices * 100) : 0;
  }

  get offlinePct(): number {
    return this.totalDevices > 0 ? Math.round(this.offlineCount / this.totalDevices * 100) : 0;
  }

  get avgHealthScore(): number {
    const active = this.allDevices.filter(function(d) { return d.status !== 'Offline'; });
    if (!active.length) return 0;
    let sum = 0;
    for (let i = 0; i < active.length; i++) sum += active[i].healthScore;
    return Math.round(sum / active.length);
  }

  get firmwareUpToDate(): number {
    let n = 0;
    for (let i = 0; i < this.allDevices.length; i++) {
      if (this.allDevices[i].firmware && this.allDevices[i].firmware !== '—') n++;
    }
    return n;
  }

  get firmwareUpToDatePct(): number {
    return this.totalDevices > 0 ? Math.round(this.firmwareUpToDate / this.totalDevices * 100) : 0;
  }

  // ── Filter + Pagination ──────────────────────────────────────────────────────

  get filteredDevices(): DeviceRow[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.allDevices;
    const result: DeviceRow[] = [];
    for (let i = 0; i < this.allDevices.length; i++) {
      const d = this.allDevices[i];
      if (
        d.name.toLowerCase().indexOf(q) !== -1 ||
        d.deviceTypeName.toLowerCase().indexOf(q) !== -1 ||
        d.location.toLowerCase().indexOf(q) !== -1 ||
        d.status.toLowerCase().indexOf(q) !== -1
      ) {
        result.push(d);
      }
    }
    return result;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDevices.length / this.pageSize));
  }

  get pagedDevices(): DeviceRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDevices.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (cur > 3) pages.push(-1);
      for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
      if (cur < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  }

  get pagedStart(): number {
    return this.filteredDevices.length > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get pagedEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredDevices.length);
  }

  setPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
  }

  onSearch(e: any) {
    this.searchQuery = e.target ? e.target.value : e;
    this.currentPage = 1;
  }

  // ── Chart data ───────────────────────────────────────────────────────────────

  get typeGroups(): Array<{ label: string; color: string; count: number; pct: number }> {
    const colorMap: {[key: string]: string} = {
      'Power Quality Meter': '#29b6f6',
      'Gateway':             '#ce93d8',
      'APF Unit':            '#ffd740',
      'Switch':              '#4db6ac',
      'Repeater':            '#ff7043',
    };
    const counts: {[key: string]: number} = {};
    for (let i = 0; i < this.allDevices.length; i++) {
      const t = this.allDevices[i].deviceTypeName;
      counts[t] = (counts[t] || 0) + 1;
    }
    const total = this.allDevices.length;
    const groups: Array<{ label: string; color: string; count: number; pct: number }> = [];
    const keys = Object.keys(counts);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      groups.push({
        label: k,
        color: colorMap[k] || '#8899a6',
        count: counts[k],
        pct: total > 0 ? Math.round(counts[k] / total * 100) : 0,
      });
    }
    groups.sort(function(a, b) { return b.count - a.count; });
    return groups;
  }

  get typeDonutSegments(): Array<{ color: string; offset: number; dash: number; total: number }> {
    const circ = this.circumference;
    const total = this.allDevices.length;
    const groups = this.typeGroups;
    let offset = 0;
    const segs: Array<{ color: string; offset: number; dash: number; total: number }> = [];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const dash = total > 0 ? (g.count / total) * circ : 0;
      if (dash > 0) {
        segs.push({ color: g.color, offset: circ - offset, dash: dash, total: circ });
        offset += dash;
      }
    }
    return segs;
  }

  get healthBuckets(): Array<{ label: string; color: string; count: number; pct: number }> {
    const buckets = [
      { label: 'Excellent (90-100)', color: '#00e676', min: 90, max: 100, count: 0 },
      { label: 'Good (70-89)',        color: '#29b6f6', min: 70, max:  89, count: 0 },
      { label: 'Fair (50-69)',        color: '#ffd740', min: 50, max:  69, count: 0 },
      { label: 'Poor (<50)',          color: '#ff5252', min:  0, max:  49, count: 0 },
    ];
    for (let i = 0; i < this.allDevices.length; i++) {
      const score = this.allDevices[i].healthScore;
      for (let j = 0; j < buckets.length; j++) {
        if (score >= buckets[j].min && score <= buckets[j].max) {
          buckets[j].count++;
          break;
        }
      }
    }
    const total = this.allDevices.length;
    return buckets.map(function(b) {
      return { label: b.label, color: b.color, count: b.count, pct: total > 0 ? Math.round(b.count / total * 100) : 0 };
    });
  }

  get healthDonutSegments(): Array<{ color: string; offset: number; dash: number; total: number }> {
    const circ = this.circumference;
    const total = this.allDevices.length;
    const buckets = this.healthBuckets;
    let offset = 0;
    const segs: Array<{ color: string; offset: number; dash: number; total: number }> = [];
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      const dash = total > 0 ? (b.count / total) * circ : 0;
      if (dash > 0) {
        segs.push({ color: b.color, offset: circ - offset, dash: dash, total: circ });
        offset += dash;
      }
    }
    return segs;
  }

  get recentAlerts(): Array<{ name: string; location: string; message: string; severity: string; timeAgo: string; iconClass: string; color: string }> {
    const alerts: Array<{ name: string; location: string; message: string; severity: string; timeAgo: string; iconClass: string; color: string }> = [];
    for (let i = 0; i < this.allDevices.length; i++) {
      const d = this.allDevices[i];
      if (d.status === 'Offline' || d.status === 'Warning') {
        alerts.push({
          name: d.name,
          location: d.location,
          message: d.status === 'Offline' ? 'Device offline' : 'Device warning — check connection',
          severity: d.status,
          timeAgo: this.timeAgo(d.lastSeenMs),
          iconClass: d.status === 'Offline' ? 'fa-times-circle' : 'fa-exclamation-triangle',
          color: d.status === 'Offline' ? '#ff5252' : '#ffd740',
        });
        if (alerts.length >= 5) break;
      }
    }
    return alerts;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  statusClass(s: string): string {
    const st = (s || '').toLowerCase();
    if (st === 'online')  return 'badge-healthy';
    if (st === 'offline') return 'badge-critical';
    if (st === 'warning') return 'badge-warning';
    return 'badge-offline';
  }

  healthColor(score: number): string {
    if (score >= 90) return '#00e676';
    if (score >= 70) return '#29b6f6';
    if (score >= 50) return '#ffd740';
    return '#ff5252';
  }

  healthLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  }

  timeAgo(ms: number): string {
    if (!ms) return '—';
    const diff = Date.now() - ms;
    const min = Math.floor(diff / 60000);
    if (min < 1)  return 'Just now';
    if (min < 60) return min + ' min ago';
    const hr = Math.floor(min / 60);
    if (hr < 24)  return hr + ' hr ago';
    return Math.floor(hr / 24) + ' days ago';
  }
}
