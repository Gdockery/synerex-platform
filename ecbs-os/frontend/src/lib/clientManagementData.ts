export type ClientManagementData = {
  clients: ClientManagementClientRow[];
  clientKpis: ClientManagementKpi[];
  message: string;
  projects: ClientManagementProjectRow[];
  projectKpis: ClientManagementKpi[];
  selectedClient: ClientManagementSelectedClient;
  state: "data" | "no-data";
  updatedAt: string;
};

export type ClientManagementClientRow = {
  activeProjects: string;
  contractNumber: string;
  industry: string;
  joinedDate: string;
  name: string;
  sites: string;
  status: string;
  totalCapacity: string;
};

export type ClientManagementKpi = {
  detail: string;
  icon: string;
  label: string;
  tone: "blue" | "cyan" | "green" | "yellow";
  value: string;
};

export type ClientManagementProjectRow = {
  capacity: string;
  location: string;
  name: string;
  progress: string;
  siteType: string;
  startDate: string;
  status: string;
  targetCompletion: string;
};

export type ClientManagementSelectedClient = {
  accountManager: string;
  activeProjects: string;
  address: string;
  annualSavings: string;
  clientSince: string;
  completedProjects: string;
  contractNumber: string;
  currency: string;
  email: string;
  industry: string;
  legalName: string;
  mobile: string;
  name: string;
  phone: string;
  primaryContactName: string;
  primaryContactTitle: string;
  status: string;
  taxId: string;
  timeZone: string;
  totalCapacity: string;
  totalSites: string;
  website: string;
};
