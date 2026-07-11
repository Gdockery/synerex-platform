import Link from "next/link";
import type { ReactNode } from "react";
import type { DeploymentCompletionData } from "@/lib/deploymentCompletionData";
import type { DeploymentDocumentationData, DocumentDataRow } from "@/lib/deploymentDocumentationData";
import type { DeploymentFieldWorkflowData, FieldEquipmentRow, FieldReadingRow } from "@/lib/deploymentFieldWorkflowData";

export type DeploymentWorkflowVariant =
  | "acceptance"
  | "checklist"
  | "closure"
  | "commissioning"
  | "completion"
  | "completionDashboard"
  | "documentViewer"
  | "exportPackage"
  | "equipmentAdd"
  | "equipmentInventory"
  | "folderDetail"
  | "installationDetails"
  | "photoDocs"
  | "permissions"
  | "postReadings"
  | "preReadings"
  | "reviewQueue"
  | "searchResults"
  | "signoff"
  | "siteDetails"
  | "testingAddIssue"
  | "testingVerification"
  | "testingViewDetails"
  | "testingViewTrend"
  | "uploadWizard"
  | "versionHistory"
  | "documentation";

const steps = ["Site & Installation", "Equipment Inventory", "Pre-Installation Readings", "Installation Details", "Post-Installation Readings", "Testing & Verification", "Documentation", "Completion", "Customer Acceptance"];

type DeploymentShellData = Pick<DeploymentCompletionData, "clientName" | "deploymentId" | "message" | "projectName" | "siteName" | "state" | "status" | "updatedAt">;

export function DeploymentWorkflowScreen({ data, deploymentId = "1", documentationData, fieldData, variant }: { data?: DeploymentCompletionData; deploymentId?: string; documentationData?: DeploymentDocumentationData; fieldData?: DeploymentFieldWorkflowData; variant: DeploymentWorkflowVariant }) {
  const shellData = data ?? documentationData ?? fieldData;
  const title =
    variant === "commissioning" ? "Commissioning Summary Report" :
    variant === "acceptance" ? "Customer Acceptance" :
    variant === "closure" ? "Deployment Closure Confirmation" :
    variant === "completion" ? "Deployment Completed Successfully!" :
    variant === "completionDashboard" ? "Deployment Dashboard" :
    variant === "documentViewer" ? "Single Line Diagram.pdf" :
    variant === "exportPackage" ? "Export Package Builder" :
    variant === "equipmentAdd" ? "Add Equipment" :
    variant === "equipmentInventory" ? "Equipment Inventory & Readings" :
    variant === "folderDetail" ? "Engineering" :
    variant === "installationDetails" ? "Installation Details" :
    variant === "photoDocs" ? "Photo & Document System" :
    variant === "permissions" ? "Permissions / Access Control" :
    variant === "postReadings" ? "Post-Installation Readings" :
    variant === "preReadings" ? "Pre-Installation Readings" :
    variant === "reviewQueue" ? "Review / Approval Queue" :
    variant === "searchResults" ? "Search Results" :
    variant === "siteDetails" ? "Site & Installation Details" :
    variant === "testingAddIssue" ? "Testing & Verification" :
    variant === "testingVerification" ? "Testing & Verification" :
    variant === "testingViewDetails" ? "View Details" :
    variant === "testingViewTrend" ? "System Performance Trend" :
    variant === "uploadWizard" ? "Upload Document Wizard" :
    variant === "versionHistory" ? "Version History" :
    variant === "documentation" ? "Documentation" :
    variant === "signoff" ? "Sign-Off Capture" :
    "Final Validation Checklist";
  const fullBleed = variant === "documentViewer";
  const customHeader = ["completion", "completionDashboard", "exportPackage", "folderDetail", "permissions", "reviewQueue", "searchResults", "uploadWizard", "versionHistory", "documentation", "equipmentAdd", "equipmentInventory", "installationDetails", "photoDocs", "postReadings", "preReadings", "siteDetails", "testingAddIssue", "testingVerification", "testingViewDetails", "testingViewTrend"].includes(variant);
  const standardStepper = !fullBleed && !["completionDashboard", "exportPackage", "folderDetail", "permissions", "uploadWizard", "versionHistory", "equipmentAdd", "testingViewDetails"].includes(variant);

  return (
    <div className="h-screen min-h-[682px] w-screen min-w-[1024px] overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[144px_1fr]">
        <DeploymentSidebar data={shellData} variant={variant} />
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.08),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-4">
          <Topbar data={shellData} variant={variant} />
          {standardStepper ? <Stepper active={activeStepForVariant(variant)} actionLabel={variant === "acceptance" ? "Print Acceptance Form" : variant === "checklist" ? "Print Checklist" : variant === "closure" ? "Print Closure Certificate" : variant === "completionDashboard" ? "Export Dashboard" : variant === "completion" ? "Export Summary" : variant === "siteDetails" || variant === "equipmentInventory" || variant === "installationDetails" || variant === "photoDocs" || variant === "postReadings" || variant === "preReadings" || variant === "testingAddIssue" || variant === "testingVerification" || variant === "testingViewTrend" ? "Save & Exit" : "Export Report"} activeLabel={variant === "acceptance" || variant === "checklist" || variant === "documentation" || variant === "siteDetails" || variant === "equipmentInventory" || variant === "installationDetails" || variant === "photoDocs" || variant === "postReadings" || variant === "preReadings" || variant === "testingAddIssue" || variant === "testingVerification" || variant === "testingViewTrend" ? "In Progress" : variant === "closure" ? "Current Step" : "Current Stage"} completedLabel={variant === "photoDocs" || variant === "postReadings" || variant === "preReadings" || variant === "testingAddIssue" || variant === "testingVerification" || variant === "testingViewTrend" ? "In Progress" : variant === "documentation" || variant === "equipmentInventory" || variant === "installationDetails" ? "In Progress" : "Completed"} firstCompletedLabel={variant === "photoDocs" ? "In Progress" : undefined} futureLabel={variant === "siteDetails" || variant === "equipmentInventory" || variant === "installationDetails" || variant === "photoDocs" || variant === "postReadings" || variant === "preReadings" || variant === "testingAddIssue" || variant === "testingVerification" || variant === "testingViewTrend" ? "Pending" : ""} showActions={variant === "commissioning" || variant === "acceptance" || variant === "checklist" || variant === "closure" || variant === "completion" || variant === "completionDashboard" || variant === "siteDetails" || variant === "equipmentInventory" || variant === "installationDetails" || variant === "photoDocs" || variant === "postReadings" || variant === "preReadings" || variant === "testingVerification"} tall={variant === "completion" || variant === "documentation"} /> : null}
          {fullBleed || customHeader ? null : (
            <section className={variant === "commissioning" || variant === "checklist" || variant === "closure" ? "mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-2.5" : "mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-[15px] font-semibold uppercase tracking-wide">{variant === "commissioning" ? <span className="mr-2 text-slate-400">◎</span> : variant === "checklist" ? <span className="mr-2 text-[#05ff5e]">▣</span> : null}{title}</h1>
                  <p className="mt-1 text-[9px] text-slate-400">{descriptionForVariant(variant)}</p>
                </div>
                {variant === "commissioning" || variant === "acceptance" || variant === "completion" || variant === "completionDashboard" || variant === "signoff" || variant === "closure" ? null : <SummaryDots variant={variant} />}
              </div>
              <DeploymentMeta data={shellData} variant={variant} />
            </section>
          )}
          {variant === "commissioning" ? <CommissioningReport /> : null}
          {variant === "checklist" ? <FinalChecklist /> : null}
          {variant === "acceptance" ? <CustomerAcceptance /> : null}
          {variant === "signoff" ? <SignOffCapture data={data} /> : null}
          {variant === "closure" ? <ClosureConfirmation data={data} /> : null}
          {variant === "completionDashboard" ? <CompletionDashboard data={data} /> : null}
          {variant === "completion" ? <CompletionSummary data={data} deploymentId={deploymentId} /> : null}
          {variant === "documentViewer" ? <DocumentViewer data={documentationData} /> : null}
          {variant === "exportPackage" ? <ExportPackageBuilder data={documentationData} /> : null}
          {variant === "folderDetail" ? <FolderDetailView data={documentationData} /> : null}
          {variant === "permissions" ? <PermissionsAccessControl data={documentationData} /> : null}
          {variant === "reviewQueue" ? <ReviewApprovalQueue data={documentationData} /> : null}
          {variant === "searchResults" ? <SearchResultsPage data={documentationData} /> : null}
          {variant === "uploadWizard" ? <UploadWizard data={documentationData} /> : null}
          {variant === "versionHistory" ? <VersionHistory data={documentationData} /> : null}
          {variant === "documentation" ? <DocumentationHome data={documentationData} /> : null}
          {variant === "equipmentAdd" ? <AddEquipment data={fieldData} /> : null}
          {variant === "equipmentInventory" ? <EquipmentInventory data={fieldData} deploymentId={deploymentId} /> : null}
          {variant === "installationDetails" ? <InstallationDetails data={fieldData} /> : null}
          {variant === "photoDocs" ? <PhotoDocumentSystem data={fieldData} /> : null}
          {variant === "postReadings" ? <ReadingsScreen data={fieldData} kind="post" /> : null}
          {variant === "preReadings" ? <ReadingsScreen data={fieldData} kind="pre" /> : null}
          {variant === "siteDetails" ? <SiteInstallationDetails data={fieldData} /> : null}
          {variant === "testingAddIssue" ? <TestingVerificationAddIssue data={fieldData} /> : null}
          {variant === "testingVerification" ? <TestingVerificationMain data={fieldData} deploymentId={deploymentId} /> : null}
          {variant === "testingViewDetails" ? <TestingVerificationViewDetails data={fieldData} /> : null}
          {variant === "testingViewTrend" ? <TestingVerificationViewTrend data={fieldData} /> : null}
          {fullBleed ? null : <ActionFooter deploymentId={deploymentId} variant={variant} />}
        </main>
      </div>
    </div>
  );
}

function activeStepForVariant(variant: DeploymentWorkflowVariant) {
  if (variant === "closure") return 9;
  if (variant === "acceptance" || variant === "commissioning" || variant === "signoff") return 8;
  if (variant === "installationDetails") return 3;
  if (variant === "photoDocs" || variant === "testingAddIssue" || variant === "testingVerification" || variant === "testingViewTrend") return 5;
  if (variant === "postReadings") return 4;
  if (variant === "preReadings") return 2;
  if (variant === "siteDetails") return 0;
  if (variant === "documentation" || variant === "exportPackage" || variant === "folderDetail" || variant === "permissions" || variant === "reviewQueue" || variant === "searchResults" || variant === "documentViewer" || variant === "uploadWizard" || variant === "versionHistory") return 6;
  if (variant === "equipmentAdd" || variant === "equipmentInventory") return 1;
  return 7;
}

function descriptionForVariant(variant: DeploymentWorkflowVariant) {
  if (variant === "acceptance") return "Review the final checklist, confirm all work meets the agreed requirements, and sign to accept the deployment.";
  if (variant === "closure") return "This deployment has been successfully completed, accepted, and is now closed.";
  if (variant === "commissioning") return "Overview of completed commissioning activities and system readiness.";
  if (variant === "completion") return "All steps have been completed and your data has been saved.";
  if (variant === "completionDashboard") return "Overview of your completed deployment.";
  if (variant === "documentation") return "Manage all documentation for this deployment.";
  if (variant === "equipmentAdd") return "Enter equipment details to include in the inventory and readings list.";
  if (variant === "equipmentInventory") return "Inventory all installed equipment and capture baseline readings where applicable.";
  if (variant === "exportPackage") return "Build and export a complete documentation package for handover, compliance, or record-keeping.";
  if (variant === "folderDetail") return "4 folders and 18 documents.";
  if (variant === "installationDetails") return "Capture detailed information about the installation work performed.";
  if (variant === "photoDocs") return "Capture, organize, and manage all photos and documents for this deployment.";
  if (variant === "permissions") return "Manage who can access, view, upload, and manage documentation.";
  if (variant === "postReadings") return "Capture electrical readings after ECBS installation and compare with baseline.";
  if (variant === "preReadings") return "Capture baseline electrical readings before ECBS installation.";
  if (variant === "reviewQueue") return "Documents pending review or approval.";
  if (variant === "searchResults") return "12 results found for installation permit.";
  if (variant === "siteDetails") return "Enter and verify site information and installation configuration.";
  if (variant === "uploadWizard") return "Follow the steps below to upload and classify your document.";
  if (variant === "versionHistory") return "View and manage all versions of this document.";
  if (variant === "signoff") return "Review final results, confirm acceptance, and capture required signatures to complete the deployment.";
  return "Review and confirm all items before closing the deployment.";
}

function emptyDocumentRow(message = "No Data"): DocumentDataRow {
  return {
    folder: "No Data",
    id: "No Data",
    name: "No Data",
    size: "No Data",
    status: message,
    storageUri: "No Data",
    type: "No Data",
    uploadedAt: "No Data",
    uploadedBy: "No Data",
  };
}

function documentRowsFromData(data?: DeploymentDocumentationData) {
  return data?.documentRows?.length ? data.documentRows : [emptyDocumentRow(data?.message)];
}

function firstDocument(data?: DeploymentDocumentationData) {
  return documentRowsFromData(data)[0] ?? emptyDocumentRow(data?.message);
}

function documentIconColor(type: string) {
  if (type === "JPG" || type === "PNG") return "text-[#05ff5e]";
  if (type === "XLS" || type === "XLSX") return "text-green-400";
  if (type === "DWG") return "text-blue-400";
  return "text-red-400";
}

function emptyEquipmentRow(message = "No Data"): FieldEquipmentRow {
  return {
    id: "No Data",
    lastCommunicatedAt: "No Data",
    location: "No Data",
    name: "No Data",
    rating: "No Data",
    serialNumber: "No Data",
    status: message,
    type: "No Data",
  };
}

function equipmentRowsFromData(data?: DeploymentFieldWorkflowData) {
  return data?.equipmentRows?.length ? data.equipmentRows : [emptyEquipmentRow(data?.message)];
}

function emptyReadingRow(message = "No Data"): FieldReadingRow {
  return {
    delta: "No Data",
    label: "No Data",
    postValue: "No Data",
    preValue: "No Data",
    source: message,
    unit: "No Data",
  };
}

function readingRowsFromData(data: DeploymentFieldWorkflowData | undefined, kind: "post" | "pre") {
  const rows = kind === "post" ? data?.postReadingRows : data?.preReadingRows;
  return rows?.length ? rows : [emptyReadingRow(data?.message)];
}

function testingMetricRows(data?: DeploymentFieldWorkflowData) {
  return readingRowsFromData(data, "post").map((row) => ({
    change: row.delta === "No Data" ? "No Data" : row.delta,
    label: row.label,
    post: row.postValue,
    pre: row.preValue,
    source: row.source,
    unit: row.unit,
  }));
}

function testingStatusText(data?: DeploymentFieldWorkflowData) {
  return data?.state === "data" ? data.status : "No Data";
}

function noDataTestRows() {
  return [
    ["Test Results", "No Data", "No Data", "No approved test-result schema exists.", "No Data", "No Data"],
    ["Issue Records", "No Data", "No Data", "No approved issue/action schema exists.", "No Data", "No Data"],
    ["Technician Assignment", "No Data", "No Data", "No approved technician assignment model exists.", "No Data", "No Data"],
  ];
}

function DeploymentSidebar({ data, variant }: { data?: DeploymentShellData; variant: DeploymentWorkflowVariant }) {
  const acceptance = variant === "acceptance";
  const completed = variant === "checklist";
  const closed = variant === "closure";
  const signoff = variant === "signoff";
  const inProgress = ["documentViewer", "equipmentAdd", "equipmentInventory", "installationDetails", "photoDocs", "postReadings", "preReadings", "siteDetails", "testingAddIssue", "testingVerification", "testingViewDetails", "testingViewTrend", "exportPackage", "folderDetail", "permissions", "reviewQueue", "searchResults", "uploadWizard", "versionHistory", "documentation"].includes(variant);
  const navItems: [DeploymentIconName, string][] = [["dashboard", "Dashboard"], ["deployments", "Deployments"], ["site", "Sites"], ["device", "Devices"], ["installation", "Installations"], ["checklist", "Forms & Checklists"], ["report", "Reports"], ["sync", "Sync Data"], ["offline", "Offline Data"], ["settings", "Settings"]];
  return (
    <aside className="flex min-h-0 flex-col border-r border-cyan-300/10 bg-[#030c15] px-3 py-3">
      <div className="mb-4 border-b border-white/8 pb-3"><div className="text-[29px] font-black italic tracking-[-0.13em]"><span className="text-[#05ff5e]">X</span>ECO</div><div className="text-[9px] font-bold uppercase tracking-[.48em] text-[#05ff5e]">Energy</div></div>
      <nav className="space-y-1.5 text-[10px]">
        {navItems.map(([icon, item]) => <div className={item === "Deployments" ? "flex items-center gap-2 rounded bg-[#063b27] px-2 py-2 text-[#05ff5e]" : "flex items-center gap-2 px-2 py-2 text-slate-300"} key={item}><DeploymentIcon className="size-3.5 shrink-0" name={icon} />{item}</div>)}
      </nav>
      <div className="mt-5 border-t border-white/8 pt-3 text-[9px] leading-relaxed text-slate-400"><b className="uppercase">Deployment Summary</b><br />Deployment ID<br /><span className="text-slate-200">{data?.deploymentId ?? "No Data"}</span><br /><br />Site<br /><span className="text-slate-200">{data?.siteName ?? "No Data"}</span><br /><br />Status<br /><span className={acceptance || inProgress ? "text-blue-400" : "text-[#05ff5e]"}>● {data?.status ?? "No Data"}</span><br /><br />{closed ? "Customer" : "Technician"}<br /><span className="text-slate-200">{closed ? data?.clientName ?? "No Data" : "No Data"}</span><br /><br />Start Time<br /><span className="text-slate-200">No Data</span><br />{inProgress ? "Last Sync" : closed ? "Closed On" : signoff ? "Commissioned On" : "Completion Time"}<br /><span className="text-slate-200">{data?.updatedAt ?? "No Data"}</span><br />{inProgress ? "" : closed ? "Total Duration" : "Duration"}<br /><span className="text-slate-200">{inProgress ? "" : "No Data"}</span></div>
      <button className="mt-auto flex items-center justify-center gap-2 rounded border border-cyan-300/12 bg-[#061421] px-3 py-2 text-[9px] text-slate-200"><DeploymentIcon className="size-3.5" name="sync" />Sync Now</button>
      <div className="mt-3 grid grid-cols-[18px_1fr] rounded border border-cyan-300/12 bg-[#061421] p-2 text-[9px] text-slate-300"><DeploymentIcon className="mt-0.5 size-4" name="support" /><span>Need Help?<br /><span className="text-slate-500">Contact Support</span></span></div>
    </aside>
  );
}

function Topbar({ data, variant }: { data?: DeploymentShellData; variant: DeploymentWorkflowVariant }) {
  return (
    <header className="flex h-[50px] items-center justify-between border-b border-cyan-300/10">
      <div><div className="text-[13px] font-semibold">ECBS Deployment App</div><div className="mt-1 text-[9px] text-slate-400">Deployments › New Deployment › Field Data Entry › {variant === "documentViewer" ? "Documentation › Document Viewer" : variant === "exportPackage" ? "Documentation › Export Package Builder" : variant === "folderDetail" ? "Documentation › Folder Detail" : variant === "permissions" ? "Documentation › Permissions / Access Control" : variant === "reviewQueue" ? "Documentation › Review / Approval Queue" : variant === "searchResults" ? "Documentation › Search Results" : variant === "uploadWizard" ? "Documentation › Upload Wizard" : variant === "versionHistory" ? "Documentation › Document Viewer › Version History" : variant === "documentation" ? "Documentation" : variant === "equipmentAdd" ? "Equipment Inventory & Readings › Add Equipment" : variant === "equipmentInventory" ? "Equipment Inventory & Readings" : variant === "installationDetails" ? "Installation Details" : variant === "photoDocs" ? "Photo & Document System" : variant === "postReadings" ? "Post-Installation Readings" : variant === "preReadings" ? "Pre-Installation Readings" : variant === "siteDetails" ? "Site & Installation Details" :
    variant === "testingAddIssue" ? "Testing & Verification" :
    variant === "testingVerification" ? "Testing & Verification" :
    variant === "testingViewDetails" ? "View Details" :
    variant === "testingViewTrend" ? "View Trend" : variant === "closure" ? "Closure Confirmation" : variant === "signoff" ? "Sign-Off Capture" : variant === "completionDashboard" ? "Deployment Dashboard" : variant === "completion" ? "Completion" : variant === "acceptance" ? "Customer Acceptance" : variant === "commissioning" ? "Commissioning Summary Report" : "Final Validation Checklist"}</div></div>
      <div className="flex items-center gap-3 text-[10px]"><Button><span className="inline-flex items-center gap-1.5"><DeploymentIcon className="size-3.5" name="site" />{data?.siteName ?? "No Data"}</span></Button><Button><span className="inline-flex items-center gap-1.5"><DeploymentIcon className="size-3.5" name="calendar" />{data?.updatedAt ?? "No Data"}</span></Button><span className="text-[#05ff5e]">● {data?.status ?? "No Data"}</span><DeploymentIcon className="size-3.5 text-red-400" name="bell" /><DeploymentIcon className="size-3.5 text-slate-400" name="help" /><span className="grid size-8 place-items-center rounded-full bg-[#0b3158]">ND</span><span>No Data<br /><span className="text-[#05ff5e]">Field Technician</span></span></div>
    </header>
  );
}

function Stepper({ actionLabel = "Export Report", active, activeLabel = "Current Stage", completedLabel = "Completed", firstCompletedLabel, futureLabel = "", showActions = false, tall = false }: { actionLabel?: string; active: number; activeLabel?: string; completedLabel?: string; firstCompletedLabel?: string; futureLabel?: string; showActions?: boolean; tall?: boolean }) {
  const height = tall ? "h-[94px]" : "h-[54px]";
  const displaySteps = futureLabel === "Pending" ? steps.slice(0, 8) : steps;
  const columns = displaySteps.length === 8 ? "grid-cols-8" : "grid-cols-9";
  return <div className="relative border-b border-cyan-300/10"><div className={showActions ? `grid ${height} ${columns} items-center gap-1 pr-[260px] text-center text-[7px]` : `grid ${height} ${columns} items-center gap-1 text-center text-[7px]`}>{displaySteps.map((step, index) => <div className="relative" key={step}><div className={index === active ? "mx-auto grid size-6 place-items-center rounded-full bg-[#05ff5e] font-semibold text-[#02100a]" : index < active ? "mx-auto grid size-5 place-items-center rounded-full bg-slate-400 font-semibold text-[#02100a]" : "mx-auto grid size-5 place-items-center rounded-full bg-slate-600"}>{index + 1}</div><div className="mt-0.5 text-slate-300">{step}</div><div className={index < active ? "text-[#05ff5e]" : index === active ? "text-slate-300" : "text-slate-500"}>{index < active ? firstCompletedLabel && index === 0 ? firstCompletedLabel : completedLabel : index === active ? activeLabel : futureLabel}</div></div>)}</div>{showActions ? <div className={tall ? "absolute right-0 top-4 flex items-center gap-3 text-[8px]" : "absolute right-0 top-2 flex items-center gap-3 text-[8px]"}><span className="text-[#05ff5e]">● Auto-saved: 10:15:23 AM</span><Button>{actionLabel === "Export Report" ? "⇩ " : actionLabel === "Save & Exit" ? "" : "▣ "}{actionLabel}</Button></div> : null}</div>;
}

function DeploymentMeta({ data, variant }: { data?: DeploymentShellData; variant: DeploymentWorkflowVariant }) {
  if (variant === "closure") return <div className="mt-2 grid grid-cols-[0.75fr_0.7fr_0.65fr_1.8fr_0.8fr_0.7fr] gap-4 border-t border-cyan-300/10 pt-2 text-[9px]"><Info label="Deployment ID" value={data?.deploymentId ?? "No Data"} /><Info label="Site" value={data?.siteName ?? "No Data"} /><Info label="Customer" value={data?.clientName ?? "No Data"} /><Info label="Address" value="No Data" /><Info label="Closed On" value="No Data" /><Info label="Closed By" value="No Data" /></div>;
  return <div className="mt-2 grid grid-cols-[0.75fr_0.7fr_0.65fr_1.45fr_0.7fr_0.95fr_0.6fr] gap-4 border-t border-cyan-300/10 pt-2 text-[9px]"><Info label="Deployment ID" value={data?.deploymentId ?? "No Data"} /><Info label="Site" value={data?.siteName ?? "No Data"} /><Info label="Customer" value={data?.clientName ?? "No Data"} /><Info label="Address" value="No Data" /><Info label="Technician" value="No Data" /><Info label="Commissioned On" value={data?.updatedAt ?? "No Data"} /><Info label="Duration" value="No Data" /></div>;
}

function TestingVerificationMain({ data, deploymentId }: { data?: DeploymentFieldWorkflowData; deploymentId: string }) {
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
        <div className="flex items-start justify-between gap-4">
          <div><h1 className="text-[15px] font-semibold uppercase">Testing & Verification</h1><p className="mt-1 text-[9px] text-slate-400">Verify system operation, performance, and safety after ECBS installation.</p></div>
          <div className="grid min-w-[610px] grid-cols-3 gap-4 text-[9px]"><Field label="Testing Start" value={data?.updatedAt ?? "No Data"} /><Field label="Technician" value="No Data" /><div><div className="text-slate-500">Overall Status</div><div className="mt-1 inline-flex rounded border border-slate-600 bg-[#03111c] px-3 py-1 text-slate-300">{testingStatusText(data)}</div></div></div>
        </div>
      </section>
      <section className="mt-2 grid h-[236px] min-h-0 grid-cols-[0.95fr_1fr_0.98fr] gap-2">
        <ExportPanel title="Test Progress"><TestingProgressSummary /></ExportPanel>
        <ExportPanel title="System Performance Summary" action={<Link className="text-cyan-400" href={`/operations/deployments/${deploymentId}/testing-verification?mode=trend`}>View Trend</Link>}><TestingPerformanceSummary data={data} /></ExportPanel>
        <ExportPanel title="Test Summary by Category" action={<Link className="text-cyan-400" href={`/operations/deployments/${deploymentId}/testing-verification?mode=details`}>View Details</Link>}><TestingCategorySummary /></ExportPanel>
      </section>
      <section className="mt-2 grid h-[402px] min-h-0 grid-cols-[1.42fr_1fr] gap-2">
        <ExportPanel title="Testing Checklist"><TestingChecklistTable /></ExportPanel>
        <div className="grid min-h-0 grid-rows-[1fr_136px] gap-2"><ExportPanel title="Issues & Actions" action={<Link className="text-cyan-400" href={`/operations/deployments/${deploymentId}/testing-verification?mode=add-issue`}>Add Issue</Link>}><TestingIssuesActions /></ExportPanel><ExportPanel title="Test Notes"><TestingBaseNotes data={data} /></ExportPanel></div>
      </section>
    </>
  );
}

function TestingProgressSummary() {
  const stats = [["", "No Data", "Passed", "No Data", "border border-slate-600 text-slate-400"], ["", "No Data", "Warning", "No Data", "border border-slate-600 text-slate-400"], ["", "No Data", "Failed", "No Data", "border border-slate-600 text-slate-400"], ["", "No Data", "Not Tested", "No Data", "border border-slate-600 text-slate-400"]];
  return <div className="h-[calc(100%-22px)]"><div className="grid grid-cols-4 gap-4">{stats.map(([icon, value, label, pct, color]) => <div className="rounded border border-cyan-300/10 bg-[#061421] p-3" key={label}><div className={`grid size-5 place-items-center rounded-full text-[11px] ${color}`}>{icon}</div><div className="mt-3 text-[24px] leading-none text-white">{value}</div><div className="mt-1 text-[9px] text-slate-300">{label}</div><div className="text-[9px] text-slate-400">{pct}</div></div>)}</div><div className="mt-5 h-2 rounded-full bg-slate-800"><div className="h-full w-0 rounded-full bg-[#22c55e]" /></div><div className="mt-4 flex justify-between text-[9px] text-slate-400"><span>No approved test-result schema exists</span><span>No Data</span></div></div>;
}

function TestingPerformanceSummary({ data }: { data?: DeploymentFieldWorkflowData }) {
  const cards = testingMetricRows(data).slice(0, 4).map((row) => [row.label, row.post, row.unit, row.change]);
  return <div className="h-[calc(100%-22px)]"><div className="mb-3 flex items-end gap-3 text-[9px]"><span className="text-slate-400">Compare With</span><Field label="" value="Baseline (Pre-Installation)⌄" /></div><div className="grid grid-cols-4 gap-2">{cards.map(([label, value, unit, change]) => <div className="rounded border border-cyan-300/10 bg-[#061421] p-3" key={label}><div className="text-[8px] text-slate-400">{label}</div><div className="mt-3 text-[21px] leading-none text-white">{value}<span className="ml-1 text-[12px]">{unit}</span></div><div className="mt-3 text-[9px] text-[#05ff5e]">{change}</div></div>)}</div><div className="mt-4 text-[9px] text-slate-400"><span className="text-slate-500">◎</span> Expected-parameter testing model: No Data.</div></div>;
}

function TestingCategorySummary() {
  return <div className="grid h-[calc(100%-22px)] grid-cols-[150px_1fr] items-center gap-5"><div className="relative mx-auto size-[135px] rounded-full bg-[conic-gradient(#334155_0_100%)]"><div className="absolute inset-7 grid place-items-center rounded-full bg-[#061521] text-center"><div><div className="text-[22px] font-semibold">No Data</div><div className="text-[9px] text-slate-400">Total Tests</div></div></div></div><div className="space-y-4 text-[9px]"><div className="flex justify-between"><span><span className="text-slate-500">●</span> Passed (No Data)</span><span>No Data</span></div><div className="flex justify-between"><span><span className="text-slate-500">●</span> Warning (No Data)</span><span>No Data</span></div><div className="flex justify-between"><span><span className="text-slate-500">●</span> Failed (No Data)</span><span>No Data</span></div><div className="flex justify-between"><span><span className="text-slate-500">●</span> Not Tested (No Data)</span><span>No Data</span></div></div></div>;
}

