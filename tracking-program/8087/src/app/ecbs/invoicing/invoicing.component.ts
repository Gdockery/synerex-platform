import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ecbs-invoicing',
  templateUrl: './invoicing.component.html',
  styleUrls: ['./invoicing.component.scss'],
})
export class InvoicingComponent implements OnInit {

  activeTab = 'all';
  showCreateModal = false;
  selectedInvoice: any = null;

  kpis = [
    { label: 'INVOICES THIS PERIOD', value: '86', change: '+12.3%', dir: 'up', color: '#29b6f6' },
    { label: 'TOTAL INVOICED (MTD)', value: '$4.12M', change: '+18.7%', dir: 'up', color: '#4caf50' },
    { label: 'OUTSTANDING', value: '$1.24M', change: '-12.6%', dir: 'down', color: '#ffd740' },
    { label: 'OVERDUE', value: '$80K', change: '-18.4%', dir: 'down', color: '#ef5350' },
    { label: 'AVG DAYS TO PAY', value: '18.3', change: '-0.4', dir: 'up', color: '#ce93d8' },
    { label: 'PAID THIS MONTH', value: '$2.88M', change: '+22.1%', dir: 'up', color: '#00e676' },
  ];

  invoices = [
    { id: 'INV-1042', customer: 'Flex Ltd.', jobId: 'JOB-2025-002', amount: 184500, issued: 'Jun 18, 2025', due: 'Jul 18, 2025', status: 'Sent', paymentMethod: 'ACH', daysLeft: 29 },
    { id: 'INV-1041', customer: 'Tesla Inc.', jobId: 'JOB-2025-003', amount: 162300, issued: 'Jun 17, 2025', due: 'Jul 17, 2025', status: 'Sent', paymentMethod: 'Wire', daysLeft: 28 },
    { id: 'INV-1040', customer: 'Flex Juarez North', jobId: 'JOB-2025-001', amount: 210750, issued: 'Jun 16, 2025', due: 'Jul 16, 2025', status: 'Paid', paymentMethod: 'Check', daysLeft: 0 },
    { id: 'INV-1039', customer: 'Apple Inc.', jobId: 'JOB-2025-005', amount: 198600, issued: 'Jun 16, 2025', due: 'Jul 16, 2025', status: 'Paid', paymentMethod: 'ACH', daysLeft: 0 },
    { id: 'INV-1038', customer: 'Medtronic', jobId: 'JOB-2025-004', amount: 86200, issued: 'Jun 15, 2025', due: 'Jul 15, 2025', status: 'Partial', paymentMethod: 'ACH', daysLeft: 26 },
    { id: 'INV-1037', customer: 'Bosch', jobId: 'JOB-2025-006', amount: 120400, issued: 'Jun 14, 2025', due: 'Jul 14, 2025', status: 'Paid', paymentMethod: 'Wire', daysLeft: 0 },
    { id: 'INV-1036', customer: 'Samsung', jobId: 'JOB-2025-007', amount: 146800, issued: 'Jun 13, 2025', due: 'Jun 30, 2025', status: 'Overdue', paymentMethod: 'Card', daysLeft: -19 },
    { id: 'INV-1035', customer: 'Nike', jobId: 'JOB-2025-008', amount: 98700, issued: 'Jun 12, 2025', due: 'Jul 12, 2025', status: 'Draft', paymentMethod: '—', daysLeft: 23 },
  ];

  newInvoice = { customer: '', jobId: '', amount: null, dueDate: '', notes: '' };

  get filteredInvoices() {
    if (this.activeTab === 'all') { return this.invoices; }
    return this.invoices.filter(i => i.status.toLowerCase() === this.activeTab);
  }

  statusColor(s: string): string {
    const m = { 'Paid': '#00e676', 'Sent': '#29b6f6', 'Partial': '#ffd740', 'Overdue': '#ef5350', 'Draft': '#546e7a' };
    return m[s] || '#546e7a';
  }

  saveInvoice() {
    const id = 'INV-' + (1043 + this.invoices.length);
    this.invoices.unshift({ ...this.newInvoice, id, issued: 'Jun 19, 2025', due: this.newInvoice.dueDate, status: 'Draft', paymentMethod: '—', daysLeft: 30 } as any);
    this.showCreateModal = false;
    this.newInvoice = { customer: '', jobId: '', amount: null, dueDate: '', notes: '' };
  }

  selectInvoice(inv: any) { this.selectedInvoice = inv; }

  ngOnInit() { this.selectedInvoice = this.invoices[0]; }
}
