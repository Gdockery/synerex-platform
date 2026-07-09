import type { ReactNode } from "react";
import { DashboardKpiCard, type DashboardKpi } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";

export type ClientManagementVariant = "details" | "list" | "new" | "newProjectReports" | "newProjectScanning" | "projects";

const clientKpis: DashboardKpi[] = [
  { icon: "C", label: "Total Clients", value: "14", detail: "Active clients", tone: "blue" },
  { icon: "S", label: "Total Sites", value: "48", detail: "Across all clients", tone: "green" },
  { icon: "P", label: "Active Projects", value: "67", detail: "In progress", tone: "cyan" },
  { icon: "M", label: "Total Capacity", value: "86.4 MW", detail: "Monitored capacity", tone: "blue" },
  { icon: "$", label: "Annual Savings", value: "$4.62M", detail: "Projected savings", tone: "yellow" },
];

const projectKpis: DashboardKpi[] = [
  { icon: "P", label: "Total Projects", value: "18", detail: "Across 12 sites", tone: "blue" },
  { icon: "C", label: "Total Capacity", value: "24.8 MW", detail: "Installed capacity", tone: "green" },
  { icon: "A", label: "Active Projects", value: "14", detail: "In progress", tone: "cyan" },
  { icon: "D", label: "Completed Projects", value: "3", detail: "This year", tone: "yellow" },
  { icon: "$", label: "Projected Savings (Annual)", value: "$1.42M", detail: "Across all projects", tone: "blue" },
];

const clients = [
  ["Flex Ltd.", "Global Manufacturing", "XC-OEM-2024-001", "12", "18", "24.8 MW", "Active", "Jan 15, 2024"],
  ["ABC Manufacturing Corp.", "Manufacturing", "XC-OEM-2024-002", "8", "11", "15.2 MW", "Active", "Feb 28, 2024"],
  ["Global Logistics Group", "Logistics & Distribution", "XC-OEM-2024-003", "6", "9", "12.6 MW", "Active", "Mar 10, 2024"],
  ["DataCenter One", "Data Centers", "XC-OEM-2024-004", "4", "7", "18.7 MW", "Active", "Apr 05, 2024"],
  ["Metro Health Systems", "Healthcare", "XC-OEM-2024-005", "5", "6", "8.1 MW", "Active", "Apr 22, 2024"],
  ["Greenfield University", "Education", "XC-OEM-2024-006", "3", "4", "5.3 MW", "Active", "May 02, 2024"],
  ["RetailMart Group", "Retail", "XC-OEM-2024-007", "2", "3", "3.4 MW", "Active", "May 18, 2024"],
  ["Pacific Industrial Co.", "Industrial", "XC-OEM-2024-008", "4", "5", "6.2 MW", "Active", "Jun 01, 2024"],
  ["PowerGrid Solutions", "Utilities", "XC-OEM-2024-009", "2", "1", "2.1 MW", "Active", "Jun 15, 2024"],
  ["CloudTech Services", "Technology", "XC-OEM-2024-010", "2", "3", "4.0 MW", "Active", "Jul 01, 2024"],
];

const projects = [
  ["Flex Tijuana Manufacturing", "Tijuana, Mexico", "Manufacturing", "3.2 MW", "In Progress", "75%", "Feb 01, 2025", "Jun 30, 2025"],
  ["Flex Juarez Plant", "Juarez, Mexico", "Manufacturing", "2.8 MW", "In Progress", "60%", "Mar 15, 2025", "Jul 15, 2025"],
  ["Flex DFW Campus", "Dallas, TX, USA", "Manufacturing", "4.6 MW", "In Progress", "40%", "Apr 01, 2025", "Aug 31, 2025"],
  ["Flex Austin HQ", "Austin, TX, USA", "Corporate", "1.5 MW", "Planning", "10%", "May 10, 2025", "Sep 30, 2025"],
  ["Flex San Luis Potosi", "San Luis Potosi, Mexico", "Manufacturing", "3.7 MW", "Not Started", "0%", "Jun 01, 2025", "Nov 30, 2025"],
  ["Flex Monterrey Facility", "Monterrey, Mexico", "Manufacturing", "2.1 MW", "In Progress", "20%", "Apr 20, 2025", "Aug 20, 2025"],
  ["Flex Phoenix DC", "Phoenix, AZ, USA", "Data Center", "2.9 MW", "In Progress", "55%", "Mar 05, 2025", "Jul 31, 2025"],
  ["Flex Guadalajara Plant", "Guadalajara, Mexico", "Manufacturing", "1.8 MW", "Planning", "5%", "Jun 15, 2025", "Dec 15, 2025"],
];

export function ClientManagementScreen({ variant }: { variant: ClientManagementVariant }) {
  return (
    <EcbsAppShell activeHref="/client-management/clients">
      <div className="flex h-full min-h-[682px] flex-col overflow-hidden px-3 py-2">
        <ClientTopbar variant={variant} />
        {variant === "list" ? <ClientList /> : null}
        {variant === "new" ? <AddNewClient /> : null}
        {variant === "details" ? <ClientDetails /> : null}
        {variant === "newProjectReports" ? <NewProjectReports /> : null}
        {variant === "newProjectScanning" ? <NewProjectScanning /> : null}
        {variant === "projects" ? <ClientProjects /> : null}
        <footer className="mt-auto flex h-[28px] items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500">
          <div>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Support</div>
          <div>Data updated: May 18, 2025 10:15 AM <span className="ml-4 text-[#05ff5e]">Live</span></div>
        </footer>
      </div>
    </EcbsAppShell>
  );
}

