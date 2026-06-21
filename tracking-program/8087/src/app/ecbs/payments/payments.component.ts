import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
})
export class PaymentsComponent implements OnInit {

  activeTab = 'all';
  showRecordModal = false;
  selectedPayment: any = null;
  loading = true;
  projectId: number;
  clientName = '';

  // No payments recorded yet — populated as payments are entered
  payments: any[] = [];
  upcomingPayments: any[] = [];

  newPayment = { customer: '', invoiceId: '', amount: null, method: 'ACH', date: '', notes: '' };

  constructor(
    private api: ApiRequestService,
    private userService: CurrentUserService,
  ) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject as any;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.clientName = (p.client && typeof p.client === 'object')
      ? p.client.name
      : (p.clientName || p.client || p.name || '');
    this.newPayment.customer = this.clientName;
    this.loading = false;
  }

  // ── KPIs derived from actual payment records ────────────────────────────────

  get totalPaymentsAmount(): number { return this.payments.reduce((s, p) => s + (p.amount || 0), 0); }
  get onTimeCount(): number { return this.payments.filter(p => p.status === 'Matched').length; }
  get onTimeRate(): string {
    if (!this.payments.length) { return '—'; }
    return ((this.onTimeCount / this.payments.length) * 100).toFixed(1) + '%';
  }
  get onTimeRatePct(): number {
    if (!this.payments.length) { return 0; }
    return (this.onTimeCount / this.payments.length) * 100;
  }
  get onTimeAmt(): number { return this.payments.filter(p => p.status === 'Matched').reduce((s, p) => s + (p.amount || 0), 0); }
  get lateAmt(): number  { return this.payments.filter(p => p.status === 'Partial').reduce((s, p) => s + (p.amount || 0), 0); }
  get unmatchedAmt(): number { return this.payments.filter(p => p.status === 'Unmatched').reduce((s, p) => s + (p.amount || 0), 0); }
  get onTimePct(): number { return this.totalPaymentsAmount ? (this.onTimeAmt / this.totalPaymentsAmount) * 100 : 0; }
  get latePct(): number  { return this.totalPaymentsAmount ? (this.lateAmt / this.totalPaymentsAmount) * 100 : 0; }
  get unmatchedPct(): number { return this.totalPaymentsAmount ? (this.unmatchedAmt / this.totalPaymentsAmount) * 100 : 0; }
  // Gauge arc: 188px circumference, offset controls fill (0=full, 188=empty)
  get gaugeOffset(): number { return 188 - (this.onTimePct / 100) * 188; }
  get avgPaymentAmount(): string {
    if (!this.payments.length) { return '—'; }
    const avg = this.totalPaymentsAmount / this.payments.length;
    return '$' + avg.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  private fmt(n: number): string {
    if (!n) return '$0';
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000)    return '$' + Math.round(n / 1000) + 'K';
    return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  get kpis() {
    return [
      { label: 'PAYMENTS THIS PERIOD (MTD)', value: this.fmt(this.totalPaymentsAmount), change: this.payments.length ? String(this.payments.length) + ' payments' : 'No payments received', dir: 'neutral', color: '#4caf50', icon: 'fa-dollar' },
      { label: 'PAYMENTS COUNT (MTD)', value: String(this.payments.length), change: '', dir: 'neutral', color: '#29b6f6', icon: 'fa-list' },
      { label: 'AVERAGE PAYMENT AMOUNT', value: this.avgPaymentAmount, change: '', dir: 'neutral', color: '#ce93d8', icon: 'fa-bar-chart' },
      { label: 'ON-TIME PAYMENT RATE', value: this.onTimeRate, change: '', dir: this.payments.length ? 'up' : 'neutral', color: '#ff7043', icon: 'fa-clock-o' },
      { label: 'DAYS TO PROCESS', value: '—', change: '', dir: 'neutral', color: '#ffd740', icon: 'fa-calendar' },
      { label: 'PAYMENTS OUTSTANDING', value: '$0', change: 'No invoices issued', dir: 'neutral', color: '#ef5350', icon: 'fa-exclamation-triangle' },
    ];
  }

  get filteredPayments() {
    if (this.activeTab === 'all') { return this.payments; }
    return this.payments.filter(p => p.status.toLowerCase() === this.activeTab);
  }

  statusColor(s: string): string {
    const m = { 'Matched': '#00e676', 'Partial': '#ffd740', 'Unmatched': '#ef5350' };
    return m[s] || '#546e7a';
  }

  methodColor(m: string): string {
    const c = { 'ACH': '#29b6f6', 'Wire': '#ce93d8', 'Check': '#ffd740', 'Card': '#ff7043' };
    return c[m] || '#546e7a';
  }

  selectPayment(p: any) { this.selectedPayment = p; }

  savePayment() {
    const p = {
      ...this.newPayment,
      id: 'PAY-' + (10000 + this.payments.length + 1),
      status: 'Unmatched',
      matchPct: 0,
      bank: '—',
      ref: '—',
    };
    this.payments.unshift(p as any);
    this.showRecordModal = false;
    this.newPayment = { customer: this.clientName, invoiceId: '', amount: null, method: 'ACH', date: '', notes: '' };
    this.selectedPayment = this.payments[0];
  }

  // Method breakdown donut — computed from actual payment records
  get methodChartData() {
    if (!this.payments.length) { return []; }
    const colors: any = { ACH: '#29b6f6', Wire: '#ce93d8', Check: '#ffd740', Card: '#ff7043', Other: '#546e7a' };
    const totals: any = { ACH: 0, Wire: 0, Check: 0, Card: 0, Other: 0 };
    this.payments.forEach(p => {
      if (totals[p.method] !== undefined) { totals[p.method] += p.amount; }
      else { totals['Other'] += p.amount; }
    });
    const total = Object.keys(totals).reduce((a, k) => a + totals[k], 0) as number;
    if (!total) { return []; }
    let offset = 0;
    return Object.keys(totals).filter(k => totals[k] > 0).map(k => {
      const pct = (totals[k] / total) * 100;
      const seg = { label: k, amount: totals[k], pct: Math.round(pct), offset, color: colors[k] };
      offset += pct;
      return seg;
    });
  }

  describeArc(pct: number, offset: number): string {
    const r = 50; const cx = 60; const cy = 60;
    const startAngle = (offset / 100) * 360 - 90;
    const endAngle = ((offset + pct) / 100) * 360 - 90;
    const x1 = cx + r * Math.cos(startAngle * Math.PI / 180);
    const y1 = cy + r * Math.sin(startAngle * Math.PI / 180);
    const x2 = cx + r * Math.cos(endAngle * Math.PI / 180);
    const y2 = cy + r * Math.sin(endAngle * Math.PI / 180);
    const large = pct > 50 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  }
}
