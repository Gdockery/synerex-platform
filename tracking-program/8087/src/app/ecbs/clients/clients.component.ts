import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

interface EcbsClientRow {
  id: number;
  name: string;
  subtitle: string;
  contractNumber: string;
  sites: number;
  activeProjects: number;
  totalCapacityMw: number;
  annualSavings: number;
  status: string;
  joinedDate: Date | null;
  initials: string;
  iconClass: string;
}

@Component({
  selector: 'ecbs-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss'],
})
export class ClientsComponent implements OnInit {
  loading = true;
  clients: EcbsClientRow[] = [];
  projects: any[] = [];
  searchQuery = '';
  statusFilter = 'all';
  currentPage = 1;
  pageSize = 10;
  dateFrom = '2026-05-12';
  dateTo = '2026-05-18';

  sidebarDevicesOpen = true;
  alarmTotal = 3;
  cbiScore = 96;

  constructor(
    private api: ApiRequestService,
    private router: Router,
    public currentUserService: CurrentUserService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.api.get('/api/client/', this.api.createRequestParams({ page: 1, pageSize: 200 })).subscribe({
      next: (clientResp: any) => {
        const rawClients = this.unwrapList(clientResp);
        this.api.get('/api/project/', this.api.createRequestParams({ page: 1, pageSize: 500 })).subscribe({
          next: (projectResp: any) => {
            this.projects = this.unwrapList(projectResp);
            this.clients = rawClients.map((client: any, index: number) => this.toClientRow(client, index));
            this.loading = false;
          },
          error: () => {
            this.clients = rawClients.map((client: any, index: number) => this.toClientRow(client, index));
            this.loading = false;
          }
        });
      },
      error: () => {
        this.clients = [];
        this.loading = false;
      }
    });
  }

  private unwrapList(resp: any): any[] {
    if (Array.isArray(resp)) return resp;
    return resp && (resp.response || resp.data || resp.items || resp.clients || resp.projects) || [];
  }

  private toClientRow(client: any, index: number): EcbsClientRow {
    const id = Number(client.id || 0);
    const clientProjects = this.projects.filter(p => this.projectBelongsToClient(p, id, client));
    const activeProjects = clientProjects.filter(p => this.isProjectActive(p)).length;
    const sites = clientProjects.length || Number(client.siteCount || client.sites || 0);
    const capacityKw = clientProjects.reduce((sum, p) => sum + this.projectCapacityKw(p), 0);
    const annualSavings = clientProjects.reduce((sum, p) => sum + this.projectAnnualSavings(p), 0);
    const name = client.legalName || client.name || client.companyName || 'Unnamed Client';

    return {
      id,
      name,
      subtitle: client.industry || client.vertical || client.type || client.businessType || 'Client',
      contractNumber: client.contractNumber || client.contract_number || client.oemContractNumber || this.contractNumber(id, index),
      sites,
      activeProjects: activeProjects || Number(client.activeProjects || client.projectCount || 0),
      totalCapacityMw: capacityKw / 1000,
      annualSavings: annualSavings || Number(client.annualSavings || client.annual_savings || 0),
      status: client.status || (client.isDeleted ? 'Inactive' : 'Active'),
      joinedDate: this.parseDate(client.createdAt || client.created_at || client.joinedDate),
      initials: this.initials(name),
      iconClass: 'cl-logo-' + (index % 10),
    };
  }

  private projectBelongsToClient(project: any, clientId: number, client: any): boolean {
    const projectClient = project.client;
    if (typeof projectClient === 'object' && projectClient && Number(projectClient.id) === clientId) return true;
    if (Number(projectClient) === clientId) return true;
    if (Number(project.client_id || project.clientId) === clientId) return true;
    const projectClientName = (project.clientName || project.client_name || '').toLowerCase();
    const clientName = (client.legalName || client.name || '').toLowerCase();
    return !!projectClientName && !!clientName && projectClientName === clientName;
  }

  private isProjectActive(project: any): boolean {
    const status = String(project.status || project.release_status || project.releaseStatus || '').toLowerCase();
    return !status || ['active', 'released', 'in progress', 'approved', 'installed'].indexOf(status) >= 0;
  }

  private projectCapacityKw(project: any): number {
    const proposal = project.proposalData || {};
    return Number(
      project.totalCapacityKw ||
      project.capacityKw ||
      project.installedKw ||
      proposal.totalCapacityKw ||
      proposal.installedKw ||
      0
    );
  }

  private projectAnnualSavings(project: any): number {
    const proposal = project.proposalData || {};
    return Number(
      project.annualSavings ||
      project.annual_savings ||
      proposal.annualSavings ||
      proposal.annual_savings ||
      0
    );
  }

  private contractNumber(id: number, index: number): string {
    const raw = String(id || index + 1);
    return 'XC-OEM-2024-' + ('000' + raw).slice(-3);
  }

  private initials(name: string): string {
    const words = String(name || '').split(/\s+/).filter(Boolean);
    if (!words.length) return 'CL';
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  get filteredClients(): EcbsClientRow[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.clients.filter(c => {
      const matchesSearch = !q || [c.name, c.subtitle, c.contractNumber].join(' ').toLowerCase().indexOf(q) >= 0;
      const matchesStatus = this.statusFilter === 'all' || c.status.toLowerCase() === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  get pagedClients(): EcbsClientRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredClients.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredClients.length / this.pageSize));
  }

  get totalClients(): number { return this.clients.length; }
  get totalSites(): number { return this.clients.reduce((sum, c) => sum + c.sites, 0); }
  get activeProjects(): number { return this.clients.reduce((sum, c) => sum + c.activeProjects, 0); }
  get totalCapacityMw(): number { return this.clients.reduce((sum, c) => sum + c.totalCapacityMw, 0); }
  get annualSavings(): number { return this.clients.reduce((sum, c) => sum + c.annualSavings, 0); }

  page(n: number) {
    this.currentPage = Math.min(Math.max(1, n), this.totalPages);
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  nav(path: string) {
    this.router.navigate(['/ecbs', path]);
  }

  editClient(client: EcbsClientRow) {
    if (!client.id) return;
    this.router.navigate(['/project/client/edit', client.id]);
  }

  addClient() {
    this.router.navigate(['/project/client/create']);
  }

  exportCsv() {
    const rows = [
      ['Client Name', 'Contract Number', 'Sites', 'Active Projects', 'Total Capacity MW', 'Status', 'Joined Date'],
      ...this.filteredClients.map(c => [
        c.name,
        c.contractNumber,
        String(c.sites),
        String(c.activeProjects),
        c.totalCapacityMw.toFixed(1),
        c.status,
        this.formatDate(c.joinedDate),
      ])
    ];
    const csv = rows.map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ecbs-clients.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  formatMoney(value: number): string {
    if (!value) return '$0';
    if (Math.abs(value) >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M';
    if (Math.abs(value) >= 1000) return '$' + (value / 1000).toFixed(1) + 'K';
    return '$' + Math.round(value).toLocaleString();
  }

  formatDate(date: Date | null): string {
    if (!date) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  userInitials(): string {
    const user: any = this.currentUserService.user || {};
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'JS';
    return this.initials(name).slice(0, 2);
  }

  userName(): string {
    const user: any = this.currentUserService.user || {};
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'John Smith';
  }
}