function ClientTopbar({ variant }: { variant: ClientManagementVariant }) {
  const title = variant === "new" ? "Add New Client" : variant === "newProjectReports" ? "Generate Proposal & Site Assessment Reports" : variant === "newProjectScanning" ? "Create New Project" : variant === "projects" ? "Flex Ltd. - Projects / Facilities" : variant === "details" ? "Flex Ltd." : "Clients";
  const subtitle = variant === "new" ? "Enter the client information below to create a new client in the system." : variant === "newProjectReports" ? "Review project data and generate proposal and site assessment reports." : variant === "newProjectScanning" ? "Enter project details, upload utility documents, and 1-line drawings to set up a new project." : variant === "projects" ? "View and manage all projects and facilities for this client." : variant === "details" ? "View and manage client information, contacts, settings, and activity." : "View and manage all clients associated with your organization.";

  return (
    <header className="border-b border-cyan-300/10 pb-2">
      <div className="flex h-[34px] items-center justify-between">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-100">XECO Energy Intelligence Portal</div>
        <div className="flex items-center gap-3 text-[9px] text-slate-300">
          <ToolbarButton>{variant === "details" || variant === "projects" ? "Client Flex Ltd." : "OEM Solutions Inc."}</ToolbarButton>
          <ToolbarButton>May 12 - May 18, 2025</ToolbarButton>
          <span className="text-[#05ff5e]">Online</span>
          <span className="grid size-7 place-items-center rounded-full bg-[#0b3158]">JS</span>
          <span>John Smith<br /><span className="text-slate-500">OEM User</span></span>
        </div>
      </div>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <Breadcrumb items={variant === "new" ? ["Clients", "Add New Client"] : variant === "newProjectReports" ? ["Clients", "Flex Ltd.", "Projects / Facilities", "Create New Project", "Generate Proposal & Site Assessment Reports"] : variant === "newProjectScanning" ? ["Clients", "Flex Ltd.", "Projects / Facilities", "Create New Project"] : variant === "projects" ? ["Clients", "Flex Ltd."] : variant === "details" ? ["Clients", "Flex Ltd.", "Client Details"] : ["Clients"]} />
          <h1 className="mt-2 text-[21px] font-semibold leading-none text-slate-100">{title}</h1>
          <p className="mt-2 text-[10px] text-slate-300">{subtitle}</p>
        </div>
        {variant === "new" ? <div className="flex gap-2"><ToolbarButton>Cancel</ToolbarButton><ToolbarButton primary>+ Save Client</ToolbarButton></div> : null}
        {variant === "newProjectScanning" ? <div className="flex gap-2"><ToolbarButton>Cancel</ToolbarButton><ToolbarButton primary><span className="inline-flex items-center gap-2"><SaveIcon />Save Draft</span></ToolbarButton></div> : null}
        {variant === "list" ? <ToolbarButton primary>+ Add New Client</ToolbarButton> : null}
        {variant === "details" ? <ToolbarButton primary><span className="inline-flex items-center gap-1.5"><PencilIcon />Edit Client</span></ToolbarButton> : null}
        {variant === "projects" ? <ClientProjectsIdentityCard /> : null}
      </div>
    </header>
  );
}

function ClientList() {
  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
      <section className="grid h-[98px] grid-cols-5 gap-3">
        {clientKpis.map((kpi) => <ClientListKpiCard key={kpi.label} kpi={kpi} />)}
      </section>
      <div className="flex h-[38px] items-center justify-between">
        <div className="flex gap-2"><SearchBox placeholder="Search clients by name, contract #, or location..." withIcon /><ToolbarButton><span className="inline-flex items-center gap-2"><FilterIcon />Filters <ChevronDownIcon /></span></ToolbarButton></div>
        <ToolbarButton><span className="inline-flex items-center gap-2"><DownloadIcon />Export <ChevronDownIcon /></span></ToolbarButton>
      </div>
      <ClientListTable />
    </div>
  );
}

function AddNewClient() {
  return (
    <div className="mt-3 grid min-h-0 flex-1 grid-cols-[1fr_238px] gap-2">
      <div className="space-y-2.5 overflow-hidden">
        <FormPanel title="1. Client Information">
          <div className="grid grid-cols-3 gap-3"><Field required label="Client Name" value="Enter client name" /><Field label="Legal Entity Name" value="Enter legal entity name" /><Field required label="Contract Number" value="Enter contract number" /><Field label="Industry" value="Select industry" /><Field label="Client Type" value="Select client type" /><Field label="Status" value="Active" /><Field className="col-span-2" label="Website" value="https://www.example.com" /><Field label="Tax ID / VAT Number" value="Enter tax ID or VAT number" /></div>
        </FormPanel>
        <FormPanel title="2. Primary Contact">
          <div className="grid grid-cols-3 gap-3"><Field required label="Contact Name" value="Enter contact name" /><Field label="Title / Position" value="Enter title or position" /><Field required label="Email Address" value="Enter email address" /><Field required label="Phone Number" value="(555) 123-4567" /><Field label="Mobile Number" value="(555) 987-6543" /></div>
        </FormPanel>
        <FormPanel title="3. Address">
          <div className="grid grid-cols-6 gap-3"><Field className="col-span-3" required label="Address Line 1" value="Enter address line 1" /><Field className="col-span-3" label="Address Line 2" value="Enter address line 2" /><Field className="col-span-2" required label="City" value="Enter city" /><Field className="col-span-1" required label="State / Province" value="Select state / province" /><Field className="col-span-2" required label="ZIP / Postal Code" value="Enter ZIP / postal code" /><Field required label="Country" value="United States" /></div>
        </FormPanel>
        <FormPanel title="4. Additional Information (Optional)">
          <div className="grid grid-cols-2 gap-4"><Field multiline label="Notes" value="Enter notes about this client..." /><UploadBox /></div>
        </FormPanel>
      </div>
      <SummaryCard />
    </div>
  );
}

function NewProjectScanning() {
  return (
    <div className="mt-3 grid min-h-0 flex-1 grid-cols-[1fr_340px] gap-3">
      <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
        <WorkflowSteps active={1} steps={["Project Information", "Site & Electrical Info", "Documents & Uploads", "Review & Confirm"]} />
        <ProjectInfoPanel />
        <DocumentUploadsPanel />
      </div>
      <aside className="flex min-h-0 flex-col gap-3">
        <ProjectSummaryCard />
        <DarkSidePanel title="Required for Next Step">
          <ChecklistDark items={["Project Information", "Utility Bill", "1-Line Drawings"]} />
        </DarkSidePanel>
        <DarkSidePanel title="Help">
          <p className="text-[10px] leading-relaxed text-slate-400">Accurate utility bills and 1-line drawings help us analyze your site&apos;s energy performance and capacity.</p>
          <button className="mt-3 text-[10px] font-semibold text-[#05ff5e]">Learn more about document requirements →</button>
        </DarkSidePanel>
      </aside>
    </div>
  );
}

function NewProjectReports() {
  return (
    <div className="mt-3 grid min-h-0 flex-1 grid-cols-[1fr_326px] gap-3">
      <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
        <WorkflowSteps active={5} steps={["Project Information", "Site & Electrical Info", "Documents & Uploads", "Review & Confirm", "Generate Reports"]} />
        <section className="grid h-[250px] grid-cols-[1fr_0.72fr] gap-3">
          <DarkSidePanel title="1. Project Overview"><ProjectOverviewGrid /></DarkSidePanel>
          <DarkSidePanel title={<span className="flex items-center justify-between gap-3">2. Uploaded Documents <button className="rounded border border-cyan-300/12 bg-[#061421] px-4 py-1.5 text-[10px] font-normal text-slate-300">Manage Files</button></span>}><UploadedDocuments /></DarkSidePanel>
        </section>
        <DarkSidePanel title="3. Generate Reports">
          <p className="mt-2 text-[10px] text-slate-300">Select the reports you want to generate for this project.</p>
          <div className="mt-4 grid h-[190px] grid-cols-2 gap-3">
            <ReportChoiceCard type="proposal" />
            <ReportChoiceCard type="assessment" />
          </div>
          <div className="mt-3 rounded border border-cyan-300/12 bg-[#061421] px-3 py-3">
            <div className="text-[10px] text-slate-300">Report Options</div>
            <div className="mt-3 flex gap-12 text-[10px] text-slate-400">
              <span><span className="mr-2 inline-block size-4 align-middle rounded border border-slate-600" />Include detailed calculations</span>
              <span><span className="mr-2 inline-block size-4 align-middle rounded border border-slate-600" />Include equipment recommendations <span className="ml-1 text-slate-500">ⓘ</span></span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <ToolbarButton>← Back</ToolbarButton>
            <div className="flex items-center gap-3"><ToolbarButton><span className="inline-flex items-center gap-2"><SaveIcon />Save Draft</span></ToolbarButton><ToolbarButton primary>Generate Reports →</ToolbarButton></div>
          </div>
          <div className="mt-2 text-right text-[10px] text-slate-500">Reports will be available in the Documents tab once generated.</div>
        </DarkSidePanel>
      </div>
      <aside className="flex min-h-0 flex-col gap-3">
        <ProjectReportSummaryCard />
        <DarkSidePanel title="Reports to be Generated">
          <ChecklistDark items={["Proposal Report", "Site Assessment Report"]} />
          <p className="mt-4 text-[10px] leading-relaxed text-slate-400">Comprehensive analysis based on uploaded utility bill and 1-line drawings.</p>
        </DarkSidePanel>
        <DarkSidePanel title="Help">
          <p className="text-[10px] leading-relaxed text-slate-400">Reports include estimated savings, capacity improvements, payback analysis, and implementation recommendations.</p>
          <button className="mt-3 text-[10px] font-semibold text-[#05ff5e]">Learn more about reports →</button>
        </DarkSidePanel>
      </aside>
    </div>
  );
}

