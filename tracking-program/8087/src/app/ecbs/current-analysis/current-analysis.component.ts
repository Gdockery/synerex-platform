import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

interface ChartPoint { x: number; y: number; }

@Component({
  selector: 'ecbs-current-analysis',
  templateUrl: './current-analysis.component.html',
  styleUrls: ['./current-analysis.component.scss'],
})
export class CurrentAnalysisComponent implements OnInit {
  projectId: number;
  loading    = true;
  summary: any    = null;
  timeseries: any[] = [];
  breakdown: any[]  = [];
  timeRange = '7d';

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadData();
  }

  private getFromTs(): number {
    const days = this.timeRange === '30d' ? 30 : this.timeRange === '90d' ? 90 : 7;
    return Date.now() - days * 86400 * 1000;
  }

  setTimeRange(r: string) { this.timeRange = r; this.loadData(); }

  loadData() {
    this.loading = true;
    const pid     = this.projectId;
    const fromTs  = this.getFromTs();
    const toTs    = Date.now();
    const base    = `/api/current-balance`;

    let done = 0;
    const finish = () => { done++; if (done === 3) this.loading = false; };

    this.api.get(`${base}/summary?project_id=${pid}&from_ts=${fromTs}&to_ts=${toTs}`).subscribe({
      next: (r: any) => { this.summary = r; finish(); },
      error: () => { finish(); },
    });
    this.api.get(`${base}/timeseries?project_id=${pid}&from_ts=${fromTs}&to_ts=${toTs}&page_size=200`).subscribe({
      next: (r: any) => { this.timeseries = r?.response || []; finish(); },
      error: () => { finish(); },
    });
    this.api.get(`${base}/breakdown?project_id=${pid}&from_ts=${fromTs}&to_ts=${toTs}`).subscribe({
      next: (r: any) => { this.breakdown = r?.response || []; finish(); },
      error: () => { finish(); },
    });
  }

  // ── KPI: Amp values (averaged from timeseries) ─────────────────────────────

  private _avg(field: string): number {
    const vals = this.timeseries.map(r => r[field]).filter(v => v != null && v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  get totalCurrentAmp(): number  { return this._avg('avg_amp'); }
  get productiveAmp(): number    { return this._avg('productive_amp'); }
  get reactiveAmp(): number      { return this._avg('reactive_amp'); }
  get harmonicAmp(): number      { return this._avg('harmonic_amp'); }
  get imbalanceAmp(): number     { return this._avg('imbalance_amp'); }
  get neutralAmp(): number       { return this._avg('neutral_amp'); }

  get productivePct(): number {
    if (!this.totalCurrentAmp) return this.summary?.productive_current_pct || 0;
    return (this.productiveAmp / this.totalCurrentAmp) * 100;
  }
  get reactivePct(): number {
    if (!this.totalCurrentAmp) return this.summary?.reactive_current_pct || 0;
    return (this.reactiveAmp / this.totalCurrentAmp) * 100;
  }
  get harmonicPct(): number {
    if (!this.totalCurrentAmp) return this.summary?.harmonic_current_pct || 0;
    return (this.harmonicAmp / this.totalCurrentAmp) * 100;
  }
  get imbalancePct(): number {
    return this.summary?.imbalance_pct || 0;
  }
  get neutralPct(): number {
    if (!this.totalCurrentAmp) return this.summary?.neutral_current_pct || 0;
    return (this.neutralAmp / this.totalCurrentAmp) * 100;
  }
  get lostCapacityPct(): number {
    return Math.min(100, this.harmonicPct + this.imbalancePct + this.neutralPct * 0.5);
  }

  // ── Phase currents ─────────────────────────────────────────────────────────

  get phaseA(): number { return this._avg('avg_l1_amp'); }
  get phaseB(): number { return this._avg('avg_l2_amp'); }
  get phaseC(): number { return this._avg('avg_l3_amp'); }
  get phaseAvg(): number {
    const vals = [this.phaseA, this.phaseB, this.phaseC].filter(v => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  // ── CBI score ──────────────────────────────────────────────────────────────

  get cbiScore(): number { return this.summary?.score ?? this.summary?.cbi_score ?? 0; }
  get cbiGrade(): string {
    const s = this.cbiScore;
    if (s >= 95) return 'A+'; if (s >= 90) return 'A';
    if (s >= 85) return 'B+'; if (s >= 80) return 'B';
    if (s >= 75) return 'C+'; if (s >= 70) return 'C';
    return 'D';
  }
  get cbiGaugeColor(): string {
    const s = this.cbiScore;
    if (s >= 90) return '#00e676';
    if (s >= 75) return '#ffd740';
    return '#ef5350';
  }
  get cbiDashoffset(): number {
    const c = 2 * Math.PI * 54;
    return c - (this.cbiScore / 100) * c;
  }
  get cbiStatusLabel(): string {
    const s = this.cbiScore;
    if (s >= 90) return 'Excellent'; if (s >= 80) return 'Good';
    if (s >= 70) return 'Fair'; return 'Poor';
  }
  get powerFactor(): number { return this.summary?.power_factor || 0; }

  // ── Donut chart segments ───────────────────────────────────────────────────

  get donutSegments(): { color: string; dash: number; offset: number; label: string; pct: number }[] {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const components = [
      { label: 'Productive',  color: '#00e676', pct: this.productivePct },
      { label: 'Reactive',    color: '#29b6f6', pct: this.reactivePct   },
      { label: 'Harmonic',    color: '#ce93d8', pct: this.harmonicPct   },
      { label: 'Imbalance',   color: '#ffd740', pct: this.imbalancePct  },
      { label: 'Neutral',     color: '#ef5350', pct: this.neutralPct    },
    ];
    let cumulativePct = 0;
    return components.map(c => {
      const dash   = (c.pct / 100) * circ;
      const offset = circ - (cumulativePct / 100) * circ;
      cumulativePct += c.pct;
      return { ...c, dash, offset };
    });
  }
  get donutTotal(): number { return this.totalCurrentAmp || 0; }

  // ── SVG Chart helpers ──────────────────────────────────────────────────────

  // Sample timeseries to at most N evenly-spaced points
  private _sampleSeries(n = 50): any[] {
    if (!this.timeseries.length) return [];
    if (this.timeseries.length <= n) return this.timeseries;
    const step = Math.floor(this.timeseries.length / n);
    return this.timeseries.filter((_, i) => i % step === 0).slice(0, n);
  }

  private _polyline(series: any[], field: string, W: number, H: number, maxVal: number): string {
    if (!series.length || !maxVal) return '';
    return series.map((r, i) => {
      const x = (i / Math.max(series.length - 1, 1)) * W;
      const y = H - ((r[field] || 0) / maxVal) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  // Stacked area chart — components over time
  readonly CA_W = 520; readonly CA_H = 140;

  get stackedAreaData(): { color: string; label: string; polygon: string }[] {
    const series = this._sampleSeries(50);
    if (!series.length) return [];
    const W = this.CA_W, H = this.CA_H;
    const maxVal = Math.max(...series.map(r => r.avg_amp || 0));
    if (!maxVal) return [];

    const layers = [
      { key: 'productive_amp', color: '#00e676', label: 'Productive' },
      { key: 'reactive_amp',   color: '#29b6f6', label: 'Reactive'   },
      { key: 'harmonic_amp',   color: '#ce93d8', label: 'Harmonic'   },
      { key: 'imbalance_amp',  color: '#ffd740', label: 'Imbalance'  },
    ];

    const n = series.length;
    let stackY = series.map(() => H); // bottom baseline

    return layers.map(layer => {
      const topPts: string[] = [];
      const botPts: string[] = [];
      const newStackY: number[] = [];

      series.forEach((row, i) => {
        const x = (i / Math.max(n - 1, 1)) * W;
        const amp = row[layer.key] || 0;
        const newY = stackY[i] - (amp / maxVal) * H;
        topPts.push(`${x.toFixed(1)},${newY.toFixed(1)}`);
        botPts.unshift(`${x.toFixed(1)},${stackY[i].toFixed(1)}`);
        newStackY.push(newY);
      });

      stackY = newStackY;
      return { color: layer.color, label: layer.label, polygon: [...topPts, ...botPts].join(' ') };
    });
  }

  // X-axis labels for stacked area chart
  get caXLabels(): { x: number; label: string }[] {
    const series = this._sampleSeries(50);
    if (!series.length) return [];
    const W = this.CA_W;
    const n = series.length;
    const step = Math.max(1, Math.floor(n / 5));
    return series
      .filter((_, i) => i % step === 0 || i === n - 1)
      .map((r, j, arr) => {
        const origIdx = j * step > n - 1 ? n - 1 : j * step;
        const x = (origIdx / Math.max(n - 1, 1)) * W;
        const d = new Date(r.bucket_ts);
        return { x, label: `${d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}` };
      })
      .slice(0, 6);
  }

  // Phase balance line chart
  readonly PH_W = 520; readonly PH_H = 140;

  get phaseLineData(): { color: string; label: string; points: string }[] {
    const series = this._sampleSeries(50);
    if (!series.length) return [];
    const W = this.PH_W, H = this.PH_H;
    const vals = series.flatMap(r => [r.avg_l1_amp || 0, r.avg_l2_amp || 0, r.avg_l3_amp || 0]);
    const maxVal = Math.max(...vals);
    if (!maxVal) return [];

    const phases = [
      { key: 'avg_l1_amp', color: '#00e676', label: 'A Phase' },
      { key: 'avg_l2_amp', color: '#29b6f6', label: 'B Phase' },
      { key: 'avg_l3_amp', color: '#ef5350', label: 'C Phase' },
    ];
    return phases.map(p => ({
      color: p.color, label: p.label,
      points: this._polyline(series, p.key, W, H, maxVal),
    }));
  }

  get phaseAvgLine(): string {
    const series = this._sampleSeries(50);
    if (!series.length) return '';
    const W = this.PH_W, H = this.PH_H;
    const avgSeries = series.map(r => ({
      avg_phase: ((r.avg_l1_amp || 0) + (r.avg_l2_amp || 0) + (r.avg_l3_amp || 0)) / 3,
    }));
    const maxVal = Math.max(...avgSeries.map(r => r.avg_phase));
    return this._polyline(avgSeries, 'avg_phase', W, H, maxVal);
  }

  // Neutral current trend
  readonly NT_W = 460; readonly NT_H = 120;

  get neutralTrendLine(): string {
    const series = this._sampleSeries(50);
    if (!series.length) return '';
    const W = this.NT_W, H = this.NT_H;
    const maxVal = Math.max(...series.map(r => r.neutral_amp || 0));
    return this._polyline(series, 'neutral_amp', W, H, maxVal || 1);
  }

  // ── Asset table from breakdown ─────────────────────────────────────────────

  get assetRows(): any[] {
    return this.breakdown.map(r => ({
      name:          `Meter #${r.meter_id}`,
      totalAmp:      r.avg_total_amp    != null ? +r.avg_total_amp.toFixed(0)    : null,
      productiveAmp: r.avg_productive_amp != null ? +r.avg_productive_amp.toFixed(0) : null,
      reactiveAmp:   r.avg_reactive_amp  != null ? +r.avg_reactive_amp.toFixed(0)  : null,
      harmonicAmp:   r.avg_harmonic_amp  != null ? +r.avg_harmonic_amp.toFixed(0)  : null,
      imbalancePct:  r.avg_imbalance_pct != null ? +r.avg_imbalance_pct.toFixed(1) : null,
      neutralAmp:    r.avg_neutral_amp   != null ? +r.avg_neutral_amp.toFixed(0)   : null,
      cbi:           r.avg_cbi_score     != null ? +r.avg_cbi_score.toFixed(0)     : null,
      cbiRating:     r.cbi_rating,
      productivePct: r.avg_total_amp > 0 ? ((r.avg_productive_amp / r.avg_total_amp) * 100).toFixed(0) : null,
      reactivePct:   r.avg_total_amp > 0 ? ((r.avg_reactive_amp   / r.avg_total_amp) * 100).toFixed(0) : null,
      harmonicPct:   r.avg_total_amp > 0 ? ((r.avg_harmonic_amp   / r.avg_total_amp) * 100).toFixed(0) : null,
    }));
  }

  cbiRowColor(score: number): string {
    if (score >= 90) return '#00e676'; if (score >= 70) return '#ffd740'; return '#ef5350';
  }

  // ── Key Insights ───────────────────────────────────────────────────────────

  get insights(): { icon: string; color: string; text: string }[] {
    if (!this.summary) return [];
    const out: { icon: string; color: string; text: string }[] = [];
    const prod = this.productivePct;
    const harm = this.harmonicPct;
    const react = this.reactivePct;
    const imb  = this.imbalancePct;
    const neu  = this.neutralPct;
    const pf   = this.powerFactor;

    if (prod > 0) {
      out.push({ icon: 'fa-check-circle', color: '#00e676',
        text: `Productive current is ${prod.toFixed(1)}% of total load — ${prod >= 75 ? 'strong utilization' : 'optimization opportunity'}.` });
    }
    if (harm > 0 && harm < 15) {
      out.push({ icon: 'fa-check-circle', color: '#00e676',
        text: `Harmonic current (THD) is within IEEE 519 limits at ${harm.toFixed(1)}%.` });
    }
    if (harm >= 15) {
      out.push({ icon: 'fa-exclamation-circle', color: '#ffd740',
        text: `Harmonic current is ${harm.toFixed(1)}% — above IEEE 519 limit of 15%. APF recommended.` });
    }
    if (imb > 0 && imb <= 5) {
      out.push({ icon: 'fa-check-circle', color: '#00e676',
        text: `Phase current balance is good. Maximum imbalance is ${imb.toFixed(1)}%.` });
    }
    if (imb > 5) {
      out.push({ icon: 'fa-exclamation-circle', color: '#ffd740',
        text: `Phase imbalance is ${imb.toFixed(1)}% — exceeds 5% threshold. Load balancing recommended.` });
    }
    if (neu > 0) {
      out.push({ icon: 'fa-info-circle', color: '#29b6f6',
        text: `Neutral current is ${neu.toFixed(1)}% of phase average.` });
    }
    if (pf > 0 && pf >= 0.95) {
      out.push({ icon: 'fa-check-circle', color: '#00e676',
        text: `Excellent power factor of ${pf.toFixed(3)} — no correction needed.` });
    }
    if (pf > 0 && pf < 0.95) {
      out.push({ icon: 'fa-exclamation-circle', color: '#ffd740',
        text: `Power factor of ${pf.toFixed(3)} contributing to ${react.toFixed(1)}% reactive burden.` });
    }
    if (this.cbiScore > 0) {
      out.push({ icon: 'fa-check-circle', color: this.cbiGaugeColor,
        text: `Excellent current balance contributing to ${this.cbiScore.toFixed(0)} CBI™ rating.` });
    }
    return out.length ? out : [
      { icon: 'fa-info-circle', color: '#546e7a',
        text: 'Install PQ meters and run CBI calculation to generate insights.' }
    ];
  }

  // ── Optimization opportunities ─────────────────────────────────────────────

  get opportunities(): { label: string; gain: string }[] {
    const out: { label: string; gain: string }[] = [];
    if (this.reactivePct > 25) {
      out.push({ label: 'Power Factor Correction', gain: `+${((this.reactivePct) * 0.4).toFixed(0)}% CBI` });
    }
    if (this.harmonicPct > 15) {
      out.push({ label: 'Active Harmonic Filter (APF)', gain: `+${((this.harmonicPct) * 0.6).toFixed(0)}% CBI` });
    }
    if (this.imbalancePct > 5) {
      out.push({ label: 'Load Balancing', gain: `+${((this.imbalancePct) * 0.5).toFixed(0)}% CBI` });
    }
    return out;
  }

  get hasData(): boolean { return this.timeseries.length > 0; }
}
