import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

export interface SiteRow {
  id: number;
  name: string;
  city: string;
  state: string;
  country: string;
  location: string;
  facilityType: string;
  healthScore: number;
  healthLabel: string;
  healthColor: string;
  cbiScore: number;
  utilization: number;
  installedKva: number;
  capacityRecovered: number;
  annualSavings: number;
  carbonReduced: number;
  status: string;
  alarmCount: number;
  criticalAlarms: number;
  deviceCount: number;
  lastUpdated: Date | null;
  loading: boolean;
}

@Component({
  selector: 'ecbs-sites',
  templateUrl: './sites.component.html',
  styleUrls: ['./sites.component.scss'],
})
export class SitesComponent implements OnInit, OnDestroy {

  // ── State ─────────────────────────────────────────────────────────
  loading = true;
  sites: SiteRow[] = [];
  viewMode: 'grid' | 'list' = 'list';

  // ── Filters ───────────────────────────────────────────────────────
  searchQuery = '';
  statusFilter = 'all';
  healthFilter = 'all';
  sortCol = 'healthScore';
  sortDir: 'asc' | 'desc' = 'desc';

  // ── Pagination ────────────────────────────────────────────────────
  pageSize = 8;
  currentPage = 1;

  private _pollTimer: any = null;

  constructor(
    private api: ApiRequestService,
    private userService: CurrentUserService
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  ngOnDestroy() {
    if (this._pollTimer) { clearInterval(this._pollTimer); }
  }

  // ── Data loading ──────────────────────────────────────────────────

  loadProjects() {
    this.loading = true;
    this.api.get('/api/project/?page=1&pageSize=200').subscribe({
      next: (r: any) => {
        const items: any[] = Array.isArray(r) ? r : (r?.response || r?.data || r?.projects || r?.items || []);
        this.sites = items.map(p => this.projectToRow(p));
        this.loading = false;
        // Load metrics for each site asynchronously
        this.sites.forEach(s => this.loadSiteMetrics(s));
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private projectToRow(p: any): SiteRow {
    const city    = p.city || p.facilityCity || '';
    const state   = p.state || p.facilityState || p.stateAbbreviation || '';
    const country = p.country || p.facilityCountry || '';
    const clientName = p.client?.name || '';
    const loc     = [city, state].filter(Boolean).join(', ') || country || clientName;

    return {
      id: p.id,
      name: p.name || p.facilityName || 'Unnamed Site',
      city,
      state,
      country,
      location: loc,
      facilityType: p.facilityType || p.buildingType || p.type || 'Facility',
      healthScore: 0,
      healthLabel: 'No Data',
      healthColor: '#546e7a',
      cbiScore: 0,
      utilization: 0,
      installedKva: p.proposalData?.installedKva || p.installedKva || 0,
      capacityRecovered: 0,
      annualSavings: 0,
      carbonReduced: 0,
      status: this.resolveStatus(p),
      alarmCount: 0,
      criticalAlarms: 0,
      deviceCount: 0,
      lastUpdated: p.updatedAt ? new Date(p.updatedAt) : null,
      loading: true,
    };
  }

  private resolveStatus(p: any): string {
    if (p.release_status === 'released' || p.releaseStatus === 'released') return 'Active';
    if (p.release_status === 'demo' || p.releaseStatus === 'demo') return 'Demo';
    if (p.status) return p.status;
    return p.id ? 'Active' : 'Inactive';
  }

  loadSiteMetrics(site: SiteRow) {
    const pid = site.id;

    // CBI / Current Balance
    this.api.get('/api/current-balance/summary?project_id=' + pid).subscribe({
      next: (r: any) => {
        site.cbiScore = r?.cbi_score ?? r?.score ?? r?.cbi ?? 0;
        this.updateHealth(site);
      },
      error: () => {}
    });

    // Capacity
    this.api.get('/api/capacity/summary?project_id=' + pid).subscribe({
      next: (r: any) => {
        site.installedKva      = r?.installed_capacity_kva || r?.installed_kva || site.installedKva;
        site.capacityRecovered = r?.recovered_capacity_kva || r?.recovered_kva || 0;
        site.utilization       = r?.utilization_pct || r?.utilization || 0;
        this.updateHealth(site);
      },
      error: () => {}
    });

    // Savings
    this.api.get('/api/savings/summary?project_id=' + pid).subscribe({
      next: (r: any) => {
        site.annualSavings  = r?.annual_savings || r?.annualSavings || 0;
        site.carbonReduced  = r?.carbon_reduced_tons || r?.carbonTons || 0;
      },
      error: () => {}
    });

    // Alarms
    this.api.get('/api/alarms/summary?project_id=' + pid).subscribe({
      next: (r: any) => {
        site.alarmCount     = r?.active_alarms || r?.total || 0;
        site.criticalAlarms = r?.critical || 0;
        this.updateHealth(site);
      },
      error: () => {}
    });

    // Devices
    this.api.get('/api/devices/count?project_id=' + pid).subscribe({
      next: (r: any) => {
        site.deviceCount = r?.count || r?.total || 0;
      },
      error: () => { site.loading = false; }
    });
  }

  private updateHealth(site: SiteRow) {
    site.loading = false;
    // Compose health: CBI primary, degrade for critical alarms
    let score = site.cbiScore;
    if (score === 0 && site.installedKva > 0) {
      score = site.capacityRecovered > 0 ? 70 : 50;
    }
    if (site.criticalAlarms > 0) score = Math.min(score, 69);
    site.healthScore = score;

    if (score >= 90) { site.healthLabel = 'Excellent';       site.healthColor = '#00e676'; }
    else if (score >= 80) { site.healthLabel = 'Very Good';  site.healthColor = '#69f0ae'; }
    else if (score >= 70) { site.healthLabel = 'Good';       site.healthColor = '#ffd740'; }
    else if (score > 0)   { site.healthLabel = 'Needs Attention'; site.healthColor = '#f44336'; }
    else                  { site.healthLabel = 'No Data';    site.healthColor = '#546e7a'; }
  }

  // ── Computed aggregates ───────────────────────────────────────────

  get totalSites(): number { return this.sites.length; }

  get avgHealthScore(): number {
    const scored = this.sites.filter(s => s.healthScore > 0);
    if (!scored.length) return 0;
    return scored.reduce((a, s) => a + s.healthScore, 0) / scored.length;
  }

  get totalCapacityRecovered(): number {
    return this.sites.reduce((a, s) => a + (s.capacityRecovered || 0), 0);
  }

  get totalAnnualSavings(): number {
    return this.sites.reduce((a, s) => a + (s.annualSavings || 0), 0);
  }

  get totalCarbonReduced(): number {
    return this.sites.reduce((a, s) => a + (s.carbonReduced || 0), 0);
  }

  // ── Health distribution for donut ────────────────────────────────

  get healthBuckets(): Array<{ label: string; color: string; count: number; pct: number }> {
    const total = this.sites.length || 1;
    const defs = [
      { label: 'Excellent (90-100)', color: '#00e676', min: 90, max: 101 },
      { label: 'Very Good (80-89)',  color: '#69f0ae', min: 80, max: 90  },
      { label: 'Good (70-79)',       color: '#ffd740', min: 70, max: 80  },
      { label: 'Needs Attention (<70)', color: '#f44336', min: 1, max: 70 },
      { label: 'No Data',           color: '#546e7a', min: 0, max: 1   },
    ];
    return defs.map(d => {
      const count = this.sites.filter(s => s.healthScore >= d.min && s.healthScore < d.max).length;
      return { label: d.label, color: d.color, count, pct: Math.round((count / total) * 100) };
    });
  }

  get donutSegments(): Array<{ color: string; offset: number; dash: number; total: number }> {
    const circumference = 2 * Math.PI * 42; // r=42
    let offset = 0;
    return this.healthBuckets.map(b => {
      const dash = (b.pct / 100) * circumference;
      const seg = { color: b.color, offset: circumference - offset, dash, total: circumference };
      offset += dash;
      return seg;
    });
  }

  // ── Top performers ────────────────────────────────────────────────

  get topHealthSite(): SiteRow | null {
    return this.sites.filter(s => s.healthScore > 0).sort((a, b) => b.healthScore - a.healthScore)[0] || null;
  }
  get topCapacitySite(): SiteRow | null {
    return this.sites.filter(s => s.capacityRecovered > 0).sort((a, b) => b.capacityRecovered - a.capacityRecovered)[0] || null;
  }
  get topSavingsSite(): SiteRow | null {
    return this.sites.filter(s => s.annualSavings > 0).sort((a, b) => b.annualSavings - a.annualSavings)[0] || null;
  }
  get topCarbonSite(): SiteRow | null {
    return this.sites.filter(s => s.carbonReduced > 0).sort((a, b) => b.carbonReduced - a.carbonReduced)[0] || null;
  }

  // ── Filtering & sorting ───────────────────────────────────────────

  get filteredSites(): SiteRow[] {
    let rows = this.sites.slice();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      rows = rows.filter(s =>
        s.name.toLowerCase().indexOf(q) >= 0 ||
        s.location.toLowerCase().indexOf(q) >= 0 ||
        s.facilityType.toLowerCase().indexOf(q) >= 0
      );
    }

    if (this.statusFilter !== 'all') {
      rows = rows.filter(s => s.status.toLowerCase() === this.statusFilter.toLowerCase());
    }

    if (this.healthFilter !== 'all') {
      rows = rows.filter(s => {
        if (this.healthFilter === 'excellent')  return s.healthScore >= 90;
        if (this.healthFilter === 'good')       return s.healthScore >= 70 && s.healthScore < 90;
        if (this.healthFilter === 'attention')  return s.healthScore > 0 && s.healthScore < 70;
        if (this.healthFilter === 'nodata')     return s.healthScore === 0;
        return true;
      });
    }

    // Sort
    rows = rows.sort((a: any, b: any) => {
      const va = a[this.sortCol] || 0;
      const vb = b[this.sortCol] || 0;
      if (typeof va === 'string') {
        return this.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return this.sortDir === 'asc' ? va - vb : vb - va;
    });

    return rows;
  }

  get pagedSites(): SiteRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSites.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSites.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) { pages.push(i); }
    return pages;
  }

  get showingFrom(): number { return this.filteredSites.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get showingTo():   number { return Math.min(this.currentPage * this.pageSize, this.filteredSites.length); }

  setSort(col: string) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'desc';
    }
    this.currentPage = 1;
  }

  goPage(p: number) {
    if (p >= 1 && p <= this.totalPages) { this.currentPage = p; }
  }

  onFilterChange() { this.currentPage = 1; }

  setViewMode(m: 'grid' | 'list') { this.viewMode = m; }

  healthLabelColor(site: SiteRow): string { return site.healthColor; }

  scoreColor(score: number): string {
    if (score >= 90) return '#00e676';
    if (score >= 80) return '#69f0ae';
    if (score >= 70) return '#ffd740';
    if (score > 0)   return '#f44336';
    return '#546e7a';
  }

  formatSavings(n: number): string {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n.toFixed(0);
  }

  formatKva(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1) + ' MVA';
    return n.toFixed(0) + ' kVA';
  }

  refresh() { this.loadProjects(); }
}