function ProjectOverviewGrid() {
  const rows = [
    ["Project / Facility Name", "Flex Tijuana Manufacturing"],
    ["Client", "Flex Ltd."],
    ["Site", "Tijuana, Mexico"],
    ["Location", "Tijuana, Baja California, Mexico"],
    ["Project Type", "Manufacturing"],
    ["Status", "Planning"],
    ["Start Date", "Feb 01, 2025"],
    ["Target Completion", "Jun 30, 2025"],
  ];
  return <div className="mt-4 grid grid-cols-2 gap-x-24 gap-y-4 text-[10px]">{rows.map(([label, value]) => <div key={label}><div className="text-[9px] text-slate-400">{label}</div><div className={label === "Status" ? "mt-1 text-blue-400" : "mt-1 text-slate-100"}>{label === "Status" ? "● " : null}{value}</div></div>)}</div>;
}

function UploadedDocuments() {
  return (
    <div className="mt-4 space-y-5">
      <UploadedDoc label="Utility Bill" name="Tijuana_Utility_Bill_May2025.pdf" tone="red" meta="Uploaded: May 18, 2025  •  1.2 MB" />
      <UploadedDoc label="1-Line Drawings" name="Flex_Tijuana_1-Line_v1.dwg" tone="blue" meta="Uploaded: May 18, 2025  •  3.7 MB" />
    </div>
  );
}

function UploadedDoc({ label, meta, name, tone }: { label: string; meta: string; name: string; tone: "blue" | "red" }) {
  return <div><div className="mb-2 text-[10px] font-semibold text-slate-300">{label}</div><div className="flex items-center gap-3 rounded border border-cyan-300/12 bg-[#061421] p-3"><DocIcon tone={tone} /><div><div className="text-[10px] text-slate-100">{name}</div><div className="text-[9px] text-slate-500">{meta}</div></div><span className="ml-auto grid size-4 place-items-center rounded-full border border-[#05ff5e] text-[9px] text-[#05ff5e]">✓</span></div></div>;
}

function ReportChoiceCard({ type }: { type: "assessment" | "proposal" }) {
  const proposal = type === "proposal";
  const items = proposal ? ["Executive Summary", "Financial Analysis & ROI", "Estimated Savings & Benefits", "Implementation Overview"] : ["Electrical System Summary", "Baseline Analysis", "Load & Capacity Assessment", "Recommendations"];
  return (
    <article className={`relative rounded-lg border p-5 ${proposal ? "border-[#05ff5e]/60 bg-[#042018]/72" : "border-violet-500/70 bg-[#140b2a]/52"}`}>
      <span className={`absolute left-3 top-3 grid size-4 place-items-center rounded-sm text-[10px] text-white ${proposal ? "bg-[#16a34a]" : "bg-[#16a34a]"}`}>✓</span>
      <div className="ml-8 flex gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-full ${proposal ? "bg-green-700 text-green-100" : "bg-violet-700 text-violet-100"}`}><DocumentLineIcon kind={proposal ? "bill" : "drawing"} /></span>
        <div>
          <div className="text-[13px] font-semibold text-slate-100">{proposal ? "Proposal Report" : "Site Assessment Report"} {proposal ? <span className="ml-2 rounded bg-green-500/20 px-2 py-0.5 text-[9px] text-[#05ff5e]">Recommended</span> : null}</div>
          <p className="mt-2 max-w-[310px] text-[9px] leading-relaxed text-slate-400">{proposal ? "Executive proposal with project summary, financial analysis, savings estimate, and return on investment." : "Technical assessment with site analysis, electrical baseline, and engineering recommendations."}</p>
          <div className="mt-5 text-[10px] text-slate-300">Includes:</div>
          <div className="mt-2 space-y-2 text-[10px] text-slate-400">{items.map((item) => <div className="flex items-center gap-2" key={item}><span className={`grid size-4 place-items-center rounded-full border text-[9px] ${proposal ? "border-[#05ff5e] text-[#05ff5e]" : "border-violet-400 text-violet-400"}`}>✓</span>{item}</div>)}</div>
        </div>
      </div>
    </article>
  );
}

function ProjectReportSummaryCard() {
  return (
    <DarkSidePanel title="Project Summary">
      <div className="mt-3 flex items-center gap-4"><span className="grid size-11 place-items-center rounded-full bg-violet-700 text-white"><DetailIcon kind="folder" /></span><div><div className="font-semibold text-slate-100">Flex Tijuana Manufacturing</div><div className="text-[10px] text-blue-400">● Planning</div></div></div>
      <MetricListDark rows={[["Client", "Flex Ltd."], ["Site", "Tijuana, Mexico"], ["Project Type", "Manufacturing"], ["Start Date", "Feb 01, 2025"], ["Target Completion", "Jun 30, 2025"], ["Documents Uploaded", "2 of 2 ✓"], ["Reports", "Not Generated"]]} />
    </DarkSidePanel>
  );
}

function WorkflowSteps({ active, steps }: { active: number; steps: string[] }) {
  return (
    <div className="flex h-[34px] items-center px-4 text-[10px] text-slate-400">
      {steps.map((step, index) => (
        <span className="flex flex-1 items-center last:flex-none" key={step}>
          <span className={`grid size-6 place-items-center rounded-full text-[10px] font-semibold ${index + 1 === active ? "bg-[#13b54a] text-white" : "bg-slate-700 text-slate-300"}`}>{index + 1}</span>
          <span className={index + 1 === active ? "ml-2 whitespace-nowrap text-[#05ff5e]" : "ml-2 whitespace-nowrap"}>{step}</span>
          {index < steps.length - 1 ? <span className="mx-5 h-px flex-1 bg-slate-700" /> : null}
        </span>
      ))}
    </div>
  );
}