function TestingChecklistTable() {
  const rows = noDataTestRows();
  return <div className="h-[calc(100%-22px)]"><table className="w-full text-left text-[8.5px]"><thead className="bg-[#092033] text-slate-400"><tr>{["Test Item", "Category", "Status", "Statut", "Captured Time", "Actions"].map((h) => <th className="px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={row[0]}>{row.map((c, i) => <td className={i === 2 ? "px-2 py-[6.5px] text-slate-400" : "px-2 py-[6.5px] text-slate-200"} key={i}>{i === 5 ? "No Data" : c}</td>)}</tr>)}</tbody></table><div className="mt-3 flex items-center justify-between text-[9px] text-slate-400"><span>Showing No Data test rows</span><span className="space-x-5">‹ <b className="rounded border border-[#05ff5e] px-2 py-1 text-[#05ff5e]">1</b> ›</span><span>Rows per page: <b className="rounded border border-cyan-300/10 px-2 py-1">10⌄</b></span></div></div>;
}

function TestingIssuesActions() {
  return <div className="space-y-3 text-[9px]"><TestingIssueCard tone="amber" title="No Data" body="No approved issue/action schema exists." /></div>;
}

function TestingIssueCard({ tone, title, body }: { tone: "red" | "amber"; title: string; body: string }) {
  return <div className="rounded border border-cyan-300/10 bg-[#061421] p-3"><div className={tone === "red" ? "mb-2 inline-flex rounded border border-red-500 px-2 py-0.5 text-red-400" : "mb-2 inline-flex rounded border border-slate-500 px-2 py-0.5 text-slate-400"}>{title === "No Data" ? "No Data" : tone === "red" ? "Failed" : "No Data"}</div><div className="font-semibold">{title}</div><div className="mt-1 grid grid-cols-[1fr_86px_78px] gap-3 text-slate-400"><span>{body}</span><span>Assigned To<br /><b className="font-normal text-slate-200">No Data</b></span><span>Due Date<br /><b className="font-normal text-slate-200">No Data</b></span></div></div>;
}

function TestingBaseNotes({ data }: { data?: DeploymentFieldWorkflowData }) {
  return <div><div className="h-[86px] rounded border border-cyan-300/10 bg-[#03111c] p-3 text-[9px] text-slate-300">{data?.message || "No approved testing notes source exists."}</div><div className="mt-2 text-[8px] text-slate-500">0 / 1000 characters</div></div>;
}

function TestingVerificationViewTrend({ data }: { data?: DeploymentFieldWorkflowData }) {
  const metrics = testingMetricRows(data);
  return (
    <>
      <section className="mt-3 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
        <div className="flex items-start justify-between gap-5">
          <div><h1 className="text-[15px] font-semibold uppercase">System Performance Trend</h1><p className="mt-1 text-[9px] text-slate-400">Compare baseline (pre-installation) and post-installation performance over time.</p></div>
          <div className="flex items-end gap-3 text-[9px]"><Field label="Compare With" value="Baseline (Pre-Installation)⌄" /><Field label="" value={data?.updatedAt ?? "No Data"} /><span className="pb-2 text-slate-500">→</span><Field label="" value={data?.updatedAt ?? "No Data"} /><Button>⇩ Export</Button></div>
        </div>
      </section>
      <section className="mt-2 grid h-[122px] grid-cols-6 gap-2">
        {metrics.slice(0, 6).map((row) => <TrendMetricCard key={row.label} label={row.label} value={row.post} unit={row.unit} change={row.change} sub={`Baseline: ${row.pre} ${row.unit}`} />)}
      </section>
      <section className="mt-2 grid h-[290px] min-h-0 grid-cols-[1.35fr_1fr] gap-2">
        <ExportPanel title="Trend Over Time" action={<Button>Add Parameter⌄</Button>}><TrendOverTimePanel /></ExportPanel>
        <ExportPanel title="Parameter Comparison"><ParameterComparisonPanel data={data} /></ExportPanel>
      </section>
      <section className="mt-2 grid h-[204px] min-h-0 grid-cols-[0.88fr_0.86fr_1.05fr] gap-2">
        <ExportPanel title="Load Profile (kW)"><LoadProfilePanel /></ExportPanel>
        <ExportPanel title="Power Factor Trend"><PowerFactorTrendPanel /></ExportPanel>
        <ExportPanel title="Event Annotations" action={<Button>＋ Add Annotation</Button>}><EventAnnotationsPanel /></ExportPanel>
      </section>
    </>
  );
}

function TrendMetricCard({ label, value, unit, change, sub }: { label: string; value: string; unit: string; change: string; sub: string }) {
  return <div className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4"><div className="text-[9px] text-slate-400">{label}</div><div className="mt-3 text-[26px] leading-none text-white">{value}<span className="ml-1 text-[16px]">{unit}</span></div><div className="mt-2 text-[10px] text-[#05ff5e]">{change}</div><div className="mt-1 text-[9px] text-slate-400">{sub}</div></div>;
}

function TrendOverTimePanel() {
  return <div className="h-[calc(100%-22px)]"><div className="mb-1 flex gap-6 text-[8px]"><span className="text-[#22c55e]">━ Telemetry After</span><span className="text-slate-400">-- Telemetry Baseline</span></div><div className="grid h-[176px] place-items-center rounded border border-cyan-300/10 bg-[#03111c] text-[11px] text-slate-400">No approved trend-series source exists.</div><div className="mt-2 flex gap-2 text-[8px]"><span className="rounded bg-[#063b27] px-4 py-1 text-[#05ff5e]">No Data</span></div></div>;
}

function ParameterComparisonPanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  const rows = testingMetricRows(data).map((row) => [row.label, `${row.pre} ${row.unit}`, `${row.post} ${row.unit}`, `${row.change} ${row.unit}`, "No Data"]);
  return <div className="h-[calc(100%-22px)]"><table className="w-full text-left text-[9px]"><thead className="text-slate-400"><tr>{["Parameter", "Baseline (Avg)", "After (Avg)", "Change", "Change %"].map((h) => <th className="px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={row[0]}>{row.map((c, i) => <td className={i === 4 ? "px-2 py-[7px] text-slate-400" : "px-2 py-[7px] text-slate-200"} key={i}>{c}</td>)}</tr>)}</tbody></table><div className="mt-3 text-[8px] text-slate-400"><span className="text-slate-500">◎</span> Change percentages require approved baseline rules.</div></div>;
}

function LoadProfilePanel() {
  return <div className="h-[calc(100%-22px)]"><div className="mb-2 flex justify-center gap-5 text-[8px]"><span>■ Baseline (Pre-Installation)</span><span className="text-[#05ff5e]">■ After (Post-Installation)</span></div><div className="grid h-[130px] place-items-center rounded border border-cyan-300/10 bg-[#03111c] text-[10px] text-slate-400">No approved load profile source exists.</div></div>;
}

function PowerFactorTrendPanel() {
  return <div className="h-[calc(100%-22px)]"><div className="mb-2 flex justify-center gap-5 text-[8px]"><span>-- Baseline (Pre-Installation)</span><span className="text-[#38bdf8]">━ After (Post-Installation)</span></div><div className="grid h-[130px] place-items-center rounded border border-cyan-300/10 bg-[#03111c] text-[10px] text-slate-400">No approved power factor trend source exists.</div></div>;
}

function EventAnnotationsPanel() {
  const rows = [["No Data", "No Data", "No approved annotation/event table exists.", "green"]];
  return <div className="space-y-4 text-[9px]">{rows.map(([time, title, body, color]) => <div className="grid grid-cols-[26px_64px_1fr_78px] items-start gap-2" key={title}><span className={color === "green" ? "text-[#05ff5e]" : color === "purple" ? "text-violet-400" : "text-sky-400"}>●</span><span>{time}</span><div><div className="font-semibold">{title}</div><div className="mt-1 text-slate-400">{body}</div></div><span className="text-slate-400">By: No Data</span></div>)}<div className="text-[8px] text-slate-500">Showing No Data annotations</div></div>;
}

function TestingVerificationViewDetails({ data }: { data?: DeploymentFieldWorkflowData }) {
  return (
    <>
      <div className="mt-3 flex h-[72px] items-center justify-between">
        <div><div className="mb-3 text-[9px] text-slate-400">← Back to Testing & Verification</div><h1 className="text-[15px] font-semibold uppercase">Test Summary Details</h1><p className="mt-1 text-[9px] text-slate-400">Comprehensive view of test results and parameter performance.</p></div>
        <Button>⇩ Export PDF</Button>
      </div>
      <section className="grid h-[70px] grid-cols-[1.05fr_0.72fr_0.72fr_0.72fr_0.72fr_0.72fr] gap-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3 text-[9px]"><Info label="Test Date & Time" value={data?.updatedAt ?? "No Data"} /><Info label="Technician" value="No Data" /><Info label="Test Duration" value="No Data" /><div><div className="text-slate-500">Overall Status</div><div className="mt-1 inline-flex rounded border border-slate-600 bg-[#03111c] px-3 py-1 text-slate-300">{testingStatusText(data)}</div></div><Info label="Tests Completed" value="No Data" /><Info label="Compliance" value="No Data" /></section>
      <div className="mt-3 flex h-[30px] items-end gap-12 border-b border-cyan-300/10 text-[9px]"><span className="border-b border-[#05ff5e] pb-2 text-[#05ff5e]">Performance Summary</span><span>Detailed Readings</span><span>Trend Analysis</span><span>Event Log</span><span>Attachments</span></div>
      <section className="mt-2 grid h-[300px] min-h-0 grid-cols-[1.15fr_0.92fr_0.43fr] gap-2">
        <ExportPanel title="Performance Overview"><PerformanceOverviewTable data={data} /></ExportPanel>
        <ExportPanel title="Before vs After Comparison"><BeforeAfterComparisonChart /></ExportPanel>
        <ExportPanel title="Test Information"><TestInformationPanel data={data} /></ExportPanel>
      </section>
      <section className="mt-2 grid h-[274px] min-h-0 grid-cols-[1.3fr_0.72fr_0.46fr] gap-2">
        <ExportPanel title="Detailed Parameter Trend"><ParameterTrendPanel /></ExportPanel>
        <ExportPanel title="Statistical Summary" action={<span className="text-cyan-400">View Calculation Details</span>}><StatisticalSummaryPanel data={data} /></ExportPanel>
        <div className="grid min-h-0 grid-rows-[138px_1fr] gap-2 overflow-hidden"><ExportPanel title="Quality Check"><DetailQualityCheck /></ExportPanel><ExportPanel title="Notes"><DetailNotesPanel /></ExportPanel></div>
      </section>
    </>
  );
}

function PerformanceOverviewTable({ data }: { data?: DeploymentFieldWorkflowData }) {
  const rows = testingMetricRows(data).map((row) => [row.label, `${row.pre} ${row.unit}`, `${row.post} ${row.unit}`, `${row.change} ${row.unit}`, "No Data", row.source]);
  return <div className="flex h-[calc(100%-22px)] flex-col"><table className="w-full text-left text-[8px]"><thead className="bg-[#092033] text-slate-400"><tr>{["Parameter", "Baseline (Pre)", "After (Post)", "Change", "Change %", "Status"].map((h) => <th className="px-2 py-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={row[0]}>{row.map((c, i) => <td className={i > 3 ? "px-2 py-[4px] text-slate-400" : "px-2 py-[4px] text-slate-200"} key={i}>{c}</td>)}</tr>)}</tbody></table><div className="mt-auto flex gap-8 text-[8px] text-slate-400"><span>Change %: No Data</span><span>Quality model: No Data</span></div></div>;
}

function BeforeAfterComparisonChart() {
  return <div className="h-[calc(100%-22px)]"><div className="mb-3 flex justify-center gap-8 text-[8px]"><span>■ Baseline (Pre-Installation)</span><span className="text-[#05ff5e]">■ After (Post-Installation)</span></div><div className="grid h-[220px] place-items-center border-b border-cyan-300/10 px-4 text-center text-[10px] text-slate-400">No approved chart series source exists.</div></div>;
}

function TestInformationPanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  const equipment = equipmentRowsFromData(data)[0] ?? emptyEquipmentRow();
  return <MetricList rows={[["Test Started", data?.updatedAt ?? "No Data"], ["Test Completed", "No Data"], ["Testing Duration", "No Data"], ["System Mode", "No Data"], ["Load Condition", "No Data"], ["Weather / Ambient", "No Data"], ["Meter / Device", equipment.name], ["Data Source", data?.state === "data" ? "ecbs_os" : "No Data"]]} />;
}

function ParameterTrendPanel() {
  return <div className="h-[calc(100%-22px)]"><div className="mb-2 grid grid-cols-[150px_150px_120px_1fr] gap-3 text-[8px]"><Field label="Parameter" value="No Data" /><Field label="Time Range" value="No Data" /><Field label="Interval" value="No Data" /><div className="self-end text-right"><Button>Reset Zoom</Button></div></div><div className="grid h-[178px] place-items-center rounded border border-cyan-300/10 bg-[#03111c] text-[10px] text-slate-400">No approved detailed trend-series source exists.</div></div>;
}

function StatisticalSummaryPanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  const first = testingMetricRows(data)[0];
  return <MetricList rows={[["Average (Baseline)", first ? `${first.pre} ${first.unit}` : "No Data"], ["Average (After)", first ? `${first.post} ${first.unit}` : "No Data"], ["Maximum (Baseline)", "No Data"], ["Maximum (After)", "No Data"], ["Minimum (Baseline)", "No Data"], ["Minimum (After)", "No Data"], ["Standard Deviation (Baseline)", "No Data"], ["Standard Deviation (After)", "No Data"]]} />;
}

function DetailQualityCheck() {
  return <div className="space-y-2 text-[9px]">{["Required parameters: No Data", "Missing readings: No Data", "Expected range model: No Data", "Data consistency: No Data", "Meter synchronization: No Data"].map((item) => <div className="flex items-center gap-2" key={item}><span className="text-slate-500">◎</span>{item}</div>)}</div>;
}

function DetailNotesPanel() {
  return <div><div className="h-[76px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[8.5px] leading-relaxed text-slate-400">No approved testing notes source exists.</div><div className="mt-2 text-[8px] text-slate-500">0 / 1000 characters</div></div>;
}

function TestingVerificationAddIssue({ data }: { data?: DeploymentFieldWorkflowData }) {
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><h1 className="text-[15px] font-semibold uppercase">Testing & Verification</h1><p className="mt-1 text-[9px] text-slate-400">Verify system operation, performance, and safety after installation.</p></section>
      <section className="mt-2 grid h-[514px] min-h-0 grid-cols-[1.05fr_1.1fr_0.95fr] gap-2 opacity-60">
        <div className="grid min-h-0 grid-rows-[182px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="Test Progress"><TestingProgressPanel /></ExportPanel>
          <ExportPanel title="Testing Checklist"><TestingChecklistPanel /></ExportPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[1fr] gap-2 overflow-hidden">
          <ExportPanel title="Performance Verification"><TestingPerformancePanel data={data} /></ExportPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[182px_156px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="Test Summary By Category" action={<span className="text-cyan-400">View Details</span>}><TestSummaryByCategory /></ExportPanel>
          <ExportPanel title="Open Issues / Actions" action={<span className="text-cyan-400">Add Issue</span>}><TestingIssuesPanel /></ExportPanel>
          <ExportPanel title="Notes"><TestingNotesPanel /></ExportPanel>
        </div>
      </section>
      <AddIssueModal />
    </>
  );
}

function TestingProgressPanel() {
  return <div className="h-[calc(100%-22px)]"><div className="grid grid-cols-4 gap-2 text-[9px]">{[["", "No Data", "Passed", "#64748b"], ["", "No Data", "Warning", "#64748b"], ["", "No Data", "Failed", "#64748b"], ["", "No Data", "Not Tested", "#64748b"]].map(([icon, value, label, color]) => <div className="rounded border border-cyan-300/12 bg-[#03111c] p-3" key={label}><div style={{ color }}>{icon}</div><div className="mt-2 text-[22px] leading-none text-slate-100">{value}</div><div className="mt-2 text-slate-400">{label}</div><div style={{ color }} className="mt-1">No Data</div></div>)}</div><div className="mt-4 h-2 rounded bg-slate-800"><div className="h-2 w-0 rounded bg-[#22c55e]" /></div><div className="mt-3 text-[8.5px] text-slate-400">No approved test-result schema exists</div></div>;
}

function TestingChecklistPanel() {
  const rows = noDataTestRows().map(([item, category, status]) => [item, category, status]);
  return <div className="flex h-[calc(100%-22px)] flex-col"><table className="w-full text-left text-[8px]"><thead className="bg-[#092033] text-slate-400"><tr>{["Test Item", "Category", "Status"].map((h) => <th className="px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([item, cat, status]) => <tr className="border-b border-white/5" key={item}><td className="px-2 py-[5px] text-slate-200">{item}</td><td className="px-2">{cat}</td><td className="px-2 text-slate-400">{status}</td></tr>)}</tbody></table><div className="mt-auto text-[8.5px] text-slate-400">Showing No Data test rows</div></div>;
}

function TestingPerformancePanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  const metrics = testingMetricRows(data).slice(0, 3);
  return <div className="space-y-3 text-[9px]">{metrics.map((row) => <TestingMetricRow key={row.label} label={row.label} value={`${row.post} ${row.unit}`} tone="green" />)}<TestingMetricRow label="Voltage Stability" value="No Data" tone="yellow" /><TestingMetricRow label="Current Balance" value="No Data" tone="yellow" /><div className="mt-4 rounded border border-cyan-300/12 bg-[#03111c] p-3"><div className="text-slate-400">Selected Test</div><div className="mt-2 text-slate-100">No Data</div><p className="mt-2 text-[8.5px] leading-relaxed text-slate-400">No approved testing issue/action schema exists.</p></div></div>;
}

function TestingMetricRow({ label, tone, value }: { label: string; tone: "green" | "yellow"; value: string }) {
  return <div className="grid grid-cols-[1fr_96px] items-center border-b border-white/5 pb-2"><span className="text-slate-400">{label}</span><span className={tone === "green" ? "text-right text-[#05ff5e]" : "text-right text-yellow-300"}>{value}</span></div>;
}

function TestSummaryByCategory() {
  return <div className="grid h-[calc(100%-22px)] grid-cols-[116px_1fr] items-center gap-4"><div className="grid size-[108px] place-items-center rounded-full p-[14px]" style={{ background: "conic-gradient(#334155 0 100%)" }}><div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center text-[16px] leading-none">No Data<br /><span className="text-[8px] text-slate-400">Total Tests</span></div></div><div className="space-y-2 text-[8.5px]"><TestingLegend color="#64748b" label="Passed (No Data)" value="No Data" /><TestingLegend color="#64748b" label="Warning (No Data)" value="No Data" /><TestingLegend color="#64748b" label="Failed (No Data)" value="No Data" /><TestingLegend color="#64748b" label="Not Tested (No Data)" value="No Data" /></div></div>;
}

function TestingLegend({ color, label, value }: { color: string; label: string; value: string }) {
  return <div className="grid grid-cols-[10px_1fr_34px] items-center gap-2"><span className="size-2 rounded-full" style={{ backgroundColor: color }} /><span>{label}</span><span>{value}</span></div>;
}

function TestingIssuesPanel() {
  return <div className="space-y-2 text-[8.5px]"><TestingIssue severity="No Data" title="No approved issue/action schema exists." /></div>;
}

function TestingIssue({ severity, title }: { severity: string; title: string }) {
  return <div className="rounded border border-cyan-300/12 bg-[#03111c] p-2"><span className="rounded bg-slate-500/20 px-2 py-0.5 text-slate-300">{severity}</span><div className="mt-1 font-semibold text-slate-200">{title}</div><div className="mt-1 grid grid-cols-2 text-slate-400"><span>Assigned To<br /><b className="text-slate-300">No Data</b></span><span>Due Date<br /><b className="text-slate-300">No Data</b></span></div></div>;
}

function TestingNotesPanel() {
  return <div><div className="h-[72px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[8.5px] text-slate-500">No Data</div><div className="mt-2 text-[8px] text-slate-500">0 / 1000 characters</div></div>;
}

function AddIssueModal() {
  return <div className="fixed left-[390px] top-[144px] z-50 h-[730px] w-[654px] overflow-hidden rounded-lg border border-cyan-300/18 bg-[#061a2b] p-5 shadow-2xl shadow-black/70"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-[17px] font-semibold uppercase">Add Issue</h2><p className="mt-2 text-[9px] text-slate-300">Record problems, risks, or deficiencies found during testing and verification.</p></div><button className="text-[24px] text-slate-400">×</button></div><div className="grid grid-cols-2 gap-x-5 gap-y-3 text-[9px]"><IssueField label="Issue Title *" value="Manual input required" /><IssueField label="Category *" value="No Data" /><IssueField label="Severity *" value="No Data" /><IssueField label="Status *" value="No Data" /><div className="col-span-2"><IssueArea label="Description *" value="Manual input required" h="h-[74px]" count="0 / 2000 characters" /></div><IssueField label="Assigned To" value="No Data" /><IssueField label="Due Date" value="No Data" /><IssueField label="Related Test Item (Optional)" value="No Data" /><IssueField label="Phase / Circuit (Optional)" value="No Data" /><div className="col-span-2"><IssueArea label="Recommended Action" value="Manual input required" h="h-[58px]" count="0 / 2000 characters" /></div><div className="col-span-2"><div className="mb-1 text-slate-300">Attachments (Optional)</div><div className="rounded border border-dashed border-cyan-300/25 bg-[#03111c] py-3 text-center text-[9px] text-slate-400">◇ &nbsp; Drag & drop files here or <button className="ml-2 rounded border border-cyan-300/12 bg-[#061421] px-5 py-1.5 text-slate-200">Select Files</button></div><div className="mt-2 text-[8px] text-slate-400">No upload command implemented in this batch.</div></div></div><div className="mt-5 flex justify-between"><Button>Cancel</Button><button className="rounded bg-[#087a35] px-6 py-2 text-[10px] font-semibold">Add Issue &nbsp; ⊕</button></div></div>;
}

function IssueField({ label, value }: { label: string; value: string }) {
  return <div><div className="mb-1 text-slate-300">{label}</div><div className="rounded border border-cyan-300/12 bg-[#03111c] px-3 py-2 text-slate-500">{value}</div></div>;
}

function IssueArea({ count, h, label, value }: { count: string; h: string; label: string; value: string }) {
  return <div><div className="mb-1 text-slate-300">{label}</div><div className={`${h} rounded border border-cyan-300/12 bg-[#03111c] p-3 text-slate-500`}>{value}</div><div className="mt-1 text-[8px] text-slate-400">{count}</div></div>;
}

function CommissioningReport() {
  return (
    <>
      <section className="mt-2 grid h-[122px] grid-cols-[1fr_1fr_1fr_0.9fr] gap-2">
        <Panel title="Overall Commissioning Status"><StatusHero value="Commissioned" /></Panel>
        <Panel title="System Readiness Score"><ReadinessScore /></Panel>
        <Panel title="Tests & Verification"><ChecklistSmall items={["Functional Tests", "Safety Tests", "Performance Tests", "Communications Tests"]} status="Passed" /></Panel>
        <Panel title="Key Metrics"><CommissioningMetrics /></Panel>
      </section>
      <section className="mt-2 grid h-[286px] grid-cols-[1.25fr_1fr_0.9fr] gap-2">
        <Panel title="Commissioning Checklist Summary"><DarkTable headers={["Category", "Items", "Passed", "Warnings", "Failures", "Status"]} rows={[["Installation Verification", "14", "14", "0", "0", "Passed"], ["Equipment Commissioning", "16", "16", "0", "0", "Passed"], ["System Functional Tests", "18", "18", "0", "0", "Passed"], ["Safety & Protection Tests", "12", "12", "0", "0", "Passed"], ["Communications & Integration", "8", "8", "0", "0", "Passed"], ["Documentation & Records", "10", "10", "0", "0", "Passed"], ["Total", "78", "78", "0", "0", "Passed"]]} /></Panel>
        <Panel title="Equipment Commissioning Summary"><p className="mb-2 text-[9px] text-slate-400">Overview of major equipment commissioned.</p><DarkTable headers={["Equipment Type", "Installed", "Commissioned", "Status"]} rows={[["▣ Transformers", "12", "12", "Commissioned"], ["▣ Panels", "18", "18", "Commissioned"], ["▣ Capacitor Banks", "8", "8", "Commissioned"], ["▣ Circuit Breakers", "16", "16", "Commissioned"], ["▣ Relays & Protection", "24", "24", "Commissioned"], ["▣ Meters", "28", "28", "Commissioned"]]} /><a className="mt-2 inline-block text-[10px] text-blue-400">View Equipment Inventory ›</a></Panel>
        <Panel title="Commissioning Highlights"><ChecklistSmall items={["All equipment energized and operating as designed.", "All protection and safety functions verified.", "All required alarms tested and cleared.", "Communications verified with SCADA / monitoring system.", "System performance within design parameters.", "No outstanding issues. System ready for acceptance."]} /></Panel>
      </section>
      <section className="mt-2 grid h-[126px] grid-cols-[1.5fr_0.75fr] gap-2"><Panel title="Documents & Reports"><p className="mb-2 text-[9px] text-slate-400">All commissioning related documents.</p><DocCards /></Panel><Panel title="Notes"><p className="mb-2 text-[9px] text-slate-400">Add any final notes about commissioning.</p><div className="h-[62px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[9px] text-slate-500">Enter notes (optional)...<button className="float-right mt-8 rounded bg-[#123047] px-3 py-1 text-[8px] text-slate-200">Save Note</button></div></Panel></section>
    </>
  );
}

function FinalChecklist() {
  return (
    <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.55fr_0.62fr] gap-2">
      <Panel title="Checklist Items"><FinalChecklistItems /></Panel>
      <div className="grid min-h-0 grid-rows-[166px_192px_1fr] gap-2 overflow-hidden"><Panel title="Validation Summary"><FinalValidationSummary /></Panel><Panel title="Reviewer Sign-Off"><ReviewerSignOff /></Panel><Panel title="Actions"><ChecklistActions /></Panel></div>
    </section>
  );
}

function CustomerAcceptance() {
  return (
    <>
      <section className="mt-2 rounded border border-blue-400/20 bg-[#08243b]/70 px-4 py-2 text-[10px] text-slate-200"><span className="mr-3 text-blue-400">ⓘ</span>Please review the final checklist below. If everything is satisfactory, provide your acceptance and signature.</section>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.45fr_0.62fr] gap-2">
        <Panel title="Final Checklist Review"><AcceptanceChecklist /></Panel>
        <div className="grid min-h-0 grid-rows-[156px_1fr] gap-2 overflow-hidden"><Panel title="Acceptance Summary"><AcceptanceSummary /></Panel><Panel title="Customer Acceptance Statement"><AcceptanceStatement /></Panel></div>
      </section>
    </>
  );
}

function SignOffCapture({ data }: { data?: DeploymentCompletionData }) {
  return (
    <>
      <section className="mt-2 grid h-[190px] grid-cols-[0.9fr_1.05fr] gap-2">
        <Panel title="Final Acceptance Checklist"><SignoffChecklist /></Panel>
        <Panel title="Acceptance Statement"><SignoffStatement /></Panel>
      </section>
      <section className="mt-2 grid h-[162px] gap-2">
        <Panel title="Digital Signatures"><SignoffSignatureBlocks /></Panel>
      </section>
      <section className="mt-2 grid h-[174px] grid-cols-[0.95fr_1fr] gap-2">
        <Panel title="Identity & Verification"><IdentityVerification /></Panel>
        <Panel title="Deployment Summary Snapshot"><DeploymentSummarySnapshot data={data} /></Panel>
      </section>
      <section className="mt-2 grid h-[88px]"><Panel title="Signed Documents & Certificate"><SignoffDocs /></Panel></section>
    </>
  );
}

function ClosureConfirmation({ data }: { data?: DeploymentCompletionData }) {
  return (
    <>
      <section className="mt-2 rounded-lg border border-[#05ff5e]/30 bg-[#063b27]/45 p-2.5">
        <div className="grid grid-cols-[76px_1fr_390px] items-center gap-5">
          <div className="grid size-16 place-items-center rounded-full border-[6px] border-[#22c55e] text-3xl text-[#22c55e]">✓</div>
          <div><h2 className="text-[20px] font-semibold">Deployment Closed Successfully!</h2><p className="mt-1 text-[9px] leading-relaxed text-slate-300">All activities are complete. The system is delivered, accepted, and handed over to operations.</p></div>
          <ChecklistSmall items={["All work completed and verified", "Customer acceptance obtained", "All documents and reports finalized", "System handed over to operations"]} />
        </div>
      </section>
      <section className="mt-2 grid h-[116px] grid-cols-4 gap-2">
        {closureCards(data).map((card) => <ClosureMetricCard card={card} key={card.title} />)}
      </section>
      <section className="mt-2 grid h-[162px] grid-cols-[1fr_1fr] gap-2">
        <Panel title="Closure Checklist"><ClosureChecklist /></Panel>
        <Panel title="Final Deployment Metrics"><ClosureMetrics data={data} /></Panel>
      </section>
      <section className="mt-2 grid h-[104px] grid-cols-1 gap-2"><Panel title="Closure Documents & Certificates"><ClosureDocs /></Panel></section>
      <section className="mt-2 grid h-[90px] grid-cols-[0.7fr_1fr] gap-2"><Panel title="Handover Confirmation"><HandoverConfirmation data={data} /></Panel><Panel title="Notes"><div className="h-[48px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[8px] text-slate-500">No Data: closure notes are not modeled yet.<button className="float-right mt-5 rounded bg-[#123047] px-3 py-1 text-[8px] text-slate-200">Save Note</button></div></Panel></section>
    </>
  );
}

function CompletionDashboard({ data }: { data?: DeploymentCompletionData }) {
  return (
    <>
      <div className="mt-2 flex h-[56px] items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-wide"><DeploymentIcon className="size-4 text-[#05ff5e]" name="dashboard" />Deployment Dashboard</h1>
          <p className="mt-1 text-[9px] text-slate-400">Overview of your completed deployment.</p>
        </div>
        <div className="text-right text-[9px]">
          <Button>⇩ Export Dashboard</Button>
          <div className="mt-2 text-slate-400">Auto-refresh: On <span className="text-[#05ff5e]">↻</span></div>
        </div>
      </div>
      <section className="grid h-[176px] grid-cols-[1.7fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-2">
        <Panel title="Deployment Completed Successfully"><CompletionHero data={data} /></Panel>
        <CompletionTopCard color="green" icon="check" title="Overall Status" value={data?.status ?? "No Data"} detail="Direct from ecbs_os deployment status" />
        <CompletionTopCard color="blue" icon="database" title="Data Summary" value="No Data" detail="Checklist item capture is not modeled yet" />
        <CompletionTopCard color="purple" icon="file" title="Files & Documents" value={data?.documentRows.find((row) => row.label === "Documents")?.value ?? "No Data"} detail="Documents from ecbs_os metadata" />
        <CompletionTopCard color="amber" icon="shield" title="Data Quality" value="No Data" detail="No approved quality model unless returned by API" />
      </section>
      <section className="mt-2 grid h-[396px] grid-cols-[1.05fr_1.65fr] gap-2">
        <Panel title="Completion Overview"><CompletionOverview data={data} /></Panel>
        <div className="grid min-h-0 grid-rows-[196px_1fr] gap-2">
          <div className="grid min-h-0 grid-cols-[0.9fr_0.75fr] gap-2">
            <Panel title="Equipment Summary"><EquipmentSummary data={data} /></Panel>
            <Panel title="Documents & Photos"><DocumentsPhotos data={data} /></Panel>
          </div>
          <div className="grid min-h-0 grid-cols-[0.75fr_1.35fr] gap-2">
            <Panel title="Activity Timeline"><ActivityTimeline data={data} /></Panel>
            <Panel title="Recent Captured Photos"><RecentCapturedPhotos /></Panel>
          </div>
        </div>
      </section>
      <section className="mt-2 grid h-[86px] grid-cols-[0.7fr_1.6fr] gap-2"><Panel title="Notes"><p className="mb-1 text-[8px] text-slate-400">Add any final notes about this deployment.</p><div className="h-[42px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[8px] text-slate-500">No Data: completion notes are not modeled yet.<button className="float-right mt-4 rounded bg-[#123047] px-3 py-1 text-[8px] text-slate-200">Save Note</button></div></Panel><Panel title="Quick Actions"><CompletionQuickActions /></Panel></section>
    </>
  );
}

function CompletionSummary({ data, deploymentId }: { data?: DeploymentCompletionData; deploymentId: string }) {
  return (
    <>
      <section className="mt-2 grid h-[230px] grid-cols-[1.55fr_0.78fr] gap-2">
        <BarePanel><CompletionSuccessHero data={data} /></BarePanel>
        <Panel title="Deliverables Generated"><CompletionDeliverables /></Panel>
      </section>
      <section className="mt-2 grid h-[190px] grid-cols-[1.55fr_0.78fr] gap-2">
        <Panel title="Completion Summary"><CompletionMetricCards data={data} /></Panel>
        <Panel title="What's Next?"><CompletionNextActions deploymentId={deploymentId} /></Panel>
      </section>
      <section className="mt-2 grid h-[230px] grid-cols-[1.55fr_0.78fr] gap-2">
        <Panel title="Step Completion Status"><CompletionStepStatus /></Panel>
        <Panel title="Notes"><CompletionNotes /></Panel>
      </section>
    </>
  );
}

function DocumentViewer({ data }: { data?: DeploymentDocumentationData }) {
  const document = firstDocument(data);
  return (
    <>
      <div className="mt-3 flex h-[32px] items-center justify-between text-[9px]"><span className="text-slate-400">← Back to Documentation</span></div>
      <section className="grid min-h-0 flex-1 grid-cols-[1fr_258px] gap-2 pb-2">
        <div className="grid min-h-0 grid-rows-[76px_1fr_34px] overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92">
          <DocumentViewerHeader document={document} />
          <div className="grid min-h-0 grid-cols-[132px_1fr]">
            <DocumentThumbnails document={document} />
            <div className="grid min-h-0 grid-rows-[38px_1fr]">
              <DocumentToolbar />
              <div className="min-h-0 overflow-hidden px-4 pb-3">
                <DocumentPreview document={document} />
              </div>
            </div>
          </div>
          <DocumentAnnotationToolbar />
        </div>
        <aside className="grid min-h-0 grid-rows-[378px_176px_1fr] gap-2 overflow-hidden">
          <Panel title="Document Details"><DocumentDetails data={data} document={document} /></Panel>
          <Panel title="Version History"><DocumentVersions data={data} /></Panel>
          <Panel title="Linked To"><DocumentLinkedTo data={data} /></Panel>
        </aside>
      </section>
      <footer className="flex h-[54px] items-center justify-between border-t border-cyan-300/10"><Button>← Back</Button><div className="flex gap-2"><Button>‹ Previous Document</Button><Button>Next Document ›</Button><button className="rounded bg-[#087a35] px-8 py-2 text-[10px] font-semibold">Back to Documentation →</button></div></footer>
    </>
  );
}

function DocumentViewerHeader({ document }: { document: DocumentDataRow }) {
  return <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-cyan-300/10 px-3 text-[9px]"><div className="grid size-9 place-items-center rounded border border-red-500/60 text-[8px] font-bold text-red-400">{document.type}</div><div><div className="flex items-center gap-3"><span className="text-[15px] font-semibold text-slate-100">{document.name}</span><span className="rounded border border-[#05ff5e]/30 bg-[#063b27]/60 px-2 py-0.5 text-[8px] text-[#05ff5e]">{document.status}</span></div><div className="mt-2 flex gap-4 text-slate-400"><span>Folder: <b className="text-slate-300">{document.folder}</b></span><span>|</span><span>Uploaded by: <b className="text-slate-300">{document.uploadedBy}</b></span><span>|</span><span>{document.uploadedAt}</span><span>|</span><span>{document.size}</span></div></div><div className="flex gap-2"><Button>⇩ Download</Button><Button>▣ Print</Button><Button>••• More</Button></div></div>;
}

function DocumentToolbar() {
  return <div className="flex items-center gap-5 border-b border-cyan-300/10 px-3 text-[10px] text-slate-300"><span>▣</span><span>⌕</span><span className="text-slate-500">‹</span><span className="text-slate-500">›</span><span className="rounded border border-cyan-300/12 bg-[#03111c] px-3 py-1">1</span><span>/ 4</span><span className="ml-6">−</span><span>+</span><span className="rounded border border-cyan-300/12 bg-[#03111c] px-4 py-1">100%⌄</span><span className="ml-auto">⟳</span><span>⛶</span><span>⌇</span><span>✎</span><span>⌕</span></div>;
}

function DocumentThumbnails({ document }: { document: DocumentDataRow }) {
  return <div className="min-h-0 overflow-hidden border-r border-cyan-300/10 px-3 py-2 text-center text-[9px] text-slate-400">{[1, 2, 3, 4].map((page) => <div className="mb-3" key={page}><div className={page === 1 ? "rounded border-2 border-[#05ff5e] bg-white p-1 shadow-[0_0_14px_rgba(5,255,94,.25)]" : "rounded border border-slate-600/30 bg-white/70 p-1 opacity-70"}>{document.name === "No Data" ? <div className="grid h-[78px] place-items-center text-[8px] text-slate-500">No Data</div> : <MiniDiagram />}</div><div className="mt-1">{page}</div></div>)}</div>;
}

function MiniDiagram() {
  return <svg className="h-[78px] w-full text-slate-900" viewBox="0 0 90 70"><rect width="90" height="70" fill="white" /><g fill="none" stroke="currentColor" strokeWidth="1"><path d="M45 8v15M14 26h62M18 26v16M30 26v16M45 26v16M60 26v16M73 26v16M12 50h68" /><circle cx="22" cy="45" r="3" /><circle cx="33" cy="45" r="3" /><rect x="52" y="40" width="8" height="8" /><rect x="67" y="40" width="8" height="8" /></g><text x="45" y="6" textAnchor="middle" fontSize="3">SLD</text></svg>;
}

function SingleLineDrawing() {
  return <div className="mx-auto h-full max-h-[575px] w-[790px] bg-white p-4 text-slate-900 shadow-2xl"><svg className="h-full w-full" viewBox="0 0 790 535"><rect x="0" y="0" width="790" height="535" fill="white" stroke="#111" /><text x="395" y="26" textAnchor="middle" fontSize="14" fontWeight="700" textDecoration="underline">MAIN ELECTRICAL SINGLE LINE DIAGRAM</text><g fill="none" stroke="#111" strokeWidth="2"><path d="M410 52v82M210 157h490M410 134v23M120 262h620M160 262v82M245 262v82M340 262v82M435 262v82M530 262v82M625 262v82M710 262v82M90 430h610" /><path d="M210 157v105M300 157v105M410 157v105M520 157v105M630 157v105" /><path d="M396 94h28M396 103h28M396 112h28M395 122h30" /><circle cx="168" cy="366" r="17" /><circle cx="246" cy="366" r="17" /><rect x="326" y="348" width="44" height="36" /><rect x="425" y="348" width="44" height="36" /><rect x="515" y="348" width="44" height="36" /><rect x="610" y="348" width="44" height="36" /><path d="M360 175v34l-10 10 20 0 -10 10v33M470 175v34l-10 10h20l-10 10v33" /><path d="M395 134c0 18 30 18 30 0M395 148c0 18 30 18 30 0" /></g><g fontSize="10" fill="#111"><text x="410" y="50" textAnchor="middle">UTILITY INCOMING</text><text x="345" y="67">34.5kV</text><text x="345" y="81">3Ø, 60Hz</text><text x="448" y="104">TX-1</text><text x="448" y="118">34.5kV / 480Y/277V</text><text x="448" y="132">1500 kVA</text><text x="430" y="188">MAIN BREAKER</text><text x="430" y="202">1600A</text><text x="430" y="216">3P</text><text x="112" y="246">480Y/277V</text><text x="112" y="260">3Ø, 4W</text><text x="112" y="274">60Hz</text>{["MCC-1\\n800A\\n3P", "MCC-2\\n600A\\n3P", "PANEL DP-1\\n400A\\n3P", "PANEL DP-2\\n400A\\n3P", "PANEL LP-1\\n225A\\n3P", "PANEL LP-2\\n225A\\n3P"].map((label, i) => <text key={label} x={[150,235,325,420,515,610][i]} y="305">{label.split("\\n").map((line, idx) => <tspan x={[150,235,325,420,515,610][i]} dy={idx === 0 ? 0 : 13} key={line}>{line}</tspan>)}</text>)}<text x="168" y="402" textAnchor="middle">P-1</text><text x="168" y="416" textAnchor="middle">75 HP</text><text x="246" y="402" textAnchor="middle">P-2</text><text x="246" y="416" textAnchor="middle">50 HP</text><text x="535" y="402" textAnchor="middle">HVAC-1</text><text x="535" y="416" textAnchor="middle">15 kW</text><text x="630" y="402" textAnchor="middle">LTS-1</text><text x="630" y="416" textAnchor="middle">10 kVA</text></g><g transform="translate(615 50)"><rect width="120" height="96" fill="none" stroke="#111" /><text x="60" y="16" textAnchor="middle" fontSize="10" fontWeight="700">LEGEND</text><g fill="none" stroke="#111" fontSize="7"><rect x="15" y="26" width="11" height="11" /><text x="36" y="35">CIRCUIT BREAKER</text><circle cx="20" cy="50" r="6" /><text x="36" y="53">FUSED DISCONNECT</text><path d="M14 68l12-12" /><text x="36" y="67">DISCONNECT SWITCH</text><path d="M15 80c0-8 12-8 12 0" /><text x="36" y="82">CURRENT TRANSFORMER</text></g></g><g fontSize="9" fill="#111"><rect x="12" y="455" width="766" height="68" fill="none" stroke="#111" /><path d="M160 455v68M395 455v68M565 455v68M690 455v68" stroke="#111" /><text x="18" y="470" fontWeight="700">NOTES:</text><text x="18" y="485">1. ALL EQUIPMENT SHALL BE RATED</text><text x="30" y="499">FOR 480V, 3Ø, 4W, 60Hz.</text><text x="170" y="485">PROJECT:</text><text x="170" y="501" fontSize="13">FLEX TIJUANA FACILITY</text><text x="405" y="485">DRAWING TITLE:</text><text x="405" y="501" fontSize="13">MAIN ELECTRICAL</text><text x="405" y="516" fontSize="13">SINGLE LINE DIAGRAM</text><text x="575" y="482">DRAWN BY:</text><text x="630" y="482">XECO Engineering</text><text x="575" y="501">DATE:</text><text x="630" y="501">05/12/2025</text><text x="700" y="482">DRAWING NO.:</text><text x="700" y="501">E-100</text><text x="700" y="518">REV: A</text></g></svg></div>;
}

function DocumentPreview({ document }: { document: DocumentDataRow }) {
  if (document.name === "No Data") {
    return <div className="grid h-full place-items-center rounded border border-dashed border-cyan-300/20 bg-[#03111c] text-center text-[12px] text-slate-400">No Data<br /><span className="mt-2 text-[9px]">No approved document preview source exists for this route.</span></div>;
  }

  return <SingleLineDrawing />;
}

function DocumentAnnotationToolbar() {
  return <div className="flex items-center gap-5 border-t border-cyan-300/10 px-3 text-[9px] text-slate-300"><span className="rounded bg-[#063b27] px-3 py-1 text-[#05ff5e]">⌖ Select</span><span>☝ Pan</span><span>▣ Comment</span><span className="text-yellow-400">✎ Highlight</span><span>╱ Draw</span><span>A Text</span><span>□ Shapes</span><span>♜ Stamp</span><span>◎ Measure</span><span>••• More</span><span className="ml-auto">♲ Clear All</span></div>;
}

function DocumentDetails({ data, document }: { data?: DeploymentDocumentationData; document: DocumentDataRow }) {
  const rows = data?.metadataRows?.length ? data.metadataRows : [{ label: "Message", value: "No Data" }];
  return <div className="space-y-2 text-[8.5px] text-slate-300"><InfoIcon label="Type" value={document.type} icon="▤" color="text-red-400" /><InfoIcon label="Status" value={document.status} icon="●" color="text-[#05ff5e]" />{rows.map((row) => <Info label={row.label} value={row.value} key={row.label} />)}<div><div className="text-slate-500">Tags</div><div className="mt-1 flex flex-wrap gap-1"><span className="rounded border border-cyan-300/15 px-2 py-0.5">No Data</span></div></div></div>;
}

function InfoIcon({ color, icon, label, value }: { color: string; icon: string; label: string; value: string }) {
  return <div className="grid grid-cols-[70px_1fr] gap-2"><span className="text-slate-500">{label}</span><span><b className={color}>{icon}</b> {value}</span></div>;
}

function DocumentVersions({ data }: { data?: DeploymentDocumentationData }) {
  const rows = data?.versionRows?.length ? data.versionRows : [emptyDocumentRow("No approved document version history model exists.")];
  return <div className="space-y-4 text-[9px] text-slate-300"><div className="float-right text-blue-400">View All</div>{rows.slice(0, 2).map((row) => <div className="flex gap-3" key={`${row.id}-${row.status}`}><span className="text-slate-500">●</span><span><b>{row.name}</b><br /><span className="text-slate-500">{row.uploadedAt}</span> <span className="ml-3">{row.uploadedBy}</span><br />{row.status}</span></div>)}</div>;
}

function DocumentLinkedTo({ data }: { data?: DeploymentDocumentationData }) {
  return <div className="space-y-4 text-[9px]"><Info label="Project" value={data?.projectName ?? "No Data"} /><Info label="Deployment" value={data?.deploymentId ?? "No Data"} /></div>;
}

function ExportPackageBuilder({ data }: { data?: DeploymentDocumentationData }) {
  const itemCount = data?.documentRows?.filter((row) => row.name !== "No Data").length ?? 0;
  return (
    <>
      <ExportPackageProgress />
      <ExportPackageHeader />
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[0.74fr_1.42fr_0.88fr] gap-2">
        <ExportPanel title="1. Select Content" subtitle="Choose folders and documents to include in the package.">
          <ExportFolderPicker data={data} />
        </ExportPanel>
        <ExportPanel title="2. Package Contents" titleSuffix={`(${itemCount > 0 ? itemCount : "No Data"} items selected)`} action={<span className="text-red-400">▢ Remove All</span>} subtitle="Review the items that will be included in the export package.">
          <ExportPackageTable data={data} />
        </ExportPanel>
        <ExportPanel title="3. Package Summary" subtitle="Review and configure your export package.">
          <ExportPackageSummary data={data} />
        </ExportPanel>
      </section>
    </>
  );
}

function ExportPackageProgress() {
  const items = [["1", "Select Content", "In Progress"], ["2", "Package Details", "In Progress"], ["3", "Review & Configure", "In Progress"], ["4", "Generate Package", "Pending"]];
  return <div className="relative h-[72px] border-b border-cyan-300/10"><div className="absolute left-[110px] right-[220px] top-[28px] h-px bg-cyan-300/12" /><div className="grid h-full grid-cols-4 items-center text-center text-[9px]">{items.map(([num, label, status], index) => <div className="relative" key={label}><div className={index === 0 ? "mx-auto grid size-6 place-items-center rounded-full bg-[#05ff5e] font-semibold text-[#02100a]" : "mx-auto grid size-6 place-items-center rounded-full bg-slate-400 font-semibold text-[#02100a]"}>{num}</div><div className="mt-1 font-semibold text-slate-200">{label}</div><div className={status === "Pending" ? "text-slate-400" : "text-[#05ff5e]"}>{status}</div></div>)}</div><div className="absolute right-0 top-3 text-[8px] text-[#05ff5e]">● Auto-saved: 10:15:23 AM</div></div>;
}

function ExportPackageHeader() {
  return <section className="mt-2 flex h-[66px] items-center justify-between rounded-lg border border-cyan-300/12 bg-[#061521]/92 px-4"><div><h1 className="text-[15px] font-semibold uppercase tracking-wide"><span className="mr-2 text-[#05ff5e]">▣</span>Export Package Builder</h1><p className="mt-1 text-[9px] text-slate-400">Build and export a complete documentation package for handover, compliance, or record-keeping.</p></div><Button>▣ Save as Template</Button></section>;
}

function ExportPanel({ action, children, subtitle, title, titleSuffix }: { action?: ReactNode; children: ReactNode; subtitle?: string; title: string; titleSuffix?: string }) {
  return <section className="h-full min-h-0 overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="mb-1 flex items-center justify-between"><h2 className="text-[11px] font-semibold uppercase text-slate-200">{title} {titleSuffix ? <span className="text-[8px] font-normal normal-case text-slate-400">{titleSuffix}</span> : null}</h2>{action ? <div className="text-[8px]">{action}</div> : null}</div>{subtitle ? <p className="mb-2 text-[8.5px] text-slate-400">{subtitle}</p> : null}{children}</section>;
}

function ExportFolderPicker({ data }: { data?: DeploymentDocumentationData }) {
  const rows = [["▾", "All Documents", String(data?.documentRows?.filter((row) => row.name !== "No Data").length || "No Data"), true, 0], ["›", "Folders", "No Data", false, 1]] as const;
  return <div className="flex h-[calc(100%-22px)] flex-col"><div className="mb-2 rounded border border-cyan-300/12 bg-[#03111c] px-2 py-2 text-[9px] text-slate-500">⌕ Search folders and documents...</div><div className="min-h-0 flex-1 space-y-1 overflow-hidden text-[9px]">{rows.map(([arrow, label, count, checked, indent]) => <div className={label === "All Documents" ? "flex items-center justify-between rounded bg-[#063b27] px-2 py-1 text-slate-200" : "flex items-center justify-between px-2 py-0.5 text-slate-300"} key={label} style={{ paddingLeft: 8 + Number(indent) * 16 }}><span>{arrow} <span className={checked ? "text-[#05ff5e]" : "text-slate-500"}>{checked ? "☑" : "☐"}</span> {label}</span><span>{count}</span></div>)}</div><button className="mx-auto mt-3 w-32 rounded border border-cyan-300/12 bg-[#03111c] py-2 text-[9px] text-slate-300">Clear Selection</button></div>;
}

function ExportPackageTable({ data }: { data?: DeploymentDocumentationData }) {
  const rows = documentRowsFromData(data).slice(0, 12);
  return <div className="flex h-[calc(100%-22px)] flex-col"><table className="w-full text-left text-[8.5px]"><thead className="text-slate-500"><tr><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium">Folder</th><th className="pb-2 text-right font-medium">Size</th><th /></tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={`${row.id}-${row.name}`}><td className="py-1.5"><span className={documentIconColor(row.type)}>▣</span> {row.name}</td><td>{row.type}</td><td>{row.folder}</td><td className="text-right">{row.size}</td><td className="text-right text-slate-400">×</td></tr>)}</tbody></table><div className="mt-auto flex items-center justify-between pt-2 text-[9px]"><Button>+ Add Custom Files</Button><span className="text-slate-400">Total Size (estimated): No Data</span></div></div>;
}

function ExportPackageSummary({ data }: { data?: DeploymentDocumentationData }) {
  const itemCount = data?.documentRows?.filter((row) => row.name !== "No Data").length ?? 0;
  return <div className="flex h-[calc(100%-22px)] flex-col text-[8.5px]"><Field label="Package Name *" value={data?.projectName ? `${data.projectName} - Documentation Package` : "No Data"} /><div className="mt-2"><div className="mb-1 text-[8px] text-slate-400">Description</div><div className="h-[58px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-slate-400">{data?.message || "Package export model is not approved yet; only scoped document metadata is shown."}</div></div><div className="mt-2 space-y-1.5">{[["▣", "Total Items", itemCount > 0 ? String(itemCount) : "No Data"], ["◈", "Total Size (Estimated)", "No Data"], ["▣", "Included Folders", "No Data"], ["☷", "Include File Types", itemCount > 0 ? Array.from(new Set(documentRowsFromData(data).map((row) => row.type))).join(", ") : "No Data"], ["▣", "Date Range", "No Data"], ["▣", "Export Format", "No Data"], ["▣", "Security", "No Data"]].map(([icon, label, value]) => <div className="flex justify-between border-b border-white/5 pb-0.5" key={label}><span className="text-slate-400"><span className="mr-2 text-blue-400">{icon}</span>{label}</span><b>{value}</b></div>)}<a className="block text-right text-blue-400">Configure Security</a></div><div className="mt-3 border-t border-cyan-300/10 pt-2"><div className="mb-1.5 text-[8.5px] font-semibold uppercase">Include Additional Content</div><div className="space-y-1.5 text-[8px]"><div><span className="text-slate-500">☐</span> Include Audit Trail<br /><span className="ml-4 text-slate-500">No approved audit trail source.</span></div><div><span className="text-[#05ff5e]">☑</span> Include Metadata<br /><span className="ml-4 text-slate-500">Uses `ecbs_os.documents` metadata only.</span></div><div><span className="text-slate-500">☐</span> Generate Package Contents Report<br /><span className="ml-4 text-slate-500">No approved report generation model.</span></div></div></div></div>;
}

function FolderDetailView({ data }: { data?: DeploymentDocumentationData }) {
  const documentCount = data?.documentRows?.filter((row) => row.name !== "No Data").length ?? 0;
  return (
    <>
      <div className="mt-3 flex h-[104px] items-center justify-between">
        <div className="text-[9px]">
          <div className="mb-4 text-slate-400">← Back to Documentation</div>
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded border border-yellow-400 text-[24px] text-yellow-400">▱</span><span><b className="text-[22px] text-slate-100">No Data</b> <span className="ml-2 text-slate-400">✎</span><br /><span className="text-slate-400">No Data folders • {documentCount > 0 ? documentCount : "No Data"} documents</span></span></div>
        </div>
        <Button>Save & Exit</Button>
      </div>
      <div className="flex h-[42px] gap-10 border-b border-cyan-300/10 text-[10px]"><span className="border-b-2 border-[#05ff5e] px-5 pt-3 text-[#05ff5e]">Contents</span><span className="pt-3">Folder Details</span><span className="pt-3">Permissions</span><span className="pt-3">Activity Log</span></div>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[0.52fr_1.58fr_0.58fr] gap-2">
        <ExportPanel title="Folder Tree" action={<span className="rounded border border-[#05ff5e]/30 px-2 py-1 text-[#05ff5e]">+</span>}>
          <FolderDetailTree data={data} />
        </ExportPanel>
        <ExportPanel title="Documents In This Folder" titleSuffix={`(${documentCount > 0 ? documentCount : "No Data"})`} action={<div className="flex gap-2"><Button>⇧ Upload Files</Button><Button>▣ New Folder</Button><Button>•••</Button></div>}>
          <FolderDocumentsTable data={data} />
        </ExportPanel>
        <div className="grid min-h-0 grid-rows-[178px_158px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="Folder Details"><FolderDetailsCard data={data} /></ExportPanel>
          <ExportPanel title="Folder Actions"><FolderActionsCard /></ExportPanel>
          <ExportPanel title="Folder Permissions" action={<span className="text-blue-400">View Details</span>}><FolderPermissionsCard data={data} /></ExportPanel>
        </div>
      </section>
    </>
  );
}

function FolderDetailTree({ data }: { data?: DeploymentDocumentationData }) {
  const rows = [["▾", "All Documents", String(data?.documentRows?.filter((row) => row.name !== "No Data").length || "No Data"), "text-[#05ff5e]", 0], ["›", "Folders", "No Data", "text-slate-400", 0]] as const;
  return <div className="space-y-1 text-[9.5px]">{rows.map(([arrow, name, count, color, indent]) => <div className={name === "All Documents" ? "flex justify-between rounded bg-[#063b27] px-2 py-1.5 text-slate-100" : "flex justify-between px-2 py-1 text-slate-300"} key={name} style={{ paddingLeft: 8 + Number(indent) * 18 }}><span>{arrow} <span className={color}>▣</span> {name}</span><span>{count}</span></div>)}</div>;
}

function FolderDocumentsTable({ data }: { data?: DeploymentDocumentationData }) {
  const rows = documentRowsFromData(data).slice(0, 10);
  return <div className="flex h-[calc(100%-22px)] flex-col"><div className="mb-3 flex gap-2"><div className="flex-1 rounded border border-cyan-300/12 bg-[#03111c] px-3 py-2 text-[9.5px] text-slate-500">⌕ Search in this folder...</div><Button>All Types</Button><Button>All Statuses</Button><Button>▦</Button><Button>☷</Button></div><table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{["☐", "Name ↕", "Type ↕", "Uploaded By ↕", "Date Uploaded", "Status ↕", "Size ↕", ""].map((h) => <th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={`${row.id}-${row.name}`}><td className="py-[5px]">☐</td><td><span className={documentIconColor(row.type)}>▣</span> {row.name}</td><td>{row.type}</td><td>{row.uploadedBy}</td><td>{row.uploadedAt}</td><td className={row.status === "No Data" ? "text-slate-400" : "text-[#05ff5e]"}>⊙ {row.status}</td><td>{row.size}</td><td>⋮</td></tr>)}</tbody></table><div className="mt-auto flex items-center justify-between pt-3 text-[9px] text-slate-400"><span>Showing {rows.length} document rows</span><span className="flex items-center gap-4">‹ <b className="rounded border border-[#05ff5e] px-2 py-1 text-[#05ff5e]">1</b> ›</span><span>Rows per page: <b className="rounded border border-cyan-300/12 px-4 py-1 text-slate-200">10⌄</b></span></div></div>;
}

function FolderDetailsCard({ data }: { data?: DeploymentDocumentationData }) {
  return <MetricList rows={(data?.folderRows ?? []).map((row) => [row.label, row.value])} />;
}

function FolderActionsCard() {
  return <div className="space-y-2 text-[9px]"><div>⇧ Upload Files</div><div>▣ New Folder</div><div>✎ Rename Folder</div><div>◇ Move Folder</div><div>⇩ Download Folder (ZIP)</div><div className="text-red-400">▢ Delete Folder</div></div>;
}

function FolderPermissionsCard({ data }: { data?: DeploymentDocumentationData }) {
  return <MetricList rows={(data?.permissionRows ?? []).map((row) => [row.label, row.value])} />;
}

function PermissionsAccessControl({ data }: { data?: DeploymentDocumentationData }) {
  const permissionRows = data?.permissionRows?.length ? data.permissionRows : [{ label: "Users", value: "No Data" }, { label: "Roles", value: "No Data" }, { label: "Access Levels", value: "No Data" }, { label: "Audit Trail", value: "No Data" }];
  return (
    <>
      <div className="mt-3 flex h-[62px] items-center justify-between">
        <div><div className="mb-3 text-[9px] text-slate-400">← Back to Documentation</div><div className="text-[17px] font-semibold uppercase">Permissions / Access Control</div><div className="text-[9px] text-slate-400">Manage who can access, view, upload, and manage documentation.</div></div>
        <div className="text-right text-[8px]"><div className="mb-2 text-[#05ff5e]">● Auto-saved: 10:15:23 AM</div><Button>Save Changes</Button></div>
      </div>
      <div className="flex h-[42px] gap-10 border-b border-cyan-300/10 text-[10px]"><span className="border-b-2 border-[#05ff5e] px-5 pt-3 text-[#05ff5e]">Overview</span><span className="pt-3">Folder Permissions</span><span className="pt-3">User Access</span><span className="pt-3">Roles & Permissions</span><span className="pt-3">Access Requests</span><span className="pt-3">Audit Log</span></div>
      <section className="mt-2 grid h-[100px] grid-cols-4 gap-3">
        {permissionRows.slice(0, 4).map((row, index) => <PermissionKpi icon={index === 0 || index === 1 ? "♙" : index === 2 ? "▭" : "◇"} title={row.label} value={row.value} detail="No approved permissions model" color={index === 1 ? "text-yellow-400" : index === 3 ? "text-[#05ff5e]" : "text-blue-400"} key={row.label} />)}
      </section>
      <section className="mt-2 grid min-h-0 flex-1 grid-cols-[1.55fr_0.63fr] gap-2">
        <ExportPanel title="Folder Access Overview" subtitle="Summary of access levels across all folders.">
          <FolderAccessOverview data={data} />
        </ExportPanel>
        <div className="grid min-h-0 grid-rows-[210px_176px_1fr] gap-2 overflow-hidden"><ExportPanel title="Access Level Definitions"><AccessLevelDefinitions /></ExportPanel><ExportPanel title="Quick Actions"><PermissionQuickActions /></ExportPanel><ExportPanel title="Recent Access Changes" action={<span className="text-blue-400">View All</span>}><RecentAccessChanges /></ExportPanel></div>
      </section>
    </>
  );
}

function PermissionKpi({ color, detail, icon, title, value }: { color: string; detail: string; icon: string; title: string; value: string }) {
  return <section className="h-full rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4"><div className="flex items-start gap-3"><span className={`text-[24px] ${color}`}>{icon}</span><span><div className="text-[10px] text-slate-400">{title}</div><div className="text-[24px] leading-none text-slate-100">{value}</div><div className="mt-1 text-[9px] text-slate-400">{detail}</div></span></div></section>;
}

function FolderAccessOverview({ data }: { data?: DeploymentDocumentationData }) {
  const folders = (data?.folderRows?.length ? data.folderRows : [{ label: "Folders", value: "No Data" }]).map((row) => ["▣", row.label, 0, 0, 0, 1, "No Data", row.value, "text-slate-400"] as const);
  return <div className="h-[calc(100%-22px)]"><div className="mb-2 flex gap-2"><div className="flex-1 rounded border border-cyan-300/12 bg-[#03111c] px-3 py-1.5 text-[8.5px] text-slate-500">⌕ Search folders...</div><Button>All Access Levels⌄</Button></div><table className="w-full text-left text-[8px]"><thead className="text-slate-500"><tr><th className="pb-1.5 font-medium">Folder Name</th><th className="pb-1.5 font-medium">Access Level Distribution</th><th className="pb-1.5 font-medium">Restricted To</th><th className="pb-1.5 font-medium">Last Modified</th><th /></tr></thead><tbody>{folders.map(([icon, folder, full, view, upload, none, restricted, modified, color]) => <tr className="border-t border-white/5" key={folder}><td className="py-[5px]"><span className={color}>{icon}</span> {folder}</td><td><div className="flex h-3 w-[330px] overflow-hidden rounded bg-slate-800 text-[7px] leading-3 text-slate-100"><span className="bg-[#22c55e] text-center" style={{ flex: full }}>{full}</span><span className="bg-[#147dff] text-center" style={{ flex: view }}>{view}</span><span className="bg-[#eab308] text-center text-slate-900" style={{ flex: upload }}>{upload}</span><span className="bg-[#ef4444] text-center" style={{ flex: Math.max(Number(none), 0.5) }}>{none}</span></div></td><td>{restricted}</td><td className="whitespace-pre-line leading-tight">{modified}</td><td>⋮</td></tr>)}</tbody></table><div className="mt-3 flex gap-7 text-[7.5px]"><span><b className="text-[#22c55e]">●</b> Full Access (View, Upload, Edit, Delete)</span><span><b className="text-[#147dff]">●</b> View Only</span><span><b className="text-[#eab308]">●</b> Upload Only</span><span><b className="text-[#ef4444]">●</b> No Access</span></div></div>;
}

function AccessLevelDefinitions() {
  return <div className="space-y-3 text-[9px] text-slate-300">{[["◎", "Full Access", "View, upload, edit, delete, and manage permissions.", "text-[#05ff5e]"], ["◎", "View Only", "View and download documents.", "text-blue-400"], ["⇧", "Upload Only", "Upload new documents. Cannot view existing files.", "text-yellow-400"], ["▣", "No Access", "No access to this folder or its contents.", "text-red-400"]].map(([icon, title, detail, color]) => <div className="grid grid-cols-[28px_1fr] gap-2" key={title}><span className={color}>{icon}</span><span><b>{title}</b><br /><span className="text-slate-500">{detail}</span></span></div>)}</div>;
}

function PermissionQuickActions() {
  return <div className="space-y-3 text-[9px]">{[["♙", "Grant Access", "Add users or roles to a folder"], ["♙", "Create Role", "Define a new role with custom permissions"], ["◇", "Bulk Update Access", "Update permissions for multiple folders"], ["▣", "Access Request Settings", "Configure request workflow and approvals"]].map(([icon, title, detail]) => <div className="grid grid-cols-[28px_1fr] gap-2" key={title}><span className="text-slate-300">{icon}</span><span><b>{title}</b><br /><span className="text-slate-500">{detail}</span></span></div>)}</div>;
}

function RecentAccessChanges() {
  return <div className="space-y-3 text-[8.5px]"><div className="grid grid-cols-[28px_1fr_56px] gap-2"><span className="grid size-7 place-items-center rounded-full bg-[#0b3158] text-[8px]">ND</span><span>No approved document permission audit source exists.</span><span className="text-right text-slate-500">No Data</span></div></div>;
}

function ReviewApprovalQueue({ data }: { data?: DeploymentDocumentationData }) {
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
        <div className="flex items-center justify-between">
          <div><h1 className="text-[15px] font-semibold uppercase"><span className="mr-2 text-[#05ff5e]">▣</span>Review / Approval Queue</h1><p className="mt-1 text-[9px] text-slate-400">Documents pending review or approval.</p></div>
          <Button>⚙ Review Settings</Button>
        </div>
        <div className="mt-3 grid h-[64px] grid-cols-4 gap-3">
          <ReviewKpi title="Total Pending" value="No Data" icon="▤" color="text-yellow-400" />
          <ReviewKpi title="Pending My Review" value="No Data" icon="♙" color="text-blue-400" />
          <ReviewKpi title="Overdue" value="No Data" icon="◷" color="text-red-400" />
          <ReviewKpi title="Reviewed Today" value="No Data" icon="✓" color="text-[#05ff5e]" />
        </div>
      </section>
      <section className="mt-2 grid h-[530px] min-h-0 grid-cols-[1.55fr_0.42fr] gap-2">
        <ExportPanel title="">
          <ReviewQueueTable data={data} />
        </ExportPanel>
        <aside className="grid min-h-0 grid-rows-[1fr_150px] gap-2 overflow-hidden">
          <ExportPanel title="Document Review"><DocumentReviewPanel data={data} /></ExportPanel>
          <ExportPanel title="Your Actions"><ReviewActions /></ExportPanel>
        </aside>
      </section>
    </>
  );
}

function ReviewKpi({ color, icon, title, value }: { color: string; icon: string; title: string; value: string }) {
  return <div className="flex items-center justify-between rounded border border-cyan-300/12 bg-[#03111c]/70 px-4"><span><div className="text-[9px] text-slate-400">{title}</div><div className="text-[22px] leading-none text-slate-100">{value}</div></span><span className={`text-[24px] ${color}`}>{icon}</span></div>;
}

function ReviewQueueTable({ data }: { data?: DeploymentDocumentationData }) {
  const rows = data?.reviewRows?.length ? data.reviewRows : [emptyDocumentRow("No approved document review workflow model exists.")];
  return <div className="flex h-full flex-col"><div className="mb-3 grid grid-cols-[1.1fr_0.45fr_0.55fr_0.55fr_0.55fr_32px_32px] gap-2"><div className="rounded border border-cyan-300/12 bg-[#03111c] px-3 py-2 text-[9px] text-slate-500">⌕ Search documents...</div><Button>All Types⌄</Button><Button>All Reviewers⌄</Button><Button>All Priorities⌄</Button><Button>All Statuses⌄</Button><Button>▦</Button><Button>☷</Button></div><table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{["☐", "Document", "Type", "Uploaded By", "Uploaded On", "Reviewer", "Priority", "Status", "Due Date ↑", ""].map((h) => <th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={`${row.id}-${row.status}`}><td className="py-[9px]">☐</td><td><span className={documentIconColor(row.type)}>▣</span> {row.name}</td><td>{row.type}</td><td>{row.uploadedBy}</td><td className="whitespace-pre-line leading-tight">{row.uploadedAt}</td><td>No Data</td><td><span className="rounded border border-slate-500/50 px-2 py-0.5 text-slate-400">No Data</span></td><td><span className="rounded border border-slate-500/50 px-2 py-0.5 text-slate-400">◷ {row.status}</span></td><td className="whitespace-pre-line leading-tight">No Data</td><td>⋮</td></tr>)}</tbody></table><div className="mt-auto flex items-center justify-between pt-2 text-[9px] text-slate-400"><span>0 selected <Button>✓ Approve</Button> <Button>✎ Request Changes</Button> <Button>Reject</Button> <Button>More Actions⌄</Button></span><span>Showing {rows.length} review rows</span><span className="flex items-center gap-4">‹ <b className="rounded border border-[#05ff5e] px-2 py-1 text-[#05ff5e]">1</b> ›</span><span>Rows per page: <b className="rounded border border-cyan-300/12 px-4 py-1 text-slate-200">25⌄</b></span></div></div>;
}

function DocumentReviewPanel({ data }: { data?: DeploymentDocumentationData }) {
  const row = data?.reviewRows?.[0] ?? emptyDocumentRow("No approved document review workflow model exists.");
  const metadata = [["Type", row.type], ["Folder", row.folder], ["Uploaded By", row.uploadedBy], ["Uploaded On", row.uploadedAt], ["Due Date", "No Data"], ["Review Cycle", "No Data"], ["Status", row.status], ["Priority", "No Data"]];
  return <div className="h-[calc(100%-22px)] text-[8.5px]"><div className="mb-2 grid grid-cols-[28px_1fr] gap-2"><span className="grid size-8 place-items-center rounded border border-red-500/60 text-red-400">{row.type}</span><span><b>{row.name}</b><br /><span className="text-slate-500">{row.type} Document • {row.size}</span></span></div><div className="grid h-[94px] place-items-center rounded bg-white p-2 text-center text-slate-900">No Data</div><div className="mt-2 flex gap-2"><Button>◎ Preview Full Document</Button><Button>⇩ Download</Button></div><h3 className="mt-2 mb-1.5 text-[11px] font-semibold uppercase">Metadata</h3><div className="space-y-0.5 text-[8px]">{metadata.map(([label, value]) => <div className="flex justify-between border-b border-white/5 pb-0.5" key={label}><span className="text-slate-400">{label}</span><b className={label === "Status" ? "text-yellow-400" : label === "Priority" ? "text-red-400" : "text-slate-200"}>{value}</b></div>)}</div></div>;
}

function ReviewActions() {
  return <div className="space-y-1 text-[9px]"><button className="w-full rounded bg-[#087a35] py-[5px] text-left pl-3 text-[#bbf7d0]">✓ Approve</button><button className="w-full rounded border border-yellow-500/70 py-[5px] text-left pl-3 text-yellow-400">✎ Request Changes</button><button className="w-full rounded border border-red-500/70 py-[5px] text-left pl-3 text-red-400">⊗ Reject</button><button className="w-full rounded border border-cyan-300/12 bg-[#03111c] py-[5px] text-left pl-3 text-slate-300">▣ Add Comment</button></div>;
}

function SearchResultsPage({ data }: { data?: DeploymentDocumentationData }) {
  const resultCount = data?.searchRows?.filter((row) => row.name !== "No Data").length ?? 0;
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
        <div className="flex items-center justify-between">
          <div><h1 className="text-[15px] font-semibold uppercase"><span className="mr-2 text-[#05ff5e]">▤</span>Search Results</h1><p className="mt-1 text-[9px] text-slate-400">{resultCount > 0 ? resultCount : "No Data"} results found for &quot;installation permit&quot;</p></div>
          <div className="flex gap-2"><Button>☆ Save Search</Button><Button>↗ Share Results</Button></div>
        </div>
        <div className="mt-3 flex h-[36px] items-center justify-between rounded border border-cyan-300/12 bg-[#03111c] px-3 text-[10px] text-slate-200"><span>⌕&nbsp;&nbsp;installation permit</span><span className="text-slate-400">×</span></div>
        <div className="mt-3 flex items-center gap-2 text-[9px] text-slate-400"><span>Active Filters:</span>{["File Type: No Data", "Folder: No Data", "Status: All", "Date Range: No Data"].map((filter) => <span className="rounded-full border border-cyan-300/12 bg-[#03111c] px-2 py-1 text-slate-300" key={filter}>{filter} ×</span>)}<span className="text-cyan-400">Clear All</span></div>
      </section>
      <section className="mt-2 grid h-[548px] min-h-0 grid-cols-[1.6fr_0.43fr] gap-2">
        <ExportPanel title="">
          <SearchResultsTable data={data} />
        </ExportPanel>
        <ExportPanel title="Filters">
          <SearchFilters />
        </ExportPanel>
      </section>
    </>
  );
}

function SearchResultsTable({ data }: { data?: DeploymentDocumentationData }) {
  const rows = data?.searchRows?.length ? data.searchRows : [emptyDocumentRow("No scoped ECBS document metadata matched the approved search term.")];
  const resultCount = rows.filter((row) => row.name !== "No Data").length;
  return <div className="flex h-full flex-col"><div className="mb-3 flex items-center justify-between text-[9px] text-slate-400"><span><b className="text-slate-200">{resultCount > 0 ? resultCount : "No Data"} Results</b><span className="ml-5">Sort by:</span><b className="ml-2 text-slate-200">Relevance</b><span className="ml-2">⌄</span></span><span className="flex gap-2"><button className="rounded border border-[#05ff5e]/60 bg-[#063b27] px-3 py-2 text-[#05ff5e]">▦</button><button className="rounded border border-cyan-300/12 bg-[#03111c] px-3 py-2 text-slate-500">☷</button></span></div><table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{["Document", "Type", "Folder", "Uploaded By", "Uploaded On", "Status", "Size", ""].map((header) => <th className="border-b border-white/5 bg-[#092033] px-2 py-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={`${row.id}-${row.name}`}><td className="grid grid-cols-[24px_1fr] gap-2 px-2 py-[8px]"><span className={`grid size-6 place-items-center rounded border border-current text-[8px] ${documentIconColor(row.type)}`}>{row.type}</span><span><b className="font-semibold text-slate-100"><HighlightedTitle value={row.name} /></b><br /><span className="text-[8px] text-slate-400">{row.status}</span></span></td><td className="px-2">{row.type}</td><td className="whitespace-pre-line px-2 leading-tight">{row.folder}</td><td className="px-2">{row.uploadedBy}</td><td className="whitespace-pre-line px-2 leading-tight">{row.uploadedAt}</td><td className={row.status === "No Data" ? "px-2 text-slate-400" : "px-2 text-[#05ff5e]"}>◎ {row.status}</td><td className="px-2">{row.size}</td><td className="px-2">⋮</td></tr>)}</tbody></table><div className="mt-auto flex items-center justify-between pt-3 text-[9px] text-slate-400"><span>Showing {rows.length} search rows</span><span className="flex items-center gap-4">‹ <b className="rounded border border-[#05ff5e] px-2 py-1 text-[#05ff5e]">1</b> ›</span><span>Rows per page: <b className="rounded border border-cyan-300/12 px-4 py-1 text-slate-200">25⌄</b></span></div></div>;
}

function HighlightedTitle({ value }: { value: string }) {
  return <>{value.split("Installation Permit").map((part, index, list) => <span key={`${part}-${index}`}>{part}{index < list.length - 1 ? <mark className="bg-yellow-400/80 px-0.5 text-[#03111c]">Installation Permit</mark> : null}</span>)}</>;
}

function SearchFilters() {
  return <div className="h-[calc(100%-22px)] text-[8.5px]"><div className="-mt-6 flex justify-end text-[8px] text-slate-400">Collapse ^</div><FilterGroup title="File Type" clear items={[["All Types", true, 0], ["PDF", true, 0], ["Image (JPG, PNG)", false, 1], ["Document (DOC, XLSX)", false, 0], ["CAD (DWG)", false, 0], ["Text (TXT)", false, 0]]} /><FilterGroup title="Folder" clear search items={[["All Folders", true, 0], ["Engineering", true, 1], ["Permits & Approvals", true, 2], ["Diagrams", false, 1], ["Reports", false, 1], ["Installation Records", false, 1]]} /><FilterGroup title="Status" clear items={[["All Statuses", true, 0], ["Uploaded", true, 0], ["Pending Review", true, 0], ["Overdue", false, 0], ["Reviewed", false, 0]]} /><div className="mt-3"><div className="mb-1.5 flex justify-between text-[8.5px] font-semibold"><span>Date Range</span><span className="font-normal text-cyan-400">Clear</span></div><div className="rounded border border-cyan-300/12 bg-[#03111c] px-2 py-1.5 text-slate-300">All Time <span className="float-right">▣</span></div></div><div className="mt-3"><div className="mb-1.5 flex justify-between text-[8.5px] font-semibold"><span>Uploaded By</span><span className="font-normal text-cyan-400">Clear</span></div><div className="rounded border border-cyan-300/12 bg-[#03111c] px-2 py-1.5 text-slate-300">All Reviewers <span className="float-right">⌄</span></div></div></div>;
}

function FilterGroup({ clear, items, search, title }: { clear?: boolean; items: [string, boolean, number][]; search?: boolean; title: string }) {
  return <div className="mt-3"><div className="mb-1.5 flex justify-between text-[8.5px] font-semibold"><span>{title}</span>{clear ? <span className="font-normal text-cyan-400">Clear</span> : null}</div>{search ? <div className="mb-1.5 rounded border border-cyan-300/12 bg-[#03111c] px-2 py-1.5 text-slate-500">⌕ Search folders...</div> : null}<div className="space-y-1">{items.map(([label, checked, indent]) => <div className="flex items-center gap-2" style={{ paddingLeft: indent * 12 }} key={label}><span className={checked ? "grid size-3 place-items-center rounded-sm bg-[#05ff5e] text-[7px] text-[#042311]" : "size-3 rounded-sm border border-cyan-300/25"}>{checked ? "✓" : ""}</span><span className="text-slate-300">{label}</span></div>)}</div></div>;
}

function UploadWizard({ data }: { data?: DeploymentDocumentationData }) {
  const document = firstDocument(data);
  return (
    <>
      <div className="mt-3 flex h-[54px] items-center justify-between"><div><h1 className="text-[15px] font-semibold uppercase">Upload Document Wizard</h1><p className="mt-1 text-[9px] text-slate-400">Follow the steps below to upload and classify your document.</p></div><Button>Cancel Upload&nbsp;&nbsp;×</Button></div>
      <UploadStepper />
      <section className="mt-2 grid h-[575px] min-h-0 grid-cols-[1fr_0.405fr] gap-2">
        <ExportPanel title="1. Select File">
          <p className="text-[9px] text-slate-400">Choose a file from your computer to upload.</p>
          <div className="mt-8 grid h-[262px] place-items-center rounded border border-dashed border-cyan-300/25 bg-[#03111c]/60 text-center text-[10px] text-slate-300"><div><div className="text-[46px] leading-none text-[#05ff5e]">⇧</div><div className="mt-5 text-[11px]">Drag and drop files here</div><div className="my-3 text-slate-500">or</div><Button>Browse Files</Button><div className="mt-5 text-[9px] text-slate-400">Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, TXT<br />Maximum file size: 100 MB</div></div></div>
          <div className="mt-5"><h3 className="mb-3 text-[11px] font-semibold uppercase">Selected File</h3><div className="flex h-[66px] items-center justify-between rounded border border-cyan-300/12 bg-[#03111c] px-4 text-[10px]"><span className="grid grid-cols-[34px_1fr] items-center gap-3"><span className="grid size-8 place-items-center rounded border border-red-500/60 text-[9px] text-red-400">{document.type}</span><span><b className="text-slate-100">{document.name}</b><br /><span className="text-slate-400">{document.size}</span></span></span><span className="text-[18px] text-[#05ff5e]">◎</span></div></div>
          <div className="mt-14 flex justify-end"><button className="rounded bg-[#087a35] px-7 py-3 text-[10px] font-semibold text-white shadow-[0_0_24px_rgba(5,255,94,.16)]">Next: Classify Document&nbsp;&nbsp;→</button></div>
        </ExportPanel>
        <ExportPanel title="Upload Summary">
          <p className="mb-8 text-[9px] text-slate-400">Review your selections as you progress</p>
          <UploadSummaryRows document={document} />
        </ExportPanel>
      </section>
    </>
  );
}

function UploadSummaryRows({ document }: { document: DocumentDataRow }) {
  const rows = [
    ["▣", "text-red-400", "File", `${document.name}\n${document.size}`],
    ["▤", "text-blue-400", "Document Type", document.type],
    ["▭", "text-yellow-400", "Folder", document.folder],
    ["▧", "text-purple-400", "Metadata", "Not added yet"],
    ["◇", "text-cyan-400", "Tags", "Not added yet"],
    ["◷", "text-[#05ff5e]", "Status", "No upload command implemented"],
  ];
  return <div className="space-y-7 text-[10px]">{rows.map(([icon, color, title, detail]) => <div className="grid grid-cols-[32px_1fr] gap-3" key={title}><span className={`grid size-7 place-items-center rounded border border-current ${color}`}>{icon}</span><span><b className="text-slate-100">{title}</b><br /><span className="whitespace-pre-line text-[9px] leading-relaxed text-slate-400">{detail}</span></span></div>)}</div>;
}

function VersionHistory({ data }: { data?: DeploymentDocumentationData }) {
  const document = firstDocument(data);
  return (
    <>
      <div className="mt-2 flex h-[72px] items-center justify-between"><div><div className="text-[10px] text-slate-300">← Back to Document Viewer</div><h1 className="mt-4 text-[15px] font-semibold uppercase">Version History</h1><p className="mt-1 text-[9px] text-slate-400">View and manage all versions of this document.</p></div><Button>▣ Compare Versions</Button></div>
      <section className="mt-2 grid h-[604px] min-h-0 grid-cols-[1.55fr_0.64fr] gap-2">
        <div className="grid min-h-0 grid-rows-[72px_238px_1fr] gap-2 overflow-hidden">
          <VersionDocumentHeader document={document} />
          <VersionHistoryTable data={data} />
          <CompareVersionsPanel />
        </div>
        <VersionSidePanel data={data} />
      </section>
    </>
  );
}

function VersionDocumentHeader({ document }: { document: DocumentDataRow }) {
  return <section className="flex items-center rounded-lg border border-cyan-300/12 bg-[#061521]/92 px-4"><span className="grid size-10 place-items-center rounded border border-red-500/60 text-[11px] text-red-400">{document.type}</span><div className="ml-4 text-[10px]"><div className="flex items-center gap-3"><b className="text-[15px] text-slate-100">{document.name}</b><span className="rounded border border-[#05ff5e]/40 bg-[#063b27] px-2 py-0.5 text-[8px] text-[#05ff5e]">{document.status}</span></div><div className="mt-2 flex gap-6 text-slate-400"><span>Folder: <b className="text-slate-300">{document.folder}</b></span><span>Uploaded by: <b className="text-slate-300">{document.uploadedBy}</b></span><span>{document.uploadedAt}</span><span>{document.size}</span></div></div></section>;
}

function VersionHistoryTable({ data }: { data?: DeploymentDocumentationData }) {
  const rows = data?.versionRows?.length ? data.versionRows : [emptyDocumentRow("No approved document version history model exists.")];
  return <section className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><h2 className="mb-3 text-[11px] font-semibold uppercase">All Versions ({rows[0]?.name === "No Data" ? "No Data" : rows.length})</h2><table className="w-full text-left text-[9px]"><thead className="text-slate-500"><tr>{["", "Version", "Status", "Uploaded By", "Upload Date", "Size", "Changes / Comments"].map((h) => <th className="border-b border-white/5 bg-[#092033] px-3 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={`${row.id}-${row.status}`}><td className="px-3 py-2.5"><span className="text-slate-400">◎</span></td><td className="px-3 py-2.5">No Data</td><td className="px-3 py-2.5 text-slate-400">◎ {row.status}</td><td className="px-3 py-2.5">{row.uploadedBy}</td><td className="whitespace-pre-line px-3 py-2.5 leading-tight">{row.uploadedAt}</td><td className="px-3 py-2.5">{row.size}</td><td className="whitespace-pre-line px-3 py-2.5 leading-tight">No approved version table exists.</td></tr>)}</tbody></table><div className="mt-3 text-[9px] text-slate-400">Showing {rows.length} version rows</div></section>;
}

function CompareVersionsPanel() {
  return <section className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><h2 className="text-[11px] font-semibold uppercase">Compare Versions</h2><div className="mt-3 flex items-center gap-3 text-[9px]"><span className="text-slate-400">Select versions to compare</span><Button>No Data&nbsp;&nbsp;⌄</Button><span>vs</span><Button>No Data&nbsp;&nbsp;⌄</Button><button className="rounded bg-[#087a35] px-5 py-2 text-[9px] font-semibold">Compare</button></div><div className="mt-3 grid h-[198px] place-items-center rounded border border-dashed border-cyan-300/12 bg-[#03111c] p-2 text-[10px] text-slate-400">No approved document version comparison source exists.</div></section>;
}

function VersionDiagram({ highlight }: { highlight: "green" | "red" }) {
  return <div className="overflow-hidden rounded bg-white p-3 text-slate-900"><div className="mb-1 text-center text-[6px] font-bold">MAIN ELECTRICAL SINGLE LINE DIAGRAM</div><svg className="h-[122px] w-full" viewBox="0 0 320 145"><g fill="none" stroke="#111" strokeWidth="1.4"><path d="M160 8v34M40 52h240M74 52v62M122 52v62M170 52v62M218 52v62M266 52v62" /><rect x="62" y="104" width="26" height="18" /><rect x="110" y="104" width="26" height="18" /><rect x="158" y="104" width="26" height="18" /><rect x="206" y="104" width="26" height="18" /><rect x="254" y="104" width="26" height="18" /><circle cx="160" cy="52" r="5" /></g><rect x={highlight === "green" ? "62" : "206"} y="104" width="26" height="18" fill={highlight === "green" ? "rgba(34,197,94,.22)" : "rgba(239,68,68,.22)"} stroke={highlight === "green" ? "#22c55e" : "#ef4444"} /><text x="34" y="42" fontSize="6">480V MAIN</text><text x="144" y="24" fontSize="6">SERVICE</text></svg></div>;
}

function VersionSidePanel({ data }: { data?: DeploymentDocumentationData }) {
  return <aside className="min-h-0 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4 text-[9px]"><VersionDetailRows data={data} /><VersionActions /><VersionNotes /><VersionTimeline data={data} /></aside>;
}

function VersionDetailRows({ data }: { data?: DeploymentDocumentationData }) {
  const row = data?.versionRows?.[0] ?? emptyDocumentRow("No approved document version history model exists.");
  const rows = [["Version", "No Data"], ["Status", row.status], ["Uploaded By", row.uploadedBy], ["Upload Date", row.uploadedAt], ["File Size", row.size], ["Comments", "No approved version table exists."]];
  return <section><h2 className="mb-3 text-[11px] font-semibold uppercase">Version Details</h2><div className="space-y-2">{rows.map(([label, value]) => <div className="grid grid-cols-[92px_1fr] gap-2" key={label}><span className="text-slate-400">{label}</span><b className={label === "Status" ? "text-[#05ff5e]" : "text-slate-200"}>{label === "Status" ? "● " : ""}{value}</b></div>)}</div></section>;
}

function VersionActions() {
  return <section className="mt-5 border-t border-white/10 pt-4"><h2 className="mb-3 text-[11px] font-semibold uppercase">Actions</h2><div className="space-y-2 text-slate-300">{["◎ Preview This Version", "⇩ Download This Version", "▣ Compare with Another Version", "◷ Restore This Version"].map((item) => <div key={item}>{item}</div>)}</div></section>;
}

function VersionNotes() {
  return <section className="mt-5 border-t border-white/10 pt-4"><h2 className="mb-3 text-[11px] font-semibold uppercase">Version Notes</h2><p className="text-slate-400">No notes added for this version.</p></section>;
}

function VersionTimeline({ data }: { data?: DeploymentDocumentationData }) {
  const items = (data?.versionRows?.length ? data.versionRows : [emptyDocumentRow("No approved document version history model exists.")]).map((row) => [row.name, "", row.uploadedAt, row.status] as const);
  return <section className="mt-5 border-t border-white/10 pt-4"><h2 className="mb-3 text-[11px] font-semibold uppercase">Version Timeline</h2><div className="space-y-3">{items.map(([title, badge, time, detail], index) => <div className="grid grid-cols-[18px_1fr]" key={title}><span className={index === 0 ? "text-[#05ff5e]" : "text-yellow-400"}>●</span><div><div className="flex justify-between gap-2"><b>{title}</b><span className="text-[8px] text-slate-400">{time}</span></div>{badge ? <span className="rounded border border-[#05ff5e]/40 bg-[#063b27] px-1.5 py-0.5 text-[7px] text-[#05ff5e]">{badge}</span> : null}<div className="mt-1 whitespace-pre-line text-[8px] leading-relaxed text-slate-400">{detail}</div></div></div>)}</div></section>;
}

function DocumentationHome({ data }: { data?: DeploymentDocumentationData }) {
  const documentCount = data?.documentRows?.filter((row) => row.name !== "No Data").length ?? 0;
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="flex items-center justify-between"><div><h1 className="text-[15px] font-semibold uppercase"><span className="mr-2 text-[#05ff5e]">▤</span>Documentation</h1><p className="mt-1 text-[9px] text-slate-400">Manage all documentation for this deployment.</p></div><div className="flex gap-4"><Button>⇧ Upload Files</Button><Button>▭ New Folder</Button><Button>▤ Document Templates</Button></div></div></section>
      <section className="mt-2 grid h-[598px] min-h-0 grid-cols-[0.52fr_1.55fr_0.64fr] gap-2">
        <div className="grid min-h-0 grid-rows-[1fr_112px] gap-2 overflow-hidden">
          <ExportPanel title="Folders"><DocumentationFolders documentCount={documentCount} /></ExportPanel>
          <ExportPanel title="Storage Usage"><DocumentationStorage /></ExportPanel>
        </div>
        <ExportPanel title={`Documents (${documentCount > 0 ? documentCount : "No Data"})`}><DocumentationTable data={data} /></ExportPanel>
        <div className="grid min-h-0 grid-rows-[286px_150px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="Document Details"><DocumentationDetails data={data} /></ExportPanel>
          <ExportPanel title="Document Actions"><DocumentationActions /></ExportPanel>
          <ExportPanel title="Version History (No Data)"><DocumentationVersionCard data={data} /></ExportPanel>
        </div>
      </section>
    </>
  );
}

function DocumentationFolders({ documentCount }: { documentCount: number }) {
  const folders = [["▾ ▣ All Documents", documentCount > 0 ? String(documentCount) : "No Data", "active"], ["› ▣ Folders", "No Data", "cyan"]];
  return <div className="h-[calc(100%-22px)] text-[9px]"><div className="-mt-6 flex justify-end text-[#05ff5e]">＋</div><div className="space-y-2">{folders.map(([name, count, color]) => <div className={color === "active" ? "flex justify-between rounded bg-[#063b27] px-2 py-2 text-[#bbf7d0]" : "flex justify-between px-2 text-slate-300"} key={name}><span className={color === "cyan" ? "text-cyan-400" : color === "blue" ? "text-blue-400" : color === "yellow" ? "text-yellow-400" : color === "purple" ? "text-purple-400" : color === "orange" ? "text-orange-400" : color === "red" ? "text-red-400" : ""}>{name}</span><span>{count}</span></div>)}</div></div>;
}

function DocumentationStorage() {
  return <div className="text-[9px] text-slate-400"><div className="mt-4 h-2 rounded-full bg-slate-800"><div className="h-2 w-0 rounded-full bg-[#05ff5e]" /></div><div className="mt-4 flex justify-between"><span>No Data</span><span>No Data</span></div></div>;
}

function DocumentationTable({ data }: { data?: DeploymentDocumentationData }) {
  const rows = documentRowsFromData(data);
  return <div className="flex h-full flex-col"><div className="mb-3 grid grid-cols-[1fr_0.27fr_0.27fr_36px_36px] gap-2"><div className="rounded border border-cyan-300/12 bg-[#03111c] px-3 py-2 text-[9px] text-slate-500">⌕ Search documents...</div><Button>All Types⌄</Button><Button>All Statuses⌄</Button><Button>▦</Button><Button>☷</Button></div><table className="w-full text-left text-[8.5px]"><thead className="text-slate-500"><tr>{["Name", "Type", "Folder", "Uploaded By", "Date Uploaded", "Status", "Size", ""].map((header) => <th className="border-b border-white/5 bg-[#092033] px-2 py-2 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={`${row.id}-${row.name}`}><td className="grid grid-cols-[24px_1fr] gap-2 px-2 py-[5px]"><span className={`grid size-5 place-items-center rounded border border-current text-[7px] ${documentIconColor(row.type)}`}>{row.type}</span><span className="font-semibold text-slate-100">{row.name}</span></td><td className="px-2">{row.type}</td><td className="px-2">{row.folder}</td><td className="px-2">{row.uploadedBy}</td><td className="whitespace-pre-line px-2 leading-tight">{row.uploadedAt}</td><td className={row.status === "No Data" ? "px-2 text-slate-400" : "px-2 text-[#05ff5e]"}>◎ {row.status}</td><td className="px-2">{row.size}</td><td className="px-2">⋮</td></tr>)}</tbody></table><div className="mt-auto flex items-center justify-between pt-2 text-[9px] text-slate-400"><span>Showing {rows.length} document rows</span><span className="flex items-center gap-4">‹ <b className="rounded border border-[#05ff5e] px-2 py-1 text-[#05ff5e]">1</b> ›</span><span>Rows per page: <b className="rounded border border-cyan-300/12 px-4 py-1 text-slate-200">25⌄</b></span></div></div>;
}

function DocumentationDetails({ data }: { data?: DeploymentDocumentationData }) {
  const document = firstDocument(data);
  const rows = data?.metadataRows?.length ? data.metadataRows : [{ label: "Status", value: document.status }];
  return <div className="text-[9px]"><div className="mb-3 grid grid-cols-[34px_1fr] gap-3"><span className="grid size-8 place-items-center rounded border border-red-500/60 text-[9px] text-red-400">{document.type}</span><span><b>{document.name}</b><br /><span className="text-slate-500">{document.type} Document • {document.size}</span></span></div><div className="mb-3 flex gap-2"><Button>◎ Preview Document</Button><Button>⇩ Download</Button></div><div className="space-y-1.5">{rows.map((row) => <div className="grid grid-cols-[86px_1fr] gap-2 border-b border-white/5 pb-1" key={row.label}><span className="text-slate-400">{row.label}</span><b className={row.label === "Status" ? "text-[#05ff5e]" : "text-slate-200"}>{row.label === "Status" ? "● " : ""}{row.value}</b></div>)}</div></div>;
}

function DocumentationActions() {
  return <div className="space-y-3 text-[9px] text-slate-300"><div>▣ Move / Copy</div><div>✎ Rename</div><div className="text-red-400">▢ Delete</div></div>;
}

function DocumentationVersionCard({ data }: { data?: DeploymentDocumentationData }) {
  const row = data?.versionRows?.[0] ?? emptyDocumentRow("No approved document version history model exists.");
  return <div className="text-[9px]"><div className="-mt-6 flex justify-end text-cyan-400">View All</div><div className="rounded border border-cyan-300/12 bg-[#03111c] p-3"><div className="flex justify-between"><b>{row.name}</b><span className="text-slate-400">●</span></div><div className="mt-2 flex justify-between text-slate-400"><span>{row.uploadedAt}</span><span>{row.uploadedBy}</span></div><div className="mt-2 text-slate-400">{row.status}</div></div></div>;
}

function EquipmentInventory({ data, deploymentId }: { data?: DeploymentFieldWorkflowData; deploymentId: string }) {
  const equipmentCount = data?.equipmentRows?.filter((row) => row.name !== "No Data").length ?? 0;
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
        <div className="flex items-center justify-between">
          <div><h1 className="text-[15px] font-semibold uppercase">Equipment Inventory & Readings</h1><p className="mt-1 text-[9px] text-slate-400">Inventory all installed equipment and capture baseline readings where applicable.</p></div>
          <div className="flex gap-3"><Button>All Equipment⌄</Button><div className="w-[230px] rounded border border-cyan-300/12 bg-[#03111c] px-3 py-2 text-[9px] text-slate-500">⌕ Search equipment...</div><Button>▾ Filters</Button><Link className="rounded bg-[#087a35] px-5 py-2 text-[10px] font-semibold text-white" href={`/operations/deployments/${deploymentId}/equipment?mode=add`}>＋ Add Equipment</Link></div>
        </div>
      </section>
      <section className="mt-2 grid h-[572px] min-h-0 grid-cols-[1.55fr_0.9fr] gap-2">
        <ExportPanel title=""><EquipmentInventoryTable data={data} /></ExportPanel>
        <aside className="grid min-h-0 grid-rows-[286px_128px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="Baseline Readings Summary"><BaselineReadingsSummary data={data} /></ExportPanel>
          <ExportPanel title="Equipment Readings Actions"><EquipmentReadingActions /></ExportPanel>
          <ExportPanel title="Equipment Inventory Summary"><EquipmentInventorySummary count={equipmentCount} /></ExportPanel>
        </aside>
      </section>
    </>
  );
}

function EquipmentInventoryTable({ data }: { data?: DeploymentFieldWorkflowData }) {
  const rows = equipmentRowsFromData(data).slice(0, 12);
  const equipmentCount = rows.filter((row) => row.name !== "No Data").length;
  const tabs = [`All Equipment (${equipmentCount > 0 ? equipmentCount : "No Data"})`, "Transformers (No Data)", "Switchgear / Panels (No Data)", "Capacitor Banks (No Data)", "Meters (No Data)", "Other (No Data)"];
  return <div className="flex h-full flex-col"><div className="mb-2 flex gap-7 text-[9px]">{tabs.map((tab, index) => <span className={index === 0 ? "border-b border-[#05ff5e] pb-1 text-[#05ff5e]" : "text-slate-400"} key={tab}>{tab}</span>)}</div><table className="w-full text-left text-[8.5px]"><thead className="text-slate-500"><tr>{["Equipment Name", "Type", "Location / Panel", "Rating", "Status", "Baseline Readings", "Actions"].map((h) => <th className="border-b border-white/5 bg-[#092033] px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={`${row.id}-${row.name}`}><td className="grid grid-cols-[22px_1fr] gap-2 px-2 py-[7px]"><span className="text-cyan-400">▣</span><b className="text-slate-100">{row.name}</b></td><td className="px-2">{row.type}</td><td className="px-2">{row.location}</td><td className="whitespace-pre-line px-2 leading-tight">{row.rating}</td><td className={row.status === "No Data" ? "px-2 text-slate-400" : "px-2 text-[#05ff5e]"}>{row.status}</td><td className="whitespace-pre-line px-2 leading-tight text-slate-400">◎ {row.lastCommunicatedAt}</td><td className="px-2 text-slate-300">◎ &nbsp; ⋮</td></tr>)}</tbody></table><div className="mt-auto flex items-center justify-between pt-2 text-[9px] text-slate-400"><span>Showing {rows.length} equipment rows</span><span className="flex items-center gap-4">‹ <b className="rounded border border-[#05ff5e] px-2 py-1 text-[#05ff5e]">1</b> ›</span></div><div className="mt-2 flex gap-8 border-t border-white/5 pt-2 text-[9px]"><span className="text-[#05ff5e]">◎ Data</span><span className="text-yellow-400">◎ Pending</span><span className="text-red-400">◎ Not Installed</span><span className="text-blue-400">◎ Not Applicable</span></div></div>;
}

function BaselineReadingsSummary({ data }: { data?: DeploymentFieldWorkflowData }) {
  const cards: [string, string, string, string][] = readingRowsFromData(data, "pre").map((row) => [row.label, row.preValue, row.unit, row.source === "No Data" ? "slate" : "blue"]);
  return <div className="h-[calc(100%-22px)]"><div className="mb-1 flex justify-end text-[8px] text-cyan-400">Live / Latest</div><div className="grid grid-cols-3 gap-2">{cards.map(([title, value, unit, color]) => <div className="rounded border border-cyan-300/12 bg-[#03111c] p-2" key={title}><div className="text-[8px] text-slate-400">{title}</div><div className="text-[18px] leading-none text-slate-100">{value}</div><div className="text-[8px] text-slate-400">{unit}</div><div className={color === "green" ? "mt-2 h-4 rounded bg-[linear-gradient(90deg,#05ff5e33,#05ff5e)]" : color === "purple" ? "mt-2 h-4 rounded bg-[linear-gradient(90deg,#a855f733,#a855f7)]" : color === "orange" ? "mt-2 h-4 rounded bg-[linear-gradient(90deg,#f9731633,#f97316)]" : "mt-2 h-4 rounded bg-[linear-gradient(90deg,#0ea5e933,#0ea5e9)]"} /></div>)}</div></div>;
}

function EquipmentReadingActions() {
  const actions = [["▣", "Capture Readings", "Capture live baseline readings"], ["✎", "Manual Entry", "Enter readings manually"], ["⇧", "Import Readings", "Import from external file"], ["◷", "Reading History", "View historical readings"]];
  return <div className="grid grid-cols-2 gap-2 text-[9px]">{actions.map(([icon, title, detail]) => <div className="grid grid-cols-[24px_1fr_12px] items-center gap-2 rounded border border-cyan-300/12 bg-[#03111c] p-2" key={title}><span className="text-cyan-400">{icon}</span><span><b>{title}</b><br /><span className="text-[8px] text-slate-400">{detail}</span></span><span>›</span></div>)}</div>;
}

function EquipmentInventorySummary({ count }: { count: number }) {
  const values = [["Equipment", count > 0 ? String(count) : "No Data", count > 0 ? "Data" : "No Data", "green"], ["Pending", "No Data", "No Data", "yellow"], ["Not Installed", "No Data", "No Data", "red"], ["N/A", "No Data", "No Data", "blue"]];
  return <div className="h-[calc(100%-22px)]"><div className="mb-1 flex justify-end text-[8px] text-cyan-400">View Details</div><div className="grid h-[calc(100%-14px)] grid-cols-4 items-center gap-2 text-center text-[9px]">{values.map(([label, value, percent, color]) => <div className="border-l border-cyan-300/10 first:border-l-0" key={label}><div className={color === "green" ? "text-[#05ff5e]" : color === "yellow" ? "text-yellow-400" : color === "red" ? "text-red-400" : "text-blue-400"}>◎ {label}</div><div className="mt-3 text-[22px] leading-none text-slate-100">{value}</div><div className="mt-1 text-slate-400">{percent}</div></div>)}</div></div>;
}

function AddEquipment({ data }: { data?: DeploymentFieldWorkflowData }) {
  return (
    <>
      <div className="mt-3 flex h-[44px] items-center justify-between"><div><h1 className="text-[15px] font-semibold uppercase">Add Equipment</h1><p className="text-[9px] text-slate-400">Enter equipment details to include in the inventory and readings list.</p></div><span className="text-slate-400">x</span></div>
      <section className="mt-2 grid h-[738px] min-h-0 grid-cols-[0.92fr_0.92fr_0.6fr] gap-2">
        <div className="grid min-h-0 grid-rows-[250px_222px_1fr] gap-2">
          <Panel title="1 Equipment Type"><EquipmentTypePicker /></Panel>
          <Panel title="2 Equipment Details"><EquipmentDetailsFields data={data} /></Panel>
          <Panel title="3 Location & Association"><LocationAssociationFields /></Panel>
        </div>
        <div className="grid min-h-0 grid-rows-[250px_266px_1fr] gap-2">
          <Panel title="4 Electrical Specifications"><ElectricalSpecificationFields /></Panel>
          <Panel title="5 Installation & Status"><InstallationStatusFields /></Panel>
          <Panel title="6 Attachments (Optional)"><AttachmentDrop /></Panel>
        </div>
        <aside className="grid min-h-0 grid-rows-[1fr_92px_136px] gap-2">
          <Panel title="Equipment Type Guide"><EquipmentTypeGuide /></Panel>
          <Panel title="Required Fields"><p className="text-[9px] text-slate-400">Fields marked with <span className="text-red-400">*</span> are required to save.</p></Panel>
          <Panel title="Tips"><ul className="space-y-2 text-[9px] leading-relaxed text-slate-300"><li>• Add all installed equipment for accurate baseline readings.</li><li>• Ensure CT ratios and wiring are verified.</li><li>• Attach photos or diagrams for future reference.</li></ul></Panel>
        </aside>
      </section>
    </>
  );
}

function EquipmentTypePicker() {
  const types = ["Transformer", "Panel", "Capacitor Bank", "Meter", "Switchgear / Panel", "CT / Sensor", "Breaker", "Other"];
  return <div><Field label="Equipment Type *" value="Select equipment type" /><div className="mt-3 grid grid-cols-4 gap-2">{types.map((item) => <div className="grid h-[64px] place-items-center rounded border border-cyan-300/12 bg-[#03111c] text-center text-[8px]" key={item}><span><span className="text-[20px] text-slate-300">{item === "Meter" ? "◎" : item === "Other" ? "•••" : "▣"}</span><br />{item}</span></div>)}</div></div>;
}

function EquipmentDetailsFields({ data }: { data?: DeploymentFieldWorkflowData }) {
  const equipment = equipmentRowsFromData(data)[0] ?? emptyEquipmentRow();
  return <div className="grid grid-cols-2 gap-3"><Field label="Equipment Name / Tag *" value={equipment.name} /><Field label="Manufacturer" value="No Data" /><Field label="Model" value="No Data" /><Field label="Serial Number" value={equipment.serialNumber} /><Field label="Rating / Capacity *" value={equipment.rating} /><Field label="Unit" value="No Data" /></div>;
}

function LocationAssociationFields() {
  return <div className="grid grid-cols-2 gap-3"><Field label="Location / Panel *" value="No Data" /><Field label="Parent Equipment (Optional)" value="No Data" /><Field label="Electrical Room / Area" value="No Data" /><Field label="Floor / Level" value="No Data" /></div>;
}

function ElectricalSpecificationFields() {
  return <div><div className="grid grid-cols-3 gap-3"><Field label="Phase" value="No Data" /><Field label="Voltage (L-L)" value="No Data" /><Field label="Voltage (L-N)" value="No Data" /><Field label="Frequency" value="No Data" /><Field label="CT Ratio (If Applicable)" value="No Data" /><Field label="No. of Poles" value="No Data" /></div><div className="mt-4 grid grid-cols-2 gap-3"><Field label="System" value="No Data" /><Field label="Connection Type" value="No Data" /></div></div>;
}

function InstallationStatusFields() {
  return <div><div className="grid grid-cols-2 gap-3"><Field label="Installation Status *" value="No Data" /><Field label="Installation Date" value="No Data" /><Field label="Installed By" value="No Data" /><Field label="Verified By" value="No Data" /></div><div className="mt-4 text-[9px] text-slate-300"><div className="mb-2 text-slate-400">Operational Status</div><div className="flex gap-12"><span className="text-slate-500">◎ No Data</span><span>○ Standby</span><span>○ Out of Service</span></div></div><div className="mt-4"><div className="mb-1 text-[8px] text-slate-400">Notes</div><div className="h-[58px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[9px] text-slate-500">No Data<br /><span className="float-left mt-6">0 / 500 characters</span></div></div></div>;
}

function AttachmentDrop() {
  return <div className="grid h-[66px] place-items-center rounded border border-dashed border-cyan-300/20 bg-[#03111c] text-center text-[9px] text-slate-400"><div>⇧ &nbsp; Drag & drop files here or <button className="rounded border border-slate-600 px-3 py-1 text-slate-300">Select Files</button><br /><span className="text-[8px]">Supported formats: JPG, PNG, PDF (Up to 10MB each)</span></div></div>;
}

function EquipmentTypeGuide() {
  const rows = [["Transformer", "Steps up or steps down voltage levels."], ["Panel", "Electrical distribution panel or switchboard."], ["Capacitor Bank", "Power factor correction equipment."], ["Meter", "Energy or power quality meter."], ["Switchgear / Panel", "Switchgear, MCC, or distribution panel."], ["CT / Sensor", "Current transformer or monitoring sensor."], ["Breaker", "Circuit breaker or protection device."], ["Other", "Any other electrical equipment."]];
  return <div><p className="mb-4 text-[9px] leading-relaxed text-slate-400">Select the correct equipment type to ensure accurate data tracking and reporting.</p><div className="space-y-3">{rows.map(([title, description]) => <div className="grid grid-cols-[24px_1fr] gap-3 text-[9px]" key={title}><span className={title === "Panel" ? "text-yellow-400" : title === "Meter" ? "text-blue-400" : title === "Other" ? "text-slate-400" : "text-cyan-400"}>{title === "Other" ? "•••" : "▣"}</span><span><b className="text-slate-200">{title}</b><br /><span className="text-slate-400">{description}</span></span></div>)}</div></div>;
}

function InstallationDetails({ data }: { data?: DeploymentFieldWorkflowData }) {
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
        <div className="grid grid-cols-[1fr_190px_210px_190px] items-center gap-5">
          <div><h1 className="text-[15px] font-semibold uppercase">Installation Details</h1><p className="mt-1 text-[9px] text-slate-400">Capture detailed information about the installation work performed.</p></div>
          <Field label="Installation Start" value={data?.updatedAt ?? "No Data"} />
          <Field label="Installer / Technician *" value="No Data" />
          <div><div className="mb-1 text-[8px] text-slate-400">Installation Status</div><span className="inline-flex rounded border border-slate-600 bg-[#03111c] px-4 py-1.5 text-[10px] text-slate-300">{data?.status ?? "No Data"}</span></div>
        </div>
      </section>
      <section className="mt-2 grid h-[650px] min-h-0 grid-cols-[0.92fr_1.18fr_0.98fr] gap-2">
        <div className="grid min-h-0 grid-rows-[386px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="Installation Checklist" subtitle="Verify completed installation tasks."><InstallationChecklistPanel /></ExportPanel>
          <ExportPanel title="Installation Information"><InstallationInfoPanel data={data} /></ExportPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[386px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="Installed Equipment / Panels" subtitle="Panels and equipment installed at this site."><InstallationEquipmentPanel data={data} /></ExportPanel>
          <ExportPanel title="Installation Photos" subtitle="Capture photos of installation progress." action={<span className="text-cyan-400">View All (No Data)</span>}><InstallationPhotosPanel /></ExportPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[300px_102px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="Wiring & Connection Verification" subtitle="Verify critical wiring and connections."><InstallationWiringPanel /></ExportPanel>
          <ExportPanel title="Notes"><InstallationNotesPanel /></ExportPanel>
          <ExportPanel title="Installation Status Summary"><InstallationStatusPanel data={data} /></ExportPanel>
        </div>
      </section>
    </>
  );
}

function InstallationChecklistPanel() {
  const rows = [["Installation Checklist", "No Data", false], ["Workflow Model", "No Data", false]] as const;
  return <div className="flex h-[calc(100%-30px)] flex-col"><div className="grid grid-cols-[1fr_96px] bg-[#092033] px-2 py-1.5 text-[8px] text-slate-400"><span>Task</span><span>Status</span></div><div className="min-h-0 flex-1 overflow-hidden text-[8px]">{rows.map(([task, status, checked]) => <div className="grid grid-cols-[1fr_96px] items-center border-b border-white/5 px-2 py-[3px]" key={task}><span className="flex items-center gap-2"><span className={checked ? "text-[#05ff5e]" : "text-slate-500"}>{checked ? "◎" : "○"}</span>{task}</span><InstallationStatusPill status={status} /></div>)}</div><div className="mt-1.5 grid grid-cols-[1fr_128px_38px] items-center gap-2 text-[8px] text-slate-400"><span>No approved checklist schema</span><MiniProgress value={0} color="green" /><span className="text-right">0%</span></div></div>;
}

function InstallationStatusPill({ status }: { status: string }) {
  const tone = status === "Completed" ? "border-[#05ff5e]/30 bg-[#063b27] text-[#05ff5e]" : status === "In Progress" ? "border-cyan-400/30 bg-[#06304b] text-cyan-300" : "border-slate-600 bg-[#03111c] text-slate-300";
  return <span className={`rounded border px-2 py-px text-[7.5px] ${tone}`}>{status}⌄</span>;
}

function InstallationEquipmentPanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  const rows = equipmentRowsFromData(data).slice(0, 8);
  return <div className="h-[calc(100%-30px)]"><table className="w-full text-left text-[8.6px]"><thead className="bg-[#092033] text-slate-400"><tr>{["Equipment / Panel", "Type", "Location", "Status", "Actions"].map((h) => <th className="px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={`${row.id}-${row.name}`}><td className="px-2 py-[7px] text-slate-200">{row.name}</td><td className="px-2">{row.type}</td><td className="px-2">{row.location}</td><td className={row.status === "No Data" ? "px-2 text-slate-400" : "px-2 text-[#05ff5e]"}>{row.status}</td><td className="px-2 text-slate-400">⋮</td></tr>)}</tbody></table><div className="mt-3"><Button>＋ Add Equipment</Button></div></div>;
}

function InstallationWiringPanel() {
  const rows = [["☑", "Main power connections", "May 12, 9:45 AM", "Verified"], ["☑", "CT wiring and polarity", "May 12, 9:48 AM", "Verified"], ["☑", "Voltage connections (L-L, L-N)", "May 12, 9:50 AM", "Verified"], ["☐", "Capacitor bank wiring", "", "Pending"], ["☐", "Grounding / bonding", "", "Pending"], ["☐", "Control / communication wiring", "", "Pending"], ["☐", "All terminations torqued", "", "Pending"]];
  return <table className="w-full text-left text-[8.4px]"><thead className="bg-[#092033] text-slate-400"><tr>{["Item", "Verified", "Status"].map((h) => <th className="px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([check, item, verified, status]) => <tr className="border-b border-white/5" key={item}><td className="px-2 py-[6px]"><span className="mr-2 text-slate-400">{check}</span>{item}</td><td className="px-2 text-slate-300">{verified}</td><td className="px-2"><span className={status === "Verified" ? "rounded bg-[#063b27] px-2 py-1 text-[8px] text-[#05ff5e]" : "rounded bg-[#3d3308] px-2 py-1 text-[8px] text-yellow-300"}>{status}</span></td></tr>)}</tbody></table>;
}

function InstallationInfoPanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  return <div className="space-y-2 text-[8.5px]"><div className="grid grid-cols-3 gap-2"><Field label="Installation Type" value="No Data" /><Field label="Installation Purpose" value="No Data" /><Field label="Rack / Panel Location" value="No Data" /></div><div className="grid grid-cols-2 gap-2"><Field label="Electrical Room / Area" value="No Data" /><Field label="Ambient Temperature (°C)" value="No Data" /></div><div><div className="mb-1 text-[8px] text-slate-400">Work Performed</div><div className="h-[78px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[9px] leading-relaxed text-slate-300">{data?.message || "No approved installation notes source exists."}</div><div className="mt-1 text-[8px] text-slate-500">0 / 1000 characters</div></div></div>;
}

function InstallationPhotosPanel() {
  const photos = [["Panel B - Front View", "May 12, 9:35 AM"], ["Wiring - Phase A", "May 12, 9:40 AM"], ["CT Installation", "May 12, 9:41 AM"], ["Grounding Connection", "May 12, 9:42 AM"]];
  return <div className="grid h-[calc(100%-22px)] grid-cols-[repeat(4,1fr)_112px] gap-2"><div className="col-span-4 grid grid-cols-4 gap-2">{photos.map(([label, time], index) => <div key={label}><div className="relative h-[92px] overflow-hidden rounded border border-cyan-300/12 bg-[linear-gradient(135deg,#6b7280,#1f2937_48%,#b45309)]"><div className="absolute inset-2 rounded border border-black/25 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.18)_0_2px,transparent_2px_14px)] opacity-70" /><span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#02100a]">✓</span><span className="absolute bottom-1 left-1 text-[8px] text-white/80">{index + 1}</span></div><div className="mt-1 text-[8px] text-slate-300">{label}</div><div className="text-[7.5px] text-slate-500">{time}</div></div>)}</div><div className="row-span-2 grid place-items-center rounded border border-dashed border-cyan-300/20 bg-[#03111c] p-2 text-center text-[8px] text-slate-400"><div><div className="mx-auto mb-2 grid size-8 place-items-center rounded border border-cyan-300/20 text-[18px] text-cyan-300">▣</div><b className="text-slate-200">Add Photo</b><br />Drag & drop or click to upload<br /><span className="text-[7px]">JPG, PNG up to 10MB</span></div></div><div className="col-span-4 flex justify-center gap-2"><span className="size-2 rounded-full bg-[#05ff5e]" /><span className="size-2 rounded-full bg-slate-600" /><span className="size-2 rounded-full bg-slate-600" /><span className="size-2 rounded-full bg-slate-600" /></div></div>;
}

function InstallationNotesPanel() {
  return <div><div className="h-[54px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[8.5px] text-slate-500">Enter any notes about the installation work...</div><div className="mt-1 text-[8px] text-slate-500">0 / 1000 characters</div></div>;
}

function InstallationStatusPanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  const equipmentCount = data?.equipmentRows?.filter((row) => row.name !== "No Data").length ?? 0;
  return <div className="space-y-4 text-[8.5px]"><p className="text-slate-400">Overall status of installation tasks and verification.</p><InstallationSummaryRow label="Checklist Progress" value="No Data" progress={0} color="green" /><InstallationSummaryRow label="Equipment Installed" value={equipmentCount > 0 ? String(equipmentCount) : "No Data"} progress={equipmentCount > 0 ? 100 : 0} color="green" /><InstallationSummaryRow label="Wiring Verified" value="No Data" progress={0} color="orange" /><div className="grid grid-cols-[1fr_auto]"><span>Photos Captured</span><span className="text-slate-200">No Data</span></div><div className="grid grid-cols-[1fr_auto]"><span>Open Issues</span><span className="text-red-400">No Data <span className="ml-8 text-cyan-400">View Issues</span></span></div></div>;
}

function InstallationSummaryRow({ color, label, progress, value }: { color: "green" | "orange"; label: string; progress: number; value: string }) {
  return <div className="grid grid-cols-[92px_1fr_54px] items-center gap-3"><span>{label}</span><MiniProgress value={progress} color={color} /><span className={color === "green" ? "text-right text-[#05ff5e]" : "text-right text-orange-400"}>{value}</span></div>;
}

function MiniProgress({ color, value }: { color: "green" | "orange"; value: number }) {
  return <div className="h-2 rounded bg-slate-800"><div className={color === "green" ? "h-2 rounded bg-[#05ff5e]" : "h-2 rounded bg-orange-400"} style={{ width: `${value}%` }} /></div>;
}

function PhotoDocumentSystem({ data }: { data?: DeploymentFieldWorkflowData }) {
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
        <div className="mb-3 flex items-start gap-3">
          <span className="grid size-6 place-items-center rounded border border-[#05ff5e]/50 text-[14px] text-[#05ff5e]">▣</span>
          <div><h1 className="text-[15px] font-semibold uppercase">Photo & Document System</h1><p className="mt-1 text-[9px] text-slate-400">Capture, organize, and manage all photos and documents for this deployment.</p></div>
        </div>
        <div className="grid grid-cols-[130px_120px_110px_1fr_130px_120px] gap-5 text-[9px]"><Info label="Deployment ID" value={data?.deploymentId ?? "No Data"} /><Info label="Site" value={data?.siteName ?? "No Data"} /><Info label="Customer" value={data?.clientName ?? "No Data"} /><Info label="Address" value={data?.siteRows?.find((row) => row.label === "Address")?.value ?? "No Data"} /><Info label="Captured On" value={data?.updatedAt ?? "No Data"} /><Info label="Captured By" value="No Data" /></div>
      </section>
      <section className="mt-2 grid h-[564px] min-h-0 grid-cols-[1.04fr_1fr] gap-2">
        <div className="grid min-h-0 grid-rows-[1fr_104px] gap-2 overflow-hidden">
          <ExportPanel title="▧ Photo Gallery" action={<PhotoGalleryActions />}><PhotoGalleryPanel /></ExportPanel>
          <ExportPanel title="Notes"><PhotoNotesPanel /></ExportPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[286px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="▧ Document Library" action={<Button>⇧ Upload Document</Button>}><PhotoDocumentLibrary data={data} /></ExportPanel>
          <div className="grid min-h-0 grid-cols-[1fr_1fr] gap-2 overflow-hidden">
            <ExportPanel title="Required Documents Checklist"><RequiredDocumentsChecklist /></ExportPanel>
            <ExportPanel title="Photo Requirements Checklist"><PhotoRequirementsChecklist /></ExportPanel>
          </div>
        </div>
      </section>
    </>
  );
}

function PhotoGalleryActions() {
  return <div className="flex items-center gap-2"><Button>⇧ Upload Photos</Button><span className="rounded bg-[#063b27] px-2 py-1 text-[#05ff5e]">▦</span><span className="rounded border border-cyan-300/12 px-2 py-1 text-slate-400">☰</span></div>;
}

function PhotoGalleryPanel() {
  const photos = ["No Data"];
  return <div className="flex h-[calc(100%-22px)] flex-col"><div className="mb-3 flex gap-7 text-[8.5px]"><span className="border-b border-[#05ff5e] pb-1 text-[#05ff5e]">All (No Data)</span><span>Installation (No Data)</span><span>Equipment (No Data)</span><span>Readings (No Data)</span><span>Other (No Data)</span></div><div className="grid grid-cols-4 gap-x-3 gap-y-3">{photos.map((photo, index) => <PhotoDocumentThumb index={index} key={photo} label={photo} time="No Data" />)}</div><div className="mt-auto flex items-center justify-between pt-2 text-[9px] text-slate-400"><span>Showing No Data photos</span><span className="flex items-center gap-4">‹ <b className="rounded border border-[#05ff5e] px-2 py-1 text-[#05ff5e]">1</b> ›</span></div></div>;
}

function PhotoDocumentThumb({ index, label, time }: { index: number; label: string; time: string }) {
  const warm = index === 3 || index === 6 || index === 9 || index === 10;
  const meter = index === 8;
  return <div><div className={warm ? "relative h-[88px] overflow-hidden rounded bg-[radial-gradient(circle_at_65%_45%,#f59e0b_0_14%,transparent_15%),linear-gradient(135deg,#374151,#111827_50%,#7c2d12)]" : meter ? "relative h-[88px] overflow-hidden rounded bg-[radial-gradient(circle_at_center,#d1d5db_0_16%,#111827_17%_28%,transparent_29%),linear-gradient(135deg,#57534e,#0f172a)]" : "relative h-[88px] overflow-hidden rounded bg-[linear-gradient(135deg,#9ca3af,#1f2937_48%,#334155)]"}><div className="absolute inset-2 rounded border border-black/25 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.18)_0_2px,transparent_2px_15px)] opacity-70" /><span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[#05ff5e] text-[8px] text-[#02100a]">✓</span></div><div className="mt-1 text-[8px] font-semibold text-slate-200">{label}</div><div className="text-[7.5px] text-slate-500">{time}</div></div>;
}

function PhotoDocumentLibrary({ data }: { data?: DeploymentFieldWorkflowData }) {
  const rows = data?.documentRows?.length ? data.documentRows : [emptyDocumentRow(data?.message)];
  const count = rows.filter((row) => row.name !== "No Data").length;
  return <div className="flex h-[calc(100%-22px)] flex-col"><div className="mb-2 flex gap-7 text-[8.5px]"><span className="border-b border-[#05ff5e] pb-1 text-[#05ff5e]">All Documents ({count > 0 ? count : "No Data"})</span><span>Required (No Data)</span><span>Optional (No Data)</span></div><table className="w-full text-left text-[8.4px]"><thead className="bg-[#092033] text-slate-400"><tr>{["Document Name", "Category", "Type", "Status", "Uploaded On", "Action"].map((h) => <th className="px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={`${row.id}-${row.name}`}><td className="px-2 py-[6px] text-slate-200">{row.name}</td><td className="px-2">{row.folder}</td><td className="px-2">{row.type}</td><td className={row.status === "No Data" ? "px-2 text-slate-400" : "px-2 text-[#05ff5e]"}>{row.status}</td><td className="px-2">{row.uploadedAt}</td><td className="px-2 text-cyan-400">No Data</td></tr>)}</tbody></table><div className="mt-auto rounded border border-dashed border-cyan-300/20 bg-[#03111c] py-4 text-center text-[8.5px] text-slate-400">▧ &nbsp; Drag and drop files here or <button className="ml-2 rounded border border-cyan-300/12 bg-[#061421] px-4 py-1 text-slate-200">Select Files</button><br /><span className="text-[7.5px]">No upload command implemented</span></div></div>;
}

function RequiredDocumentsChecklist() {
  const rows = [["Required Document Model", "No Data", "yellow"], ["Checklist Source", "No Data", "yellow"]] as const;
  return <ChecklistMini rows={rows} />;
}

function PhotoRequirementsChecklist() {
  const rows = [["Photo Metadata Model", "No Data", "yellow"], ["Photo Requirements", "No Data", "yellow"]] as const;
  return <div className="h-[calc(100%-22px)]"><ChecklistMini rows={rows} /><div className="mt-4 border-t border-white/5 pt-3 text-[9px] text-slate-400">No approved photo metadata source exists.</div></div>;
}

function ChecklistMini({ rows }: { rows: readonly (readonly [string, string, string])[] }) {
  return <div className="space-y-2 text-[8.8px]">{rows.map(([label, status, tone]) => <div className="grid grid-cols-[1fr_auto_14px] items-center gap-2" key={label}><span>{label}</span><span className={tone === "yellow" ? "text-yellow-300" : "text-[#05ff5e]"}>{status}</span><span className={tone === "yellow" ? "text-yellow-300" : "text-[#05ff5e]"}>●</span></div>)}</div>;
}

function PhotoNotesPanel() {
  return <div className="text-[9px]"><p className="mb-2 text-slate-400">Add any notes related to photos or documents for this deployment.</p><div className="grid grid-cols-[1fr_68px] gap-2"><div className="rounded border border-cyan-300/12 bg-[#03111c] px-2 py-2 text-slate-500">Enter notes (optional)...</div><button className="rounded bg-[#092033] px-3 py-2 text-[8px] text-slate-300">Save Note</button></div></div>;
}

function ReadingsScreen({ data, kind }: { data?: DeploymentFieldWorkflowData; kind: "pre" | "post" }) {
  const isPost = kind === "post";
  if (isPost) return <PostInstallationReadings data={data} />;
  return <PreInstallationReadings data={data} />;
}

function PreInstallationReadings({ data }: { data?: DeploymentFieldWorkflowData }) {
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
        <div className="flex items-center justify-between"><div><h1 className="text-[15px] font-semibold uppercase"><span className="mr-2 text-[#05ff5e]">▣</span>Pre-Installation Readings</h1><p className="mt-1 text-[9px] text-slate-400">Capture baseline electrical readings before ECBS installation.</p></div><div className="flex gap-3"><Button>▣ Capture All Readings</Button><Button>↥ Import Readings</Button><Button>↻ Reading History</Button></div></div>
      </section>
      <section className="mt-2 grid h-[650px] min-h-0 grid-cols-[1.68fr_0.58fr] gap-2">
        <div className="grid min-h-0 grid-rows-[164px_1fr] gap-2 overflow-hidden">
          <div className="grid min-h-0 grid-cols-[0.92fr_1fr] gap-2 overflow-hidden">
            <ExportPanel title="Meter / Snapshot Selection"><PreMeterSelection data={data} /></ExportPanel>
            <ExportPanel title="Reading Capture Status"><PreReadingCaptureStatus data={data} /></ExportPanel>
          </div>
          <ExportPanel title="Pre-Installation Readings"><PreReadingsTable data={data} /></ExportPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[212px_150px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="Baseline Summary"><BaselineSummaryPanel data={data} /></ExportPanel>
          <ExportPanel title="Quality Check"><PostQualityCheck /></ExportPanel>
          <ExportPanel title="Notes"><PreNotes /></ExportPanel>
        </div>
      </section>
    </>
  );
}

function PreMeterSelection({ data }: { data?: DeploymentFieldWorkflowData }) {
  const equipment = equipmentRowsFromData(data)[0] ?? emptyEquipmentRow();
  return <div className="grid grid-cols-[1fr_1fr_94px] gap-2 text-[9px]"><div className="space-y-2"><Field label="Source Type" value="Meter" /><Field label="Snapshot Time *" value={data?.updatedAt ?? "No Data"} /><Button>⌁ Live Data</Button></div><div className="space-y-2"><Field label="Meter / Device" value={equipment.name} /><Field label="" value={equipment.lastCommunicatedAt} /></div><div className="mt-[44px] rounded border border-slate-600 bg-[#03111c] p-2 text-center text-[7.5px]"><div className="font-semibold text-slate-300">{data?.state === "data" ? "Data" : "No Data"}</div><div className="text-slate-400">Last Data: {equipment.lastCommunicatedAt}</div></div></div>;
}

function PreReadingCaptureStatus({ data }: { data?: DeploymentFieldWorkflowData }) {
  const count = data?.preReadingRows?.filter((row) => row.label !== "No Data").length ?? 0;
  const cards = [["Reading Rows", count > 0 ? String(count) : "No Data", "", "white"], ["Captured", count > 0 ? String(count) : "No Data", count > 0 ? "Data" : "No Data", "green"], ["Pending", "No Data", "No Data", "yellow"], ["Not Applicable", "No Data", "No Data", "blue"]];
  return <div className="h-[calc(100%-22px)]"><div className="grid grid-cols-4 gap-2">{cards.map(([label, value, sub, tone]) => <div className="rounded border border-cyan-300/12 bg-[#03111c] p-2" key={label}><div className="text-[8px] text-slate-400">{label}</div><div className={tone === "green" ? "text-[23px] leading-tight text-[#05ff5e]" : tone === "yellow" ? "text-[23px] leading-tight text-yellow-300" : tone === "blue" ? "text-[23px] leading-tight text-cyan-400" : "text-[23px] leading-tight text-slate-100"}>{value}</div><div className={tone === "green" ? "text-[8px] text-[#05ff5e]" : tone === "yellow" ? "text-[8px] text-yellow-300" : tone === "blue" ? "text-[8px] text-cyan-400" : "text-[8px] text-slate-500"}>{sub}</div></div>)}</div><div className="mt-3 h-2 rounded bg-slate-800"><div className="h-2 rounded bg-[#22c55e]" style={{ width: count > 0 ? "100%" : "0%" }} /></div><p className="mt-3 text-[8.5px] text-slate-400">{data?.message || "Readings are sourced from ecbs_os.telemetry_intervals when scoped rows exist."}</p></div>;
}

function BaselineSummaryPanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  return <div className="h-[calc(100%-22px)] text-[9px]"><MetricList rows={readingRowsFromData(data, "pre").map((row) => [row.label, `${row.preValue} ${row.unit}`])} /></div>;
}

function PreReadingsTable({ data }: { data?: DeploymentFieldWorkflowData }) {
  const rows = readingRowsFromData(data, "pre").slice(0, 10);
  return <div className="flex h-[calc(100%-22px)] flex-col"><table className="w-full text-left text-[8.8px]"><thead className="bg-[#092033] text-slate-400"><tr>{["Parameter", "L1", "L2", "L3", "Average", "Unit", "Status", "Captured Time", "Actions"].map((h) => <th className="px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={row.label}><td className="px-2 py-[7px] text-slate-200">{row.label}</td><td className="px-2">No Data</td><td className="px-2">No Data</td><td className="px-2">No Data</td><td className="px-2">{row.preValue}</td><td className="px-2">{row.unit}</td><td className={row.source === "No Data" ? "px-2 text-slate-400" : "px-2 text-[#05ff5e]"}>{row.source === "No Data" ? "No Data" : "Captured"}</td><td className="px-2">{data?.updatedAt ?? "No Data"}</td><td className="px-2 text-cyan-300">▣ &nbsp;▥</td></tr>)}</tbody></table><div className="mt-auto flex items-center justify-between pt-3 text-[9px] text-slate-400"><span>Showing {rows.length} reading rows</span><span className="flex items-center gap-6">‹ <b className="rounded border border-[#05ff5e] px-3 py-1 text-[#05ff5e]">1</b> ›</span><span>Rows per page: <b className="rounded border border-cyan-300/12 px-3 py-1 text-slate-200">10⌄</b></span></div></div>;
}

function PreNotes() {
  return <div><div className="h-[124px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[9px] text-slate-500">Enter any notes about baseline readings...</div><div className="mt-2 text-[8px] text-slate-500">0 / 1000 characters</div></div>;
}

function PostInstallationReadings({ data }: { data?: DeploymentFieldWorkflowData }) {
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3">
        <div className="flex items-center justify-between"><div><h1 className="text-[15px] font-semibold uppercase"><span className="mr-2 text-[#05ff5e]">▣</span>Post-Installation Readings</h1><p className="mt-1 text-[9px] text-slate-400">Capture electrical readings after ECBS installation and compare with baseline.</p></div><div className="flex gap-3"><Button>▣ Capture All Readings</Button><Button>↥ Import Readings</Button><Button>↻ Reading History</Button></div></div>
      </section>
      <section className="mt-2 grid h-[438px] min-h-0 grid-cols-[1.66fr_0.62fr] gap-2">
        <div className="grid min-h-0 grid-rows-[126px_1fr] gap-2 overflow-hidden">
          <div className="grid min-h-0 grid-cols-[0.9fr_1fr] gap-2 overflow-hidden">
            <ExportPanel title="Meter / Snapshot Selection"><PostMeterSelection data={data} /></ExportPanel>
            <ExportPanel title="Reading Capture Status"><PostReadingCaptureStatus data={data} /></ExportPanel>
          </div>
          <ExportPanel title="Post-Installation Readings"><PostReadingsTable data={data} /></ExportPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[220px_112px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="Before vs After Summary" action={<span className="text-cyan-400">View Details</span>}><BeforeAfterSummary data={data} /></ExportPanel>
          <ExportPanel title="Quality Check"><PostQualityCheck /></ExportPanel>
          <ExportPanel title="Notes"><PostNotes /></ExportPanel>
        </div>
      </section>
    </>
  );
}

function PostMeterSelection({ data }: { data?: DeploymentFieldWorkflowData }) {
  const equipment = equipmentRowsFromData(data)[0] ?? emptyEquipmentRow();
  return <div className="grid grid-cols-[1fr_1fr_92px] gap-2 text-[9px]"><div className="space-y-2"><Field label="Source Type" value="Meter" /><Field label="Snapshot Time *" value={data?.updatedAt ?? "No Data"} /></div><div className="space-y-2"><Field label="Meter / Device" value={equipment.name} /><Field label="" value={equipment.lastCommunicatedAt} /></div><div className="mt-[34px] rounded border border-slate-600 bg-[#03111c] p-1.5 text-center text-[7.5px]"><div className="font-semibold text-slate-300">{data?.state === "data" ? "Data" : "No Data"}</div><div className="mt-0.5 text-slate-400">⌁ Live Data</div><div className="text-slate-400">Last Data:<br />{equipment.lastCommunicatedAt}</div></div></div>;
}

function PostReadingCaptureStatus({ data }: { data?: DeploymentFieldWorkflowData }) {
  const count = data?.postReadingRows?.filter((row) => row.label !== "No Data").length ?? 0;
  const cards = [["Reading Rows", count > 0 ? String(count) : "No Data", "", "white"], ["Captured", count > 0 ? String(count) : "No Data", count > 0 ? "Data" : "No Data", "green"], ["Pending", "No Data", "No Data", "yellow"], ["Not Applicable", "No Data", "No Data", "blue"]];
  return <div className="h-[calc(100%-22px)]"><div className="grid grid-cols-4 gap-2">{cards.map(([label, value, sub, tone]) => <div className="rounded border border-cyan-300/12 bg-[#03111c] p-2" key={label}><div className="text-[8px] text-slate-400">{label}</div><div className={tone === "green" ? "text-[21px] leading-tight text-[#05ff5e]" : tone === "yellow" ? "text-[21px] leading-tight text-yellow-300" : tone === "blue" ? "text-[21px] leading-tight text-cyan-400" : "text-[21px] leading-tight text-slate-100"}>{value}</div><div className={tone === "green" ? "text-[8px] text-[#05ff5e]" : tone === "yellow" ? "text-[8px] text-yellow-300" : tone === "blue" ? "text-[8px] text-cyan-400" : "text-[8px] text-slate-500"}>{sub}</div></div>)}</div><div className="mt-2 h-2 rounded bg-slate-800"><div className="h-2 rounded bg-[#22c55e]" style={{ width: count > 0 ? "100%" : "0%" }} /></div><p className="mt-2 text-[8.5px] text-slate-400">{data?.message || "Readings are sourced from ecbs_os.telemetry_intervals when scoped rows exist."}</p></div>;
}

function BeforeAfterSummary({ data }: { data?: DeploymentFieldWorkflowData }) {
  const rows: [string, string][] = readingRowsFromData(data, "post").slice(0, 4).map((row) => [row.label, row.delta === "No Data" ? "No Data" : `${row.delta} ${row.unit}`]);
  return <div className="h-[calc(100%-22px)] text-[8.5px]"><div className="mb-2 grid grid-cols-[84px_1fr]"><span className="text-slate-400">Key Improvement</span><span className="rounded border border-cyan-300/12 bg-[#03111c] px-2 py-1 text-slate-200">Telemetry Delta⌄</span></div><MetricList rows={rows} /><div className="mt-2 grid h-[70px] grid-cols-4 items-end gap-4 px-4 text-center text-[7px] text-slate-400"><BarPair label="A" before={0} after={0} /><BarPair label="B" before={0} after={0} /><BarPair label="C" before={0} after={0} /><BarPair label="Total" before={0} after={0} /></div></div>;
}

function BarPair({ after, before, label }: { after: number; before: number; label: string }) {
  return <div><div className="mx-auto flex h-[54px] items-end justify-center gap-1"><span className="w-3 bg-slate-500" style={{ height: `${before}%` }} /><span className="w-3 bg-[#22c55e]" style={{ height: `${after}%` }} /></div><div>{label}</div></div>;
}

function PostReadingsTable({ data }: { data?: DeploymentFieldWorkflowData }) {
  const rows = readingRowsFromData(data, "post").slice(0, 10);
  return <div className="flex h-[calc(100%-22px)] flex-col"><table className="w-full text-left text-[7.8px]"><thead className="bg-[#092033] text-slate-400"><tr>{["Parameter", "L1", "L2", "L3", "Average", "Unit", "Status", "Change vs Baseline", "Captured Time", "Actions"].map((h) => <th className="px-2 py-1.5 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-white/5" key={row.label}><td className="px-2 py-[4px] text-slate-200">{row.label}</td><td className="px-2">No Data</td><td className="px-2">No Data</td><td className="px-2">No Data</td><td className="px-2">{row.postValue}</td><td className="px-2">{row.unit}</td><td className={row.source === "No Data" ? "px-2 text-slate-400" : "px-2 text-[#05ff5e]"}>{row.source === "No Data" ? "No Data" : "Captured"}</td><td className="px-2 text-slate-300">{row.delta}</td><td className="px-2">{data?.updatedAt ?? "No Data"}</td><td className="px-2 text-cyan-300">▣ &nbsp;▥</td></tr>)}</tbody></table><div className="mt-auto flex items-center justify-between pt-1 text-[8.5px] text-slate-400"><span>Showing {rows.length} reading rows</span><span className="flex items-center gap-6">‹ <b className="rounded border border-[#05ff5e] px-3 py-1 text-[#05ff5e]">1</b> ›</span><span>Rows per page: <b className="rounded border border-cyan-300/12 px-3 py-1 text-slate-200">10⌄</b></span></div></div>;
}

function PostQualityCheck() {
  return <div className="space-y-2 text-[9px]">{["Phase-specific readings: No Data", "Missing-reading checks: No Data", "Expected range model: No Data", "Data quality score: No Data"].map((item) => <div className="flex items-center gap-2" key={item}><span className="text-slate-500">◎</span>{item}</div>)}</div>;
}

function PostNotes() {
  return <div><div className="h-[118px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[9px] text-slate-500">Enter any notes about post-installation readings...</div><div className="mt-2 text-[8px] text-slate-500">0 / 1000 characters</div></div>;
}

function SiteInstallationDetails({ data }: { data?: DeploymentFieldWorkflowData }) {
  return (
    <>
      <section className="mt-2 rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><h1 className="text-[15px] font-semibold uppercase"><span className="mr-2 text-[#05ff5e]">▣</span>Site & Installation Details</h1><p className="mt-1 text-[9px] text-slate-400">Enter and verify site information and installation configuration.</p></section>
      <section className="mt-2 grid h-[650px] min-h-0 grid-cols-[0.98fr_1fr_1fr] gap-2">
        <div className="grid min-h-0 grid-rows-[400px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="1. Site Information"><SiteInformationPanel data={data} /></ExportPanel>
          <ExportPanel title="2. Installation Information"><SiteInstallInfoPanel data={data} /></ExportPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[352px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="3. Installation Location"><SiteLocationPanel data={data} /></ExportPanel>
          <ExportPanel title="4. System Configuration Summary"><SiteConfigurationSummary data={data} /></ExportPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[196px_196px_1fr] gap-2 overflow-hidden">
          <ExportPanel title="5. Site Photo" titleSuffix="(Optional)"><SiteDropZone icon="▣" label="Drag & drop image here or click to upload" sub="JPG, PNG up to 10MB" /></ExportPanel>
          <ExportPanel title="6. Site Map / Location Diagram" titleSuffix="(Optional)"><SiteDropZone icon="◇" label="Drag & drop file here or click to upload" sub="PDF, PNG, JPG up to 20MB" /></ExportPanel>
          <ExportPanel title="7. Notes"><SiteNotesPanel /></ExportPanel>
        </div>
      </section>
    </>
  );
}

function SiteInformationPanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  const siteValue = (label: string) => data?.siteRows?.find((row) => row.label === label)?.value ?? "No Data";
  return <div className="space-y-2 text-[9px]"><Field label="Site *" value={data?.siteName ?? siteValue("Site Name")} /><Field label="Customer" value={data?.clientName ?? "No Data"} /><Field label="Address *" value={siteValue("Address")} /><div className="grid grid-cols-3 gap-2"><Field label="City *" value="No Data" /><Field label="State / Province *" value="No Data" /><Field label="Postal Code *" value="No Data" /></div><div className="grid grid-cols-[0.9fr_1.1fr] gap-2"><Field label="Country *" value="No Data" /><Field label="Time Zone *" value={siteValue("Time Zone")} /></div><div className="grid grid-cols-2 gap-2"><Field label="Site Contact" value="No Data" /><Field label="Contact Phone" value="No Data" /></div><Field label="Contact Email" value="No Data" /></div>;
}

function SiteInstallInfoPanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  return <div className="space-y-2 text-[9px]"><div className="grid grid-cols-2 gap-2"><Field label="Installation Type *" value="No Data" /><Field label="Installation Purpose" value="No Data" /></div><div className="grid grid-cols-2 gap-2"><Field label="Project Reference / PO #" value={data?.projectName ?? "No Data"} /><Field label="Target Completion Date" value={data?.updatedAt ?? "No Data"} /></div><div className="grid grid-cols-2 gap-2"><Field label="Weather Conditions" value="No Data" /><Field label="Ambient Temperature (°C)" value="No Data" /></div></div>;
}

function SiteLocationPanel({ data }: { data?: DeploymentFieldWorkflowData }) {
  return <div className="space-y-2 text-[9px]"><Field label="Facility / Building" value={data?.siteName ?? "No Data"} /><Field label="Area / Room" value="No Data" /><div className="grid grid-cols-2 gap-2"><Field label="Electrical Room ID" value="No Data" /><Field label="Floor / Level" value="No Data" /></div><div className="mb-1 text-[8px] text-slate-400">GPS Coordinates (optional)</div><div className="grid grid-cols-[1fr_1fr_30px] gap-2"><Field label="Latitude" value="No Data" /><Field label="Longitude" value="No Data" /><button className="mt-[14px] rounded border border-cyan-300/12 bg-[#03111c] text-cyan-300">⌾</button></div><div><div className="mb-1 text-[8px] text-slate-400">Access Notes</div><div className="h-[58px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[9px] leading-relaxed text-slate-300">{data?.message || "No approved access notes source exists."}</div></div></div>;
}

function SiteConfigurationSummary({ data }: { data?: DeploymentFieldWorkflowData }) {
  const equipmentCount = data?.equipmentRows?.filter((row) => row.name !== "No Data").length ?? 0;
  const rows = [["Main Service Voltage (L-L)", "No Data"], ["System Frequency", "No Data"], ["Phases", "No Data"], ["Service Entrance Location", "No Data"], ["Main Switchgear / Panel", "No Data"], ["Existing Transformer", "No Data"], ["Equipment Rows", equipmentCount > 0 ? String(equipmentCount) : "No Data"], ["Capacitor Banks (Existing)", "No Data"]];
  return <div className="space-y-2 text-[9px]">{rows.map(([label, value]) => <div className="grid grid-cols-[1fr_0.8fr] border-b border-white/5 pb-1" key={label}><span className="text-slate-400">{label}</span><span className="text-slate-200">{value}</span></div>)}</div>;
}

function SiteDropZone({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return <div className="grid h-[calc(100%-22px)] place-items-center rounded border border-dashed border-cyan-300/20 bg-[#03111c] text-center text-[9px] text-slate-400"><div><div className="mx-auto mb-3 text-[30px] text-slate-300">{icon}</div><div>{label}</div><div className="mt-3 text-[8px] text-slate-500">{sub}</div></div></div>;
}

function SiteNotesPanel() {
  return <div><div className="h-[112px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[9px] text-slate-500">No Data</div><div className="mt-2 text-[8px] text-slate-500">0 / 1000 characters</div></div>;
}

function ChecklistTable({ acceptance = false }: { acceptance?: boolean }) {
  const rows = ["All required documents uploaded", "Photo documentation complete", "Test reports completed", "Installation permit uploaded", "Equipment labels and serial numbers recorded", "Notes and comments added", "All equipment installed as per design", "All connections tightened and secured", "Proper grounding & bonding verified", "Panel labeling completed", "System functional test passed", "Voltage readings within acceptable range", "Current readings within acceptable range", "Insulation resistance test passed", "Breaker operations verified", "Communication test passed", "All alarms cleared", "All documentation reviewed", "Customer walkthrough completed", "Customer satisfied with completed work"];
  return <DarkTable headers={["", "Checklist Item", "Category", "Status", "Reviewed", "Comments"]} rows={rows.map((row, index) => ["✓", row, index < 6 ? "Documentation" : index < 10 ? "Equipment & Installation" : index < 17 ? "Testing & Verification" : acceptance ? "Customer Acceptance" : "Completion", index === rows.length - 1 && acceptance ? "Pending" : "Complete", "May 12, 2025 9:45 AM", index === rows.length - 1 && acceptance ? "Requires acceptance" : "-"])} />;
}

function AcceptanceChecklist() {
  return (
    <div className="flex h-[calc(100%-22px)] flex-col">
      <div className="mb-1.5 flex items-end justify-between">
        <p className="text-[9px] text-slate-400">All items must be reviewed and accepted before signing.</p>
        <div className="flex gap-2 text-[8px]"><Button>All Categories ˅</Button><Button>All Statuses ˅</Button><button className="rounded bg-[#063b27] px-3 py-1 text-[#05ff5e]">☷</button></div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <AcceptanceChecklistTable />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400"><span>22 of 22 items reviewed</span><span className="flex gap-6"><span className="text-[#05ff5e]">✓ Complete</span><span className="text-yellow-300">△ Pending</span><span className="text-red-400">⊗ Issue</span></span></div>
    </div>
  );
}

function AcceptanceChecklistTable() {
  const rows = [
    ["All required documents uploaded and verified", "Documentation", "Complete", "May 12, 2025 9:45 AM", "-"],
    ["All photos captured and clear", "Documentation", "Complete", "May 12, 2025 9:50 AM", "-"],
    ["All tests passed and results within limits", "Testing & Verification", "Complete", "May 12, 2025 9:50 AM", "-"],
    ["Installation completed as per design", "Equipment & Installation", "Complete", "May 12, 2025 9:05 AM", "-"],
    ["All equipment labeled and identified", "Equipment & Installation", "Complete", "May 12, 2025 8:55 AM", "-"],
    ["Wiring terminations tight and secure", "Equipment & Installation", "Complete", "May 12, 2025 9:10 AM", "-"],
    ["Grounding and bonding verified", "Equipment & Installation", "Complete", "May 12, 2025 9:15 AM", "-"],
    ["Enclosures closed and locked", "Equipment & Installation", "Complete", "May 12, 2025 9:25 AM", "-"],
    ["Work area clean and free of debris", "Site & Installation", "Complete", "May 12, 2025 10:05 AM", "-"],
    ["No tools or materials left on site", "Site & Installation", "Complete", "May 12, 2025 10:08 AM", "-"],
    ["Baseline readings captured", "Pre-Installation Readings", "Complete", "May 12, 2025 9:00 AM", "-"],
    ["Post-installation readings captured", "Post-Installation Readings", "Complete", "May 12, 2025 9:25 AM", "-"],
    ["Voltage readings within acceptable range", "Testing & Verification", "Complete", "May 12, 2025 9:32 AM", "-"],
    ["Insulation resistance test passed", "Testing & Verification", "Complete", "May 12, 2025 9:34 AM", "-"],
    ["Breaker operations verified", "Testing & Verification", "Complete", "May 12, 2025 9:35 AM", "-"],
    ["Communication test passed", "Testing & Verification", "Complete", "May 12, 2025 9:40 AM", "-"],
    ["All alarms cleared", "Testing & Verification", "Complete", "May 12, 2025 9:42 AM", "-"],
    ["All documentation reviewed", "Documentation", "Complete", "May 12, 2025 9:50 AM", "-"],
    ["Operations & maintenance instructions provided", "Documentation", "Complete", "May 12, 2025 10:00 AM", "-"],
    ["Safety requirements verified", "Site & Installation", "Complete", "May 12, 2025 10:02 AM", "-"],
    ["Customer walkthrough completed", "Site & Installation", "Complete", "May 12, 2025 10:05 AM", "-"],
    ["Customer satisfied with completed work", "Customer Acceptance", "Pending", "-", "Requires acceptance"],
  ];

  return (
    <table className="w-full text-left text-[7.5px]">
      <thead className="bg-white/5 text-slate-500"><tr>{["#", "Checklist Item", "Category", "Status", "Reviewed", "Comments"].map((h) => <th className="px-2 py-1 font-medium" key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[0]}><td className="px-2 py-[3px] text-[#05ff5e]">●</td>{row.map((c, j) => <td className={c === "Complete" ? "px-2 py-[3px] text-[#05ff5e]" : c === "Pending" ? "px-2 py-[3px] text-yellow-300" : "px-2 py-[3px] text-slate-300"} key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

function AcceptanceSummary() {
  return (
    <div className="grid h-full grid-cols-[120px_1fr] items-center gap-4">
      <div className="grid size-[108px] place-items-center rounded-full p-[13px]" style={{ background: "conic-gradient(#22c55e 0 100%)" }}><div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center text-[24px] leading-none">22<br /><span className="text-[8px] text-slate-400">Total Items</span></div></div>
      <div className="space-y-2 text-[9px]">
        {[["22", "Completed", "#22c55e"], ["0", "Pending / Warning", "#eab308"], ["0", "Issues", "#ef4444"], ["0", "Not Applicable", "#38bdf8"]].map(([value, label, color]) => <div className="flex items-center gap-2" key={label}><span className="size-2 rounded-full" style={{ backgroundColor: color }} /><b>{value}</b><span className="text-slate-400">{label}</span></div>)}
        <div className="pt-2 text-[#05ff5e]">✓ All required items completed. Ready for acceptance.</div>
      </div>
    </div>
  );
}

function AcceptanceStatement() {
  return (
    <div className="space-y-1.5 text-[8.5px] text-slate-300">
      <p className="leading-relaxed">I confirm that the work performed under this deployment has been completed to my satisfaction and in accordance with the agreed scope and specifications. I accept this deployment as complete.</p>
      <Field label="Customer Representative Name *" value="Alex Martinez" />
      <Field label="Title / Position" value="Facilities Manager" />
      <div className="grid grid-cols-2 gap-2"><Field label="Email" value="alex.martinez@flex.com" /><Field label="Phone" value="+52 664 123 4567" /></div>
      <div><div className="mb-1 text-[8px] text-slate-400">Signature *</div><div className="relative h-[82px] rounded border border-cyan-300/12 bg-[#03111c] p-5 text-[34px] italic leading-none text-slate-100">Alex Martinez<span className="absolute right-4 top-3 text-[9px] not-italic text-slate-400">↻ Clear</span></div></div>
      <div className="grid grid-cols-2 gap-2"><Field label="Date & Time *" value="▣  May 12, 2025" /><Field label=" " value="◷  10:18 AM" /></div>
    </div>
  );
}

function SignoffChecklist() {
  const items = ["All installation work verified", "All equipment commissioned", "All functional tests passed", "All safety tests passed", "All alarms tested and cleared", "All documents & photos uploaded", "Commissioning summary approved", "System ready for handover"];
  return <div className="flex h-[calc(100%-22px)] flex-col"><p className="mb-0.5 text-[7.5px] text-slate-400">All items below are completed and verified.</p><table className="w-full text-left text-[7px]"><thead className="text-slate-500"><tr><th className="py-0.5">Item</th><th className="py-0.5 text-right">Status</th></tr></thead><tbody>{items.map((item) => <tr className="border-t border-white/5" key={item}><td className="py-[1px] text-slate-300"><span className="mr-2 text-[#05ff5e]">●</span>{item}</td><td className="py-[1px] text-right text-[#05ff5e]">Completed</td></tr>)}</tbody></table><div className="mt-auto rounded border border-[#05ff5e]/20 bg-[#05ff5e]/10 px-2 py-0.5 text-[7.5px] text-[#05ff5e]">✓ All checklist items are complete. System is ready for customer acceptance.</div></div>;
}

function SignoffStatement() {
  return <div className="h-[calc(100%-22px)] text-[8.5px] leading-relaxed text-slate-300"><p>I confirm that the ECBS system has been installed, tested, and commissioned in accordance with the agreed scope and specifications. All work has been completed to my satisfaction and the system is accepted for final delivery.</p><div className="mt-2 rounded border border-[#05ff5e]/20 bg-[#05ff5e]/10 p-2 text-[#05ff5e]">▣ I Agree & Accept System Delivery</div><p className="mt-2 text-slate-400">Acknowledgement</p><p>By signing below, I acknowledge that I have reviewed all documentation, test results, and system performance. I accept full responsibility for the system from this date forward.</p></div>;
}

function SignoffSignatureBlocks() {
  return <div className="grid h-[calc(100%-22px)] grid-cols-2 gap-4"><SignatureCapture name="Alex Martinez" role="Facilities Manager" title="Customer Representative" /><SignatureCapture name="John Doe" role="Field Technician" title="XECO Technician" /></div>;
}

function SignatureCapture({ name, role, title }: { name: string; role: string; title: string }) {
  return <div className="flex min-h-0 flex-col text-[8px] text-slate-300"><div className="mb-1 font-semibold uppercase text-slate-200">♙ {title} <span className="text-slate-500">(Required)</span></div><div className="grid grid-cols-2 gap-2"><Field label="Name *" value={name} /><Field label="Title / Position *" value={role} /></div><div className="mt-2"><div className="mb-1 flex justify-between text-slate-400"><span>Signature *</span><span>↻ Clear</span></div><div className="h-[62px] rounded border border-cyan-300/12 bg-[#03111c] px-10 py-3 text-[32px] italic leading-none text-slate-100">{name}</div></div><div className="mt-1 text-[#05ff5e]">● Signature captured successfully.</div></div>;
}

function IdentityVerification() {
  return <div className="grid h-[calc(100%-22px)] grid-cols-[1fr_1.05fr] gap-3 text-[8px] text-slate-300"><div className="space-y-1">{[["Email Verification", "alex.martinez@flex.com", "Verified"], ["Phone Verification", "+52 664 123 4567", "Verified"], ["Verification Method", "Email OTP", "Verified"]].map(([label, value, status]) => <div className="flex justify-between border-b border-white/5 pb-1" key={label}><span><b>{label}</b><br /><span className="text-slate-500">{value}</span></span><span className="text-[#05ff5e]">{status} ●</span></div>)}<div className="rounded border border-[#05ff5e]/20 bg-[#05ff5e]/10 p-1.5 text-[#05ff5e]">✓ GPS location captured successfully.</div></div><div><div className="mb-1 font-semibold text-slate-200">Location & Time Capture</div><div className="grid grid-cols-2 gap-2"><Field label="Captured On" value="▣ May 12, 2025" /><Field label=" " value="◷ 10:18 AM" /></div><div className="mt-2 grid h-[78px] place-items-center rounded bg-[linear-gradient(135deg,#0d2840,#061521)] text-center text-blue-300"><span className="text-[28px] text-[#05ff5e]">●</span><br />Av. El Salto</div></div></div>;
}

function DeploymentSummarySnapshot({ data }: { data?: DeploymentCompletionData }) {
  const rows = data?.closureCards?.length ? data.closureCards.map((row) => [row.label, row.value, "ecbs_os"]) : [["System Readiness Score", "No Data", "No approved readiness model"], ["Tests Passed", "No Data", "No approved test-result model"], ["Total Equipment Commissioned", "No Data", "No approved equipment-commissioning model"], ["Alarms Cleared", "No Data", "No approved alarm-clearance model"], ["Zero Open Issues", "No Data", "No approved issue model"], ["Overall Status", data?.status ?? "No Data", "Direct status"]];
  return <div className="flex h-[calc(100%-22px)] flex-col text-[8.5px] text-slate-300"><div className="space-y-1">{rows.map(([label, value, status]) => <div className="grid grid-cols-[1fr_70px_80px] border-b border-white/5 pb-0.5" key={label}><span className="text-slate-400">{label}</span><b>{value}</b><span className={status === "Commissioned" || status === "Yes" || status === "Excellent" ? "text-[#05ff5e]" : "text-slate-200"}>{status}</span></div>)}</div><div className="mt-auto grid grid-cols-3 gap-2">{[["Power Factor", "99.7%", "+31.2% vs Baseline"], ["THD Improvement", "86%", "↓ vs Baseline"], ["kVA Reduction", "18.6%", "↓ vs Baseline"]].map(([label, value, detail]) => <div className="rounded border border-cyan-300/12 bg-[#03111c] p-2 text-center" key={label}><div className="text-slate-400">{label}</div><div className="text-[17px] text-slate-100">{value}</div><div className="text-[7px] text-[#05ff5e]">{detail}</div></div>)}</div><div className="mt-2 rounded border border-[#05ff5e]/20 bg-[#05ff5e]/10 p-1.5 text-[#05ff5e]">✓ All results verified and approved in commissioning summary.</div></div>;
}

function SignoffDocs() {
  const docs = [["red", "Customer Acceptance Form"], ["purple", "Deployment Completion Certificate"], ["cyan", "Commissioning Summary Report"], ["purple", "Test & Verification Report"], ["yellow", "System Handover Certificate"]];
  return <div className="flex h-[calc(100%-22px)] flex-col"><p className="mb-1 text-[8px] text-slate-400">The following documents will be generated after sign-off.</p><div className="grid flex-1 grid-cols-5 gap-2">{docs.map(([color, name]) => <div className="grid grid-cols-[24px_1fr_14px] items-center gap-2 rounded border border-cyan-300/12 bg-[#03111c] p-1.5 text-[7.5px]" key={name}><span className={color === "red" ? "grid size-5 place-items-center rounded border border-red-400/50 text-red-400" : color === "yellow" ? "grid size-5 place-items-center rounded border border-yellow-300/50 text-yellow-300" : color === "cyan" ? "grid size-5 place-items-center rounded border border-cyan-400/50 text-cyan-400" : "grid size-5 place-items-center rounded border border-purple-400/50 text-purple-400"}>▤</span><span><b className="text-slate-100">{name}</b><br />PDF <span className="text-[#05ff5e]">Ready</span></span><span className="text-blue-400">⇩</span></div>)}</div><div className="mt-1 rounded border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-[7.5px] text-blue-300">ⓘ After submitting sign-off, the deployment will be locked and all documents finalized.</div></div>;
}

function FinalChecklistItems() {
  return (
    <div className="flex h-[calc(100%-22px)] flex-col">
      <div className="mb-2 grid grid-cols-[1fr_140px_120px_36px] gap-2 text-[8px]">
        <div className="rounded border border-cyan-300/12 bg-[#03111c] px-3 py-1.5 text-slate-500">⌕ Search checklist items...</div>
        <Button>All Categories ˅</Button>
        <Button>All Statuses ˅</Button>
        <button className="rounded bg-[#063b27] text-[#05ff5e]">☷</button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {finalChecklistGroups.map((group) => <ChecklistGroup group={group} key={group.title} />)}
      </div>
    </div>
  );
}

const finalChecklistGroups = [
  { title: "Documentation & Records", count: "6 / 6 Completed", rows: [["All required documents uploaded", "All mandatory documents are uploaded and legible.", "Completed", "May 12, 2025 9:45 AM"], ["Photo documentation complete", "All required photos captured and uploaded.", "Completed", "May 12, 2025 9:50 AM"], ["Test reports completed", "All test reports filled and uploaded.", "Completed", "May 12, 2025 9:50 AM"], ["Installation permit uploaded", "Installation permit is uploaded and valid.", "Completed", "May 12, 2025 9:10 AM"], ["Equipment labels & serial numbers recorded", "All equipment labels and serial numbers captured.", "Completed", "May 12, 2025 8:55 AM"], ["Notes and comments added", "All relevant notes and comments are added.", "Completed", "May 12, 2025 9:12 AM"]] },
  { title: "Equipment & Installation", count: "7 / 7 Completed", rows: [["All equipment installed as per design", "Installed equipment matches approved design.", "Completed", "May 12, 2025 9:05 AM"], ["All connections tightened and secured", "Electrical and mechanical connections verified.", "Completed", "May 12, 2025 9:20 AM"], ["Proper grounding & bonding verified", "Grounding and bonding connections verified.", "Completed", "May 12, 2025 9:15 AM"], ["Panel labeling completed", "All panels and circuits labeled correctly.", "Completed", "May 12, 2025 8:58 AM"], ["Enclosure doors closed & locked", "All enclosures closed and locked.", "Completed", "May 12, 2025 9:21 AM"], ["Work area clean and free of debris", "Installation area cleaned and organized.", "Completed", "May 12, 2025 10:05 AM"], ["No tools or materials left on site", "Site inspected; no tools or materials left behind.", "Completed", "May 12, 2025 10:08 AM"]] },
  { title: "Testing & Verification", count: "8 / 9 Complete", rows: [["System functional test passed", "System functional test completed successfully.", "Completed", "May 12, 2025 9:30 AM"], ["Voltage readings within acceptable range", "All voltage readings are within specifications.", "Completed", "May 12, 2025 9:32 AM"], ["Current readings within acceptable range", "All current readings are within specifications.", "Completed", "May 12, 2025 9:33 AM"], ["Insulation resistance test passed", "Insulation resistance test completed successfully.", "Completed", "May 12, 2025 9:34 AM"], ["Breaker operations verified", "All breakers tested and operating correctly.", "Completed", "May 12, 2025 9:35 AM"], ["Communications test passed", "System communications verified and stable.", "Warning", "May 12, 2025 9:40 AM"], ["Protective devices tested", "All protective devices tested and functional.", "Completed", "May 12, 2025 9:41 AM"], ["All alarms cleared", "No active alarms or warnings in the system.", "Completed", "May 12, 2025 9:42 AM"], ["Performance verified", "System performance verified under normal operation.", "N/A", "N/A"]] },
];

function ChecklistGroup({ group }: { group: { count: string; rows: string[][]; title: string } }) {
  return (
    <div className="mb-2 overflow-hidden rounded border border-white/5 bg-[#03111c]/40">
      <div className="flex items-center justify-between border-b border-white/5 px-2 py-1 text-[9px]"><span className="font-semibold text-slate-200">⌄ ▣ {group.title}</span><span className={group.count.includes("8 / 9") ? "text-yellow-300" : "text-[#05ff5e]"}>{group.count}</span></div>
      <table className="w-full text-left text-[7.6px]"><tbody>{group.rows.map(([item, desc, status, time]) => <tr className="border-t border-white/5" key={item}><td className={status === "Warning" ? "w-[28px] px-2 py-[3px] text-yellow-300" : "w-[28px] px-2 py-[3px] text-[#05ff5e]"}>{status === "Warning" ? "△" : "●"}</td><td className="w-[30%] px-1 py-[3px] text-slate-200">{item}</td><td className="px-1 py-[3px] text-slate-400">{desc}</td><td className={status === "Warning" ? "w-[86px] px-1 py-[3px] text-yellow-300" : status === "N/A" ? "w-[86px] px-1 py-[3px] text-slate-400" : "w-[86px] px-1 py-[3px] text-[#05ff5e]"}>{status}</td><td className="w-[112px] px-1 py-[3px] text-slate-400">{time}</td></tr>)}</tbody></table>
    </div>
  );
}

function FinalValidationSummary() {
  return (
    <div className="grid h-full grid-cols-[126px_1fr] items-center gap-4">
      <div className="grid size-[118px] place-items-center rounded-full p-[14px]" style={{ background: "conic-gradient(#22c55e 0 92%, #eab308 92% 96%, #ef4444 96% 96%, #3b82f6 96% 100%)" }}><div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center text-[24px] leading-none">23<br /><span className="text-[8px] text-slate-400">Total Items</span></div></div>
      <div className="space-y-2 text-[9px]">{[["22", "Completed", "#22c55e"], ["1", "Warning", "#eab308"], ["0", "Errors", "#ef4444"], ["0", "N/A", "#3b82f6"]].map(([value, label, color]) => <div className="flex items-center gap-2" key={label}><span className="size-3 rounded-full" style={{ backgroundColor: color }} /><b>{value}</b><span className="text-slate-400">{label}</span></div>)}<div className="pt-2 text-[9px] text-slate-300">Please address all warnings before finalizing △</div></div>
    </div>
  );
}

function ReviewerSignOff() {
  return <div className="space-y-2 text-[9px] text-slate-300"><div>Technician</div><div className="flex items-center justify-between rounded border border-cyan-300/12 bg-[#03111c] p-2"><span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-[#063b27] text-[#05ff5e]">JD</span><span><b>John Doe</b><br /><span className="text-slate-400">Field Technician</span></span></span><span>May 12, 2025<br />10:15 AM</span><span className="text-[#05ff5e]">●</span></div><div>Signature</div><div className="border-b border-slate-600 py-2 text-[28px] italic leading-none text-slate-100">John Doe</div><div>Comments (optional)</div><div className="h-[42px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-slate-500">Enter any additional comments...</div></div>;
}

function ChecklistActions() {
  return <div className="flex h-[calc(100%-22px)] flex-col text-[8.5px] text-slate-300"><div className="space-y-1.5">{[["⇩", "Download Checklist (PDF)", "Export checklist with status"], ["↗", "Share Checklist", "Share with team or stakeholders"], ["▣", "Request Manager Review", "Submit for review and approval"]].map(([icon, title, body]) => <div className="grid grid-cols-[24px_1fr] gap-2 border-b border-white/5 pb-1.5" key={title}><span className="grid size-5 place-items-center rounded border border-cyan-300/20 text-blue-400">{icon}</span><span><b>{title}</b><br /><span className="text-slate-500">{body}</span></span></div>)}</div><div className="mt-auto rounded border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-[8px] text-blue-300">ⓘ Once all items are completed, you can close the deployment.</div></div>;
}

function closureCards(data?: DeploymentCompletionData) {
  if (data?.closureCards?.length) {
    return data.closureCards.slice(0, 4).map((row, index) => ({
      color: (["blue", "yellow", "purple", "cyan"] as const)[index] ?? "blue",
      detail1: `Source|${row.value}`,
      detail2: "Source|ecbs_os / No Data where unsupported",
      icon: ["▤", "◇", "▣", "◴"][index] ?? "▤",
      title: row.label,
      value: row.value,
      sub: "ecbs_os",
    }));
  }
  return [
  { color: "blue", detail1: "Total Steps|8 / 8", detail2: "Checklist Items|78 / 78", icon: "▤", title: "Completion Summary", value: "100%", sub: "Completed" },
  { color: "yellow", detail1: "Tests Passed|46 / 46", detail2: "Zero Open Issues|✓ Yes", icon: "◇", title: "Tests & Verification", value: "100%", sub: "Passed" },
  { color: "purple", detail1: "Reports Generated|6", detail2: "Documents Uploaded|12", icon: "▣", title: "Documentation", value: "100%", sub: "Complete" },
  { color: "cyan", detail1: "Readiness Score|100%", detail2: "Overall Status|Commissioned", icon: "◴", title: "System Readiness", value: "100%", sub: "Excellent" },
  ];
}

function ClosureMetricCard({ card }: { card: ReturnType<typeof closureCards>[number] }) {
  const color = card.color === "blue" ? "text-blue-400 border-blue-400/40" : card.color === "yellow" ? "text-yellow-300 border-yellow-300/40" : card.color === "purple" ? "text-purple-400 border-purple-400/40" : "text-cyan-400 border-cyan-400/40";
  const [l1, v1] = card.detail1.split("|");
  const [l2, v2] = card.detail2.split("|");
  return <Panel title={card.title}><div className="flex h-[calc(100%-22px)] flex-col"><div className="flex items-start justify-between"><span className={`grid size-7 place-items-center rounded border ${color}`}>{card.icon}</span><div className="text-right"><div className="text-[22px] leading-none text-slate-100">{card.value}</div><div className="text-[9px] text-slate-300">{card.sub}</div></div></div><div className="mt-auto grid grid-cols-2 gap-3 border-t border-cyan-300/10 pt-1 text-[7.5px]"><span className="text-slate-400">{l1}<br /><b className="text-slate-100">{v1}</b></span><span className="text-slate-400">{l2}<br /><b className={v2.includes("✓") ? "text-[#05ff5e]" : "text-slate-100"}>{v2}</b></span></div></div></Panel>;
}

function ClosureChecklist() {
  const rows = ["All field work completed", "Customer acceptance obtained", "All tests and verifications passed", "All documents and photos uploaded", "All reports generated and attached", "System commissioned and approved", "Deployment closed in system", "Handover to operations confirmed"];
  return <table className="w-full text-left text-[7px]"><thead className="bg-white/5 text-slate-500"><tr><th className="px-2 py-0.5 font-medium">Item</th><th className="px-2 py-0.5 font-medium">Status</th></tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row}><td className="px-2 py-[1px] text-slate-300"><span className="mr-2 text-[#05ff5e]">●</span>{row}</td><td className="px-2 py-[1px] text-[#05ff5e]">Completed</td></tr>)}</tbody></table>;
}

function ClosureMetrics({ data }: { data?: DeploymentCompletionData }) {
  const rows = data?.closureCards?.length ? data.closureCards.map((row) => [row.label, row.value]) : [["Total Equipment Installed", "No Data"], ["Total Circuits Verified", "No Data"], ["Total Alarms Tested", "No Data"], ["Zero Open Issues", "No Data"], ["System Readiness Score", "No Data"], ["Power Factor Improvement", "No Data"], ["THD Improvement", "No Data"], ["kVA Reduction", "No Data"], ["Overall Status", data?.status ?? "No Data"]];
  return <div className="space-y-1 text-[7.8px]">{rows.map(([label, value]) => <div className="flex justify-between border-b border-white/5 pb-0.5" key={label}><span className="text-slate-400">{label}</span><b className={value.includes("✓") ? "text-[#05ff5e]" : "text-slate-200"}>{value}</b></div>)}</div>;
}

function ClosureDocs() {
  const docs = [["red", "Deployment Closure Certificate"], ["purple", "Customer Acceptance Form"], ["cyan", "Commissioning Summary Report"], ["purple", "Test & Verification Report"], ["yellow", "System Handover Report"]];
  return <div className="flex h-[calc(100%-22px)] flex-col"><p className="mb-1 text-[8px] text-slate-400">The following documents are finalized and archived.</p><div className="grid flex-1 grid-cols-5 gap-2">{docs.map(([color, name]) => <div className="grid grid-cols-[24px_1fr_14px] items-center gap-2 rounded border border-cyan-300/12 bg-[#03111c] p-1.5 text-[7.5px]" key={name}><span className={color === "red" ? "grid size-5 place-items-center rounded border border-red-400/50 text-red-400" : color === "yellow" ? "grid size-5 place-items-center rounded border border-yellow-300/50 text-yellow-300" : color === "cyan" ? "grid size-5 place-items-center rounded border border-cyan-400/50 text-cyan-400" : "grid size-5 place-items-center rounded border border-purple-400/50 text-purple-400"}>▤</span><span><b className="text-slate-100">{name}</b><br />PDF <span className="text-[#05ff5e]">Final</span></span><span className="text-blue-400">⇩</span></div>)}</div><div className="mt-1 rounded border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-[7.5px] text-blue-300">ⓘ All documents are archived and locked. No further edits allowed. This deployment record is now closed.</div></div>;
}

function HandoverConfirmation({ data }: { data?: DeploymentCompletionData }) {
  return <div className="grid h-[calc(100%-22px)] grid-cols-[1fr_86px] items-center gap-2 text-[7.5px] text-slate-300"><div><p className="mb-1 text-slate-400">This system is now officially handed over to the Operations team.</p><div className="grid grid-cols-2 gap-x-3 gap-y-0.5">{[["Operations Contact", "No Data"], ["Department", "No Data"], ["Email", "No Data"], ["Phone", "No Data"]].map(([l, v]) => <div key={l}><span className="text-slate-500">{l}</span><br /><b>{v}</b></div>)}</div></div><div className="text-center"><div className="mx-auto grid size-10 place-items-center rounded-full bg-[#063b27] text-[20px] text-[#05ff5e]">H</div><div className="text-[#05ff5e]">{data?.status ?? "No Data"}</div><div className="text-[6.5px] text-slate-400">{data?.updatedAt ?? "No Data"}</div></div></div>;
}

type DeploymentIconName = "bell" | "calendar" | "camera" | "check" | "checklist" | "dashboard" | "database" | "deployments" | "device" | "diagram" | "download" | "file" | "folder" | "help" | "home" | "installation" | "offline" | "plus" | "report" | "settings" | "shield" | "site" | "support" | "sync";

function DeploymentIcon({ className = "size-4", name }: { className?: string; name: DeploymentIconName }) {
  const common = { className, fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8, viewBox: "0 0 24 24" };
  if (name === "check") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="m8.2 12.2 2.5 2.6 5.2-5.8" /></svg>;
  if (name === "database") return <svg {...common}><ellipse cx="12" cy="5.5" rx="6.5" ry="2.8" /><path d="M5.5 5.5v9c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8v-9" /><path d="M5.5 10c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8" /></svg>;
  if (name === "file") return <svg {...common}><path d="M7 3.5h7l4 4V20H7z" /><path d="M14 3.5v4h4" /><path d="M9.5 12h5M9.5 15h5" /></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3.5 18 6v5.2c0 3.8-2.3 7.1-6 8.8-3.7-1.7-6-5-6-8.8V6z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (name === "dashboard") return <svg {...common}><rect height="6" rx="1" width="6" x="4" y="4" /><rect height="6" rx="1" width="6" x="14" y="4" /><rect height="6" rx="1" width="6" x="4" y="14" /><rect height="6" rx="1" width="6" x="14" y="14" /></svg>;
  if (name === "deployments") return <svg {...common}><rect height="7" rx="1.2" width="7" x="4" y="4" /><path d="M13.5 6h4.7M13.5 9.5h6" /><rect height="7" rx="1.2" width="7" x="4" y="13" /><path d="M13.5 15h4.7M13.5 18.5h6" /></svg>;
  if (name === "site") return <svg {...common}><path d="M4 20h16" /><path d="M6 20V7l6-3 6 3v13" /><path d="M9 10h1M14 10h1M9 14h1M14 14h1" /></svg>;
  if (name === "device") return <svg {...common}><rect height="13" rx="1.5" width="10" x="7" y="4" /><path d="M10 20h4M12 17v3M9.5 7h5" /></svg>;
  if (name === "installation") return <svg {...common}><path d="M14.5 4.5 19 9l-9.8 9.8-4.5.8.8-4.5z" /><path d="m13 6 5 5" /></svg>;
  if (name === "checklist") return <svg {...common}><path d="M8 5h10v15H6V5h2" /><path d="M9 4h6v3H9z" /><path d="m8.5 11 1.2 1.2 2-2.2M13.5 11h2.5M8.5 16l1.2 1.2 2-2.2M13.5 16h2.5" /></svg>;
  if (name === "camera") return <svg {...common}><path d="M4.5 8.5h3l1.4-2h6.2l1.4 2h3v9h-15z" /><circle cx="12" cy="13" r="3.2" /></svg>;
  if (name === "diagram") return <svg {...common}><rect height="4.5" rx="1" width="5.5" x="4" y="4" /><rect height="4.5" rx="1" width="5.5" x="14.5" y="4" /><rect height="4.5" rx="1" width="5.5" x="9.25" y="15.5" /><path d="M6.75 8.5v3.2h5.25m5.25-3.2v3.2H12v3.8" /></svg>;
  if (name === "report") return <svg {...common}><path d="M6 3.5h12v17H6z" /><path d="M9 8h6M9 11h6M9 14h3" /><path d="M15 16.5h1.5" /></svg>;
  if (name === "folder") return <svg {...common}><path d="M3.8 7.5h6l1.8 2h8.6v8.8H3.8z" /><path d="M3.8 7.5V5.7h5.1l1.6 1.8" /></svg>;
  if (name === "download") return <svg {...common}><path d="M12 4v10" /><path d="m8.5 10.5 3.5 3.5 3.5-3.5" /><path d="M5 18.5h14" /></svg>;
  if (name === "sync") return <svg {...common}><path d="M17.5 8.5A6.5 6.5 0 0 0 6.2 7.2L4.5 9" /><path d="M4.5 5.5V9H8" /><path d="M6.5 15.5a6.5 6.5 0 0 0 11.3 1.3l1.7-1.8" /><path d="M19.5 18.5V15H16" /></svg>;
  if (name === "offline") return <svg {...common}><path d="M12 4.5v5" /><path d="M7.2 7.2a7 7 0 1 0 9.6 0" /><path d="m4 4 16 16" /></svg>;
  if (name === "settings") return <svg {...common}><circle cx="12" cy="12" r="2.8" /><path d="M12 3.8v2M12 18.2v2M4.9 7.9l1.7 1M17.4 15.1l1.7 1M4.9 16.1l1.7-1M17.4 8.9l1.7-1" /><path d="M6.5 12h-2M19.5 12h-2" /></svg>;
  if (name === "calendar") return <svg {...common}><rect height="14" rx="1.5" width="15" x="4.5" y="6" /><path d="M8 4v4M16 4v4M4.5 10h15" /></svg>;
  if (name === "bell") return <svg {...common}><path d="M18 16H6l1.2-1.8V10a4.8 4.8 0 0 1 9.6 0v4.2z" /><path d="M10 18.5a2.2 2.2 0 0 0 4 0" /><circle cx="17.5" cy="6.5" r="2.2" fill="currentColor" stroke="none" /></svg>;
  if (name === "help") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M9.8 9.5a2.4 2.4 0 0 1 4.6 1c0 1.8-2.4 2.1-2.4 3.7" /><path d="M12 17.2h.01" /></svg>;
  if (name === "support") return <svg {...common}><path d="M5 13v-1a7 7 0 0 1 14 0v1" /><rect height="5" rx="1.5" width="3" x="3.8" y="12" /><rect height="5" rx="1.5" width="3" x="17.2" y="12" /><path d="M17.2 16.2c-.5 2-2 3-4.2 3h-1.2" /></svg>;
  if (name === "plus") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></svg>;
  return <svg {...common}><path d="M4 11.2 12 4l8 7.2" /><path d="M6.5 10.5V20h11v-9.5" /><path d="M10 20v-5h4v5" /></svg>;
}

function CompletionHero({ data }: { data?: DeploymentCompletionData }) {
  return <div className="grid h-[calc(100%-22px)] grid-cols-[94px_1fr] items-center gap-4"><div className="grid size-[74px] place-items-center rounded-full border-[7px] border-[#22c55e] text-4xl text-[#22c55e] shadow-[0_0_24px_rgba(34,197,94,.22)]">✓</div><div className="text-[8.5px] text-slate-300"><div className="text-[14px] font-semibold text-slate-100">Deployment Completed Successfully</div><p className="mt-0.5 text-slate-400">{data?.message ?? "No Data"}</p><div className="mt-2 grid grid-cols-5 gap-3 border-t border-cyan-300/10 pt-1.5"><Info label="Deployment ID" value={data?.deploymentId ?? "No Data"} /><Info label="Site" value={data?.siteName ?? "No Data"} /><Info label="Technician" value="No Data" /><Info label="Completion Time" value={data?.updatedAt ?? "No Data"} /><Info label="Duration" value="No Data" /></div><div className="mt-2 text-[#05ff5e]">● {data?.state ?? "No Data"} <span className="ml-5 text-slate-400">{data?.updatedAt ?? "No Data"}</span></div></div></div>;
}

function CompletionTopCard({ color, detail, icon, title, value }: { color: "amber" | "blue" | "green" | "purple"; detail: string; icon: DeploymentIconName; title: string; value: string }) {
  const colorClass = color === "green" ? "border-[#22c55e]/55 bg-[#22c55e]/10 text-[#22c55e]" : color === "blue" ? "border-blue-400/55 bg-blue-400/10 text-blue-400" : color === "purple" ? "border-purple-400/55 bg-purple-400/10 text-purple-400" : "border-amber-400/55 bg-amber-400/10 text-amber-400";
  return <Panel title={title}><div className="flex h-[calc(100%-22px)] flex-col"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded border ${colorClass}`}><DeploymentIcon className="size-5" name={icon} /></span><span><b className="block whitespace-pre-line text-[18px] leading-none text-slate-100">{value.replace(" ", "\n")}</b></span></div><div className="mt-auto text-[9px] text-slate-400">{detail}</div><a className="mt-1 text-[9px] text-blue-400">View Details ›</a></div></Panel>;
}

function CompletionOverview({ data }: { data?: DeploymentCompletionData }) {
  return <div className="grid h-[calc(100%-22px)] grid-cols-[150px_1fr] gap-4"><div className="grid place-items-center"><div className="grid size-[132px] place-items-center rounded-full p-[18px]" style={{ background: "conic-gradient(#22c55e 0 100%)" }}><div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center text-[22px]">No Data<br /><span className="text-[9px] text-slate-400">Steps</span></div></div></div><div className="space-y-1.5 text-[8.5px]">{steps.slice(0, 8).map((step, index) => <div className="grid grid-cols-[24px_1fr_70px_16px] items-center border-b border-white/5 pb-1" key={step}><span className="grid size-4 place-items-center rounded-full bg-slate-600 text-[7px]">{index + 1}</span><b>{step}</b><span className="text-slate-400">No Data</span><span className="text-slate-400">●</span></div>)}<a className="block pt-2 text-[9px] text-blue-400">{data?.status ?? "No Data"}</a></div></div>;
}

function EquipmentSummary({ data }: { data?: DeploymentCompletionData }) {
  const rows = data?.equipmentRows?.length ? data.equipmentRows : [{ label: "Equipment", value: "No Data" }];
  return <div className="grid h-[calc(100%-22px)] grid-cols-[145px_1fr] items-center gap-4"><div className="grid size-[128px] place-items-center rounded-full p-[24px]" style={{ background: "conic-gradient(#22c55e 0 100%)" }}><div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center text-[22px]">{rows[0]?.value ?? "No Data"}<br /><span className="text-[9px] text-slate-400">Total Items</span></div></div><div className="space-y-2 text-[9px]">{rows.map((row) => <div className="grid grid-cols-[1fr_36px_80px] gap-2" key={row.label}><span><i className="mr-2 inline-block size-2 rounded-sm bg-[#22c55e]" />{row.label}</span><b>{row.value}</b><span className="text-slate-400">ecbs_os</span></div>)}<a className="block pt-3 text-blue-400">View Equipment Inventory ›</a></div></div>;
}

function DocumentsPhotos({ data }: { data?: DeploymentCompletionData }) {
  const rows = data?.documentRows?.length ? data.documentRows : [{ label: "Documents", value: "No Data" }];
  return <div className="space-y-3 text-[9px]">{rows.map((row) => <div className="flex justify-between border-b border-white/5 pb-2" key={row.label}><span className="flex items-center gap-2 text-slate-300"><DeploymentIcon className="size-4 text-blue-400" name="file" />{row.label}</span><b>{row.value} <span className="ml-3 text-[#05ff5e]">●</span><br /><span className="font-normal text-slate-500">ecbs_os</span></b></div>)}<a className="text-blue-400">View All Files ›</a></div>;
}

function ActivityTimeline({ data }: { data?: DeploymentCompletionData }) {
  return <div className="space-y-2 text-[8.5px] text-slate-300">{[["Deployment status", data?.status ?? "No Data"], ["Last updated", data?.updatedAt ?? "No Data"], ["Audit trail", "No Data"], ["Completion event", "No Data"]].map(([title, time]) => <div className="flex gap-2" key={title}><span className="text-[#05ff5e]">●</span><span><b>{title}</b><br /><span className="text-slate-500">{time}</span></span></div>)}<a className="text-blue-400">View Full Audit Log ›</a></div>;
}

function RecentCapturedPhotos() {
  const labels = ["Panel Overview", "CT Installation", "Voltage Connections", "Existing Capacitors"];
  return <div className="grid h-[calc(100%-22px)] grid-cols-4 gap-2">{labels.map((label) => <div className="text-[8px]" key={label}><div className="grid h-[78px] place-items-center rounded border border-dashed border-cyan-300/20 bg-[#03111c] p-1 text-center text-slate-500">No Data</div><b>{label}</b><br /><span className="text-slate-500">No approved photo source</span></div>)}</div>;
}

function CompletionQuickActions() {
  const rows: [DeploymentIconName, string, string, string][] = [["report", "View Reports", "Open generated reports", "border-[#22c55e]/45 text-[#22c55e]"], ["download", "Download Package", "Download all deliverables", "border-blue-400/45 text-blue-400"], ["plus", "Create Another Deployment", "Start a new deployment", "border-purple-400/45 text-purple-400"], ["home", "Return to Dashboard", "Go to main dashboard", "border-amber-400/45 text-amber-400"]];
  return <div className="grid h-[calc(100%-22px)] grid-cols-4 gap-2">{rows.map(([icon, title, detail, color]) => <div className="grid grid-cols-[28px_1fr] items-center gap-2 rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[8px]" key={title}><span className={`grid size-6 place-items-center rounded border ${color}`}><DeploymentIcon className="size-4" name={icon} /></span><span><b>{title}</b><br /><span className="text-slate-500">{detail}</span></span></div>)}</div>;
}

function CompletionSuccessHero({ data }: { data?: DeploymentCompletionData }) {
  return <div className="grid h-full grid-cols-[126px_1fr] items-center gap-5"><div className="grid size-[92px] place-items-center rounded-full border-[8px] border-[#22c55e] text-[50px] text-[#22c55e] shadow-[0_0_32px_rgba(34,197,94,.22)]">✓</div><div className="text-[10px] text-slate-300"><div className="text-[22px] font-semibold text-slate-100">Deployment Completed Successfully!</div><p className="mt-2 text-slate-400">{data?.message ?? "No Data"}</p><div className="mt-5 grid grid-cols-5 gap-4 border-t border-cyan-300/10 pt-3"><Info label="Deployment ID" value={data?.deploymentId ?? "No Data"} /><Info label="Site" value={data?.siteName ?? "No Data"} /><Info label="Technician" value="No Data" /><Info label="Completion Time" value={data?.updatedAt ?? "No Data"} /><Info label="Duration" value="No Data" /></div><div className="mt-5 text-[#05ff5e]">● {data?.state ?? "No Data"} <span className="ml-6 text-slate-400">›</span><span className="ml-5 text-slate-400">{data?.updatedAt ?? "No Data"}</span></div></div></div>;
}

function CompletionDeliverables() {
  const rows = [["▤", "Deployment Summary Report", "PDF", "Ready", "text-red-400"], ["▣", "Test & Verification Report", "PDF", "Ready", "text-indigo-400"], ["▣", "Equipment Inventory Report", "PDF", "Ready", "text-purple-400"], ["▣", "Documentation Index", "PDF", "Ready", "text-fuchsia-400"], ["▣", "Photo Log Report", "PDF", "Ready", "text-yellow-400"], ["▣", "Raw Data Export", "XLSX", "Ready", "text-[#05ff5e]"]];
  return <div className="h-[calc(100%-22px)] text-[8.5px]"><p className="mb-2 text-slate-400">Your deployment deliverables are ready.</p><div className="space-y-1">{rows.map(([icon, name, type, status, color]) => <div className="grid grid-cols-[20px_1fr_38px_42px_58px] items-center gap-2 border-b border-white/5 py-1.5" key={name}><span className={color}>{icon}</span><b>{name}</b><span>{type}</span><span className="text-[#05ff5e]">{status}</span><span className="text-blue-400">⇩ Download</span></div>)}</div></div>;
}

function CompletionMetricCards({ data }: { data?: DeploymentCompletionData }) {
  const documents = data?.documentRows.find((row) => row.label === "Documents")?.value ?? "No Data";
  const equipment = data?.equipmentRows[0]?.value ?? "No Data";
  const metrics = [["▤", "Total Steps", "No Data", "No approved checklist model", "text-[#05ff5e]"], ["▣", "Forms & Check-lists", "No Data", "No approved checklist model", "text-blue-400"], ["⌘", "Equipment", equipment, "From ecbs_os where available", "text-yellow-400"], ["▰", "Readings", "No Data", "No approved readings model", "text-fuchsia-400"], ["▣", "Photos", "No Data", "No approved photo model", "text-cyan-400"], ["▢", "Documents", documents, "From ecbs_os where available", "text-sky-400"]];
  return <div className="h-[calc(100%-22px)]"><p className="mb-2 text-[8.5px] text-slate-400">Overview of everything completed in this deployment.</p><div className="grid h-[80px] grid-cols-6 gap-2">{metrics.map(([icon, label, value, detail, color]) => <div className="rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[8px]" key={label}><div className={color}>{icon} <span className="ml-1 text-slate-300">{label}</span></div><div className="mt-2 whitespace-nowrap text-[20px] leading-none text-slate-100">{value}</div><div className="mt-1 text-slate-400">{detail}</div></div>)}</div></div>;
}

function CompletionStepStatus() {
  return <div className="h-[calc(100%-22px)]"><p className="mb-3 text-[9px] text-slate-400">All required steps have been completed.</p><div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px]">{steps.slice(0, 8).map((step, index) => <div className="grid grid-cols-[22px_1fr_70px_18px] items-center rounded border border-cyan-300/8 bg-[#03111c]/50 px-2 py-2" key={step}><span className="grid size-5 place-items-center rounded-full bg-slate-500 text-[8px] font-semibold text-[#02100a]">{index + 1}</span><b>{step}</b><span className="text-[#05ff5e]">Completed</span><span className="text-[#05ff5e]">✓</span></div>)}</div></div>;
}

function CompletionNextActions({ deploymentId }: { deploymentId: string }) {
  const rows = [["▣", "View Deployment Dashboard", "Go to deployment overview", `/operations/deployments/${deploymentId}/completion/completion-post-completion-dashboard-screen`], ["+", "Create Another Deployment", "Start a new deployment", "/operations/deployments"], ["⌂", "Return to Dashboard", "Go to main dashboard", "/enterprise"]];
  return <div className="space-y-1.5 text-[8px]"><p className="text-slate-400">Choose your next action.</p>{rows.map(([icon, title, detail, href]) => <Link className="grid grid-cols-[26px_1fr_12px] items-center rounded border border-cyan-300/12 bg-[#03111c] p-1.5" href={href} key={title}><span className="grid size-5 place-items-center rounded border border-slate-500/50 text-slate-300">{icon}</span><span><b>{title}</b><br /><span className="text-slate-500">{detail}</span></span><span className="text-slate-500">›</span></Link>)}</div>;
}

function CompletionNotes() {
  return <div className="h-[calc(100%-22px)] text-[8.5px]"><p className="mb-2 text-slate-400">Add any final notes about this deployment.</p><div className="h-[150px] rounded border border-cyan-300/12 bg-[#03111c] p-2 text-slate-500">Enter notes (optional)...</div><button className="float-right -mt-8 mr-2 rounded bg-[#123047] px-3 py-1 text-[8px] text-slate-200">Save Note</button></div>;
}

function SummaryDots({ variant }: { variant: DeploymentWorkflowVariant }) {
  const values = variant === "acceptance" ? [["22", "Completed"], ["0", "Pending"], ["0", "Issues"]] : [["22", "Completed"], ["1", "Warnings"], ["0", "Errors"], ["0", "Not Applicable"]];
  return <div className="flex gap-5 text-center text-[9px]">{values.map(([value, label]) => <div key={label}><div className="whitespace-nowrap text-[16px] leading-none text-[#05ff5e]">{value}</div><div className="text-slate-400">{label}</div></div>)}</div>;
}

function ActionFooter({ deploymentId, variant }: { deploymentId: string; variant: DeploymentWorkflowVariant }) {
  const docVariant = variant === "documentation" || variant === "exportPackage" || variant === "folderDetail" || variant === "permissions" || variant === "reviewQueue" || variant === "searchResults" || variant === "uploadWizard" || variant === "versionHistory" || variant === "photoDocs";
  const back = variant === "signoff" ? "← Back to Commissioning Summary" : variant === "completion" ? "← Back to Documentation" : variant === "permissions" ? "⇩ Export Access Report" : variant === "versionHistory" ? "← Back to Document Viewer" : variant === "documentation" ? "← Back" : variant === "equipmentAdd" ? "Cancel" : variant === "equipmentInventory" ? "← Back" : variant === "installationDetails" ? "← Back" : variant === "postReadings" ? "← Back" : variant === "preReadings" ? "← Back" : variant === "siteDetails" ? "← Back" : variant === "testingViewDetails" ? "← Back" : variant === "testingViewTrend" ? "← Back" : variant === "testingVerification" ? "← Back" : variant === "testingAddIssue" ? "← Back" : docVariant ? "← Back to Documentation" : "← Back to Completion";
  const next = variant === "closure" ? "Confirm & Close Deployment" : variant === "signoff" ? "Submit Final Sign-off" : variant === "completion" ? "Finish & Close" : variant === "completionDashboard" ? "Finish & Close" : variant === "acceptance" ? "Submit Acceptance ✓" : variant === "commissioning" ? "Proceed to Customer Acceptance →" : variant === "exportPackage" ? "Next: Package Details" : variant === "folderDetail" ? "Next: Complete" : variant === "permissions" ? "Save Changes" : variant === "uploadWizard" ? "Upload" : variant === "versionHistory" ? "Close" : variant === "documentation" ? "Next: Complete →" : variant === "equipmentAdd" ? "Save & Add to Inventory" : variant === "equipmentInventory" ? "Next: Pre-Installation Readings →" : variant === "installationDetails" ? "Next: Post-Installation Readings →" : variant === "photoDocs" ? "Next: Testing & Verification →" : variant === "testingViewDetails" ? "Next: Documentation →" : variant === "testingViewTrend" ? "Next: Documentation →" : variant === "testingVerification" ? "Next: Documentation →" : variant === "testingAddIssue" ? "Next: Documentation →" : variant === "preReadings" ? "Next: Installation Details →" : variant === "postReadings" ? "Next: Testing & Verification →" : variant === "siteDetails" ? "Next: Equipment Inventory →" : variant === "reviewQueue" || variant === "searchResults" ? "Next: Complete" : "All Items Complete  Close Deployment";
  if (variant === "photoDocs") return <footer className="mt-auto flex h-[54px] items-center justify-between border-t border-cyan-300/10"><span /><div className="flex gap-4"><button className="w-[118px] rounded border border-slate-700 bg-[#061421] py-2 text-[9px] text-slate-300">Save Draft</button><button className="w-[90px] rounded border border-slate-700 bg-[#061421] py-2 text-[9px] text-slate-300">← Back</button><button className="w-[226px] rounded bg-[#087a35] py-2 text-[10px] font-semibold">{next}</button></div></footer>;
  const base = `/operations/deployments/${deploymentId}/completion`;
  const deploymentBase = `/operations/deployments/${deploymentId}`;
  const testingVariant = variant === "testingAddIssue" || variant === "testingVerification" || variant === "testingViewDetails" || variant === "testingViewTrend";
  const backHref = testingVariant
    ? (variant === "testingVerification" ? `${deploymentBase}/post-installation-readings` : `${deploymentBase}/testing-verification`)
    : variant === "signoff" ? `${base}/completion-post-completion-dashboard-final-validation-checklist-screen` : variant === "closure" ? `${base}/completion-post-completion-dashboard-final-validation-checklist-screen-sign-off-capture-screen` : variant === "acceptance" ? `${base}/completion-post-completion-dashboard-final-validation-checklist-screen-sign-off-capture-screen` : variant === "completionDashboard" ? `${base}/completion-screen` : `${base}/completion-screen`;
  const nextHref = testingVariant
    ? `${deploymentBase}/documents/documentation-screen`
    : variant === "completion" ? `${base}/completion-post-completion-dashboard-screen` : variant === "completionDashboard" ? `${base}/completion-post-completion-dashboard-final-validation-checklist-screen` : variant === "checklist" ? `${base}/completion-post-completion-dashboard-final-validation-checklist-screen-sign-off-capture-screen` : variant === "signoff" ? `${base}/completion-post-completion-dashboard-final-validation-checklist-screen-sign-off-capture-deployment-closure-confirmation-screen` : variant === "closure" ? `${base}/completion-post-completion-dashboard-final-validation-checklist-final-validation-checklist-customer-acceptance-screen` : variant === "acceptance" ? `${base}/completion-post-completion-dashboard-screen` : `${base}/completion-screen`;
  return <footer className="mt-auto flex h-[54px] items-center justify-between border-t border-cyan-300/10"><Link className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-[9px] text-slate-300" href={backHref}>{back}</Link><div className="flex gap-2">{variant === "signoff" ? <Button>Cancel</Button> : null}{variant === "versionHistory" ? <Button>Restore Version</Button> : <Button>Save Draft</Button>}<Link className="rounded bg-[#087a35] px-8 py-2 text-[10px] font-semibold" href={nextHref}>{next}{variant === "signoff" ? <><br /><span className="text-[8px] font-normal">Lock deployment & generate certificates</span></> : null}</Link></div></footer>;
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return <section className="h-full overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><h2 className="mb-2 text-[11px] font-semibold uppercase text-slate-200">{title}</h2>{children}</section>;
}

function BarePanel({ children }: { children: ReactNode }) {
  return <section className="h-full overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-5">{children}</section>;
}

function Button({ children }: { children: ReactNode }) {
  return <button className="rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-[9px] text-slate-300">{children}</button>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-slate-500">{label}</div><div className="mt-1 text-slate-200">{value}</div></div>;
}

function StatusHero({ value }: { value: string }) {
  return <div className="flex h-full items-center gap-5"><div className="grid size-[72px] place-items-center rounded-full border-[7px] border-[#22c55e] text-4xl text-[#22c55e]">✓</div><div><div className="text-[16px] font-semibold uppercase text-[#05ff5e]">{value}</div><div className="mt-1 max-w-[190px] text-[9px] leading-relaxed text-slate-400">All systems are operational and ready for handover.</div></div></div>;
}

function Ring({ subtitle = "", value }: { subtitle?: string; value: string }) {
  return <div className="grid h-full place-items-center"><div className="grid size-20 place-items-center rounded-full p-4" style={{ background: "conic-gradient(#22c55e 0 92%, #eab308 92% 100%)" }}><div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center text-lg">{value}<br /><span className="text-[8px] text-slate-400">{subtitle || "Excellent"}</span></div></div></div>;
}

function ReadinessScore() {
  return <div className="flex h-full items-center gap-4"><div className="grid size-[72px] place-items-center rounded-full p-[7px]" style={{ background: "conic-gradient(#22c55e 0 100%, #0f172a 100%)" }}><div className="grid h-full w-full place-items-center rounded-full bg-[#061521] text-center text-[16px]">100%</div></div><div><div className="text-[13px] font-semibold text-[#05ff5e]">Excellent</div><p className="mt-1 max-w-[170px] text-[9px] leading-relaxed text-slate-400">All required checks passed successfully.</p></div></div>;
}

function ChecklistSmall({ items, status }: { items: string[]; status?: string }) {
  return <ul className="space-y-2 text-[9px] text-slate-300">{items.map((item) => <li className="flex items-center gap-2" key={item}><span className="grid size-4 place-items-center rounded border border-[#05ff5e]/40 text-[8px] text-[#05ff5e]">✓</span><span className="min-w-0 flex-1">{item}</span>{status ? <span className="text-[#05ff5e]">{status} ✓</span> : null}</li>)}</ul>;
}

function MetricList({ rows }: { rows: [string, string][] }) {
  return <div className="space-y-1.5 text-[8.5px]">{rows.map(([label, value]) => <div className="flex justify-between border-b border-white/5 pb-1" key={label}><span className="text-slate-400">{label}</span><b className="text-slate-200">{value}</b></div>)}</div>;
}

function CommissioningMetrics() {
  return (
    <div className="space-y-1 text-[8.5px]">
      {[["Total Equipment Installed", "56"], ["Total Circuits Verified", "48"], ["Total Alarms Tested", "12"], ["Zero Open Issues", "✓ Yes"]].map(([label, value]) => (
        <div className="flex justify-between border-b border-white/5 pb-0.5" key={label}>
          <span className="font-semibold text-slate-300">{label}</span>
          <span className={value.includes("✓") ? "font-semibold text-[#05ff5e]" : "font-semibold text-slate-100"}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function DarkTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[8px]"><thead className="text-slate-500"><tr>{headers.map((h) => <th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr className="border-t border-white/5" key={i}>{r.map((c, j) => <td className={c === "Complete" || c === "Passed" || c === "Commissioned" ? "py-1.5 text-[#05ff5e]" : c === "Pending" || c === "Warning" ? "py-1.5 text-yellow-300" : c.startsWith("▣") ? "py-1.5 text-blue-400" : "py-1.5 text-slate-300"} key={j}>{c}</td>)}</tr>)}</tbody></table>;
}

function DocCards() {
  const docs = [["Commissioning Report", "PDF", "blue"], ["Test Results Summary", "PDF", "purple"], ["Protection Settings Report", "PDF", "cyan"], ["As-Built Drawings", "PDF", "purple"]];
  return <div className="grid grid-cols-4 gap-2">{docs.map(([item, type, color]) => <div className="grid grid-cols-[26px_1fr_12px] items-start gap-2 rounded border border-cyan-300/12 bg-[#03111c] p-2 text-[8px]" key={item}><span className={color === "blue" ? "grid size-5 place-items-center rounded border border-blue-400/40 text-blue-400" : color === "cyan" ? "grid size-5 place-items-center rounded border border-cyan-400/40 text-cyan-400" : "grid size-5 place-items-center rounded border border-purple-400/40 text-purple-400"}>▣</span><span><b className="text-slate-100">{item}</b><br /><span className="text-slate-500">{type}</span><br /><span className="text-[#05ff5e]">Ready</span> <span className="ml-4 text-blue-400">⇩ Download</span></span><span className="text-slate-500">›</span></div>)}</div>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><div className="mb-1 text-[8px] text-slate-400">{label}</div><div className="rounded border border-cyan-300/12 bg-[#03111c] px-2 py-1.5 text-[9px] text-slate-200">{value}</div></div>;
}

function UploadStepper() {
  const uploadSteps = [["1", "Select File", "Upload your file"], ["2", "Classify Document", "Choose type and folder"], ["3", "Add Details", "Add metadata and tags"], ["4", "Review & Confirm", "Verify and upload"], ["5", "Upload Complete", "Confirmation"]];
  return <div className="relative mx-auto grid h-[110px] w-[84%] grid-cols-5 items-center text-center text-[9px] before:absolute before:left-[8%] before:right-[8%] before:top-[34px] before:h-px before:bg-slate-500/70">{uploadSteps.map(([number, title, subtitle], index) => <div className="relative z-10" key={title}><div className={index === 0 ? "mx-auto grid size-8 place-items-center rounded-full bg-[#05ff5e] text-[13px] font-semibold text-[#02100a]" : "mx-auto grid size-8 place-items-center rounded-full border border-slate-500 bg-[#061421] text-[13px] text-slate-300"}>{number}</div><div className="mt-3 font-semibold text-slate-100">{title}</div><div className="mt-1 text-slate-400">{subtitle}</div></div>)}</div>;
}

function MiniDrawing({ removed = false }: { removed?: boolean }) {
  return <div className="rounded bg-white p-3 text-slate-900"><div className="mb-1 text-center text-[6px] font-bold">MAIN ELECTRICAL SINGLE LINE DIAGRAM</div><svg className="h-[88px] w-full" viewBox="0 0 260 120"><g fill="none" stroke="#111" strokeWidth="1.4"><path d="M130 8v25M35 45h190M60 45v45M105 45v45M150 45v45M195 45v45" /><rect x="48" y="82" width="24" height="16" /><rect x="93" y="82" width="24" height="16" /><rect x="138" y="82" width="24" height="16" /><rect x="183" y="82" width="24" height="16" /></g><rect x={removed ? "183" : "48"} y="82" width="24" height="16" fill={removed ? "rgba(239,68,68,.22)" : "rgba(34,197,94,.22)"} stroke={removed ? "#ef4444" : "#22c55e"} /></svg></div>;
}

function PhotoThumb({ index, label }: { index: number; label: string }) {
  const gradients = ["from-slate-500 to-slate-900", "from-stone-500 to-slate-900", "from-zinc-400 to-slate-800", "from-orange-700 to-slate-900"];
  return <div><div className={`h-[64px] rounded bg-gradient-to-br ${gradients[index % gradients.length]} p-1 text-right text-[#05ff5e]`}>✓</div><div className="mt-1 text-[8px] font-semibold">{label}</div><div className="text-[7px] text-slate-400">May 12, 2025 {8 + index % 3}:{25 + index} AM</div></div>;
}

function DropBox({ label }: { label: string }) {
  return <div className="grid h-[112px] place-items-center rounded border border-dashed border-cyan-300/20 bg-[#03111c] text-center text-[9px] text-slate-400"><div><div className="text-2xl">▣</div>{label}<br /><span className="text-[8px]">JPG, PNG up to 10MB</span></div></div>;
}

function readingRows(isPost: boolean) {
  const time = isPost ? "May 12, 10:05 AM" : "May 12, 8:52 AM";
  const changes = ["-0.6%", "-0.2%", "-6.7%", "-27.2%", "-24.1%", "-8.5%", "0.0%", "0.0%", "-12.5%", "-27.3%"];
  return [
    ["Voltage (L-N)", "277.1", "276.8", "277.3", "277.1", "V"],
    ["Voltage (L-L)", "480.2", "480.5", "479.8", "480.2", "V"],
    ["Current", "412", "398", "405", "405", "A"],
    ["kW", "284.6", "275.1", "279.3", "279.7", "kW"],
    ["kVA", "356.2", "345.8", "351.0", "351.0", "kVA"],
    ["kVAR", "214.8", "209.0", "212.3", "212.0", "kVAR"],
    ["Power Factor", "0.80", "0.80", "0.80", "0.80", "Lagging"],
    ["Frequency", "60.01", "60.01", "60.00", "60.01", "Hz"],
    ["THD Voltage", "3.2", "3.4", "3.1", "3.2", "%"],
    ["THD Current", "8.7", "8.1", "8.3", "8.4", "%"],
  ].map((row, index) => [...row, "Captured", isPost ? changes[index] : time, "▣"]);
}

function FolderTree({ compact = false }: { compact?: boolean }) {
  const rows = [["All Documents", "97"], ["Engineering", "24"], ["  Electrical", "7"], ["  Mechanical", "5"], ["  Civil", "3"], ["  Control Systems", "3"], ["Diagrams", "6"], ["Permits & Approvals", "12"], ["Photos", "18"], ["Test Reports", "11"], ["Safety", "8"], ["Installation Records", "7"], ["Commissioning", "4"], ["Other", "3"]];
  return <div className={compact ? "space-y-2 text-[9px]" : "space-y-1.5 text-[9px]"}>{rows.map(([name, count]) => <div className={name.startsWith("  ") ? "flex justify-between pl-4 text-slate-400" : name === "Engineering" ? "flex justify-between rounded bg-[#063b27] px-2 py-1 text-[#05ff5e]" : "flex justify-between text-slate-300"} key={name}><span>▾ {name.trim()}</span><span>{count}</span></div>)}</div>;
}

function documentRows() {
  return [
    ["Installation Permit.pdf", "PDF", "Permits & Approvals", "May 12, 2025 9:22 AM", "712 KB", "Pending Review"],
    ["Single Line Diagram.pdf", "PDF", "Engineering / Electrical", "May 12, 2025 9:15 AM", "1.2 MB", "Uploaded"],
    ["Panel Schedule.pdf", "PDF", "Engineering / Electrical", "May 12, 2025 9:16 AM", "856 KB", "Uploaded"],
    ["Site Safety Plan.pdf", "PDF", "Safety", "May 12, 2025 9:20 AM", "1.4 MB", "Uploaded"],
    ["CT Installation.jpg", "JPG", "Engineering / Electrical", "May 12, 2025 9:24 AM", "1.8 MB", "Uploaded"],
    ["Voltage Connections.jpg", "JPG", "Engineering / Electrical", "May 12, 2025 9:24 AM", "2.1 MB", "Uploaded"],
    ["Pre-Install Readings Report.pdf", "PDF", "Test Reports", "May 12, 2025 9:30 AM", "1.6 MB", "Uploaded"],
    ["Post-Install Readings Report.pdf", "PDF", "Test Reports", "May 12, 2025 9:31 AM", "1.7 MB", "Uploaded"],
    ["Testing & Verification Summary.pdf", "PDF", "Test Reports", "May 12, 2025 9:50 AM", "952 KB", "Pending Review"],
    ["Load Calculation.xlsx", "XLSX", "Engineering / Electrical", "May 12, 2025 9:24 AM", "512 KB", "Uploaded"],
    ["Equipment Specification.pdf", "PDF", "Engineering / Mechanical", "May 12, 2025 9:33 AM", "2.4 MB", "Uploaded"],
    ["Commissioning Checklist.xlsx", "XLSX", "Commissioning", "May 12, 2025 10:05 AM", "320 KB", "Uploaded"],
  ];
}

function AccessRows() {
  const folders = [["Engineering", 12, 4, 2, 1], ["Diagrams", 14, 3, 1, 0], ["Permits & Approvals", 10, 6, 2, 0], ["Photos", 18, 3, 0, 0], ["Test Reports", 8, 5, 3, 2], ["Safety", 6, 4, 2, 1], ["Installation Records", 9, 4, 1, 0], ["Commissioning", 7, 3, 2, 0], ["Other", 15, 2, 0, 0]];
  return <div className="space-y-3 text-[9px]">{folders.map(([name, full, view, upload, none]) => <div className="grid grid-cols-[120px_1fr_120px_90px] items-center gap-3" key={name}><span>{name}</span><span className="flex h-3 overflow-hidden rounded bg-slate-800"><span className="bg-[#22c55e]" style={{ flex: Number(full) }} /><span className="bg-[#147dff]" style={{ flex: Number(view) }} /><span className="bg-[#eab308]" style={{ flex: Number(upload) }} /><span className="bg-[#ef4444]" style={{ flex: Number(none) }} /></span><span>{Number(full) + Number(view)} Roles, {Number(full) + Number(view) + Number(upload)} Users</span><span>May 12, 2025</span></div>)}</div>;
}

function SignatureBlock({ name, role }: { name: string; role: string }) {
  return <div className="space-y-2 text-[9px]"><div className="grid grid-cols-2 gap-3"><Field label="Name" value={name} /><Field label="Title / Position" value={role} /></div><div className="rounded border border-cyan-300/12 bg-[#03111c] p-5 text-3xl italic">{name}</div><div className="text-[#05ff5e]">Signature captured successfully.</div></div>;
}
