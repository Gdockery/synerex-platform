import type { ReactNode } from "react";

const enterpriseNav = [
  { href: "/enterprise/dashboard", label: "Enterprise Dashboard", section: "Home" },
  { href: "/enterprise/energy-dashboard", label: "Energy Dashboard", section: "Home" },
  { href: "/enterprise/capacity-intelligence", label: "Capacity Intelligence", section: "Intelligence" },
  { href: "/enterprise/digital-twin", label: "Digital Twin", section: "Intelligence" },
  { href: "/enterprise/sites", label: "Sites", section: "Intelligence" },
  { href: "/enterprise/transformers", label: "Transformers", section: "Intelligence" },
  { href: "/enterprise/electrical-network", label: "Electrical Network", section: "Intelligence" },
  { href: "/enterprise/current-analysis", label: "Current Analysis", section: "Intelligence" },
  { href: "/enterprise/savings-forecast", label: "Savings & Forecast", section: "Intelligence" },
  { href: "/enterprise/alerts-events", label: "Alarms & Events", section: "Operations", badge: "16" },
  { href: "/enterprise/reports", label: "Reports", section: "Operations" },
  { href: "/devices/gateways", label: "Gateways", section: "Devices" },
  { href: "/devices/meters", label: "Meters", section: "Devices" },
  { href: "/devices/switches", label: "Switches", section: "Devices" },
  { href: "/devices/repeaters", label: "Repeaters", section: "Devices" },
  { href: "/administration/settings", label: "Settings", section: "System" },
];

const adminNav = [
  ...enterpriseNav.slice(0, 11),
  ...enterpriseNav.slice(11, 15),
  { href: "/client-management/users", label: "Users & Roles", section: "Administration" },
  { href: "/administration/account-settings", label: "Account Settings", section: "Administration" },
  { href: "/administration/integrations", label: "Integrations", section: "Administration" },
  { href: "/administration/billing", label: "Billing", section: "Administration" },
  { href: "/administration/settings", label: "Settings", section: "Administration" },
];

type ShellProps = {
  activeHref: string;
  children: ReactNode;
  nav?: typeof enterpriseNav;
  subtitle?: string;
  title?: string;
  user?: string;
};

export function SettingsOverviewScreen() {
  return (
    <ScreenshotShell activeHref="/administration/settings" nav={adminNav} subtitle="Manage your account, system configuration, and preferences." title="Settings">
      <Breadcrumb items={["Settings", "Overview"]} />
      <Tabs items={["Overview", "Users & Permissions", "Notifications", "System Configuration", "Data & Integrations", "Security", "Billing & Subscription", "Audit Logs", "Advanced"]} />
      <div className="grid h-[494px] grid-cols-3 gap-2 pt-2">
        <SettingsCard color="#05b85a" icon="▦" title="Account Settings" subtitle="Manage your organization information and account preferences." rows={[["Organization Profile", "XECO Energy"], ["Regional Settings", "›"], ["Time Zone", "(UTC-08:00) Pacific Time (US & Canada) ›"]]} action="Manage Account →" />
        <SettingsCard color="#6d40d8" icon="☷" title="Users & Permissions" subtitle="Invite users and manage roles, permissions, and access." rows={[["Total Users", "18"], ["Administrators", "5"], ["Viewer Users", "13"]]} action="Manage Users →" />
        <SettingsCard color="#b46211" icon="♢" title="Notifications" subtitle="Configure how and when you receive alerts and updates." rows={[["Email Notifications", "On"], ["SMS Notifications", "Off"], ["Alert Preferences", "›"]]} action="Configure Notifications →" />
        <SettingsCard color="#2268d9" icon="⚙" title="System Configuration" subtitle="Customize system behavior, thresholds, and default settings." rows={[["Health Score Settings", "›"], ["Alert Thresholds", "›"], ["Units & Measurements", "Metric (kVA, kW, kWh) ›"]]} action="Configure System →" />
        <SettingsCard color="#19b1a1" icon="◫" title="Data & Integrations" subtitle="Manage data sources, integrations, and data retention policies." rows={[["Data Sources", "12 Connected"], ["Integrations", "8 Active"], ["Data Retention", "13 Months"]]} action="Manage Integrations →" />
        <SettingsCard color="#276bd8" icon="▣" title="Security" subtitle="Configure security settings and manage authentication." rows={[["Password Policy", "›"], ["Multi-Factor Authentication", "On ›"], ["Session Timeout", "30 minutes ›"]]} action="Manage Security →" />
        <SettingsCard color="#c18410" icon="▤" title="Billing & Subscription" subtitle="View your subscription details and billing information." rows={[["Current Plan", "Enterprise"], ["Next Billing Date", "Jun 12, 2025"], ["Payment Method", "•••• •••• •••• 4242 ›"]]} action="Manage Billing →" />
        <SettingsCard color="#1aa59a" icon="☁" title="Audit Logs" subtitle="View system activity and change history." rows={[["Recent Logins", "›"], ["Configuration Changes", "›"], ["Data Export Logs", "›"]]} action="View Audit Logs →" />
        <SettingsCard color="#64748b" icon="☷" title="Advanced" subtitle="Advanced tools and system maintenance options." rows={[["API Access", "Manage API Keys ›"], ["System Diagnostics", "Run Diagnostics ›"], ["Support Access", "Enable ›"]]} action="Advanced Tools →" />
      </div>
    </ScreenshotShell>
  );
}