function ProjectInfoPanel() {
  return (
    <FormPanel title="1. Project Information">
      <div className="grid grid-cols-3 gap-4">
        <Field required label="Project / Facility Name" value="Enter project name" />
        <Field required label="Site" value="Select site" />
        <Field required label="Project Type" value="Select project type" />
        <Field label="Facility / Building" value="Enter facility or building name" />
        <Field required label="Location" value="Enter city, state / province, country" />
        <Field label="Project Manager" value="Enter project manager name" />
        <Field required label="Start Date" value="Select start date" />
        <Field label="Target Completion Date" value="Select target date" />
        <Field label="Status" value="Planning" />
        <Field className="col-span-3" multiline label="Description / Notes" value="Enter project description or notes..." />
      </div>
    </FormPanel>
  );
}

function DocumentUploadsPanel() {
  return (
    <FormPanel title="2. Document Uploads">
      <div className="grid grid-cols-2 gap-4">
        <ScanUploadCard button="Scan Utility Bill" icon="bill" title="Utility Bill" tone="green" />
        <ScanUploadCard button="Scan 1-Line Drawing" icon="drawing" title="1-Line Drawings" tone="purple" />
      </div>
      <div className="mt-3 rounded border border-blue-500/20 bg-blue-500/8 px-3 py-2 text-[10px] text-slate-300"><span className="mr-2 inline-grid size-4 place-items-center rounded-full bg-blue-500 text-[9px] text-white">i</span>Tip: Use the scan buttons above to capture documents directly from your scanner or mobile device.</div>
      <div className="mt-2 flex justify-end"><ToolbarButton primary>Save & Continue →</ToolbarButton></div>
    </FormPanel>
  );
}

function ScanUploadCard({ button, icon, title, tone }: { button: string; icon: "bill" | "drawing"; title: string; tone: "green" | "purple" }) {
  const color = tone === "green" ? "text-[#05ff5e]" : "text-violet-400";
  const buttonColor = tone === "green" ? "bg-[#0a8a3a]" : "bg-violet-700";
  return (
    <div>
      <h3 className="text-[12px] font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 text-[10px] text-slate-400">{title === "Utility Bill" ? "Upload the most recent full utility bill for this site." : "Upload the site 1-line electrical drawing(s)."}</p>
      <div className="mt-3 grid h-[160px] place-items-center rounded border border-dashed border-cyan-300/25 bg-[#061421] text-center">
        <div>
          <div className={`mx-auto grid size-10 place-items-center ${color}`}><DocumentLineIcon kind={icon} /></div>
          <div className="mt-3 text-[12px] font-semibold text-slate-200">Scan or upload {title === "Utility Bill" ? "utility bill" : "1-line drawing"}</div>
          <div className="mt-1 text-[10px] text-slate-400">Drag and drop files here or</div>
          <button className={`mt-4 rounded px-9 py-2 text-[10px] font-semibold text-white ${buttonColor}`}>{button}</button>
          <div className="mt-3 text-[10px] text-[#05ff5e]">or browse files</div>
        </div>
      </div>
      <div className="mt-2 text-[9px] text-slate-500">Accepted formats: PDF, JPG, PNG {title === "Utility Bill" ? "(Max 10MB)" : "DWG (Max 20MB)"}</div>
    </div>
  );
}

function ProjectSummaryCard() {
  return (
    <DarkSidePanel title="Project Summary">
      <div className="mt-3 flex items-center gap-4"><span className="grid size-11 place-items-center rounded-full bg-violet-700 text-white"><DetailIcon kind="folder" /></span><div><div className="font-semibold text-slate-100">New Project</div><div className="text-[10px] text-slate-400">Not Saved</div></div></div>
      <div className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4"><span className="grid size-9 place-items-center rounded-full bg-white text-[12px] font-bold text-[#00a9ff]">flex</span><div><div className="text-[11px] font-semibold text-slate-100">Flex Ltd.</div><div className="text-[9px] text-slate-400">Global Manufacturing</div></div></div>
      <MetricListDark rows={[["Site", "-"], ["Project Type", "-"], ["Status", "Planning"], ["Start Date", "-"], ["Target Completion", "-"]]} />
    </DarkSidePanel>
  );
}

function DarkSidePanel({ children, title }: { children: ReactNode; title: ReactNode }) {
  return <section className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4"><h2 className="text-[13px] font-semibold text-slate-100">{title}</h2>{children}</section>;
}

function ChecklistDark({ items }: { items: string[] }) {
  return <div className="mt-4 space-y-3 text-[10px] text-slate-300">{items.map((item) => <div className="flex items-center gap-2" key={item}><span className="grid size-4 place-items-center rounded-full border border-[#05ff5e] text-[9px] text-[#05ff5e]">✓</span>{item}</div>)}</div>;
}

function ClientDetails() {
  return (
    <>
      <section className="mt-3 rounded-lg bg-white p-4 text-slate-900">
        <div className="grid grid-cols-[1.2fr_1.4fr] items-center gap-5">
          <div className="flex items-center gap-4"><div className="text-3xl font-bold text-[#00a9ff]">flex</div><div><div className="text-xl font-semibold">Flex Ltd. <span className="ml-2 rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">Active</span></div><div className="mt-1 text-xs text-slate-600">Global Manufacturing</div><div className="mt-2 text-[10px] text-slate-500">Client Since: Jan 15, 2024 &nbsp; | &nbsp; Contract Number: XC-OEM-2024-001 &nbsp; | &nbsp; Account Manager: Sarah Johnson</div></div></div>
          <div className="grid grid-cols-4 gap-3 text-center"><LightMetric icon="sites" label="Sites" value="12" /><LightMetric icon="folder" label="Active Projects" value="18" /><LightMetric icon="gauge" label="Total Capacity" value="24.8 MW" /><LightMetric icon="money" label="Annual Savings" value="$1.42M" /></div>
        </div>
      </section>
      <Tabs items={["Overview", "Sites (12)", "Projects (18)", "Contacts (8)", "Documents", "Alerts (6)", "Analytics", "Settings"]} />
      <section className="mt-2 grid h-[260px] grid-cols-[1.35fr_0.6fr_0.82fr] gap-2">
        <LightPanel title="Client Information">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10px]"><Info label="Legal Entity Name" value="Flex Manufacturing Corporation" /><Info label="Phone" value="(512) 555-0187" /><Info label="Industry" value="Manufacturing" /><Info label="Email" value="admin@flex.com" link /><Info label="Website" value="www.flex.com" link /><Info label="Address" value="2500 Industrial Way, Austin, TX 78741" /><Info label="Tax ID / EIN" value="74-1234567" /><Info label="Time Zone" value="(GMT-06:00) Central Time" /><Info label="Currency" value="USD - US Dollar" /><Info label="Status" value="Active" /></div>
        </LightPanel>
        <LightPanel footerAction={<button className="inline-flex h-8 items-center justify-center gap-2 rounded border border-blue-500/45 px-4 text-[10px] font-semibold text-blue-600">View All Contacts <ArrowRightIcon /></button>} title="Primary Contact">
          <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-full bg-blue-600 text-white">MJ</div><div><div className="font-semibold">Michael Johnson</div><div className="text-[10px]">Director of Facilities</div></div></div>
          <div className="mt-4 space-y-2 text-[10px]"><Info label="Phone" value="(512) 555-0187" /><Info label="Email" value="mjohnson@flex.com" link /><Info label="Mobile" value="(512) 555-0199" /></div>
        </LightPanel>
        <LightPanel footerAction={<button className="inline-flex h-8 items-center justify-center gap-2 rounded border border-blue-500/35 px-4 text-[10px] font-semibold text-blue-600">View Activity Log <ArrowRightIcon /></button>} title="Account Summary">
          <AccountSummaryRows />
        </LightPanel>
      </section>
      <section className="mt-2 grid h-[225px] grid-cols-[1.15fr_1fr] gap-2">
        <LightPanel action={<button className="text-[10px] font-semibold text-blue-600">View All Projects <span className="ml-1">→</span></button>} title="Recent Projects">
          <ClientProjectsTable />
        </LightPanel>
        <LightPanel action={<button className="text-[10px] font-semibold text-blue-600">View All Documents <span className="ml-1">→</span></button>} title="Documents">
          <DocumentsTable />
        </LightPanel>
      </section>
    </>
  );
}

