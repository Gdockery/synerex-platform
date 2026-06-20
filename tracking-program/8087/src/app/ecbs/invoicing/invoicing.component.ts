import { Component, OnInit } from '@angular/core';

// Real data — Ochsner Ortho Lafayette (project 13)
// Invoice schedule: 30% deposit, 30% installation, 40% final (per "how it all fits.txt").
// Contract value (totalCost) = $0 — not entered yet.
// All invoice amounts = 0 until contract value is set.
// No invoices have been issued yet.

@Component({
  selector: 'ecbs-invoicing',
  templateUrl: './invoicing.component.html',
  styleUrls: ['./invoicing.component.scss'],
})
export class InvoicingComponent implements OnInit {

  activeTab = 'all';
  showCreateModal = false;
  selectedInvoice: any = null;

  // All $0 — contract value not entered.
  // Formula: Invoice amount = invoice_pct × project_totalCost.
  kpis = [
    { label: 'INVOICES CREATED', value: '0', change: 'No invoices yet', dir: 'neutral', color: '#29b6f6' },
    { label: 'TOTAL INVOICED', value: '$0', change: 'Enter contract value', dir: 'neutral', color: '#4caf50' },
    { label: 'OUTSTANDING', value: '$0', change: '', dir: 'neutral', color: '#ffd740' },
    { label: 'OVERDUE', value: '$0', change: '', dir: 'neutral', color: '#ef5350' },
    { label: 'AVG DAYS TO PAY', value: '—', change: 'No paid invoices', dir: 'neutral', color: '#ce93d8' },
    { label: 'PAID THIS MONTH', value: '$0', change: '', dir: 'neutral', color: '#00e676' },
  ];

  // No invoices issued yet. Will be created when contract value is entered.
  // The "Create Invoice" button lets users manually add invoices.
  invoices: any[] = [];

  newInvoice = { customer: 'Ochsner Health System', jobId: 'JOB-2025-001', amount: null, dueDate: '', notes: '' };

  get filteredInvoices() {
    if (this.activeTab === 'all') { return this.invoices; }
    return this.invoices.filter(i => i.status.toLowerCase() === this.activeTab);
  }

  statusColor(s: string): string {
    const m = { 'Paid': '#00e676', 'Sent': '#29b6f6', 'Partial': '#ffd740', 'Overdue': '#ef5350', 'Draft': '#546e7a' };
    return m[s] || '#546e7a';
  }

  saveInvoice() {
    const num = this.invoices.length + 1;
    const id = 'INV-2025-' + (num < 10 ? '00' + num : num < 100 ? '0' + num : '' + num);
    const today = new Date();
    const issued = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
    this.invoices.unshift({
      ...this.newInvoice,
      id,
      issued,
      due: this.newInvoice.dueDate,
      status: 'Draft',
      paymentMethod: '—',
      daysLeft: 30,
    } as any);
    this.showCreateModal = false;
    this.newInvoice = { customer: 'Ochsner Health System', jobId: 'JOB-2025-001', amount: null, dueDate: '', notes: '' };
  }

  selectInvoice(inv: any) { this.selectedInvoice = inv; }

  ngOnInit() {
    this.selectedInvoice = this.invoices.length > 0 ? this.invoices[0] : null;
  }
}
