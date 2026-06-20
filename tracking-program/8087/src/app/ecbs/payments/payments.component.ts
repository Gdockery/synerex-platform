import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ecbs-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
})
export class PaymentsComponent implements OnInit {

  activeTab = 'all';
  showRecordModal = false;
  selectedPayment: any = null;

  kpis = [
    { label: 'PAYMENTS THIS PERIOD (MTD)', value: '$4.12M', change: '+18.7%', dir: 'up', color: '#4caf50', icon: 'fa-dollar' },
    { label: 'PAYMENTS COUNT (MTD)', value: '86', change: '+12.3%', dir: 'up', color: '#29b6f6', icon: 'fa-list' },
    { label: 'AVERAGE PAYMENT AMOUNT', value: '$47,930', change: '+9.6%', dir: 'up', color: '#ce93d8', icon: 'fa-bar-chart' },
    { label: 'ON-TIME PAYMENT RATE', value: '92.4%', change: '+6.1%', dir: 'up', color: '#ff7043', icon: 'fa-clock-o' },
    { label: 'DAYS TO PROCESS', value: '1.8 Days', change: '-0.4 Days Faster', dir: 'up', color: '#ffd740', icon: 'fa-calendar' },
    { label: 'PAYMENTS OUTSTANDING', value: '$1.24M', change: '-12.6%', dir: 'down', color: '#ef5350', icon: 'fa-exclamation-triangle' },
  ];

  payments = [
    { id: 'PAY-10087', customer: 'Flex Ltd.', invoiceId: 'INV-1042', date: 'May 18, 2025', method: 'ACH', amount: 184500, status: 'Matched', matchPct: 100, bank: 'JPMorgan Chase', ref: 'ACH63829172', notes: 'Payment received on time.' },
    { id: 'PAY-10086', customer: 'Tesla, Inc.', invoiceId: 'INV-1041', date: 'May 17, 2025', method: 'Wire', amount: 162300, status: 'Matched', matchPct: 100, bank: 'Bank of America', ref: 'WIRE99021', notes: '' },
    { id: 'PAY-10085', customer: 'Apple Inc.', invoiceId: 'INV-1039', date: 'May 16, 2025', method: 'ACH', amount: 198600, status: 'Matched', matchPct: 100, bank: 'Wells Fargo', ref: 'ACH55902', notes: '' },
    { id: 'PAY-10084', customer: 'Flex Juarez North', invoiceId: 'INV-1040', date: 'May 16, 2025', method: 'Check', amount: 210750, status: 'Matched', matchPct: 100, bank: 'Citibank', ref: 'CHK-48291', notes: '' },
    { id: 'PAY-10083', customer: 'Medtronic', invoiceId: 'INV-1038', date: 'May 15, 2025', method: 'ACH', amount: 64650, status: 'Partial', matchPct: 75, bank: 'US Bank', ref: 'ACH44821', notes: 'Partial payment — balance due.' },
    { id: 'PAY-10082', customer: 'Bosch', invoiceId: 'INV-1037', date: 'May 14, 2025', method: 'Wire', amount: 120400, status: 'Matched', matchPct: 100, bank: 'Deutsche Bank', ref: 'WIRE88201', notes: '' },
    { id: 'PAY-10081', customer: 'Samsung', invoiceId: 'INV-1036', date: 'May 13, 2025', method: 'Wire', amount: 146800, status: 'Matched', matchPct: 100, bank: 'Chase', ref: 'WIRE77110', notes: '' },
    { id: 'PAY-10080', customer: 'Nike', invoiceId: 'INV-1035', date: 'May 12, 2025', method: 'Card', amount: 98700, status: 'Unmatched', matchPct: 0, bank: 'Amex', ref: 'CARD-2901', notes: 'Invoice not found — manual review needed.' },
  ];

  upcomingPayments = [
    { customer: 'Flex Juarez South', due: 'May 22, 2025', amount: 189200, daysLeft: 4 },
    { customer: 'Medtronic', due: 'May 24, 2025', amount: 96800, daysLeft: 6 },
    { customer: 'Bosch', due: 'May 25, 2025', amount: 112300, daysLeft: 7 },
    { customer: 'Samsung', due: 'May 27, 2025', amount: 148600, daysLeft: 9 },
    { customer: 'Apple Inc.', due: 'May 30, 2025', amount: 205400, daysLeft: 12 },
  ];

  newPayment = { customer: '', invoiceId: '', amount: null, method: 'ACH', date: '', notes: '' };

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
    const p = { ...this.newPayment, id: 'PAY-' + (10088 + this.payments.length), status: 'Unmatched', matchPct: 0, bank: '—', ref: '—' };
    this.payments.unshift(p as any);
    this.showRecordModal = false;
    this.newPayment = { customer: '', invoiceId: '', amount: null, method: 'ACH', date: '', notes: '' };
  }

  // Chart helpers — MTD totals across all 86 payments (not just the 8 shown rows)
  readonly methodMtdTotals = [
    { label: 'ACH',   amount: 1920000, color: '#29b6f6' },
    { label: 'Wire',  amount: 1260000, color: '#ce93d8' },
    { label: 'Check', amount:  540000, color: '#ffd740' },
    { label: 'Card',  amount:  210000, color: '#ff7043' },
    { label: 'Other', amount:  190000, color: '#546e7a' },
  ];

  get methodChartData() {
    const total = 4120000;
    let offset = 0;
    return this.methodMtdTotals.map(m => {
      const pct = (m.amount / total) * 100;
      const seg = { label: m.label, amount: m.amount, pct: Math.round(pct), offset, color: m.color };
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

  ngOnInit() { this.selectedPayment = this.payments[0]; }
}