function ClientProjects() {
  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
      <section className="grid h-[98px] grid-cols-5 gap-3">
        {projectKpis.map((kpi) => <ClientProjectsKpiCard key={kpi.label} kpi={kpi} />)}
      </section>
      <Tabs items={["Projects / Facilities", "Sites", "Analytics", "Documents", "Alerts"]} />
      <div className="flex h-[38px] items-center justify-between">
        <div className="flex gap-2"><SearchBox placeholder="Search projects by name, site, or location..." withIcon /><ToolbarButton><span className="inline-flex items-center gap-2"><FilterIcon />Filters <ChevronDownIcon /></span></ToolbarButton></div>
        <ToolbarButton primary><span className="inline-flex items-center gap-2">+ New Project</span></ToolbarButton>
      </div>
      <ClientProjectsFacilitiesTable />
    </div>
  );
}

function SummaryCard() {
  return (
    <aside className="self-start rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4">
      <h2 className="text-[13px] font-semibold text-slate-100">Client Summary</h2>
      <div className="mt-7 flex items-center gap-4"><div className="grid size-11 place-items-center rounded-full bg-blue-600 text-lg"><BuildingIcon /></div><div><div className="font-semibold">New Client</div><div className="text-[10px] text-slate-400">Not Saved</div></div></div>
      <MetricListDark rows={[["Contract Number", "-"], ["Client Since", "-"], ["Sites", "0"], ["Active Projects", "0"], ["Total Capacity", "0 MW"], ["Status", "Active"]]} />
    </aside>
  );
}

function Breadcrumb({ items }: { items: string[] }) {
  return <div className="text-[9px] text-slate-400">{items.map((item, index) => <span key={item}>{index ? <span className="mx-2">›</span> : null}<span className={index === items.length - 1 ? "text-slate-100" : ""}>{item}</span></span>)}</div>;
}

function ToolbarButton({ children, primary = false }: { children: ReactNode; primary?: boolean }) {
  return <button className={primary ? "rounded border border-[#05ff5e]/40 bg-[#0a7a35] px-4 py-2 text-[10px] font-semibold text-white" : "rounded border border-slate-700 bg-[#061421] px-3 py-2 text-[10px] text-slate-300"}>{children}</button>;
}

function SearchBox({ placeholder, withIcon = false }: { placeholder: string; withIcon?: boolean }) {
  return <div className="flex h-[38px] w-[374px] items-center gap-2 rounded border border-cyan-300/12 bg-[#061421] px-3 text-[10px] text-slate-500">{withIcon ? <SearchIcon /> : null}<span>{placeholder}</span></div>;
}

function Tabs({ items }: { items: string[] }) {
  return <div className="mt-3 flex h-[32px] items-end gap-8 border-b border-cyan-300/10 text-[10px] text-slate-300">{items.map((item, index) => <span className={index === 0 ? "border-b-2 border-[#05ff5e] pb-2 text-[#05ff5e]" : "pb-2"} key={item}>{item}</span>)}</div>;
}

function FormPanel({ children, title }: { children: ReactNode; title: string }) {
  return <section className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><h2 className="mb-3 text-[13px] font-semibold text-slate-100">{title}</h2>{children}</section>;
}

function Field({ className = "", label, multiline = false, required = false, value }: { className?: string; label: string; multiline?: boolean; required?: boolean; value: string }) {
  return <label className={`block text-[9px] text-slate-300 ${className}`}><span>{label}{required ? <b className="text-red-400"> *</b> : null}</span><span className={multiline ? "mt-1 block h-[72px] rounded border border-cyan-300/12 bg-[#061421] px-2 py-2 text-slate-500" : "mt-1 block h-[28px] rounded border border-cyan-300/12 bg-[#061421] px-2 py-2 text-slate-500"}>{value}</span></label>;
}

function UploadBox() {
  return <div><div className="mb-1 text-[9px] text-slate-300">Client Logo</div><div className="grid h-[72px] place-items-center rounded border border-dashed border-cyan-300/25 bg-[#061421] text-center text-[10px] text-slate-400">Upload client logo<br />PNG, JPG up to 2MB</div></div>;
}

function ClientListKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const config = clientListKpiConfig[kpi.label] ?? clientListKpiConfig["Total Clients"];

  return (
    <article className="flex items-center gap-4 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${config.bg} ${config.text}`}>
        <ClientListKpiIcon kind={config.icon} />
      </span>
      <div className="min-w-0">
        <div className="whitespace-nowrap text-[10px] text-slate-300">{kpi.label}</div>
        <div className="mt-1 whitespace-nowrap text-[25px] font-semibold leading-none text-slate-100">{kpi.value}</div>
        <div className="mt-2 whitespace-nowrap text-[10px] text-slate-400">{kpi.detail}</div>
      </div>
    </article>
  );
}

const clientListKpiConfig: Record<string, { bg: string; icon: "building" | "folder" | "gauge" | "money" | "users"; text: string }> = {
  "Total Clients": { bg: "bg-blue-600", icon: "users", text: "text-white" },
  "Total Sites": { bg: "bg-emerald-500/85", icon: "building", text: "text-white" },
  "Active Projects": { bg: "bg-violet-700", icon: "folder", text: "text-white" },
  "Total Capacity": { bg: "bg-sky-600", icon: "gauge", text: "text-white" },
  "Annual Savings": { bg: "bg-amber-600", icon: "money", text: "text-white" },
};

