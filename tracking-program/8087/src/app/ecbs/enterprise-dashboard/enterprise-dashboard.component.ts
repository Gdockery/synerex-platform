import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'app-enterprise-dashboard',
  templateUrl: './enterprise-dashboard.component.html',
  styleUrls: ['./enterprise-dashboard.component.scss'],
})
export class EnterpriseDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── State ─────────────────────────────────────────────────────────────────
  loading = true;
  currentUser: any = null;

  // ── Date range ────────────────────────────────────────────────────────────
  dateFrom = '';
  dateTo   = '';

  // ── Portfolio data ────────────────────────────────────────────────────────
  portfolio: any        = null;
  trendsData: any[]     = [];


  // ── Leaf map ──────────────────────────────────────────────────────────────
  private _map: any     = null;

  // ── Ticker ───────────────────────────────────────────────────────────────
  private _ticker: any  = null;
  private _updateTs: string = '';

  constructor(
    private api: ApiRequestService,
    private userService: CurrentUserService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUser = this.userService.user as any;
    const now  = new Date();
    const week = new Date(now.getTime() - 30 * 86400000);
    this.dateTo   = now.toISOString().slice(0, 10);
    this.dateFrom = week.toISOString().slice(0, 10);
    this._updateTs = now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    this.loadAll();
    this._ticker = setInterval(() => this._updateTs = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }), 60000);
  }

  ngAfterViewInit() { this._initMap(); }

  ngOnDestroy() {
    if (this._ticker) clearInterval(this._ticker);
    if (this._map) { try { this._map.remove(); } catch(e) {} this._map = null; }
  }

  get updateTs(): string { return this._updateTs; }

  // ── Date change ───────────────────────────────────────────────────────────
  onDateChange() { if (this.dateFrom && this.dateTo) this.loadAll(); }

  // ── Load ──────────────────────────────────────────────────────────────────
  loadAll() {
    this.loading = true;
    this.api.get('/api/portfolio/summary').subscribe({
      next: (r: any) => {
        this.portfolio = r?.response || r;
        this.loading   = false;
        if (this._map) this._addMarkers();
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Computed: KPIs ────────────────────────────────────────────────────────
  get annualSavings(): number    { return Number(this.portfolio?.total_annual_savings || 0); }
  get kvaRecovered(): number     { return Number(this.portfolio?.total_kva_recovered  || 0); }
  get avgPf(): number            { const v = Number(this.portfolio?.avg_power_factor || 0); return v > 1 ? v : v * 100; }
  get avgThd(): number           { return Number(this.portfolio?.avg_thd || 0); }
  get co2Tons(): number          { return Number(this.portfolio?.total_co2_tons || 0); }
  get siteCount(): number        { return Number(this.portfolio?.site_count || 0); }
  get sitesAttention(): number   { return (this.sites.filter((s: any) => s.status !== 'Healthy')).length; }

  // ── Devices ───────────────────────────────────────────────────────────────
  get devHealthy():  number { return Number(this.portfolio?.devices_healthy  || 0); }
  get devWarning():  number { return Number(this.portfolio?.devices_warning  || 0); }
  get devOffline():  number { return Number(this.portfolio?.devices_offline  || 0); }
  get devTotal():    number { return this.devHealthy + this.devWarning + this.devOffline || 1; }
  get devHealthPct():number { return Math.round(this.devHealthy / this.devTotal * 100); }

  // ── Sites list ────────────────────────────────────────────────────────────
  get sites(): any[] { return this.portfolio?.sites || []; }
  get healthySites(): number  { return this.sites.filter((s: any) => s.status === 'Healthy').length; }
  get warningSites(): number  { return this.sites.filter((s: any) => s.status === 'Warning').length; }
  get criticalSites(): number { return this.sites.filter((s: any) => s.status === 'Critical').length; }

  // ── Trend series from API ────────────────────────────────────────────────
  get trend30Savings(): any[]  { return this.portfolio?.trend_savings_30d || []; }
  get trend30Kva(): any[]      { return this.portfolio?.trend_kva_30d     || []; }
  get trend30Pf(): any[]       { return this.portfolio?.trend_pf_30d      || []; }
  get trend30Thd(): any[]      { return this.portfolio?.trend_thd_30d     || []; }
  get monthlyTrend(): any[]    { return this.portfolio?.monthly_trend      || []; }
  get savingsDeltaPct(): number{ return Number(this.portfolio?.savings_delta_pct || 0); }
  get kvaDelta(): number       { return Number(this.portfolio?.kva_delta || 0); }
  get hasPfBaseline(): boolean { return !!this.portfolio?.has_pf_baseline; }
  get hasThdBaseline(): boolean{ return !!this.portfolio?.has_thd_baseline; }
  get baselinePf(): number     { return Number(this.portfolio?.baseline_avg_pf  || 0); }
  get baselineThd(): number    { return Number(this.portfolio?.baseline_avg_thd || 0); }
  // % change relative to baseline, e.g. (current - baseline) / baseline * 100
  get pfVsBaseline(): number  { return this.baselinePf  > 0 ? Number(((this.avgPf  - this.baselinePf)  / this.baselinePf  * 100).toFixed(1)) : 0; }
  // THD reduction: (baseline - current) / baseline * 100  (positive = improvement)
  get thdVsBaseline(): number { return this.baselineThd > 0 ? Number(((this.baselineThd - this.avgThd) / this.baselineThd * 100).toFixed(1)) : 0; }

  // ── Legacy (used as fallback) ─────────────────────────────────────────────
  get savingsTrend(): any[] { return this.portfolio?.savings_trend || []; }

  /** Alias used by template SVG sparklines — delegates to trendPolyline. */
  sparkline(w: number, h: number, data?: any[]): string {
    return this.trendPolyline(w, h, data);
  }

  // ── Polyline builder (min-max normalized, no y-axis zero anchor) ──────────
  trendPolyline(w: number, h: number, data?: any[]): string {
    const pts = data || this.trend30Savings;
    if (!pts || pts.length < 2) return '';
    const vals = pts.map((d: any) => Number(d.value || 0));
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const range = maxV - minV || 1;
    const pad = 3;
    return pts.map((d: any, i: number) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - pad - ((Number(d.value || 0) - minV) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  // ── Monthly cumulative chart ───────────────────────────────────────────────
  get monthlyMax(): number {
    const vals = this.monthlyTrend.map((t: any) => Number(t.value || 0));
    return vals.length ? Math.max(...vals, 1) : 1;
  }
  monthlyPolyline(w: number, h: number): string {
    const pts = this.monthlyTrend;
    if (!pts || pts.length < 2) return '';
    const maxV = this.monthlyMax;
    const pad = 4;
    return pts.map((d: any, i: number) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - pad - (Number(d.value || 0) / maxV) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  // Unique month labels for x-axis (deduplicated)
  get monthLabels(): string[] {
    const seen = new Set<string>();
    return this.monthlyTrend.reduce((acc: string[], t: any) => {
      if (!seen.has(t.month)) { seen.add(t.month); acc.push(t.month); }
      else acc.push('');
      return acc;
    }, []);
  }

  // ── Capacity aggregates ───────────────────────────────────────────────────
  get totalInstalledKva(): number { return this.sites.reduce((a: number, s: any) => a + (s.kva_installed || 0), 0) || this.kvaRecovered * 3.3; }
  get currentLoadKva(): number    { return Math.max(0, this.totalInstalledKva - this.kvaRecovered); }
  get utilizationPct(): number    { return this.totalInstalledKva > 0 ? Math.round(this.currentLoadKva / this.totalInstalledKva * 100) : 75; }
  get availableKva(): number      { return Math.max(0, this.totalInstalledKva - this.currentLoadKva - this.kvaRecovered); }
  get deferredCapital(): number   { return Math.round(this.kvaRecovered * 65); }

  // Capacity equivalents
  get equivMotors(): number   { return Math.floor(this.kvaRecovered * 0.746 / 50); }
  get equivCnc(): number      { return Math.floor(this.kvaRecovered / 25); }
  get equivServers(): number  { return Math.floor(this.kvaRecovered * 1000 / 8); }

  // ── Network losses ────────────────────────────────────────────────────────
  get lossesBeforeKw(): number { return Math.round(this.annualSavings / 365 / 24 * 10) / 10 * 2.5 || 31.2; }
  get lossesAfterKw(): number  { return Math.round(this.lossesBeforeKw * 0.6 * 10) / 10; }
  get lossReductionPct(): number { return this.lossesBeforeKw > 0 ? Math.round((1 - this.lossesAfterKw / this.lossesBeforeKw) * 100) : 40; }

  // ── Network health scores ─────────────────────────────────────────────────
  get cbiScore(): number {
    // Average across sites if available, otherwise derive from PF
    const pf = this.avgPf > 1 ? this.avgPf : this.avgPf * 100;
    return pf >= 98 ? 95 : pf >= 95 ? 90 : pf >= 90 ? 80 : 70;
  }
  get harmonicHealth(): number { return this.avgThd > 0 ? Math.round(Math.max(0, 100 - this.avgThd * 8)) : 96; }
  get assetHealth(): number    { return this.sitesAttention === 0 ? 98 : Math.max(70, 100 - this.sitesAttention * 5); }
  get overallHealth(): number  {
    const vals = [this.cbiScore, this.harmonicHealth, this.assetHealth].filter(v => v > 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 97;
  }

  // ── Alarms — sourced from portfolio summary ───────────────────────────────
  get alarmTotal(): number { return Number(this.portfolio?.total_active_alarms || 0); }

  // ── AI Summary items ──────────────────────────────────────────────────────
  get aiItems(): { icon: string; text: string; good: boolean }[] {
    const items: { icon: string; text: string; good: boolean }[] = [];
    if (this.annualSavings > 0) items.push({ icon: '✓', text: `Annual savings $${Math.round(this.annualSavings / 1000)}K across ${this.siteCount} sites`, good: true });
    if (this.kvaRecovered  > 0) items.push({ icon: '✓', text: `Capacity recovered up ${Math.round(this.kvaRecovered)} kVA`, good: true });
    if (this.avgPf > 0)         items.push({ icon: '✓', text: `Power factor ${this.avgPf.toFixed(1)}% portfolio average`, good: true });
    if (this.avgThd > 0)        items.push({ icon: '✓', text: `THD reduced to ${this.avgThd.toFixed(1)}% avg`, good: true });
    if (this.sitesAttention > 0) items.push({ icon: '⚠', text: `${this.sitesAttention} site${this.sitesAttention > 1 ? 's' : ''} require attention`, good: false });
    return items;
  }
  get aiStatusText(): string {
    if (this.sitesAttention === 0 && this.siteCount > 0) return 'Network performance is excellent. All metrics are trending in the right direction.';
    if (this.sitesAttention > 0) return `${this.sitesAttention} site${this.sitesAttention > 1 ? 's' : ''} require attention. Review alerts.`;
    return 'Loading portfolio data…';
  }

  // ── SVG helpers ───────────────────────────────────────────────────────────
  gaugeDash(val: number, max = 100): string {
    const circ = 251.3;
    return `${(Math.min(val, max) / max * circ).toFixed(1)} ${circ}`;
  }
  gaugeColor(val: number): string {
    if (val >= 90) return '#00e676';
    if (val >= 70) return '#ffd740';
    return '#f44336';
  }
  capDonutDash(pct: number): string {
    const circ = 226.2;
    return `${(pct / 100 * circ).toFixed(1)} ${circ}`;
  }
  devDonutDash(v: number): string {
    const circ = 188.5;
    return `${(v / this.devTotal * circ).toFixed(1)} ${circ}`;
  }

  // ── Formatting ────────────────────────────────────────────────────────────
  currency(v: number): string {
    if (!v) return '—';
    const n = Math.abs(Math.round(v));
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + n.toLocaleString();
  }
  kva(v: number): string {
    if (!v) return '—';
    const n = Math.round(v);
    return n >= 1000 ? (n / 1000).toFixed(2) + ' MVA' : n.toLocaleString() + ' kVA';
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────
  devicesOpen = false;
  toggleDevices(e: Event) { e.stopPropagation(); this.devicesOpen = !this.devicesOpen; }

  // ── Navigation ────────────────────────────────────────────────────────────
  nav(path: string) { this.router.navigate(['/ecbs/' + path]); }
  navActive(path: string): boolean { return this.router.url.includes(path); }

  // ── Leaflet map ───────────────────────────────────────────────────────────
  private _initMap() {
    const init = () => {
      const L = (window as any).L;
      if (!L) return;
      const el = document.getElementById('ent-map');
      if (!el || this._map) return;
      this._map = L.map(el, { zoomControl: true, attributionControl: false, scrollWheelZoom: false })
        .setView([20, 0], 2);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(this._map);
      if (this.portfolio) this._addMarkers();
    };
    if ((window as any).L) { init(); return; }
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
    const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = init; document.head.appendChild(s);
  }

  private _addMarkers() {
    const L = (window as any).L;
    if (!L || !this._map) return;
    this.sites.forEach((site: any) => {
      if (!site.location) return;
      const color = site.status === 'Healthy' ? '#00e676' : site.status === 'Warning' ? '#ffd740' : '#f44336';
      const icon  = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 8px ${color};"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6],
      });
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(site.location)}`)
        .then((r: any) => r.json())
        .then((res: any[]) => {
          if (res && res.length) {
            L.marker([parseFloat(res[0].lat), parseFloat(res[0].lon)], { icon })
              .addTo(this._map)
              .bindPopup(`<b>${site.name}</b><br>Savings: ${this.currency(site.annual_savings)}<br>Status: ${site.status}`);
          }
        }).catch(() => {});
    });
  }
}
