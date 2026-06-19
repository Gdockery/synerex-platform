import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-capacity',
  templateUrl: './capacity.component.html',
  styleUrls: ['./capacity.component.scss'],
})
export class CapacityComponent implements OnInit {
  projectId: number;
  loading = true;
  summary: any = null;
  assets: any[] = [];
  trendsData: any[] = [];
  savingsData: any = null;
  calculating = false;
  error: string = null;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.api.get(`/api/capacity/summary?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.summary = r; this.loading = false; },
      error: (e: any) => { this.error = e?.error?.error || 'Failed to load.'; this.loading = false; }
    });
    this.api.get(`/api/capacity/assets?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.assets = r?.assets || r || []; },
      error: () => {}
    });
    this.api.get(`/api/capacity/trends?project_id=${this.projectId}&limit=500`).subscribe({
      next: (r: any) => { this.trendsData = r?.data || []; },
      error: () => {}
    });
    this.api.get(`/api/savings/intelligence?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.savingsData = r?.latest || r; },
      error: () => {}
    });
  }

  calculate() {
    this.calculating = true;
    this.api.post('/api/capacity/calculate', { project_id: this.projectId }).subscribe({
      next: () => { this.calculating = false; this.loadAll(); },
      error: () => { this.calculating = false; }
    });
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  get installed(): number { return this.summary?.installed_capacity_kva || 0; }
  get load(): number      { return this.summary?.current_load_kva || 0; }
  get available(): number { return this.summary?.available_capacity_kva || 0; }
  get recovered(): number { return this.summary?.recovered_capacity_kva || 0; }
  get hidden(): number    { return this.summary?.hidden_capacity_kva || 0; }
  get deferred(): number  { return this.summary?.deferred_capital_value || 0; }
  get healthScore(): number { return this.summary?.capacity_health_score || 0; }
  get utilizationPct(): number { return this.summary?.utilization_pct || 0; }
  get recoveredPct(): number {
    return this.installed > 0 ? Math.round((this.recovered / this.installed) * 100) : 0;
  }
  get nowAvailable(): number { return this.available + this.recovered; }
  get annualBenefit(): number {
    return this.savingsData?.annual_savings_est ?? this.savingsData?.annual_savings ?? 0;
  }
  get co2Tons(): number { return Math.round(this.recovered * 0.092); }

  // Proportional slices of recovered kVA — these sum to recovered
  get motorKva(): number   { return Math.round(this.recovered * 0.35); }
  get serverKva(): number  { return Math.round(this.recovered * 0.25); }
  get evKva(): number      { return Math.round(this.recovered * 0.20); }
  get hvacKva(): number    { return Math.round(this.recovered * 0.12); }
  get otherKva(): number   { return Math.max(0, this.recovered - this.motorKva - this.serverKva - this.evKva - this.hvacKva); }

  // Unit counts from each slice
  get equivMotors(): number  { return Math.max(1, Math.floor(this.motorKva / 37.3)); }
  get equivServers(): number { return Math.max(1, Math.floor(this.serverKva / 10)); }
  get equivEV(): number      { return Math.max(1, Math.floor(this.evKva / 7.2)); }

  // Health subscores derived from summary
  get loadBalanceScore(): number {
    const u = this.utilizationPct;
    return u > 0 && u < 90 ? Math.min(100, Math.round(100 - Math.abs(u - 70))) : 60;
  }
  get utilizationScore(): number {
    const u = this.utilizationPct;
    if (u < 50) return 75; if (u > 90) return 50;
    return Math.round(100 - Math.abs(u - 70) * 0.8);
  }
  get voltageScore(): number  { return Math.min(100, Math.round((this.summary?.avg_power_factor || 0.9) * 105)); }
  get harmonicScore(): number { return this.healthScore > 0 ? Math.min(100, this.healthScore + 4) : 0; }
  get thermalScore(): number  { return this.installed > 0 ? Math.min(100, Math.round((1 - this.load / this.installed) * 100 + 50)) : 0; }
  get healthRating(): string  { return this.healthScore >= 85 ? 'Excellent' : this.healthScore >= 70 ? 'Good' : this.healthScore >= 50 ? 'Fair' : 'Needs Attention'; }
  get healthColor(): string   { return this.healthScore >= 80 ? '#00e676' : this.healthScore >= 60 ? '#ffd740' : '#f44336'; }

  // Key insight text
  get keyInsight(): string {
    if (!this.summary) return '—';
    return `You have ${Math.round(this.nowAvailable)} kVA of available capacity, enough to support additional equipment or growth.`;
  }
  get avoidedUpgrade(): string {
    const next = Math.ceil(this.installed / 500) * 500;
    return `You can defer a ${next.toLocaleString()} kVA transformer upgrade and associated switchgear.`;
  }

  // ── Trend chart helpers ─────────────────────────────────────────────────────
  get trendDays(): { label: string; used: number; available: number; installed: number }[] {
    if (!this.trendsData.length) {
      // Generate flat line from current values if no history
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return days.map(d => ({ label: d, used: this.load, available: this.available, installed: this.installed }));
    }
    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return this.trendsData.slice(-14).map(r => ({
      label: dayLabels[new Date(r.bucket_ts).getDay()],
      used: r.used_capacity || 0,
      available: r.available_capacity || 0,
      installed: r.installed_capacity || this.installed
    }));
  }

  trendPolyline(key: 'used' | 'available' | 'installed', w: number, h: number): string {
    const pts = this.trendDays;
    if (!pts.length) return '';
    const maxV = Math.max(...pts.map(p => p.installed), 1);
    return pts.map((p, i) => {
      const x = (i / (pts.length - 1 || 1)) * w;
      const y = h - (p[key] / maxV) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  // Asset sparkline (7-day stub using utilization)
  assetSparkline(asset: any): string {
    const base = asset.utilization_pct || 50;
    const pts = [base - 5, base - 2, base + 3, base - 1, base + 2, base - 3, base].map((v, i) => {
      const x = i * 10;
      const y = 20 - Math.min(20, Math.max(0, v / 5));
      return `${x},${y.toFixed(1)}`;
    });
    return pts.join(' ');
  }

  // SVG gauge helpers
  gaugeCirc = 2 * Math.PI * 36;
  gaugeDash(score: number): string {
    const pct = Math.min(100, Math.max(0, score)) / 100;
    return `${(pct * this.gaugeCirc).toFixed(1)} ${this.gaugeCirc.toFixed(1)}`;
  }

  barColor(pct: number): string {
    if (pct >= 85) return '#f44336';
    if (pct >= 70) return '#ffd740';
    return '#00e676';
  }

  healthClass(pct: number): string {
    if (pct >= 85) return 'badge-critical';
    if (pct >= 70) return 'badge-warning';
    return 'badge-healthy';
  }
}