function ClientListTable() {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92">
      <table className="w-full table-fixed text-left text-[10px]">
        <thead className="h-[38px] bg-[#092130] text-slate-300">
          <tr>
            <th className="w-[25%] px-4 font-medium">Client Name</th>
            <th className="w-[16%] px-4 font-medium">Contract Number</th>
            <th className="w-[8%] px-4 text-center font-medium">Sites</th>
            <th className="w-[12%] px-4 text-center font-medium">Active Projects</th>
            <th className="w-[12%] px-4 text-center font-medium">Total Capacity</th>
            <th className="w-[11%] px-4 font-medium">Status</th>
            <th className="w-[12%] px-4 font-medium">Joined Date</th>
            <th className="w-[4%] px-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr className="h-[46px] border-t border-white/5" key={client[0]}>
              <td className="px-4 text-slate-100"><ClientBrandCell client={client} /></td>
              <td className="px-4 text-slate-200">{client[2]}</td>
              <td className="px-4 text-center text-slate-200">{client[3]}</td>
              <td className="px-4 text-center text-slate-200">{client[4]}</td>
              <td className="px-4 text-center text-slate-200">{client[5]}</td>
              <td className="px-4 text-slate-100"><span className="text-[#05ff5e]">●</span> Active</td>
              <td className="px-4 text-slate-200">{client[7]}</td>
              <td className="px-4 text-right text-slate-200">•••</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-auto flex h-[54px] items-center justify-between border-t border-white/5 px-4 text-[11px] text-slate-300">
        <span>Showing 1 to 10 of 14 clients</span>
        <div className="flex items-center gap-3">
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 text-slate-400"><ChevronLeftIcon /></button>
          <button className="grid size-8 place-items-center rounded border border-[#05ff5e]/55 text-[#05ff5e]">1</button>
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 text-slate-300">2</button>
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 text-slate-300"><ChevronRightIcon /></button>
        </div>
      </div>
    </section>
  );
}

function ClientBrandCell({ client }: { client: string[] }) {
  return <div className="flex items-center gap-3"><ClientLogoIcon name={client[0]} /><span className="min-w-0"><b className="block truncate text-[11px] leading-tight">{client[0]}</b><span className="block truncate text-[9px] text-slate-400">{client[1]}</span></span></div>;
}

function ClientLogoIcon({ name }: { name: string }) {
  const configs: Record<string, { bg: string; content: ReactNode }> = {
    "Flex Ltd.": { bg: "bg-white", content: <span className="text-[12px] font-bold text-[#00a9ff]">flex</span> },
    "ABC Manufacturing Corp.": { bg: "bg-white", content: <span className="text-[11px] font-black text-red-600">ABC</span> },
    "Global Logistics Group": { bg: "bg-sky-500", content: <GlobeIcon /> },
    "DataCenter One": { bg: "bg-violet-600", content: <ServerIcon /> },
    "Metro Health Systems": { bg: "bg-teal-500", content: <HealthIcon /> },
    "Greenfield University": { bg: "bg-orange-500", content: <BuildingIconSmall /> },
    "RetailMart Group": { bg: "bg-green-500", content: <CartIcon /> },
    "Pacific Industrial Co.": { bg: "bg-cyan-500", content: <FactoryIcon /> },
    "PowerGrid Solutions": { bg: "bg-yellow-400", content: <BoltIcon /> },
    "CloudTech Services": { bg: "bg-sky-500", content: <CloudIcon /> },
  };
  const config = configs[name] ?? { bg: "bg-white", content: name.slice(0, 2) };

  return <span className={`grid size-8 shrink-0 place-items-center rounded-full ${config.bg} text-white ring-1 ring-white/20`}>{config.content}</span>;
}

function ClientProjectsIdentityCard() {
  return (
    <article className="flex items-center gap-3 rounded-lg border border-cyan-300/12 bg-[#061521]/92 px-4 py-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-600 text-[13px] font-bold text-white">flex</span>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold leading-tight text-slate-100">Flex Ltd.</div>
        <div className="text-[9px] text-slate-400">Global Manufacturing</div>
      </div>
      <div className="ml-auto grid grid-cols-[90px_116px_106px] items-center gap-4 text-[9px] text-slate-300">
        <div><span className="block text-slate-500">Client Since</span><b className="font-semibold text-slate-100">Jan 15, 2024</b></div>
        <div><span className="block text-slate-500">Contract Number</span><b className="font-semibold text-slate-100">XC-OEM-2024-001</b></div>
        <ToolbarButton><span className="inline-flex items-center gap-2"><InfoIcon />Client Details</span></ToolbarButton>
      </div>
    </article>
  );
}

function ClientProjectsKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const config = clientProjectsKpiConfig[kpi.label] ?? clientProjectsKpiConfig["Total Projects"];

  return (
    <article className="flex items-center gap-4 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${config.bg} text-white`}>
        <ClientProjectsKpiIcon kind={config.icon} />
      </span>
      <div className="min-w-0">
        <div className="whitespace-nowrap text-[10px] text-slate-300">{kpi.label}</div>
        <div className="mt-1 whitespace-nowrap text-[25px] font-semibold leading-none text-slate-100">{kpi.value}</div>
        <div className="mt-2 whitespace-nowrap text-[10px] text-slate-400">{kpi.detail}</div>
      </div>
    </article>
  );
}

const clientProjectsKpiConfig: Record<string, { bg: string; icon: "check" | "folder" | "gauge" | "money" | "trend" }> = {
  "Total Projects": { bg: "bg-blue-700", icon: "folder" },
  "Total Capacity": { bg: "bg-emerald-600", icon: "gauge" },
  "Active Projects": { bg: "bg-violet-700", icon: "trend" },
  "Completed Projects": { bg: "bg-amber-600", icon: "check" },
  "Projected Savings (Annual)": { bg: "bg-blue-700", icon: "money" },
};

function ClientProjectsFacilitiesTable() {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92">
      <table className="w-full table-fixed text-left text-[10px]">
        <thead className="h-[38px] bg-[#092130] text-slate-300">
          <tr>
            <th className="w-[19%] px-4 font-medium">Project / Facility Name</th>
            <th className="w-[15%] px-4 font-medium">Site Location</th>
            <th className="w-[10%] px-4 font-medium">Site Type</th>
            <th className="w-[8%] px-4 font-medium">Capacity</th>
            <th className="w-[10%] px-4 font-medium">Status</th>
            <th className="w-[13%] px-4 font-medium">Progress</th>
            <th className="w-[10%] px-4 font-medium">Start Date</th>
            <th className="w-[10%] px-4 font-medium">Target Completion</th>
            <th className="w-[5%] px-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr className="h-[52px] border-t border-white/5" key={project[0]}>
              <td className="px-4 text-slate-100"><ProjectFacilityCell project={project} /></td>
              <td className="px-4 text-slate-200"><LocationCell location={project[1]} /></td>
              <td className="px-4 text-slate-200">{project[2]}</td>
              <td className="px-4 text-slate-200">{project[3]}</td>
              <td className="px-4"><StatusText status={project[4]} /></td>
              <td className="px-4"><ProgressBar status={project[4]} value={project[5]} /></td>
              <td className="px-4 text-slate-200">{project[6]}</td>
              <td className="px-4 text-slate-200">{project[7]}</td>
              <td className="px-2 text-right"><span className="inline-flex items-center gap-3"><ChartActionIcon /><span className="text-slate-200">•••</span></span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-auto flex h-[54px] items-center justify-between border-t border-white/5 px-4 text-[11px] text-slate-300">
        <span>Showing 1 to 8 of 18 projects</span>
        <div className="flex items-center gap-3">
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 text-slate-400"><ChevronLeftIcon /></button>
          <button className="grid size-8 place-items-center rounded border border-[#05ff5e]/55 text-[#05ff5e]">1</button>
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 text-slate-300">2</button>
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 text-slate-300">3</button>
          <button className="grid size-8 place-items-center rounded border border-cyan-300/12 text-slate-300"><ChevronRightIcon /></button>
        </div>
      </div>
    </section>
  );
}