export function SettingsSubpagesScreen() {
  return (
    <ScreenshotShell activeHref="/administration/settings" nav={adminNav} subtitle="Configure your account, users, system preferences, integrations, and more." title="Settings" user="John Smith">
      <Breadcrumb items={["Home", "Settings"]} />
      <div className="grid h-[580px] grid-cols-3 gap-2 pt-2">
        <SubpagePanel number="1" title="Account Settings"><AccountSettingsMock /></SubpagePanel>
        <SubpagePanel number="2" title="Users & Permissions"><UsersMock /></SubpagePanel>
        <SubpagePanel number="3" title="Notifications"><NotificationPrefsMock /></SubpagePanel>
        <SubpagePanel number="4" title="System Configuration"><SystemConfigMock /></SubpagePanel>
        <SubpagePanel number="5" title="Data & Integrations"><IntegrationsMock /></SubpagePanel>
        <SubpagePanel number="6" title="Security"><SecurityMock /></SubpagePanel>
        <SubpagePanel number="7" title="Billing & Subscription"><BillingMock /></SubpagePanel>
        <SubpagePanel number="8" title="Audit Logs"><AuditMock /></SubpagePanel>
        <SubpagePanel number="9" title="Advanced Tools"><AdvancedMock /></SubpagePanel>
      </div>
    </ScreenshotShell>
  );
}

export function AlarmDetailScreen() {
  return (
    <ScreenshotShell activeHref="/enterprise/alerts-events" nav={adminNav} title="High Demand Alert" subtitle="Alarm ID: ALM-20250518-10212  |  Triggered: May 18, 2025 10:12 AM CDT  |  Active" user="John Smith">
      <div className="flex h-[54px] items-center justify-between">
        <Breadcrumb items={["Home", "Alarms & Events", "Alarm Details"]} />
        <div className="flex gap-2 text-[9px]"><Button>← Back to Alarms</Button><Button>◎ Acknowledge</Button><Button>◷ Snooze</Button><Button primary>✈ Escalate</Button></div>
      </div>
      <div className="grid h-[76px] grid-cols-[1.1fr_1.1fr_0.9fr_0.85fr_0.85fr_0.95fr] gap-1.5">
        <SummaryTile title="Alarm Summary" value="High Demand Alert" detail="Demand exceeded threshold of 1,200 kW for more than 15 minutes." color="#ef4444" />
        <SummaryTile title="Affected Assets (2)" value="Main Transformer (TXFR-01)" detail="Transformer T-2 (TXFR-02)" color="#05ff5e" />
        <SummaryTile title="Location" value="Flex Tijuana Manufacturing" detail="Main Electrical Room" />
        <SummaryTile title="Alarm Status" value="Active" detail="Duration: 18 min 32 sec" color="#05ff5e" />
        <SummaryTile title="Priority" value="High" detail="Escalation in: 11 min 28 sec" color="#f97316" />
        <SummaryTile title="Ack Status" value="Not Acknowledged" detail="Acknowledged by: —" color="#ef4444" />
      </div>
      <Tabs items={["Overview", "Asset Details", "Metrics & Trends", "Notifications", "History", "Notes", "Actions Taken"]} />
      <div className="grid h-[248px] grid-cols-[0.95fr_1.7fr_0.95fr] gap-2 pt-2">
        <Panel title="Alarm Timeline"><Timeline /></Panel>
        <Panel title="Demand (kW)"><DemandChart /></Panel>
        <div className="space-y-2"><Panel title="Alarm Impact"><AlarmImpact /></Panel><Panel title="Recommended Actions"><RecommendedActions /></Panel><Panel title="Related Alarms (Last 7 Days)"><RelatedAlarms /></Panel></div>
      </div>
      <Panel className="mt-2 h-[126px]" title="Trigger Conditions"><TriggerConditions /></Panel>
    </ScreenshotShell>
  );
}

