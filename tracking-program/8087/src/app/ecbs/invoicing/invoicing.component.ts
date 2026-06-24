import { fmtCurrency as fmt } from '../../shared/helpers/ecbs-format.helpers';
import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

// Invoice schedule: 30% deposit, 30% installation, 40% final (from "how it all fits.txt").
// Invoice amounts = invoice_pct × project.totalCost.
// All amounts are $0 until project cost is set and invoices are created.

@Component({
  selector: 'ecbs-invoicing',
  templateUrl: './invoicing.component.html',
  styleUrls: ['./invoicing.component.scss'],
})
export class InvoicingComponent implements OnInit {

  activeTab = 'all';
  showCreateModal = false;
  selectedInvoice: any = null;
  loading = true;
  projectId: number;
  clientName = '';

  // Raw API response
  savingsData: any = null;
  roiData: any = null;

  // Invoice records — none until manually created.
  // The "Create Invoice" button pre-fills amounts from project cost.
  invoices: any[] = [];

  newInvoice: any = { customer: '', jobId: '', amount: null, dueDate: '', notes: '' };

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
      : (p.clientName || p.client || '');

    this.newInvoice.customer = this.clientName || p.name;
    this.newInvoice.jobId = 'JOB-' + p.id + '-001';

    this.api.get(`/api/savings/intelligence?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.savingsData = r; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.api.get(`/api/roi?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.roiData = r?.data || r; },
      error: () => {},
    });
  }

  // ── Computed invoice amounts from project cost ──────────────────────────────

  get projectCost(): number  { return this.savingsData?.project_cost || this.roiData?.project_cost || 0; }
  readonly taxRate = 0.0825;  // Louisiana standard combined sales tax — update per project if needed
  get depositAmt(): number   { return Math.round(this.projectCost * 0.30); }
  get installAmt(): number   { return Math.round(this.projectCost * 0.30); }
  get finalAmt(): number     { return Math.round(this.projectCost * 0.40); }
  get totalInvoiced(): number { return this.invoices.reduce((s, i) => s + (i.amount || 0), 0); }
  get totalOutstanding(): number {
    return this.invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.amount || 0), 0);
  }
  get totalPaid(): number {
    return this.invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0);
  }
  get totalOverdue(): number {
    return this.invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + (i.amount || 0), 0);
  }



  get kpis() {
    return [
      { label: 'INVOICES CREATED', value: String(this.invoices.length), change: '', dir: 'neutral', color: '#29b6f6' },
      { label: 'TOTAL INVOICED', value: fmt(this.totalInvoiced), change: this.projectCost ? '30/30/40 of $' + this.projectCost.toLocaleString(undefined, {maximumFractionDigits:0}) : 'Enter project cost', dir: 'neutral', color: '#4caf50' },
      { label: 'OUTSTANDING', value: fmt(this.totalOutstanding), change: '', dir: 'neutral', color: '#ffd740' },
      { label: 'OVERDUE', value: fmt(this.totalOverdue), change: '', dir: 'neutral', color: '#ef5350' },
      { label: 'AVG DAYS TO PAY', value: '—', change: 'No paid invoices', dir: 'neutral', color: '#ce93d8' },
      { label: 'PAID THIS MONTH', value: fmt(this.totalPaid), change: '', dir: 'neutral', color: '#00e676' },
    ];
  }

  get filteredInvoices() {
    if (this.activeTab === 'all') { return this.invoices; }
    return this.invoices.filter(i => i.status.toLowerCase() === this.activeTab);
  }

  statusColor(s: string): string {
    const m = { 'Paid': '#00e676', 'Sent': '#29b6f6', 'Partial': '#ffd740', 'Overdue': '#ef5350', 'Draft': '#546e7a' };
    return m[s] || '#546e7a';
  }

  // Pre-fill modal with deposit amount when creating first invoice
  openCreateModal() {
    const num = this.invoices.length;
    // Auto-suggest amount based on invoice number: 1st=30%, 2nd=30%, 3rd+=40%
    if (num === 0) { this.newInvoice.amount = this.depositAmt || null; }
    else if (num === 1) { this.newInvoice.amount = this.installAmt || null; }
    else if (num === 2) { this.newInvoice.amount = this.finalAmt || null; }
    else { this.newInvoice.amount = null; }
    this.showCreateModal = true;
  }

  saveInvoice() {
    const num = this.invoices.length + 1;
    const padded = num < 10 ? '00' + num : num < 100 ? '0' + num : '' + num;
    const id = 'INV-' + this.projectId + '-' + padded;
    const today = new Date();
    const issued = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
    this.invoices.unshift({
      ...this.newInvoice,
      id,
      issued,
      due: this.newInvoice.dueDate || '—',
      status: 'Draft',
      paymentMethod: '—',
      daysLeft: 30,
    } as any);
    this.showCreateModal = false;
    this.newInvoice = { customer: this.clientName, jobId: 'JOB-' + this.projectId + '-001', amount: null, dueDate: '', notes: '' };
    this.selectedInvoice = this.invoices[0];
  }

  selectInvoice(inv: any) { this.selectedInvoice = inv; }
}