function ProjectFacilityCell({ project }: { project: string[] }) {
  return <div className="flex items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-sky-600 text-white"><BuildingIconSmall /></span><span className="min-w-0"><b className="block truncate text-[11px] leading-tight">{project[0]}</b><span className="block truncate text-[9px] text-slate-400">{project[1]}</span></span></div>;
}

function LocationCell({ location }: { location: string }) {
  const flag = location.includes("Mexico") ? "🇲🇽" : "🇺🇸";
  return <span className="inline-flex items-center gap-2 whitespace-nowrap"><span className="text-[14px] leading-none">{flag}</span>{location}</span>;
}

function StatusText({ status }: { status: string }) {
  const color = status === "Planning" ? "text-sky-400" : status === "Not Started" ? "text-slate-400" : "text-[#05ff5e]";
  return <span className={color}><span className="mr-1">●</span>{status}</span>;
}

function ProgressBar({ status, value }: { status: string; value: string }) {
  const numeric = Number(value.replace("%", ""));
  const color = status === "Planning" ? "bg-sky-500" : status === "Not Started" ? "bg-slate-500" : "bg-[#05c760]";
  return <div className="flex items-center gap-3"><span className="h-2 w-[88px] rounded-full bg-slate-700/65"><span className={`block h-2 rounded-full ${color}`} style={{ width: `${numeric}%` }} /></span><span className="w-8 text-slate-200">{value}</span></div>;
}

function DarkTable({ className = "", headers, rows }: { className?: string; headers: string[]; rows: string[][] }) {
  return (
    <section className={`overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 ${className}`}>
      <table className="w-full text-left text-[10px]">
        <thead className="bg-[#092130] text-slate-400"><tr>{headers.map((header) => <th className="px-3 py-3 font-medium" key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr className="border-t border-white/5" key={index}>{row.map((cell, cellIndex) => <td className="px-3 py-2.5 text-slate-200" key={`${index}-${cellIndex}`}>{cell.includes("|") ? <ClientCell value={cell} /> : cell === "Active" || cell === "In Progress" ? <span className="text-[#05ff5e]">● {cell}</span> : cell === "Planning" ? <span className="text-blue-400">● {cell}</span> : cell}</td>)}</tr>)}</tbody>
      </table>
    </section>
  );
}

function ClientCell({ value }: { value: string }) {
  const [title, subtitle] = value.split("|");
  return <div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-white text-[9px] font-bold text-blue-600">{title.slice(0, 2)}</span><span><b className="block">{title}</b><span className="text-[9px] text-slate-400">{subtitle}</span></span></div>;
}

function LightPanel({ action, children, footerAction, title }: { action?: ReactNode; children: ReactNode; footerAction?: ReactNode; title: string }) {
  return <section className="flex min-h-0 flex-col rounded-lg bg-white p-3 text-slate-900"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-[13px] font-semibold">{title}</h2>{action}</div>{children}{footerAction ? <div className="mt-auto pt-3">{footerAction}</div> : null}</section>;
}

function LightMetric({ icon, label, value }: { icon: "folder" | "gauge" | "money" | "sites"; label: string; value: string }) {
  return <div className="flex items-center justify-center gap-3 border-l border-slate-200 px-3"><span className="grid size-9 place-items-center rounded-full bg-slate-50 text-slate-800"><DetailIcon kind={icon} /></span><span><div className="whitespace-nowrap text-[10px] text-slate-500">{label}</div><div className="mt-1 whitespace-nowrap text-lg font-semibold">{value}</div></span></div>;
}

function Info({ label, link = false, value }: { label: string; link?: boolean; value: string }) {
  return <div><div className="text-[9px] text-slate-500">{label}</div><div className={link ? "text-[10px] text-blue-600" : "text-[10px] text-slate-900"}>{value}</div></div>;
}

function MetricListLight({ rows }: { rows: [string, string][] }) {
  return <div className="space-y-2 text-[10px]">{rows.map(([label, value]) => <div className="flex justify-between border-b border-slate-200 pb-2" key={label}><span className="text-slate-600">{label}</span><b>{value}</b></div>)}</div>;
}

function MetricListDark({ rows }: { rows: [string, string][] }) {
  return <div className="mt-7 space-y-4 text-[10px]">{rows.map(([label, value]) => <div className="flex justify-between border-b border-white/5 pb-2" key={label}><span className="text-slate-400">{label}</span><span className={value === "Active" ? "text-[#05ff5e]" : "text-slate-200"}>{value}</span></div>)}</div>;
}

function BuildingIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 21V5.8L12 3l7 2.8V21M8 9h2m4 0h2M8 13h2m4 0h2M8 17h2m4 0h2M3 21h18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function AccountSummaryRows() {
  const rows: [string, string, "capacity" | "clock" | "folder" | "money" | "sites" | "check"][] = [
    ["Total Sites", "12", "sites"],
    ["Active Projects", "18", "folder"],
    ["Completed Projects", "5", "check"],
    ["Total Capacity", "24.8 MW", "capacity"],
    ["Annual Savings (Projected)", "$1.42M", "money"],
    ["Last Activity", "May 18, 2025 9:15 AM", "clock"],
  ];

  return <div className="space-y-0 text-[10px]">{rows.map(([label, value, icon]) => <div className="flex items-center justify-between border-b border-slate-200 py-1.5" key={label}><span className="flex items-center gap-2 text-slate-600"><SummaryIcon kind={icon} />{label}</span><b className="whitespace-nowrap">{value}</b></div>)}</div>;
}