export function AlarmEventsRuleScreen() {
  return (
    <ScreenshotShell activeHref="/enterprise/alerts-events" nav={enterpriseNav} subtitle="Real-time monitoring of system alerts, alarms and important events." title="Alarms & Events">
      <div className="flex h-[44px] justify-between">
        <div className="text-[10px] text-[#05ff5e]">Alarms & Events</div>
        <div className="flex gap-3 text-[8px]"><Select label="Asset Scope" value="Entire Site" /><Select label="Severity" value="All" /><Select label="Status" value="Active" /><Button>⇩ Export Report</Button></div>
      </div>
      <div className="grid h-[78px] grid-cols-6 gap-1.5">
        {[
          ["Critical Alarms", "2", "Active", "#ef4444"],
          ["Warning Alarms", "8", "Active", "#f59e0b"],
          ["Info Events", "24", "Today", "#147dff"],
          ["Alarm Rate", "1.2", "Per Day (7 Day Avg)", "#05ff5e"],
          ["MTTR", "18 min", "(7 Day Avg)", "#7c3aed"],
          ["System Health", "97%", "Excellent", "#00bcd4"],
        ].map(([label, value, detail, color]) => <Metric key={label} color={color} detail={detail} label={label} value={value} />)}
      </div>
      <div className="grid h-[442px] grid-cols-[1.85fr_0.85fr] gap-2 pt-2">
        <div>
          <Tabs items={["Active Alarms", "Alarm History", "Event Log"]} />
          <Panel className="h-[218px]" title="Active Alarms (10)"><AlarmsTable /></Panel>
          <Panel className="mt-2 h-[184px]" title="Custom Alert Rules (6)"><RulesTable /></Panel>
        </div>
        <div className="space-y-2"><Panel title="Create / Edit Alert Rule"><AlertRuleForm /></Panel><Panel title="About Alert Rules"><p className="text-[8px] leading-relaxed text-slate-400">Alert rules monitor specific parameters in real time and notify you when conditions are met. Rules are evaluated continuously using 1-minute data.</p><a className="mt-2 block text-[8px] text-[#05ff5e]" href="/enterprise/alarms-events/alarm-events">Learn more about alert rules →</a></Panel></div>
      </div>
    </ScreenshotShell>
  );
}

export function SetNotificationsScreen() {
  return (
    <ScreenshotShell activeHref="/enterprise/alerts-events" nav={enterpriseNav} subtitle="Define how and when notifications are sent for this alert rule." title="Set Notifications">
      <div className="flex h-[54px] items-center justify-between"><Breadcrumb items={["Alarms & Events", "Alert Rules", "Peak kW Demand Alert", "Set Notifications"]} /><Stepper /></div>
      <div className="grid h-[520px] grid-cols-[1fr_214px] gap-2">
        <div className="space-y-2">
          <Panel title="1. Notification Channels"><ChannelCards /></Panel>
          <Panel title="2. Recipients"><Recipients /></Panel>
          <Panel title="3. Escalation Settings"><EscalationSettings /></Panel>
        </div>
        <div className="space-y-2"><Panel title="Alert Rule Summary"><RuleSummary /></Panel><Panel title="Notification Preview"><NotificationPreview /></Panel><Panel title="About Notifications"><p className="text-[8px] leading-relaxed text-slate-400">Notifications are sent based on the alert condition and recipient preferences.</p><a className="mt-3 block text-[8px] text-[#05ff5e]" href="/enterprise/alarms-events/alarms-and-events-set-notifications-screen">Learn more about notifications →</a></Panel></div>
      </div>
    </ScreenshotShell>
  );
}

