import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  projectId: number;
  siteName = '';
  loading = true;

  alarmSummary: any  = null;
  capacityData: any  = null;
  savingsData: any   = null;
  cbiData: any       = null;
  trendsData: any[]  = [];
  devicesData: any   = null;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.siteName = p.name ? p.name.toString() : '';
    this.loadData();
  }

  ngAfterViewInit() { this._initLeafletMap(); }

  private _leafletMap: any = null;
  private _initLeafletMap() {
    const init = () => {
      const L = (window as any).L;
      if (!L) return;
      const el = document.getElementById('site-leaflet-map');
      if (!el || this._leafletMap) return;
      this._leafletMap = L.map(el, { zoomControl: false, attributionControl: false, scrollWheelZoom: false }).setView([30.22, -92.02], 4);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(this._leafletMap);
      const icon = L.divIcon({ className: '', html: '<div style="width:14px;height:14px;border-radius:50%;background:#00e676;border:2px solid #fff;box-shadow:0 0 10px #00e676;"></div>', iconSize: [14, 14], iconAnchor: [7, 7] });
      L.marker([30.22, -92.02], { icon }).addTo(this._leafletMap).bindPopup('<b>' + (this.siteName || 'Lafayette, LA') + '</b>');
    };
    if ((window as any).L) { init(); return; }
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
    const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = init; document.head.appendChild(s);
  }

  loadData() {
    this.loading = true;
    const pid = this.projectId;

    this.api.get(`/api/alarms/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.alarmSummary = r; }, error: () => {}});
    this.api.get(`/api/capacity/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.capacityData = r; this.loading = false; }, error: () => { this.loading = false; }});
    this.api.get(`/api/savings/intelligence?project_id=${pid}`).subscribe({ next: (r: any) => { this.savingsData = r?.latest || r; }, error: () => {}});
    this.api.get(`/api/current-balance/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.cbiData = r; }, error: () => {}});
    this.api.get(`/api/savings/trends?project_id=${pid}&limit=500`).subscribe({ next: (r: any) => { this.trendsData = r?.data || []; }, error: () => {}});
    this.api.get(`/api/devices/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.devicesData = r; }, error: () => {}});
  }

  // ── Annual Savings ──────────────────────────────────────────────────────────
  get annualSavingsDisplay(): string {
    const v = this.savingsData?.annual_savings_est ?? this.savingsData?.annual_savings;
    if (!v) return '—';
    const n = Number(v);
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  // ── Capacity ────────────────────────────────────────────────────────────────
  get recoveredKva(): number {
    return this.capacityData?.recovered_capacity_kva ?? this.capacityData?.recoverable_kva ?? 0;
  }
  get capacityRecovered(): string {
    if (!this.recoveredKva) return '—';
    return this.recoveredKva.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' kVA';
  }
  get installedKva(): number {
    return this.capacityData?.installed_capacity_kva ?? this.capacityData?.total_installed_kva ?? 0;
  }
  get availableKva(): number {
    return this.capacityData?.available_capacity_kva ?? 0;
  }
  get utilizationPct(): number {
    return this.capacityData?.utilization_pct ?? 0;
  }

  // ── Power Factor ─────────────────────────────────────────────────────────────
  get pfValue(): number { return this.savingsData?.current_avg_pf ?? this.cbiData?.avg_pf ?? 0; }
  get avgPowerFactor(): string {
    if (!this.pfValue) return '—';
    return (this.pfValue * 100).toFixed(1) + '%';
  }
  get pfVsBaseline(): string {
    const b = this.savingsData?.baseline_avg_pf;
    const c = this.pfValue;
    if (!b || !c) return '';
    const delta = ((c - b) / b * 100);
    return (delta >= 0 ? '+' : '') + delta.toFixed(1) + '% vs Baseline';
  }

  // ── THD ──────────────────────────────────────────────────────────────────────
  get thdValue(): number { return this.cbiData?.avg_thd ?? 0; }
  get thdDisplay(): string {
    if (!this.thdValue) return '—';
    return this.thdValue.toFixed(1) + '%';
  }
  get thdVsBaseline(): string {
    const b = this.savingsData?.baseline_avg_pf; // use as proxy if no baseline THD
    if (this.thdValue <= 0) return '';
    // If THD is below 5% show it's good, else show value
    if (this.thdValue < 5) return 'Within IEEE limits';
    return 'Current THD';
  }

  // ── Sites Requiring Attention ─────────────────────────────────────────────────
  get sitesRequiringAttention(): number {
    return this.alarmSummary?.sites_requiring_attention ?? (this.activeAlarms > 0 ? 1 : 0);
  }

  // ── CO₂ Reduction ──────────────────────────────────────────────────────────
  get co2Tons(): number {
    const stored = this.savingsData?.co2_reduction_tons;
    if (stored && stored > 0) return Math.round(stored);
    // Compute from kw_reduction: kWh/yr × EPA grid factor (0.386 kg/kWh = 0.000386 t/kWh)
    const kwRed = this.savingsData?.kw_reduction ?? 0;
    return Math.round(kwRed * 8760 * 0.000386);
  }
  get co2Display(): string {
    if (!this.co2Tons) return '—';
    return this.co2Tons.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  // ── Alarms ───────────────────────────────────────────────────────────────────
  get activeAlarms(): number { return this.alarmSummary?.active_alarms ?? (this.alarmSummary?.critical ?? 0) + (this.alarmSummary?.high ?? 0) + (this.alarmSummary?.medium ?? 0); }
  get criticalAlarms(): number { return this.alarmSummary?.critical ?? 0; }

  // ── CBI ─────────────────────────────────────────────────────────────────────
  get cbiValue(): number { return this.cbiData?.score ?? this.cbiData?.cbi_score ?? 0; }
  get cbiScoreDisplay(): string { return this.cbiValue ? this.cbiValue.toFixed(0) : '—'; }
  get cbiLabel(): string {
    const v = this.cbiValue;
    if (v >= 90) return 'A (Excellent)';
    if (v >= 80) return 'B (Good)';
    if (v >= 70) return 'C (Fair)';
    if (v >  0)  return 'D (Poor)';
    return '—';
  }

  // ── Network Health gauges ────────────────────────────────────────────────────
  get harmonicHealth(): number {
    const hb = this.cbiData?.harmonic_current_pct ?? this.cbiData?.harmonic_burden_pct ?? 0;
    return Math.round(Math.max(0, Math.min(100, 100 - hb * 2.5)));
  }
  get assetHealth(): number {
    // 100 minus penalty for alarms and utilization
    let score = 100;
    if (this.criticalAlarms > 0) score -= this.criticalAlarms * 15;
    if (this.activeAlarms > 0)   score -= this.activeAlarms * 5;
    if (this.utilizationPct > 90) score -= 10;
    return Math.max(60, Math.min(100, score));
  }
  get overallNetworkHealth(): number {
    const vals = [this.cbiValue, this.harmonicHealth, this.assetHealth].filter(v => v > 0);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // SVG circle gauge helper — returns stroke-dasharray string for a value 0-100
  // Circle circumference at r=40: 2π×40 ≈ 251.3
  gaugeCirc = 251.3;
  gaugeDash(value: number): string {
    const pct = Math.min(100, Math.max(0, value)) / 100;
    const filled = pct * this.gaugeCirc;
    return `${filled} ${this.gaugeCirc}`;
  }
  gaugeColor(value: number): string {
    if (value >= 90) return '#00e676';
    if (value >= 70) return '#ffd740';
    return '#f44336';
  }

  // ── CBI breakdown ────────────────────────────────────────────────────────────
  get cbiBreakdown(): { label: string; pct: number; color: string }[] {
    if (!this.cbiData) return [];
    return [
      { label: 'Productive', pct: this.cbiData.productive_current_pct || 0, color: '#00e676' },
      { label: 'Reactive',   pct: this.cbiData.reactive_current_pct || 0,  color: '#29b6f6' },
      { label: 'Harmonic',   pct: this.cbiData.harmonic_current_pct || 0,  color: '#ce93d8' },
      { label: 'Imbalance',  pct: this.cbiData.imbalance_pct || 0,         color: '#ffd740' },
      { label: 'Neutral',    pct: this.cbiData.neutral_current_pct || 0,   color: '#f44336' },
    ];
  }

  // ── Savings trend chart ───────────────────────────────────────────────────────
  // 7-day cumulative savings from annual rate
  get monthlySavings(): { month: string; value: number }[] {
    const annual = this.savingsData?.annual_savings_est ?? this.savingsData?.annual_savings ?? 0;
    const daily = Number(annual) / 365;
    if (!daily) return [];
    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const now = new Date();
    const result: { month: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      result.push({ month: dayLabels[d.getDay()], value: Math.round(daily * (7 - i)) });
    }
    return result;
  }

  trendPolyline(items: { month: string; value: number }[], w: number, h: number): string {
    if (!items.length) return '';
    const maxV = Math.max(...items.map(i => i.value), 1);
    const pts = items.map((item, i) => {
      const x = (i / (items.length - 1 || 1)) * w;
      const y = h - (item.value / maxV) * (h - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return pts.join(' ');
  }

  get trendMax(): number {
    const vals = this.monthlySavings.map(m => m.value);
    return vals.length ? Math.max(...vals) : 0;
  }

  // ── AI Energy Summary ─────────────────────────────────────────────────────────
  get aiSummaryItems(): { icon: string; text: string; color: string }[] {
    const items: { icon: string; text: string; color: string }[] = [];
    const annual = this.savingsData?.annual_savings;
    if (annual) items.push({ icon: '✓', text: `Annual savings $${Math.round(annual / 1000)}K/yr`, color: '#00e676' });
    const kva = this.recoveredKva;
    if (kva)    items.push({ icon: '✓', text: `${kva} kVA capacity recovered`, color: '#00e676' });
    const pf = this.pfValue;
    if (pf)     items.push({ icon: '✓', text: `Power factor improved to ${(pf * 100).toFixed(1)}%`, color: '#00e676' });
    const thd = this.thdValue;
    if (thd)    items.push({ icon: '✓', text: `THD at ${thd.toFixed(1)}% — monitoring active`, color: '#00e676' });
    if (this.sitesRequiringAttention > 0) {
      items.push({ icon: '⚠', text: `${this.sitesRequiringAttention} site requires attention`, color: '#ffd740' });
    }
    return items;
  }

  get aiStatusText(): string {
    if (this.activeAlarms > 0) return 'Action required on ' + this.activeAlarms + ' alarm(s).';
    if (this.cbiValue >= 90) return 'Network performance is excellent. All metrics trending in the right direction.';
    if (this.cbiValue >= 70) return 'Network performance is good. Minor optimization opportunities detected.';
    return 'Network performance needs attention. Review CBI details.';
  }

  // ── Top sites (single-project: show current project) ─────────────────────────
  get topSites(): { name: string; savings: number; pf: number; thd: number; status: string }[] {
    if (!this.savingsData) return [];
    return [{
      name: this.siteName || 'Current Site',
      savings: Math.round(this.savingsData.annual_savings || 0),
      pf:      Math.round((this.pfValue * 1000)) / 10,
      thd:     Math.round(this.thdValue * 10) / 10,
      status:  this.activeAlarms > 0 ? 'Warning' : 'Healthy',
    }];
  }

  // ── Hidden capacity equivalents ───────────────────────────────────────────────
  get capacityEquivMotors(): number   { return Math.floor(this.recoveredKva * 0.746 / 50); }  // 50HP motor ≈ 37.3kVA
  get capacityEquivCNC(): number      { return Math.floor(this.recoveredKva / 25); }
  get capacityEquivServers(): number  { return Math.floor(this.recoveredKva * 1000 / 8); }    // 8VA per server
  get deferredCapital(): number       { return Math.round(this.recoveredKva * 65); }           // $65/kVA

  // ── Network losses ────────────────────────────────────────────────────────────
  get lossesBeforeKw(): number {
    const b = this.savingsData?.baseline_avg_kw ?? 0;
    const c = this.savingsData?.current_avg_kw ?? 0;
    if (!b) return 0;
    return Math.round((b - c + (this.savingsData?.kw_reduction ?? 0)) * 10) / 10;
  }
  get lossesAfterKw(): number {
    const red = this.savingsData?.kw_reduction ?? 0;
    const before = this.lossesBeforeKw;
    return Math.max(0, Math.round((before - red) * 10) / 10);
  }
  get lossReductionPct(): number {
    const b = this.lossesBeforeKw;
    if (!b) return 0;
    return Math.round((b - this.lossesAfterKw) / b * 100);
  }

  // ── Device health ─────────────────────────────────────────────────────────────
  get devicesHealthy(): number  { return this.devicesData?.healthy ?? (this.activeAlarms === 0 ? 1 : 0); }
  get devicesWarning(): number  { return this.devicesData?.warning ?? this.activeAlarms; }
  get devicesOffline(): number  { return this.devicesData?.offline ?? 0; }
  get devicesTotal(): number    { return this.devicesHealthy + this.devicesWarning + this.devicesOffline || 1; }
  get deviceHealthPct(): number { return Math.round(this.devicesHealthy / this.devicesTotal * 100); }

  // Donut for device health (circ 2π×30 ≈ 188.5)
  deviceCirc = 188.5;
  deviceDonutDash(value: number, total: number): string {
    const pct = total > 0 ? value / total : 0;
    const filled = pct * this.deviceCirc;
    return `${filled} ${this.deviceCirc}`;
  }
  deviceDonutOffset(prev: number, total: number): number {
    return -(prev / (total || 1)) * this.deviceCirc;
  }
}