function ClientProjectsTable() {
  return <table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{["Project / Facility Name", "Site Location", "Status", "Capacity", "Start Date", "Target Completion"].map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}<th /></tr></thead><tbody>{projects.slice(0, 4).map((project) => <tr className="border-t border-slate-200" key={project[0]}><td className="py-2 text-slate-800"><span className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-blue-600 text-white"><BuildingIconSmall /></span>{project[0]}</span></td><td className="py-2 text-slate-800">{project[1]}</td><td className={project[4] === "Planning" ? "py-2 text-blue-600" : "py-2 text-[#05aa55]"}><span className="mr-1">●</span>{project[4]}</td><td className="py-2 text-slate-800">{project[3]}</td><td className="py-2 text-slate-800">{project[6]}</td><td className="py-2 text-slate-800">{project[7]}</td><td className="py-2 text-right text-slate-400">⋮</td></tr>)}</tbody></table>;
}

function DocumentsTable() {
  const rows: [string, string, string, string, "blue" | "green" | "red"][] = [
    ["Master Service Agreement", "Contract", "Jan 15, 2024", "Sarah Johnson", "red"],
    ["Insurance Certificate", "Insurance", "Jan 20, 2024", "Sarah Johnson", "red"],
    ["Site Access Agreement", "Agreement", "Feb 10, 2024", "Michael Johnson", "blue"],
    ["Rate Schedule - 2025", "Utility Rate", "Mar 05, 2024", "Michael Johnson", "green"],
  ];

  return <table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{["Document Name", "Type", "Date Uploaded", "Uploaded By"].map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}<th /></tr></thead><tbody>{rows.map(([documentName, type, date, uploadedBy, tone]) => <tr className="border-t border-slate-200" key={documentName}><td className="py-2 text-slate-800"><span className="flex items-center gap-2"><DocIcon tone={tone} />{documentName}</span></td><td className="py-2 text-slate-800">{type}</td><td className="py-2 text-[#05aa55]">{date}</td><td className="py-2 text-slate-800">{uploadedBy}</td><td className="py-2 text-right text-blue-600"><DownloadIcon /></td></tr>)}</tbody></table>;
}

function DetailIcon({ kind }: { kind: "folder" | "gauge" | "money" | "sites" }) {
  if (kind === "folder") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5h6l2 2h9v9.5a2 2 0 0 1-2 2h-15v-13.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
  if (kind === "gauge") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18a7 7 0 1 1 14 0M12 18l4-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
  if (kind === "money") return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M12 7v10m3-7.5c-.6-.8-1.6-1.2-3-1.2-1.5 0-2.5.7-2.5 1.7 0 2.6 5.5 1.2 5.5 4 0 1.1-1.1 1.8-2.8 1.8-1.4 0-2.5-.5-3.2-1.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>;
  return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4h8v17M14 9h4v12M8 8h2m0 4H8m0 4h2m6-3h1m-1 4h1M4 21h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

function SummaryIcon({ kind }: { kind: "capacity" | "check" | "clock" | "folder" | "money" | "sites" }) {
  return <span className="grid size-4 place-items-center text-[#16a34a]">{kind === "sites" ? <BuildingIconSmall /> : kind === "folder" ? <DetailIcon kind="folder" /> : kind === "money" ? <DetailIcon kind="money" /> : kind === "capacity" ? <DetailIcon kind="gauge" /> : kind === "clock" ? <ClockIcon /> : <CheckIcon />}</span>;
}

function BuildingIconSmall() {
  return <svg className="size-3.5" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V5h7v16M13 10h5v11M8 9h2m-2 4h2m-2 4h2m7-3h1m-1 3h1M4 21h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
}

function DocIcon({ tone }: { tone: "blue" | "green" | "red" }) {
  const color = tone === "blue" ? "bg-blue-600" : tone === "green" ? "bg-green-600" : "bg-red-600";
  return <span className={`grid size-4 place-items-center rounded-sm ${color} text-white`}><svg className="size-2.5" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2h5l3 3v9H4V2Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" /></svg></span>;
}

function DownloadIcon() {
  return <svg className="ml-auto size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function SaveIcon() {
  return <svg className="size-3.5" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h10l2 2v12H4V3Zm3 0v5h6V3M7 17v-5h6v5" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" /></svg>;
}

function DocumentLineIcon({ kind }: { kind: "bill" | "drawing" }) {
  return <svg className="size-9" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6V3Zm9 0v4h3" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" /><path d={kind === "bill" ? "M9 10h6M9 13h6M9 16h4" : "M9 10h6M9 14h6M9 18h4"} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg>;
}

function ClientListKpiIcon({ kind }: { kind: "building" | "folder" | "gauge" | "money" | "users" }) {
  if (kind === "users") return <svg className="size-6" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-1.5a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6ZM3.5 20a6 6 0 0 1 12 0m1-7.5a5 5 0 0 1 4 4.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
  if (kind === "building") return <DetailIcon kind="sites" />;
  if (kind === "folder") return <DetailIcon kind="folder" />;
  if (kind === "gauge") return <DetailIcon kind="gauge" />;
  return <DetailIcon kind="money" />;
}

function ClientProjectsKpiIcon({ kind }: { kind: "check" | "folder" | "gauge" | "money" | "trend" }) {
  if (kind === "check") return <svg className="size-6" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="m8 12 2.6 2.7L16.5 9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" /></svg>;
  if (kind === "trend") return <svg className="size-6" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18V6m0 12h16M7 15l4-5 3 3 4-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
  if (kind === "folder") return <DetailIcon kind="folder" />;
  if (kind === "gauge") return <DetailIcon kind="gauge" />;
  return <DetailIcon kind="money" />;
}

function InfoIcon() {
  return <svg className="size-3.5" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M10 9.5V14m0-8h.01" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" /></svg>;
}

function ChartActionIcon() {
  return <span className="grid size-7 place-items-center rounded border border-cyan-300/16 text-slate-300"><svg className="size-4" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 15V5m0 10h12M7 12l2-3 2 2 3-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg></span>;
}

function SearchIcon() {
  return <svg className="size-4 shrink-0 text-slate-300" viewBox="0 0 20 20" aria-hidden="true"><path d="m14 14 3 3M8.5 15a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
}

function FilterIcon() {
  return <svg className="size-4" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14l-5.5 6v4.5l-3 1V11L3 5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" /></svg>;
}

function ChevronDownIcon() {
  return <svg className="size-3" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function ChevronLeftIcon() {
  return <svg className="size-4" viewBox="0 0 20 20" aria-hidden="true"><path d="m12 5-5 5 5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function ChevronRightIcon() {
  return <svg className="size-4" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 5 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function GlobeIcon() {
  return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M3.8 12h16.4M12 3.5c2.3 2.2 3.5 5 3.5 8.5S14.3 18.3 12 20.5C9.7 18.3 8.5 15.5 8.5 12S9.7 5.7 12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function ServerIcon() {
  return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v5H5V5Zm0 9h14v5H5v-5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="M8 7.5h.1M8 16.5h.1M11 7.5h5M11 16.5h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

function HealthIcon() {
  return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" /><path d="M7 3h10v18H7V3Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}

function CartIcon() {
  return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2l2 10h8.5l2-7H7M9 20h.1M17 20h.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function FactoryIcon() {
  return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9l5 3V9l5 3V5h5v15H4Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="M8 16h1m4 0h1m4 0h1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

function BoltIcon() {
  return <svg className="size-5 text-white" viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z" fill="currentColor" /></svg>;
}

function CloudIcon() {
  return <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 18h9.2a4 4 0 0 0 .1-8A6 6 0 0 0 5.5 12 3 3 0 0 0 7.5 18Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function ArrowRightIcon() {
  return <svg className="size-3.5" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m0 0-4-4m4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}

function PencilIcon() {
  return <svg className="size-3.5" viewBox="0 0 20 20" aria-hidden="true"><path d="m4 13.5-.7 3.2 3.2-.7L15.3 7.2l-2.5-2.5L4 13.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" /></svg>;
}

function ClockIcon() {
  return <svg className="size-3.5" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M10 6v4l3 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

function CheckIcon() {
  return <svg className="size-3.5" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5 8.2 15 16 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function LightTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{headers.map((header) => <th className="pb-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-t border-slate-200" key={index}>{row.map((cell, cellIndex) => <td className={cellIndex === 2 ? "py-2 text-[#05aa55]" : "py-2 text-slate-800"} key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table>;
}
