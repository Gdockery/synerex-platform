import { Component, OnInit } from '@angular/core';

// Real data — Ochsner Ortho Lafayette (project 13)
// No payments have been received. Payment table is empty.
// Donut and timeliness charts show "no data" state.
// Upcoming payments = outstanding invoices (none yet).

@Component({
  selector: 'ecbs-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
})
export class PaymentsComponent implements OnInit {

  activeTab = 'all';
  showRecordModal = false;
  selectedPayment: any = null;

  // All $0 / 0 — no payments received.
  kpis = [
    { label: 'PAYMENTS THIS PERIOD (MTD)', value: '$0', change: 'No payments received', dir: 'neutral', color: '#4caf50', icon: 'fa-dollar' },
    { label: 'PAYMENTS COUNT (MTD)', value: '0', change: '', dir: 'neutral', color: '#29b6f6', icon: 'fa-list' },
    { label: 'AVERAGE PAYMENT AMOUNT', value: '—', change: 'No payments yet', dir: 'neutral', color: '#ce93d8', icon: 'fa-bar-chart' },
    { label: 'ON-TIME PAYMENT RATE', value: '—', change: 'No payments yet', dir: 'neutral', color: '#ff7043', icon: 'fa-clock-o' },
    { label: 'DAYS TO PROCESS', value: '—', change: '', dir: 'neutral', color: '#ffd740', icon: 'fa-calendar' },
    { label: 'PAYMENTS OUTSTANDING', value: '$0', change: 'No invoices issued', dir: 'neutral', color: '#ef5350', icon: 'fa-exclamation-triangle' },
  ];

  // No payments recorded yet.
  payments: any[] = [];

  // No upcoming payments (no invoices issued).
  upcomingPayments: any[] = [];

  newPayment = { customer: 'Ochsner Health System', invoiceId: '', amount: null, method: 'ACH', date: '', notes: '' };

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
    this.newPayment = { customer: 'Ochsner Health System', invoiceId: '', amount: null, method: 'ACH', date: '', notes: '' };
  }

  // Method chart: derived from actual payments array.
  // Returns empty array when no payments recorded.
  get methodChartData() {
    if (this.payments.length === 0) { return []; }
    const colors = { ACH: '#29b6f6', Wire: '#ce93d8', Check: '#ffd740', Card: '#ff7043', Other: '#546e7a' };
    const totals: any = { ACH: 0, Wire: 0, Check: 0, Card: 0, Other: 0 };
    this.payments.forEach(p => {
      if (totals[p.method] !== undefined) { totals[p.method] += p.amount; }
      else { totals['Other'] += p.amount; }
    });
    const total = Object.keys(totals).reduce((a, k) => a + totals[k], 0) as number;
    if (total === 0) { return []; }
    let offset = 0;
    return Object.keys(totals).map(k => {
      const pct = (totals[k] / total) * 100;
      const seg = { label: k, amount: totals[k], pct: Math.round(pct), offset, color: colors[k] };
      offset += pct;
      return seg;
    });
  }

  get totalPaymentsAmount(): number {
    return this.payments.reduce((s, p) => s + (p.amount || 0), 0);
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

  ngOnInit() {
    this.selectedPayment = this.payments.length > 0 ? this.payments[0] : null;
  }
}