function ScreenshotShell({ activeHref, children, nav = enterpriseNav, subtitle, title, user = "Greg Dockery" }: ShellProps) {
  return (
    <div className="h-[682px] w-[1024px] overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[114px_910px]">
        <aside className="flex min-h-0 flex-col border-r border-cyan-300/10 bg-[#030c15] px-2 py-2">
          <div className="mb-3 border-b border-white/8 pb-2">
            <div className="text-[26px] font-black italic leading-none tracking-[-0.13em]"><span className="text-[#03f45f]">X</span><span className="text-white">ECO</span></div>
            <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.48em] text-[#16ff5d]">Energy</div>
          </div>
          <nav className="min-h-0 flex-1 space-y-2 overflow-hidden text-[8px]">
            {["Home", "Intelligence", "Operations", "Devices", "System", "Administration"].map((section) => {
              const items = nav.filter((item) => item.section === section);
              return items.length ? (
                <div key={section}>
                  {section !== "Home" ? <div className="mb-1 text-[7px] font-bold uppercase text-[#05ff5e]">{section}</div> : null}
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <a className={`flex h-[18px] items-center gap-1 rounded px-1 ${item.href === activeHref ? "border-l-2 border-[#05ff5e] bg-[#063b27] text-[#05ff5e]" : "text-slate-300"}`} href={item.href} key={item.href}>
                        <span>{item.label.includes("Alarm") ? "⚠" : item.label === "Settings" ? "⚙" : "⌾"}</span><span className="truncate">{item.label}</span>{item.badge ? <b className="ml-auto rounded-full bg-red-500 px-1 text-[7px] text-white">{item.badge}</b> : null}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null;
            })}
          </nav>
          <div className="mt-2 rounded border border-cyan-300/12 bg-[#041722] p-2 text-center">
            <div className="text-[8px] leading-snug text-slate-300">XECO Current<br />Balance Index™</div>
            <div className="mt-1 text-[30px] font-light leading-none text-[#05ff5e]">96</div>
            <div className="mt-1 text-[8px] text-slate-300">A+ Rating</div>
            <a className="mt-2 block text-[8px] text-[#05ff5e]" href="/enterprise/current-analysis">View Details →</a>
          </div>
          <div className="mt-2 text-[6px] leading-snug text-slate-500">© 2025 XECO Energy Corporation.<br />All rights reserved.</div>
        </aside>
        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,0.08),transparent_32%),linear-gradient(180deg,#03101a,#020910)] px-3">
          <header className="flex h-[38px] items-center justify-between border-b border-cyan-300/10">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-100">XECO ENERGY INTELLIGENCE PORTAL</div>
            <div className="flex items-center gap-3 text-[8px] text-slate-300">
              <Button>▣ Flex Tijuana⌄</Button><Button>▣ May 12 - May 18, 2025⌄</Button><span className="text-[#05ff5e]">● Live</span><span>♧</span><span>?</span><span className="grid size-6 place-items-center rounded-full bg-[#0b3158]">{user.split(" ").map((part) => part[0]).join("")}</span><span>{user}<br /><span className="text-slate-500">Administrator</span></span>
            </div>
          </header>
          <div className="pt-2">
            {title ? <h1 className="text-[17px] font-semibold leading-none">{title}</h1> : null}
            {subtitle ? <p className="mt-1 text-[8px] text-slate-300">{subtitle}</p> : null}
          </div>
          {children}
          <footer className="mt-auto flex h-[24px] items-center justify-between text-[8px] text-slate-500">
            <span />
            <div className="flex gap-6 text-[#05ff5e]"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/support">Support</a></div>
            <div>Data updated: May 18, 2025 10:15 AM <span className="ml-4 text-[#05ff5e]">▥ Live</span></div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function Panel({ children, className = "", title }: { children: ReactNode; className?: string; title: string }) {
  return <section className={`overflow-hidden rounded border border-cyan-300/12 bg-[#061521]/92 p-2 ${className}`}><h2 className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-slate-100">{title}</h2>{children}</section>;
}

function Button({ children, primary = false }: { children: ReactNode; primary?: boolean }) {
  return <button className={`rounded border px-3 py-1.5 text-[8px] ${primary ? "border-blue-500 bg-blue-600 text-white" : "border-slate-700 bg-[#061421] text-slate-300"}`}>{children}</button>;
}

function Breadcrumb({ items }: { items: string[] }) {
  return <div className="my-1 text-[8px] text-slate-400">{items.map((item, index) => <span key={`${item}-${index}`}>{index ? <span className="mx-1 text-slate-600">›</span> : null}<span className={index === items.length - 1 ? "text-[#05ff5e]" : ""}>{item}</span></span>)}</div>;
}

function Tabs({ items }: { items: string[] }) {
  return <nav className="mt-2 flex h-[24px] gap-6 border-b border-cyan-300/10 text-[8px] text-slate-400">{items.map((tab, index) => <span className={index === 0 ? "border-b-2 border-[#05ff5e] pb-1 font-semibold text-[#05ff5e]" : ""} key={tab}>{tab}</span>)}</nav>;
}

function SettingsCard({ action, color, icon, rows, subtitle, title }: { action: string; color: string; icon: string; rows: [string, string][]; subtitle: string; title: string }) {
  return <article className="rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-3"><div className="flex gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-full text-[18px] text-white" style={{ backgroundColor: color }}>{icon}</div><div><h2 className="text-[13px] font-semibold">{title}</h2><p className="mt-1 text-[8px] leading-snug text-slate-300">{subtitle}</p></div></div><div className="mt-4 space-y-2 text-[9px]">{rows.map(([label, value]) => <div className="flex justify-between border-b border-white/5 pb-1" key={label}><span>{label}</span><span className="text-slate-300">{value}</span></div>)}</div><a className="mt-4 block text-right text-[9px] text-[#05ff5e]" href="/administration/settings/settings-subpages">{action}</a></article>;
}

function SubpagePanel({ children, number, title }: { children: ReactNode; number: string; title: string }) {
  return <Panel title={`${number}. ${title}`}><div className="h-[154px] overflow-hidden">{children}</div></Panel>;
}

function MiniSidebar() {
  return <div className="w-[62px] shrink-0 border-r border-white/8 pr-1 text-[6px] text-slate-400">{["Account Settings", "Users & Permissions", "Notifications", "System Configuration", "Data & Integrations", "Security", "Billing & Subscription", "Audit Logs", "Advanced Tools"].map((item, index) => <div className={`mb-1 rounded px-1 py-0.5 ${index === 0 ? "bg-blue-600 text-white" : ""}`} key={item}>⌾ {item}</div>)}</div>;
}

function AccountSettingsMock() {
  return <div className="flex gap-2 text-[7px]"><MiniSidebar /><div className="grid flex-1 grid-cols-[1fr_90px] gap-2"><div className="space-y-1">{["Organization Name", "Industry", "Currency / Region", "Time Zone", "Organization ID"].map((label) => <div key={label}><span className="text-slate-500">{label}</span><div className="rounded border border-slate-700 bg-[#07131f] px-2 py-1">{label === "Organization Name" ? "Flex Ltd." : label === "Industry" ? "Manufacturing" : "US - USD"}</div></div>)}</div><div className="grid place-items-center rounded bg-[#08192a] text-center text-[18px] text-sky-300">FLEX<br /><Button>Change Logo</Button></div></div></div>;
}

function UsersMock() {
  return <div className="flex gap-2 text-[7px]"><MiniSidebar /><div className="flex-1"><div className="mb-2 flex justify-between"><Button>Search users...</Button><Button primary>+ Invite User</Button></div><SimpleTable headers={["User", "Role", "Sites", "Status", "Last Active"]} rows={[["John Smith", "OEM Admin", "All Sites", "Active", "May 18, 2025"], ["Sarah Johnson", "Site Manager", "8 Sites", "Active", "May 18, 2025"], ["Michael Brown", "Engineer", "4 Sites", "Active", "May 17, 2025"], ["Emily Davis", "Analyst", "2 Sites", "Active", "May 16, 2025"]]} /></div></div>;
}

function NotificationPrefsMock() {
  return <div className="flex gap-2 text-[7px]"><MiniSidebar /><div className="flex-1"><SimpleTable headers={["Notification Preference", "Email", "SMS", "In-App"]} rows={[["Alarms & Alerts", "●", "●", "●"], ["Reports & Summaries", "●", "○", "●"], ["System Updates", "●", "○", "●"], ["Billing & Payments", "●", "○", "●"], ["Comments & Mentions", "○", "○", "●"]]} /></div></div>;
}

function SystemConfigMock() {
  return <div className="flex gap-2 text-[7px]"><MiniSidebar /><div className="grid flex-1 grid-cols-2 gap-2">{["System Name", "Enable Dark Mode", "Default Landing Page", "Enable Multi-Site View", "Refresh Interval"].map((item) => <div key={item}><span className="text-slate-500">{item}</span><div className="rounded border border-slate-700 bg-[#07131f] px-2 py-1">{item.includes("Enable") ? "●" : item === "Refresh Interval" ? "24" : "XECOS Energy Intelligence Portal"}</div></div>)}</div></div>;
}

function IntegrationsMock() {
  return <div className="flex gap-2 text-[7px]"><MiniSidebar /><div className="flex-1"><SimpleTable headers={["Integration", "Status", "Last Sync"]} rows={[["UtilityAPI", "Connected", "May 18, 2025"], ["Salesforce", "Connected", "May 18, 2025"], ["SAP ERP", "Connected", "May 18, 2025"], ["Slack", "Connected", "May 18, 2025"], ["Power BI", "Disconnected", "—"]]} /></div></div>;
}

function SecurityMock() {
  return <div className="flex gap-2 text-[7px]"><MiniSidebar /><div className="grid flex-1 grid-cols-2 gap-2">{["Multi-Factor Authentication", "Password Policy", "Session Timeout", "IP Allowlist", "Login Alerts", "Data Encryption"].map((item) => <div className="rounded border border-slate-700 bg-[#07131f] p-2" key={item}><div className="font-semibold">{item}</div><div className="mt-1 text-slate-400">{item.includes("Encryption") ? "Enabled" : "Manage"}</div></div>)}</div></div>;
}

function BillingMock() {
  return <div className="flex gap-2 text-[7px]"><MiniSidebar /><div className="grid flex-1 grid-cols-2 gap-3"><div><div className="text-[14px]">Enterprise Plan <span className="text-[#05ff5e]">Active</span></div><p className="mt-2">$2,500 /month<br />Billed monthly<br />Next billing date Jun 1, 2025</p><Button primary>Manage Subscription</Button></div><div className="space-y-3">{["Sites 28 / 100", "Meters 146 / 500", "Data Storage 456 GB / 1 TB", "API Calls 52,431 / 100,000"].map((item) => <div key={item}><div>{item}</div><div className="mt-1 h-1 rounded bg-slate-700"><div className="h-1 w-1/2 rounded bg-blue-500" /></div></div>)}</div></div></div>;
}

function AuditMock() {
  return <div className="flex gap-2 text-[7px]"><MiniSidebar /><div className="flex-1"><SimpleTable headers={["Time", "User", "Action", "Details", "IP Address"]} rows={[["May 18, 2025 10:42 AM", "John Smith", "Login", "Successful login", "192.168.1.10"], ["May 18, 2025 09:45 AM", "Sarah Johnson", "Update User", "Updated site role", "192.168.1.22"], ["May 17, 2025 05:17 PM", "Michael Brown", "Export Report", "Job costing summary", "192.168.1.35"]]} /></div></div>;
}

function AdvancedMock() {
  return <div className="grid h-full grid-cols-3 gap-2 text-center text-[7px]">{["Data Maintenance", "Import / Export Tools", "Backup & Restore", "System Diagnostics", "Cache Management", "Feature Management"].map((item) => <div className="rounded border border-slate-700 bg-[#07131f] p-2" key={item}><div className="text-[18px] text-blue-400">⚙</div><div>{item}</div><p className="text-slate-500">Run system tools.</p></div>)}</div>;
}

function SummaryTile({ color = "#cbd5e1", detail, title, value }: { color?: string; detail: string; title: string; value: string }) {
  return <div className="rounded border border-cyan-300/12 bg-[#061521]/92 p-2 text-[8px]"><div className="text-slate-400">{title}</div><div className="mt-2 font-semibold" style={{ color }}>{value}</div><p className="mt-1 leading-snug text-slate-400">{detail}</p></div>;
}

function Timeline() {
  const events = [["10:12:05 AM", "Alarm Triggered", "#ef4444"], ["10:12:05 AM", "Notification Sent", "#147dff"], ["10:15:00 AM", "Threshold Exceeded", "#ef4444"], ["10:20:00 AM", "Notification Sent", "#147dff"], ["10:25:00 AM", "Escalation Level 1", "#64748b"], ["10:35:00 AM", "Escalation Level 2", "#64748b"]];
  return <div className="space-y-3 text-[8px]">{events.map(([time, text, color]) => <div className="grid grid-cols-[60px_1fr] gap-2" key={`${time}-${text}`}><span className="text-slate-400">{time}</span><span style={{ color }}>● {text}</span></div>)}</div>;
}

function DemandChart() {
  return <div><div className="grid grid-cols-4 gap-2 text-[8px]"><Summary value="1,236 kW" label="Current Demand" red /><Summary value="1,200 kW" label="Threshold" /><Summary value="36 kW (3.0%)" label="Exceeded By" /><Summary value="18 min 32 sec" label="Duration" /></div><svg className="mt-2 h-[126px] w-full" viewBox="0 0 500 130" preserveAspectRatio="none"><line x1="0" x2="500" y1="55" y2="55" stroke="#ef4444" strokeDasharray="4 4" /><polyline fill="rgba(239,68,68,.12)" points="0,105 30,100 60,102 90,96 120,100 150,84 180,88 210,70 240,62 270,48 300,52 330,43 360,50 390,45 420,52 450,42 480,55 500,49 500,130 0,130" /><polyline fill="none" points="0,105 30,100 60,102 90,96 120,100 150,84 180,88 210,70 240,62 270,48 300,52 330,43 360,50 390,45 420,52 450,42 480,55 500,49" stroke="#ef4444" strokeWidth="2" /></svg><div className="flex justify-between text-[7px] text-slate-500"><span>09:42</span><span>09:52</span><span>10:02</span><span>10:12</span><span>10:22</span><span>10:32</span></div></div>;
}

function AlarmImpact() {
  return <div className="space-y-2 text-[8px]">{[["Estimated Extra Cost (Today)", "$412.35"], ["Potential Monthly Impact", "$12,370"], ["Power Factor (Avg)", "0.89"], ["Capacity Utilization", "92%"], ["Demand Charge Exposure", "High"]].map(([a, b], i) => <div className="flex justify-between" key={a}><span className="text-slate-400">{a}</span><span className={i === 4 ? "text-red-400" : "text-white"}>{b}</span></div>)}</div>;
}

function RecommendedActions() {
  return <div className="space-y-2 text-[8px] text-slate-300">{["Investigate high load equipment", "Check large motor and HVAC systems", "Verify production schedule", "Consider load shedding if necessary"].map((item) => <div key={item}>● {item}</div>)}<a className="block text-[#05ff5e]" href="/enterprise/alarms-events/alarm-detail-page">View Optimization Recommendations →</a></div>;
}

function RelatedAlarms() {
  return <div className="space-y-2 text-[8px] text-slate-300">{["High Demand Alert", "Low Power Factor Alert", "Transformer Temp Alert"].map((item) => <div key={item}>△ {item}<span className="float-right text-slate-500">Duration: 22 min</span></div>)}<a className="block text-[#05ff5e]" href="/enterprise/alarms-events/alarm-events">View All Alarms →</a></div>;
}

function TriggerConditions() {
  return <SimpleTable headers={["Parameter", "Condition", "Threshold", "Actual Value", "Duration", "Status"]} rows={[["Demand (kW)", "Greater Than (>)", "1,200 kW for 15 min", "1,236 kW", "18 min 32 sec", "Triggered"], ["Power Factor (PF)", "Less Than (<)", "0.90 for 10 min", "0.89", "18 min 32 sec", "Triggered"], ["Current (Primary)", "Greater Than (>)", "1,400 A for 5 min", "1,512 A", "12 min 45 sec", "Normal"], ["THD (Voltage)", "Greater Than (>)", "5.0% for 10 min", "4.1%", "18 min 32 sec", "Normal"]]} />;
}

function Metric({ color, detail, label, value }: { color: string; detail: string; label: string; value: string }) {
  return <div className="rounded border border-cyan-300/12 bg-[#061521]/92 p-2"><div className="text-[8px] uppercase text-slate-400">{label}</div><div className="mt-1 text-[22px] leading-none" style={{ color }}>{value}</div><div className="mt-1 text-[8px] text-slate-400">{detail}</div><svg className="mt-2 h-4 w-full"><polyline fill="none" points="0,12 10,11 20,8 30,12 40,5 50,9 60,4 70,8 80,3 90,10 100,6" stroke={color} strokeWidth="1.4" /></svg></div>;
}

function Select({ label, value }: { label: string; value: string }) {
  return <label className="text-[7px] text-slate-500">{label}<span className="ml-1 rounded border border-slate-700 bg-[#061421] px-3 py-1.5 text-slate-300">{value}⌄</span></label>;
}

function AlarmsTable() {
  return <SimpleTable headers={["Severity", "Time", "Asset / Location", "Parameter", "Condition", "Current Value", "Threshold", "Status", "Actions"]} rows={[["Critical", "May 18, 2025 10:12 AM", "Main Transformer T-1", "Transformer Load", "Greater Than", "96%", "90%", "Unacknowledged", "◎ ◎ ◎"], ["Critical", "May 18, 2025 09:47 AM", "Main Switchgear MSB", "THD-L1 (3rd)", "Greater Than", "18.7%", "15.0%", "Unacknowledged", "◎ ◎ ◎"], ["Warning", "May 18, 2025 09:58 AM", "Feeder C", "Power Factor", "Less Than", "0.78", "0.85", "Acknowledged", "◎ ◎ ◎"], ["Warning", "May 18, 2025 09:52 AM", "Panel D1", "Voltage Imbalance", "Greater Than", "2.8%", "2.0%", "Acknowledged", "◎ ◎ ◎"], ["Info", "May 18, 2025 09:01 AM", "Gateway GW-3", "Communication", "Device Online", "—", "—", "Active", "◎ ◎ ◎"], ["Info", "May 18, 2025 08:45 AM", "Meter PM-12", "Data Quality", "Data Recovered", "—", "—", "Active", "◎ ◎ ◎"]]} />;
}

function RulesTable() {
  return <SimpleTable headers={["#", "Rule Name", "Category", "Parameter", "Condition", "Threshold", "Current Value", "Status", "Notifications", "Actions"]} rows={[["1", "Peak kW Demand Alert", "Utility", "Peak kW Demand (15 Min)", "Greater Than", "2,500 kW", "2,410 kW", "Normal", "✉ 💬", "✎ 🗑"], ["2", "kVA Demand Alert", "Utility", "kVA Demand (15 Min)", "Greater Than", "3,000 kVA", "2,920 kVA", "Warning", "✉ 💬", "✎ 🗑"], ["3", "Transformer Capacity Alert", "Capacity", "Transformer T-1 Load", "Greater Than", "85%", "84%", "Near Limit", "✉ 💬", "✎ 🗑"], ["4", "Current Balance Index Alert", "Current Balance", "CBI™", "Less Than", "80", "96", "Normal", "✉ 💬", "✎ 🗑"]]} />;
}

function AlertRuleForm() {
  return <div className="space-y-2 text-[8px]"><div className="flex gap-2 text-[#05ff5e]"><span>1 Define Rule</span><span>2 Set Notifications</span><span>3 Review</span></div>{["Alert Name", "Category", "Parameter", "Condition", "Threshold Value", "For How Long", "Severity", "Applies To", "Description"].map((field) => <div key={field}><div className="text-slate-400">{field}</div><div className="rounded border border-slate-700 bg-[#07131f] px-2 py-1">{field === "Alert Name" ? "Peak kW Demand Alert" : field === "Threshold Value" ? "2,500 kW" : field === "Description" ? "Alert when 15-min peak kW demand exceeds 2,500 kW." : "Greater Than (>)"}</div></div>)}<Button primary>Next: Set Notifications →</Button></div>;
}

function Stepper() {
  return <div className="flex items-center gap-8 text-center text-[8px]"><span className="text-[#05ff5e]">●<br />Define Rule</span><span className="text-blue-400">②<br />Set Notifications</span><span className="text-slate-500">③<br />Review</span><Button>← Back</Button><Button primary>Next: Review →</Button></div>;
}

function ChannelCards() {
  return <div className="grid grid-cols-5 gap-2 text-center text-[8px]">{[["Email", "Send email notifications", "#147dff"], ["SMS Text", "Send text messages", "#05ff5e"], ["Push Notification", "In-app and mobile push alerts", "#a855f7"], ["Voice Call", "Automated voice call", "#f97316"], ["Webhook", "Send to external endpoint", "#06b6d4"]].map(([title, text, color]) => <div className="rounded border border-cyan-300/12 bg-[#07131f] p-3" key={title}><div className="mx-auto grid size-9 place-items-center rounded-full border text-[18px]" style={{ borderColor: color, color }}>◎</div><div className="mt-2 font-semibold">{title}</div><p className="text-slate-400">{text}</p><span className="text-[#05ff5e]">●</span></div>)}</div>;
}

function Recipients() {
  return <div><div className="mb-2 flex justify-between"><span className="text-[8px] text-slate-400">Who should receive these notifications?</span><Button>+ Add Recipient</Button></div><SimpleTable headers={["Recipient", "Type", "Channels", "Schedule", "Severity Filter", "Escalation", "Status", "Actions"]} rows={[["John Martinez", "User", "✉ 💬 🔔", "24x7", "🔴 🟠 🔵", "Enabled", "●", "✎ 🗑"], ["Amanda Lee", "User", "✉ 💬 🔔", "7 AM - 7 PM", "🔴 🟠", "Enabled", "●", "✎ 🗑"], ["Operations Team", "Group", "✉ 🔔", "24x7", "🔴 🟠 🔵", "Enabled", "●", "✎ 🗑"], ["On-Call Engineer", "User", "✉ 💬 🔔 ☎", "7 PM - 7 AM", "🔴", "Enabled", "●", "✎ 🗑"]]} /></div>;
}

function EscalationSettings() {
  return <div className="grid grid-cols-5 gap-3 text-[8px]">{["Escalation Delay", "Escalate To", "Repeat Every", "Max Escalations", "Auto Resolve When Condition Clears"].map((item) => <div key={item}><div className="text-slate-400">{item}</div><div className="mt-1 rounded border border-slate-700 bg-[#07131f] px-2 py-2">{item === "Escalate To" ? "On-Call Engineer" : item === "Auto Resolve When Condition Clears" ? "●" : "15 Minutes"}</div></div>)}</div>;
}

function RuleSummary() {
  return <div className="space-y-2 text-[8px]"><div className="text-[12px] font-semibold">Peak kW Demand Alert</div>{[["Category", "Utility"], ["Parameter", "Peak kW Demand (15 Min)"], ["Condition", "Greater Than"], ["Threshold", "2,500 kW"], ["For How Long", "15 Minutes"], ["Severity", "Warning"]].map(([a, b]) => <div className="flex justify-between" key={a}><span className="text-slate-400">{a}</span><span>{b}</span></div>)}</div>;
}

function NotificationPreview() {
  return <div className="space-y-3 text-[8px]">{["Email notification sent immediately", "SMS text message sent immediately", "Push notification sent immediately", "Escalate to On-Call Engineer after 15 minutes if unacknowledged", "Auto notification when condition clears"].map((item) => <div key={item}>◎ {item}</div>)}</div>;
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[7px]"><thead className="text-slate-500"><tr>{headers.map((h) => <th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-t border-white/5" key={index}>{row.map((cell, cellIndex) => <td className={`py-1 ${/Active|Normal|Enabled|●/.test(cell) ? "text-[#05ff5e]" : /Critical|Triggered|Unacknowledged/.test(cell) ? "text-red-400" : /Warning|Near/.test(cell) ? "text-yellow-400" : "text-slate-300"}`} key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function Summary({ label, red = false, value }: { label: string; red?: boolean; value: string }) {
  return <div className="rounded border border-cyan-300/12 bg-[#07131f] p-2"><div className="text-slate-400">{label}</div><div className={red ? "text-red-400" : "text-white"}>{value}</div></div>;
}
