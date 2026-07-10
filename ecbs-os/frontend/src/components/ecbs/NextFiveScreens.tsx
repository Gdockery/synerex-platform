import type { ReactNode } from "react";
import type { AlarmDetailData } from "@/lib/alarmDetailData";
import type { SetNotificationsData } from "@/lib/setNotificationsData";

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
    <SettingsWideShell>
      <div className="text-[10px] text-slate-300">Settings &nbsp; <span className="text-slate-600">›</span> &nbsp; <span className="text-white">Overview</span></div>
      <h1 className="mt-3 text-[24px] font-semibold leading-none">Settings</h1>
      <p className="mt-2 text-[10px] text-slate-200">Manage your account, system configuration, and preferences.</p>
      <SettingsWideTabs />
      <div className="mt-3 grid h-[638px] grid-cols-3 gap-4">
        <SettingsWideCard color="#05b85a" icon="▦" title="Account Settings" subtitle="Manage your organization information and account preferences." rows={[["Organization Profile", "XECO Energy"], ["Regional Settings", "›"], ["Time Zone", "(UTC-08:00) Pacific Time (US & Canada) ›"]]} action="Manage Account →" />
        <SettingsWideCard color="#6d40d8" icon="☷" title="Users & Permissions" subtitle="Invite users and manage roles, permissions, and access." rows={[["Total Users", "18"], ["Administrators", "5"], ["Viewer Users", "13"]]} action="Manage Users →" />
        <SettingsWideCard color="#b46211" icon="♢" title="Notifications" subtitle="Configure how and when you receive alerts and updates." rows={[["Email Notifications", "On"], ["SMS Notifications", "Off"], ["Alert Preferences", "›"]]} action="Configure Notifications →" />
        <SettingsWideCard color="#2268d9" icon="⚙" title="System Configuration" subtitle="Customize system behavior, thresholds, and default settings." rows={[["Health Score Settings", "›"], ["Alert Thresholds", "›"], ["Units & Measurements", "Metric (kVA, kW, kWh) ›"]]} action="Configure System →" />
        <SettingsWideCard color="#19b1a1" icon="◫" title="Data & Integrations" subtitle="Manage data sources, integrations, and data retention policies." rows={[["Data Sources", "12 Connected"], ["Integrations", "8 Active"], ["Data Retention", "13 Months"]]} action="Manage Integrations →" />
        <SettingsWideCard color="#276bd8" icon="▣" title="Security" subtitle="Configure security settings and manage authentication." rows={[["Password Policy", "›"], ["Multi-Factor Authentication", "On ›"], ["Session Timeout", "30 minutes ›"]]} action="Manage Security →" />
        <SettingsWideCard color="#c18410" icon="▤" title="Billing & Subscription" subtitle="View your subscription details and billing information." rows={[["Current Plan", "Enterprise"], ["Next Billing Date", "Jun 12, 2025"], ["Payment Method", "•••• •••• •••• 4242 ›"]]} action="Manage Billing →" />
        <SettingsWideCard color="#1aa59a" icon="☁" title="Audit Logs" subtitle="View system activity and change history." rows={[["Recent Logins", "›"], ["Configuration Changes", "›"], ["Data Export Logs", "›"]]} action="View Audit Logs →" />
        <SettingsWideCard color="#64748b" icon="☷" title="Advanced" subtitle="Advanced tools and system maintenance options." rows={[["API Access", "Manage API Keys ›"], ["System Diagnostics", "Run Diagnostics ›"], ["Support Access", "Enable ›"]]} action="Advanced Tools →" />
      </div>
    </SettingsWideShell>
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

export function AlarmDetailScreen({ data }: { data: AlarmDetailData }) {
  const statusColor = data.state === "no-data" ? "text-slate-300" : data.status.toLowerCase() === "active" ? "text-[#05ff5e]" : "text-slate-300";

  return (
    <AlarmDetailWideShell>
      <section className="flex h-[86px] items-start justify-between pt-4">
        <div>
          <div className="text-[10px] text-slate-300">Home &nbsp; <span className="text-slate-600">›</span> &nbsp; Alarms & Events &nbsp; <span className="text-slate-600">›</span> &nbsp; <span className="text-white">Alarm Details</span></div>
          <div className="mt-4 flex items-center gap-3">
            <h1 className="text-[24px] font-semibold leading-none">{data.title}</h1>
            <span className="rounded bg-red-600 px-2.5 py-1 text-[9px] font-semibold text-white">{data.priorityLabel}</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-300">Alarm ID: {data.alarmId} &nbsp; | &nbsp; Triggered: {data.triggeredAt} &nbsp; | &nbsp; <span className={statusColor}>● {data.status}</span></p>
        </div>
        <div className="mt-5 flex gap-3 text-[10px]">
          <AlarmButton>← Back to Alarms</AlarmButton>
          <AlarmButton>◎ Acknowledge</AlarmButton>
          <AlarmButton>◷ Snooze</AlarmButton>
          <AlarmButton primary>✈ Escalate</AlarmButton>
        </div>
      </section>
      <section className="grid h-[106px] grid-cols-[1.1fr_1.15fr_0.95fr_0.95fr_0.85fr_1fr] gap-0 rounded-md border border-cyan-300/12 bg-[#061521]/92">
        {data.summaryTiles.map((tile) => <AlarmSummaryTile color={tile.color} detail={tile.detail} icon={tile.icon} key={tile.title} title={tile.title} value={tile.value} />)}
      </section>
      <AlarmTabs />
      <section className="grid h-[384px] grid-cols-[330px_1fr_330px] gap-3 pt-3">
        <AlarmPanel title="Alarm Timeline"><AlarmTimelineWide data={data} /></AlarmPanel>
        <AlarmPanel title="Demand (kW)" action="Last 1 Hour ⌄  ⛶"><DemandChartWide data={data} /></AlarmPanel>
        <div className="grid min-h-0 grid-rows-[130px_112px_118px] gap-3">
          <AlarmPanel compact title="Alarm Impact"><AlarmImpactWide data={data} /></AlarmPanel>
          <AlarmPanel compact title="Recommended Actions"><RecommendedActionsWide data={data} /></AlarmPanel>
          <AlarmPanel compact title="Related Alarms (Last 7 Days)"><RelatedAlarmsWide data={data} /></AlarmPanel>
        </div>
      </section>
      <AlarmPanel className="mt-3 h-[164px] p-3" title="Trigger Conditions"><TriggerConditionsWide data={data} /></AlarmPanel>
    </AlarmDetailWideShell>
  );
}

export function AlarmEventsRuleScreen() {
  return (
    <AlarmEventsWideShell>
      <section className="flex h-[70px] items-start justify-between pt-3">
        <div>
          <div className="text-[12px] font-semibold text-[#05ff5e]">Alarms & Events</div>
          <h1 className="mt-2 text-[22px] font-semibold leading-none">Alarms & Events</h1>
          <p className="mt-1.5 text-[10px] text-slate-300">Real-time monitoring of system alerts, alarms and important events.</p>
        </div>
        <div className="mt-4 flex items-end gap-4 text-[10px]">
          <AlarmEventsSelect label="Asset Scope" value="Entire Site" />
          <AlarmEventsSelect label="Severity" value="All" />
          <AlarmEventsSelect label="Status" value="Active" />
          <AlarmButton>⇩ Export Report</AlarmButton>
        </div>
      </section>
      <section className="grid h-[104px] grid-cols-6 gap-2">
        {[
          ["⚠", "Critical Alarms", "2", "Active", "2 Unacknowledged", "#ef4444"],
          ["▲", "Warning Alarms", "8", "Active", "3 Unacknowledged", "#f59e0b"],
          ["i", "Info Events", "24", "Today", "24 New", "#147dff"],
          ["✓", "Alarm Rate", "1.2", "Per Day (7 Day Avg)", "", "#05ff5e"],
          ["◷", "MTTR", "18 min", "(7 Day Avg)", "", "#7c3aed"],
          ["⌁", "System Health", "97%", "Excellent", "", "#00bcd4"],
        ].map(([icon, label, value, detail, subdetail, color]) => <AlarmMetricCard color={color} detail={detail} icon={icon} key={label} label={label} subdetail={subdetail} value={value} />)}
      </section>
      <section className="mt-3 grid h-[604px] grid-cols-[1fr_320px] gap-3">
        <div className="min-h-0">
          <AlarmEventsTabs />
          <AlarmEventsPanel className="h-[286px]" title="Active Alarms (10)" action="Acknowledge All      View All Alarms →">
            <AlarmEventsAlarmsTable />
          </AlarmEventsPanel>
          <AlarmEventsPanel className="mt-3 h-[263px]" title="Custom Alert Rules (6)" action="+ Create Alert Rule">
            <AlarmEventsRulesTable />
          </AlarmEventsPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[458px_124px] gap-3">
          <AlarmEventsPanel title="Create / Edit Alert Rule">
            <AlarmEventsRuleFormWide />
          </AlarmEventsPanel>
          <AlarmEventsPanel title="About Alert Rules">
            <p className="text-[9px] leading-relaxed text-slate-400">Alert rules monitor specific parameters in real time and notify you when conditions are met. Rules are evaluated continuously using 1-minute data.</p>
            <a className="mt-2 block text-[9px] text-[#05ff5e]" href="/enterprise/alarms-events/alarm-events">Learn more about alert rules →</a>
          </AlarmEventsPanel>
        </div>
      </section>
    </AlarmEventsWideShell>
  );
}

export function ConfigureAlertRuleScreen() {
  return (
    <AlarmEventsWideShell>
      <section className="flex h-[92px] items-start justify-between pt-3">
        <div>
          <div className="text-[10px] text-slate-300">Home &nbsp; <span className="text-slate-600">›</span> &nbsp; Alarms & Events &nbsp; <span className="text-slate-600">›</span> &nbsp; <span className="text-white">Configure Alerts</span></div>
          <h1 className="mt-3 text-[23px] font-semibold leading-none">Configure Alerts / Create Alert Rule</h1>
          <p className="mt-1.5 text-[10px] text-slate-300">Define conditions, thresholds, and notifications for monitoring your electrical network.</p>
        </div>
        <div className="mt-5 flex gap-3 text-[10px]">
          <AlarmButton>← Back to Alerts</AlarmButton>
          <AlarmButton>Save as Draft</AlarmButton>
          <AlarmButton primary>Create Alert Rule</AlarmButton>
        </div>
      </section>
      <section className="grid h-[722px] grid-cols-[1fr_300px] gap-3">
        <div className="grid min-h-0 grid-rows-[104px_154px_146px_150px_108px] gap-3">
          <ConfigurePanel number="1" title="Alert Information"><ConfigureAlertInfo /></ConfigurePanel>
          <ConfigurePanel number="2" title="Scope"><ConfigureScope /></ConfigurePanel>
          <ConfigurePanel number="3" title="Trigger Conditions"><ConfigureTriggers /></ConfigurePanel>
          <ConfigurePanel number="4" title="Notification Settings"><ConfigureNotifications /></ConfigurePanel>
          <ConfigurePanel number="5" title="Advanced Settings (Optional)"><ConfigureAdvanced /></ConfigurePanel>
        </div>
        <div className="grid min-h-0 grid-rows-[294px_138px_250px] gap-3">
          <ConfigureSidePanel title="Alert Rule Summary"><ConfigureRuleSummary /></ConfigureSidePanel>
          <ConfigureSidePanel title="How It Works"><p className="text-[10px] leading-relaxed text-slate-400">You will be notified when any of the defined conditions are met for the specified duration. The alert will automatically clear when the parameters return to normal based on the selected clear condition.</p><a className="mt-3 block text-[10px] text-[#05ff5e]" href="/enterprise/alarms-events/configure-alerts-page-alert-rules">Learn more about alerts →</a></ConfigureSidePanel>
          <ConfigureSidePanel title="Recent Alert Activity (Preview)"><ConfigureRecentActivity /></ConfigureSidePanel>
        </div>
      </section>
    </AlarmEventsWideShell>
  );
}

export function SetNotificationsScreen({ data }: { data: SetNotificationsData }) {
  return (
    <AlarmEventsWideShell>
      <section className="grid h-[104px] grid-cols-[1fr_600px] items-start gap-4 pt-4">
        <div>
          <div className="text-[10px] text-slate-300">Alarms & Events &nbsp; <span className="text-slate-600">›</span> &nbsp; Alert Rules &nbsp; <span className="text-slate-600">›</span> &nbsp; {data.ruleName} &nbsp; <span className="text-slate-600">›</span> &nbsp; <span className="text-[#05ff5e]">Set Notifications</span></div>
          <h1 className="mt-4 text-[24px] font-semibold leading-none">Set Notifications</h1>
          <p className="mt-2 text-[10px] text-slate-300">Define how and when notifications are sent for this alert rule.</p>
        </div>
        <div className="flex items-start justify-end gap-6">
          <SetNotificationsStepper />
          <div className="mt-2 flex gap-3"><AlarmButton>← Back</AlarmButton><AlarmButton primary>Next: Review →</AlarmButton></div>
        </div>
      </section>
      <section className="grid h-[710px] grid-cols-[1fr_300px] gap-3">
        <div className="grid min-h-0 grid-rows-[190px_292px_206px] gap-3">
          <SetNotifyPanel title="1. Notification Channels" subtitle="Select one or more channels to send notifications.">
            <SetNotifyChannels data={data} />
          </SetNotifyPanel>
          <SetNotifyPanel title="2. Recipients" action="+ Add Recipient" subtitle="Who should receive these notifications?">
            <SetNotifyRecipients data={data} />
          </SetNotifyPanel>
          <SetNotifyPanel title="3. Escalation Settings" subtitle="Define escalation behavior if the alert is not acknowledged.">
            <SetNotifyEscalation data={data} />
          </SetNotifyPanel>
        </div>
        <div className="grid min-h-0 grid-rows-[205px_289px_192px] gap-3">
          <SetNotifyPanel title="Alert Rule Summary"><SetNotifyRuleSummary data={data} /></SetNotifyPanel>
          <SetNotifyPanel title="Notification Preview" subtitle="When this alert is triggered:"><SetNotifyPreview data={data} /></SetNotifyPanel>
          <SetNotifyPanel title="About Notifications">
            <p className="text-[10px] leading-relaxed text-slate-400">Notifications are sent based on the alert condition and recipient preferences.</p>
            <a className="mt-5 block text-[10px] text-[#05ff5e]" href="/enterprise/alarms-events/alarms-and-events-set-notifications-screen">Learn more about notifications →</a>
          </SetNotifyPanel>
        </div>
      </section>
    </AlarmEventsWideShell>
  );
}

export function LoginErrorScreen() {
  return <AuthScreen mode="login" />;
}

export function ForgotPasswordScreen() {
  return <AuthScreen mode="forgot" />;
}

export function MfaVerificationScreen() {
  return <AuthScreen mode="mfa" />;
}

export function ResetPasswordScreen() {
  return <AuthScreen mode="reset" />;
}

export function SessionTimeoutScreen() {
  return <AuthScreen mode="timeout" />;
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

function SettingsWideShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[182px_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-cyan-300/10 bg-[#030c15] px-4 py-3">
          <div className="mb-5 border-b border-white/8 pb-4">
            <div className="text-[36px] font-black italic leading-none tracking-[-0.13em]"><span className="text-[#03f45f]">X</span><span className="text-white">ECO</span></div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.55em] text-[#16ff5d]">Energy</div>
          </div>
          <nav className="min-h-0 flex-1 overflow-hidden text-[10px] text-slate-300">
            <div className="space-y-1.5">
              {[
                ["⌘", "Enterprise Dashboard", ""],
                ["◉", "Energy Dashboard", ""],
                ["▥", "Capacity Intelligence", ""],
                ["◇", "Digital Twin", ""],
                ["⌂", "Sites", ""],
                ["▤", "Transformers", ""],
                ["⚡", "Current Analysis", ""],
                ["◌", "Savings & Forecast", ""],
                ["⚠", "Alarms & Events", "2"],
                ["▧", "Reports", ""],
              ].map(([icon, label, badge]) => (
                <a className="flex h-[24px] items-center gap-2 rounded px-1.5" href="/enterprise/dashboard" key={label}>
                  <span className="w-3 text-slate-400">{icon}</span><span>{label}</span>{badge ? <b className="ml-auto rounded-full bg-red-500 px-1.5 text-[9px] text-white">{badge}</b> : null}
                </a>
              ))}
            </div>
            <div className="mt-4 border-t border-white/8 pt-2">
              <div className="flex h-[24px] items-center justify-between rounded px-1.5 text-[#05ff5e]">⌬ Devices <span>⌃</span></div>
              <div className="mt-1 space-y-1 border-l border-[#05ff5e]/25 pl-4">
                {["Gateways", "Meters", "Switches", "Repeaters"].map((label) => <a className="block h-[21px] text-[9px] text-slate-300" href="/devices/gateways" key={label}>• {label}</a>)}
              </div>
            </div>
            <div className="mt-3 border-t border-white/8 pt-2">
              <a className="flex h-[24px] items-center gap-2 rounded border-l-2 border-[#05ff5e] bg-[#063b27] px-1.5 text-[#05ff5e]" href="/administration/settings">⚙ Settings</a>
            </div>
          </nav>
          <div className="mt-3 rounded-md border border-cyan-300/12 bg-[#041722] p-3 text-center">
            <div className="text-[10px] leading-snug text-slate-300">XECO Current<br />Balance Index™</div>
            <div className="mt-2 text-[44px] font-light leading-none text-[#05ff5e]">96</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-200">A+ Rating</div>
            <a className="mt-3 block text-[10px] text-[#05ff5e]" href="/enterprise/current-analysis">View Details →</a>
          </div>
          <div className="mt-4 rounded-md border border-slate-700/70 bg-[#061421] p-2 text-[10px]">
            <div className="font-semibold">Need Help?</div>
            <a className="text-slate-400" href="/support">Contact Support</a>
          </div>
        </aside>
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-5">
          <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10">
            <div className="text-[12px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div>
            <div className="flex items-center gap-4 text-[10px] text-slate-300">
              <span className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2">▣ Flex Tijuana ⌄</span>
              <span className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2">▣ May 12 – May 18, 2025 ⌄</span>
              <span className="text-[#05ff5e]">● Online</span>
              <span>♧<sup className="ml-[-3px] rounded-full bg-red-500 px-1 text-[8px] text-white">3</sup></span>
              <span>?</span>
              <span className="grid size-8 place-items-center rounded-full bg-[#0b3158] text-[11px]">GD</span>
              <span>Greg Dockery<br /><span className="text-slate-500">Administrator</span></span>
              <span>⌄</span>
            </div>
          </header>
          <section className="pt-4">{children}</section>
          <footer className="absolute bottom-0 left-5 right-5 flex h-[42px] items-center justify-between border-t border-cyan-300/10 text-[10px] text-slate-500">
            <div>© 2025 XECO Energy Corporation. All rights reserved.</div>
            <div className="flex gap-8 text-[#05ff5e]"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/support">Support</a></div>
            <div>Data updated: May 18, 2025 10:15 AM <span className="ml-5 text-[#05ff5e]">▥ Live</span></div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function SettingsWideTabs() {
  const tabs = ["Overview", "Users & Permissions", "Notifications", "System Configuration", "Data & Integrations", "Security", "Billing & Subscription", "Audit Logs", "Advanced"];

  return (
    <nav className="mt-3 flex h-[30px] items-start gap-8 border-b border-cyan-300/10 text-[10px] text-slate-300">
      {tabs.map((tab, index) => (
        <span className={index === 0 ? "border-b-2 border-[#05ff5e] pb-2.5 font-semibold text-[#05ff5e]" : ""} key={tab}>
          {index === 0 ? "⚙ " : ""}{tab}
        </span>
      ))}
    </nav>
  );
}

function SettingsWideCard({ action, color, icon, rows, subtitle, title }: { action: string; color: string; icon: string; rows: [string, string][]; subtitle: string; title: string }) {
  return (
    <article className="relative overflow-hidden rounded-lg border border-cyan-300/12 bg-[#061521]/92 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
      <div className="flex gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-full text-[24px] text-white" style={{ backgroundColor: color }}>{icon}</div>
        <div>
          <h2 className="text-[15px] font-semibold leading-tight">{title}</h2>
          <p className="mt-2 max-w-[210px] text-[10px] leading-snug text-slate-300">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 space-y-2 text-[9.5px]">
        {rows.map(([label, value]) => (
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/5 pb-1.5" key={label}>
            <span>{label}</span>
            <span className="max-w-[210px] text-right text-slate-300">{value}</span>
          </div>
        ))}
      </div>
      <a className="absolute bottom-4 right-4 text-[9.5px] text-[#05ff5e]" href="/administration/settings/settings-subpages">{action}</a>
    </article>
  );
}

function AlarmDetailWideShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[150px_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-cyan-300/10 bg-[#030c15] px-3 py-3">
          <div className="mb-4 border-b border-white/8 pb-3">
            <div className="text-[31px] font-black italic leading-none tracking-[-0.13em]"><span className="text-[#03f45f]">X</span><span className="text-white">ECO</span></div>
            <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.5em] text-[#16ff5d]">Energy</div>
          </div>
          <nav className="min-h-0 flex-1 overflow-hidden text-[9px]">
            <div className="mb-2 text-[8px] font-bold uppercase text-[#05ff5e]">Enterprise</div>
            {[
              ["⌘", "Enterprise Dashboard", ""],
              ["◎", "Energy Dashboard", ""],
              ["▥", "Capacity Intelligence", ""],
              ["◇", "Digital Twin", ""],
              ["⌂", "Sites", ""],
              ["▤", "Transformers", ""],
              ["▧", "Electrical Network", ""],
              ["◉", "Current Analysis", ""],
              ["⌁", "Savings & Forecast", ""],
              ["⚠", "Alarms & Events", "3"],
              ["▦", "Reports", ""],
            ].map(([icon, label, badge]) => (
              <a className={`flex h-[22px] items-center gap-1.5 rounded px-1 ${label === "Alarms & Events" ? "text-white" : "text-slate-300"}`} href="/enterprise/alerts-events" key={label}>
                <span className="w-3 text-slate-400">{icon}</span><span>{label}</span>{badge ? <b className="ml-auto grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">{badge}</b> : null}
              </a>
            ))}
            <div className="mt-3 border-t border-white/8 pt-2 text-[#05ff5e]">Devices <span className="float-right">⌃</span></div>
            <div className="mt-1 space-y-1 border-l border-[#05ff5e]/25 pl-3 text-[8px] text-slate-300">
              {["Gateways", "Meters", "Switches", "Repeaters"].map((item) => <div key={item}>• {item}</div>)}
            </div>
            <div className="mt-3 border-t border-white/8 pt-2 text-[#05ff5e]">Administration</div>
            {["Users & Roles", "Account Settings", "Integrations", "Billing"].map((item) => <a className="mt-1 flex h-[20px] items-center gap-1.5 rounded px-1 text-[8px] text-slate-300" href="/administration/settings" key={item}>⌾ {item}</a>)}
          </nav>
          <div className="mt-2 rounded-md border border-cyan-300/12 bg-[#041722] p-2 text-center">
            <div className="text-[8px] leading-snug text-slate-300">XECO Current<br />Balance Index™</div>
            <div className="mt-1 text-[38px] font-light leading-none text-[#05ff5e]">96</div>
            <div className="mt-1 text-[9px] font-semibold text-slate-200">A+ Rating</div>
            <a className="mt-2 block text-[8px] text-[#05ff5e]" href="/enterprise/current-analysis">View Details →</a>
          </div>
          <div className="mt-3 rounded-md border border-slate-700/70 bg-[#061421] p-2 text-[8px]">
            <div className="font-semibold">Need Help?</div>
            <a className="text-slate-400" href="/support">Contact Support</a>
          </div>
        </aside>
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-5">
          <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10">
            <div className="text-[12px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div>
            <div className="flex items-center gap-4 text-[10px] text-slate-300">
              <span className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2"><span className="text-[8px] text-slate-500">Client</span><br />Flex Ltd. ⌄</span>
              <span className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2">▣ May 18, 2025 10:15 AM CDT ⌄</span>
              <span className="text-[#05ff5e]">● Live</span>
              <span>♧<sup className="ml-[-3px] rounded-full bg-red-500 px-1 text-[8px] text-white">6</sup></span>
              <span>?</span>
              <span className="grid size-8 place-items-center rounded-full bg-[#0b3158] text-[11px]">JS</span>
              <span>John Smith<br /><span className="text-slate-500">OEM Admin</span></span>
              <span>⌄</span>
            </div>
          </header>
          {children}
          <footer className="absolute bottom-0 left-5 right-5 flex h-[42px] items-center justify-between border-t border-cyan-300/10 text-[10px] text-slate-500">
            <div>© 2025 XECO Energy Corporation. All rights reserved.</div>
            <div className="flex gap-8 text-[#05ff5e]"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/support">Support</a></div>
            <div>Data updated: May 18, 2025 10:15 AM <span className="ml-5 text-[#05ff5e]">▥ Live</span></div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function AlarmEventsWideShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[150px_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-cyan-300/10 bg-[#030c15] px-3 py-3">
          <div className="mb-4 border-b border-white/8 pb-3">
            <div className="text-[31px] font-black italic leading-none tracking-[-0.13em]"><span className="text-[#03f45f]">X</span><span className="text-white">ECO</span></div>
            <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.5em] text-[#16ff5d]">Energy</div>
          </div>
          <nav className="min-h-0 flex-1 overflow-hidden text-[9px]">
            <div className="mb-2 text-[8px] font-bold uppercase text-[#05ff5e]">Home</div>
            <a className="flex h-[22px] items-center gap-1.5 rounded px-1 text-slate-300" href="/enterprise/dashboard">⌘ Enterprise Dashboard</a>
            <a className="flex h-[22px] items-center gap-1.5 rounded px-1 text-slate-300" href="/enterprise/energy-dashboard">◎ Energy Dashboard</a>
            <div className="mt-3 text-[8px] font-bold uppercase text-[#05ff5e]">Intelligence</div>
            {["Capacity Intelligence", "Digital Twin", "Sites", "Transformers", "Current Analysis", "Savings & Forecast"].map((label) => <a className="mt-1 flex h-[20px] items-center gap-1.5 rounded px-1 text-slate-300" href="/enterprise/dashboard" key={label}>⌾ {label}</a>)}
            <div className="mt-3 text-[8px] font-bold uppercase text-[#05ff5e]">Operations</div>
            <a className="mt-1 flex h-[22px] items-center gap-1.5 rounded border-l-2 border-[#05ff5e] bg-[#063b27] px-1 text-[#05ff5e]" href="/enterprise/alerts-events">⚠ Alarms & Events <b className="ml-auto grid size-4 place-items-center rounded-full bg-red-500 text-[8px] text-white">16</b></a>
            <a className="mt-1 flex h-[20px] items-center gap-1.5 rounded px-1 text-slate-300" href="/enterprise/reports">▦ Reports</a>
            <div className="mt-3 text-[8px] font-bold uppercase text-[#05ff5e]">Devices</div>
            <div className="mt-1 flex h-[22px] items-center justify-between rounded px-1 text-slate-300">▣ Devices <span>⌄</span></div>
            <div className="mt-3 border-t border-white/8 pt-2 text-[8px] font-bold uppercase text-[#05ff5e]">System</div>
            <a className="mt-1 flex h-[20px] items-center gap-1.5 rounded px-1 text-slate-300" href="/administration/settings">⚙ Settings</a>
          </nav>
          <div className="mt-3 rounded-md border border-cyan-300/12 bg-[#041722] p-3 text-center">
            <div className="text-[10px] leading-snug text-slate-300">XECO Current<br />Balance Index™</div>
            <div className="mt-2 text-[44px] font-light leading-none text-[#05ff5e]">96</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-200">A+ Rating</div>
            <a className="mt-3 block text-[10px] text-[#05ff5e]" href="/enterprise/current-analysis">View Details →</a>
          </div>
        </aside>
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)] px-5">
          <header className="flex h-[52px] items-center justify-between border-b border-cyan-300/10">
            <div className="text-[12px] font-semibold uppercase tracking-wide">XECO ENERGY INTELLIGENCE PORTAL</div>
            <div className="flex items-center gap-4 text-[10px] text-slate-300">
              <span className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2">▣ Flex Tijuana ⌄</span>
              <span className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-2">▣ May 12 – May 18, 2025 ⌄</span>
              <span>♧<sup className="ml-[-3px] rounded-full bg-red-500 px-1 text-[8px] text-white">16</sup></span>
              <span>?</span>
              <span className="grid size-8 place-items-center rounded-full bg-slate-800 text-[11px]">●</span>
              <span>Greg Dockery<br /><span className="text-slate-500">Administrator</span></span>
              <span>⌄</span>
            </div>
          </header>
          {children}
          <footer className="absolute bottom-0 left-5 right-5 flex h-[42px] items-center justify-between border-t border-cyan-300/10 text-[10px] text-slate-500">
            <div>© 2025 XECO Energy Corporation. All rights reserved.</div>
            <div className="flex gap-8 text-[#05ff5e]"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/support">Support</a></div>
            <div>Data updated: May 18, 2025 10:15 AM <span className="ml-5 text-[#05ff5e]">▥ Live</span></div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function AlarmEventsSelect({ label, value }: { label: string; value: string }) {
  return <label className="text-[9px] text-slate-400">{label}<span className="ml-2 inline-block min-w-[92px] rounded border border-slate-700 bg-[#061421] px-3 py-2 text-slate-200">{value} ⌄</span></label>;
}

function AlarmMetricCard({ color, detail, icon, label, subdetail, value }: { color: string; detail: string; icon: string; label: string; subdetail: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-cyan-300/12 bg-[#061521]/92 p-4">
      <div className="grid grid-cols-[48px_1fr] gap-3">
        <div className="grid size-11 place-items-center rounded-full text-[22px] text-white" style={{ background: color }}>{icon}</div>
        <div>
          <div className="text-[9px] uppercase text-slate-400">{label}</div>
          <div className="mt-1 text-[26px] font-semibold leading-none text-white">{value}</div>
          <div className="mt-2 text-[9px] text-slate-300">{detail}</div>
          {subdetail ? <div className="mt-1 text-[8px] text-slate-500">{subdetail}</div> : null}
        </div>
      </div>
      <svg className="mt-2 h-5 w-full" viewBox="0 0 140 24" preserveAspectRatio="none"><polyline fill="none" points="0,18 12,16 24,10 36,15 48,7 60,13 72,6 84,12 96,5 108,14 120,8 132,16 140,9" stroke={color} strokeWidth="2" /></svg>
    </div>
  );
}

function AlarmEventsTabs() {
  return <nav className="flex h-[36px] border-b border-cyan-300/10 text-[10px] text-slate-300">{["Active Alarms", "Alarm History", "Event Log"].map((tab, index) => <span className={index === 0 ? "border-b-2 border-[#05ff5e] px-7 py-3 text-white" : "px-7 py-3"} key={tab}>{tab}</span>)}</nav>;
}

function AlarmEventsPanel({ action, children, className = "", title }: { action?: string; children: ReactNode; className?: string; title: string }) {
  return <section className={`overflow-hidden rounded-md border border-cyan-300/12 bg-[#061521]/92 p-3 ${className}`}><div className="mb-2 flex items-center justify-between"><h2 className="text-[11px] font-semibold uppercase tracking-wide">{title}</h2>{action ? <span className="text-[9px] text-[#05ff5e]">{action}</span> : null}</div>{children}</section>;
}

function AlarmEventsAlarmsTable() {
  const rows = [
    ["Critical", "May 18, 2025 10:12 AM", "Main Transformer T-1", "Transformer Load", "Greater Than", "96%", "90%", "Unacknowledged", "◎ ◎ ◎"],
    ["Critical", "May 18, 2025 09:47 AM", "Main Switchgear MSB", "THD-L1 (3rd)", "Greater Than", "18.7%", "15.0%", "Unacknowledged", "◎ ◎ ◎"],
    ["Warning", "May 18, 2025 09:58 AM", "Feeder C", "Power Factor", "Less Than", "0.78", "0.85", "Acknowledged", "◎ ◎ ◎"],
    ["Warning", "May 18, 2025 09:52 AM", "Panel D1", "Voltage Imbalance", "Greater Than", "2.8%", "2.0%", "Acknowledged", "◎ ◎ ◎"],
    ["Warning", "May 18, 2025 09:35 AM", "HVAC System", "Phase Imbalance", "Greater Than", "3.1%", "3.0%", "Unacknowledged", "◎ ◎ ◎"],
    ["Info", "May 18, 2025 10:01 AM", "Gateway GW-3", "Communication", "Device Online", "—", "—", "Active", "◎ ◎ ◎"],
    ["Info", "May 18, 2025 09:32 AM", "APF-100 #2", "Device Status", "Device Restarted", "—", "—", "Active", "◎ ◎ ◎"],
    ["Info", "May 18, 2025 08:45 AM", "Meter PM-12", "Data Quality", "Data Recovered", "—", "—", "Active", "◎ ◎ ◎"],
  ];
  return <AlarmEventsTable headers={["Severity", "Time", "Asset / Location", "Parameter", "Condition", "Current Value", "Threshold", "Status", "Duration", "Actions"]} rows={rows.map((row, index) => [...row.slice(0, 8), ["2h 14m", "2h 39m", "1h 02m", "1h 23m", "3h 46m", "45m", "1h 10m", "2h 12m"][index], row[8]])} />;
}

function AlarmEventsRulesTable() {
  return <AlarmEventsTable headers={["#", "Rule Name", "Category", "Parameter", "Condition", "Threshold", "Current Value", "Status", "Notifications", "Actions"]} rows={[["1", "Peak kW Demand Alert", "Utility", "Peak kW Demand (15 Min)", "Greater Than", "2,500 kW", "2,410 kW", "Normal", "✉  💬", "✎  🗑"], ["2", "kVA Demand Alert", "Utility", "kVA Demand (15 Min)", "Greater Than", "3,000 kVA", "2,920 kVA", "Warning", "✉  💬", "✎  🗑"], ["3", "Transformer Capacity Alert", "Capacity", "Transformer T-1 Load", "Greater Than", "85%", "84%", "Near Limit", "✉  💬", "✎  🗑"], ["4", "Current Balance Index Alert", "Current Balance", "Current Balance Index™", "Less Than", "80", "96", "Normal", "✉  💬", "✎  🗑"], ["5", "Monthly Savings Alert", "Savings", "Monthly Savings ($)", "Less Than", "$25,000", "$41,320", "Normal", "✉  💬", "✎  🗑"], ["6", "Utility Cost Forecast Alert", "Utility", "Forecasted Cost (Monthly)", "Greater Than", "$100,000", "$94,800", "Normal", "✉  💬", "✎  🗑"]]} footer="Drag to reorder rules (top to bottom). Rules are evaluated from top to bottom." />;
}

function AlarmEventsTable({ footer, headers, rows }: { footer?: string; headers: string[]; rows: string[][] }) {
  return <div className="text-[8px]"><table className="w-full text-left"><thead className="text-slate-500"><tr>{headers.map((h) => <th className="pb-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-t border-white/5" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td className={`py-1.5 ${/Critical|Unacknowledged/.test(cell) ? "text-red-400" : /Warning|Near/.test(cell) ? "text-yellow-400" : /Info|Active/.test(cell) ? "text-blue-400" : /Normal|Acknowledged/.test(cell) ? "text-[#05ff5e]" : "text-slate-300"}`} key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table>{footer ? <div className="mt-3 text-[8px] text-slate-400">↕ {footer}<a className="float-right text-[#05ff5e]" href="/enterprise/alarms-events/alarm-events">View All Rules →</a></div> : <div className="mt-2 flex justify-between text-[8px] text-slate-400"><span>Showing 1 to 8 of 10 active alarms</span><a className="text-[#05ff5e]" href="/enterprise/alarms-events/alarm-events">View All Alarms →</a></div>}</div>;
}

function AlarmEventsRuleFormWide() {
  return (
    <div className="text-[9px]">
      <div className="mb-4 flex items-center gap-3 text-[9px]"><span className="rounded-full bg-[#05ff5e] px-2 py-1 text-[#03110a]">1 Define Rule</span><span className="text-slate-500">2 Set Notifications</span><span className="text-slate-500">3 Review</span></div>
      <AlarmEventsField label="Alert Name" value="Peak kW Demand Alert" />
      <div className="mt-3 grid grid-cols-2 gap-3"><AlarmEventsField label="Category" value="Utility ⌄" /><AlarmEventsField label="Parameter" value="Peak kW Demand (15 Min) ⌄" /></div>
      <div className="mt-3 grid grid-cols-2 gap-3"><AlarmEventsField label="Condition" value="Greater Than (>) ⌄" /><AlarmEventsField label="Threshold Value" value="2,500      kW ⌄" /></div>
      <div className="mt-3 grid grid-cols-2 gap-3"><AlarmEventsField label="For How Long" value="15 Minutes ⌄" /><AlarmEventsField label="Severity" value="● Warning ⌄" /></div>
      <AlarmEventsField className="mt-3" label="Applies To" value="Entire Site ⌄" />
      <label className="mt-3 block text-slate-400">Description (Optional)<textarea className="mt-1 h-[64px] w-full resize-none rounded border border-slate-700 bg-[#07131f] px-3 py-2 text-slate-200" defaultValue="Alert when 15-min peak kW demand exceeds 2,500 kW." /></label>
      <div className="mt-3 flex justify-between"><AlarmButton>Cancel</AlarmButton><AlarmButton primary>Next: Set Notifications →</AlarmButton></div>
    </div>
  );
}

function AlarmEventsField({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return <label className={`block text-slate-400 ${className}`}>{label}<div className="mt-1 rounded border border-slate-700 bg-[#07131f] px-3 py-2 text-slate-200">{value}</div></label>;
}

function SetNotificationsStepper() {
  const steps = [
    ["✓", "Define Rule", "done"],
    ["2", "Set Notifications", "current"],
    ["3", "Review", "next"],
  ];

  return (
    <div className="flex items-start gap-7">
      {steps.map(([number, label, state], index) => (
        <div className="flex items-start gap-7" key={label}>
          <div className="grid justify-items-center gap-1">
            <div className={state === "done" ? "grid size-8 place-items-center rounded-full bg-[#05ff5e] text-[13px] font-bold text-[#03110a]" : state === "current" ? "grid size-8 place-items-center rounded-full border-2 border-[#147dff] bg-[#071b32] text-[13px] font-bold text-white shadow-[0_0_16px_rgba(20,125,255,.38)]" : "grid size-8 place-items-center rounded-full border border-slate-500 bg-[#061421] text-[13px] font-bold text-slate-300"}>{number}</div>
            <div className={state === "done" ? "text-[9px] text-[#05ff5e]" : state === "current" ? "text-[9px] text-[#58a6ff]" : "text-[9px] text-slate-500"}>{label}</div>
          </div>
          {index < steps.length - 1 ? <div className="mt-4 h-px w-16 bg-cyan-300/18" /> : null}
        </div>
      ))}
    </div>
  );
}

function SetNotifyPanel({ action, children, subtitle, title }: { action?: string; children: ReactNode; subtitle?: string; title: string }) {
  return (
    <section className="overflow-hidden rounded-md border border-cyan-300/12 bg-[#061521]/92 p-4">
        <div className="mb-2.5 flex items-start justify-between">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wide">{title}</h2>
          {subtitle ? <p className="mt-1 text-[9px] text-slate-400">{subtitle}</p> : null}
        </div>
        {action ? <button className="rounded border border-cyan-300/12 bg-[#061421] px-3 py-1.5 text-[10px] text-slate-200" type="button">{action}</button> : null}
      </div>
      {children}
    </section>
  );
}

function SetNotifyChannels({ data }: { data: SetNotificationsData }) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {data.channels.map((channel) => (
        <div className="flex h-[128px] flex-col rounded-md border border-cyan-300/12 bg-[#07131f] p-4" key={channel.title}>
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 bg-[#061421] text-[20px]" style={{ borderColor: channel.color, color: channel.color }}>{channel.icon}</span>
            <div><div className="text-[12px] font-semibold">{channel.title}</div><p className="mt-1 text-[9px] leading-snug text-slate-400">{channel.text}</p></div>
          </div>
          <span className={channel.enabled ? "mt-auto inline-flex h-5 w-9 items-center rounded-full bg-[#1f7aff] p-0.5 shadow-[0_0_12px_rgba(31,122,255,.45)]" : "mt-auto inline-flex h-5 w-9 items-center rounded-full bg-slate-600/70 p-0.5"}>
            <span className={channel.enabled ? "ml-auto block size-4 rounded-full bg-white" : "block size-4 rounded-full bg-white"} />
          </span>
        </div>
      ))}
    </div>
  );
}

function SetNotifyRecipients({ data }: { data: SetNotificationsData }) {
  if (!data.recipients.length) {
    return <AlarmNoData message={data.message || "No notification recipients were found in tracking for this alert rule."} />;
  }

  return (
    <div className="text-[9px]">
      <table className="w-full text-left">
        <thead className="text-slate-500"><tr>{["Recipient", "Type", "Channels", "Schedule", "Severity Filter", "Escalation", "Status", "Actions"].map((header) => <th className="pb-1.5 font-medium" key={header}>{header}</th>)}</tr></thead>
        <tbody>
          {data.recipients.map((recipient) => (
            <tr className="border-t border-white/5" key={`${recipient.name}-${recipient.email}`}>
              <td className="py-2 text-slate-200"><div className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full border border-cyan-300/20 text-[8px] text-[#147dff]">{recipient.initials}</span><span><b>{recipient.name}</b><br /><span className="text-[7.5px] text-slate-500">{recipient.email}</span></span></div></td>
              <td className="py-2"><span className="rounded border border-cyan-300/12 bg-[#061421] px-2 py-0.5 text-slate-300">{recipient.type}</span></td>
              <td className="py-2"><div className="flex items-center gap-2">{recipient.channelIcons.map((icon) => <span className="text-[13px] leading-none text-[#147dff]" key={icon}>{icon}</span>)}</div></td>
              <td className="py-2 text-slate-300">{recipient.schedule}</td>
              <td className="py-2"><div className="flex items-center gap-2">{recipient.severityColors.map((color) => <span className="block size-2 rounded-full" key={color} style={{ background: color }} />)}</div></td>
              <td className="py-2 text-[#05ff5e]">{recipient.escalation}</td>
              <td className="py-2"><SetNotifyToggle enabled={recipient.status === "Enabled"} /></td>
              <td className="py-2"><div className="flex gap-2"><button className="grid size-6 place-items-center rounded border border-cyan-300/12 bg-[#061421]" type="button">✎</button><button className="grid size-6 place-items-center rounded border border-cyan-300/12 bg-[#061421]" type="button">🗑</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 text-[9px] text-slate-400">Showing 1 to {data.recipients.length} of {data.recipients.length} recipients</div>
    </div>
  );
}

function SetNotifyEscalation({ data }: { data: SetNotificationsData }) {
  const byLabel = new Map(data.escalationRows.map((row) => [row.label, row.value]));

  return (
    <div className="grid grid-cols-[1fr_1.45fr_1fr_1fr_1.25fr] gap-4 text-[10px]">
      <SetNotifyField label="Escalation Delay" value={byLabel.get("Escalation Delay") ?? "No Data"} />
      <SetNotifyField label="Escalate To" value={byLabel.get("Escalate To") ?? "No Data"} />
      <SetNotifyField label="Repeat Every" value={byLabel.get("Repeat Every") ?? "No Data"} />
      <SetNotifyField label="Max Escalations" value={byLabel.get("Max Escalations") ?? "No Data"} />
      <div>
        <div className="flex items-start justify-between gap-3 text-slate-400"><span>Auto Resolve When Condition Clears</span><SetNotifyToggle enabled={byLabel.get("Auto Resolve When Condition Clears") === "Enabled"} /></div>
        <p className="mt-3 text-[9px] leading-snug text-slate-400">Automatically notify when condition returns to normal.</p>
      </div>
    </div>
  );
}

function SetNotifyField({ label, value }: { label: string; value: string }) {
  return <label className="block text-slate-400">{label}<div className="mt-2 rounded border border-slate-700 bg-[#07131f] px-3 py-2.5 text-slate-200">{value}</div></label>;
}

function SetNotifyRuleSummary({ data }: { data: SetNotificationsData }) {
  return <div className="text-[9px]"><div className="mb-3 flex items-center gap-3"><span className="text-[22px] text-yellow-500">⌘</span><span className="text-[12px] font-semibold">{data.ruleName}</span></div>{data.ruleSummary.map((row) => <div className="mb-1.5 flex justify-between" key={row.label}><span className="text-slate-400">{row.label}</span><span>{row.value}</span></div>)}</div>;
}

function SetNotifyPreview({ data }: { data: SetNotificationsData }) {
  return <div className="space-y-2 text-[9px]">{data.previewItems.map((item, index) => <div key={item.text}><div className="grid grid-cols-[30px_1fr] items-center gap-3"><span className="grid size-7 place-items-center rounded-full border text-[13px]" style={{ borderColor: item.color, color: item.color }}>{item.icon}</span><span>{item.text}</span></div>{index < data.previewItems.length - 1 ? <div className="ml-3.5 mt-0.5 text-slate-500">↓</div> : null}</div>)}</div>;
}

function SetNotifyToggle({ enabled }: { enabled: boolean }) {
  return <span className={enabled ? "inline-flex h-5 w-10 items-center rounded-full bg-[#1f7aff] p-0.5 shadow-[0_0_12px_rgba(31,122,255,.45)]" : "inline-flex h-5 w-10 items-center rounded-full bg-slate-600/70 p-0.5"}><span className={enabled ? "ml-auto block size-4 rounded-full bg-white" : "block size-4 rounded-full bg-white"} /></span>;
}

function ConfigurePanel({ children, number, title }: { children: ReactNode; number: string; title: string }) {
  return (
    <section className="overflow-hidden rounded-md border border-cyan-300/12 bg-[#061521]/92 p-4">
      <h2 className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold"><span className="grid size-5 place-items-center rounded-full bg-[#147dff] text-[10px]">{number}</span>{title}</h2>
      {children}
    </section>
  );
}

function ConfigureSidePanel({ children, title }: { children: ReactNode; title: string }) {
  return <section className="overflow-hidden rounded-md border border-cyan-300/12 bg-[#061521]/92 p-4"><h2 className="mb-3 text-[12px] font-semibold">{title}</h2>{children}</section>;
}

function ConfigureAlertInfo() {
  return <div className="grid grid-cols-[1fr_1.45fr_120px_120px] gap-4 text-[9px]"><ConfigureField label="Alert Name" required value="High Demand Alert" /><ConfigureField label="Description" value="Alert when demand exceeds threshold" /><ConfigureField label="Priority" required value="↑ High ⌄" /><ConfigureField label="Status" value="● Active" /></div>;
}

function ConfigureScope() {
  return (
    <div className="grid grid-cols-[230px_1fr_280px] gap-6 text-[9px]">
      <div><div className="mb-2 text-slate-400">Apply To <span className="text-red-400">*</span></div><div className="text-slate-300">○ Entire Network</div><div className="mt-3 text-[#147dff]">● Specific Assets</div><ConfigureField className="mt-3" label="Asset Type" value="Transformer ⌄" /></div>
      <ConfigureField label="Assets" required value={"Main Transformer (TXFR-01)  ×\nTransformer T-2 (TXFR-02)  ×\n\n2 assets selected"} />
      <div className="space-y-3"><ConfigureField label="Site" value="Flex Tijuana Manufacturing ⌄" /><ConfigureField label="Electrical Room / Location" value="Main Electrical Room ⌄" /></div>
    </div>
  );
}

function ConfigureTriggers() {
  const rows = [["◎", "Demand (kW)", "Greater Than (>)", "1,200", "kW", "15", "min", "🗑"], ["OR", "Power Factor (PF)", "Less Than (<)", "0.90", "PF", "10", "min", "🗑"]];
  return <div className="text-[9px]"><table className="w-full text-left"><thead className="text-slate-500"><tr>{["", "Parameter", "Condition", "Threshold", "", "Duration", "", ""].map((h, i) => <th className="pb-2 font-medium" key={`${h}-${i}`}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-white/5" key={row[1]}>{row.map((cell, i) => <td className={`py-2 ${i === 7 ? "text-red-400" : i === 0 ? "text-[#05ff5e]" : "text-slate-300"}`} key={`${row[1]}-${i}`}>{cell}</td>)}</tr>)}</tbody></table><a className="mt-2 block text-[#147dff]" href="/enterprise/alarms-events/configure-alerts-page-alert-rules">+ Add Condition</a></div>;
}

function ConfigureNotifications() {
  return (
    <div className="grid grid-cols-[220px_270px_1fr] gap-6 text-[8.5px]">
      <div><div className="mb-1.5 text-slate-400">Notification Channels</div>{["In-Portal Alerts", "Email", "SMS / Text", "Push Notification", "Webhook"].map((item) => <div className="mt-1 text-slate-300" key={item}>☑ {item}</div>)}</div>
      <ConfigureField label="Recipients" value={"john.smith@flex.com  ×\nmaintenance@flex.com  ×\nfacility.manager@flex.com  ×\n+ Add Recipient"} />
      <div><div className="text-slate-300">☑ Enable Escalation</div><div className="mt-3 grid grid-cols-2 gap-3"><ConfigureField label="Escalate after" value="30    min" /><ConfigureField label="Escalate to" value="operations.manager@flex.com ⌄" /></div></div>
    </div>
  );
}

function ConfigureAdvanced() {
  return <div className="grid grid-cols-[1fr_1.15fr_1fr_1fr_1fr] gap-4 text-[9px]"><ConfigureField label="Alert Evaluation Frequency" value="1 minute ⌄" /><ConfigureField label="Clear Condition" value="Auto (When condition normalizes) ⌄" /><ConfigureField label="Hysteresis (Optional)" value="5          %" /><ConfigureField label="Debounce Time (Optional)" value="2          min" /><div><div className="text-slate-400">Suppress Alerts ⓘ</div><div className="mt-2 flex items-center gap-2"><SetNotifyToggle enabled={false} /><span className="text-slate-300">Off</span></div></div></div>;
}

function ConfigureField({ className = "", label, required = false, value }: { className?: string; label: string; required?: boolean; value: string }) {
  return <label className={`block text-slate-400 ${className}`}>{label}{required ? <span className="text-red-400"> *</span> : null}<div className="mt-1 whitespace-pre-line rounded border border-slate-700 bg-[#07131f] px-3 py-1.5 text-slate-200">{value}</div></label>;
}

function ConfigureRuleSummary() {
  const rows = [["Alert Name", "High Demand Alert"], ["Priority", "↑ High"], ["Status", "● Active"], ["Scope", "2 Assets\nTXFR-01, TXFR-02\nFlex Tijuana Manufacturing\nMain Electrical Room"]];
  return <div className="text-[10px]">{rows.map(([label, value]) => <div className="mb-3 grid grid-cols-[86px_1fr] gap-3" key={label}><span className="text-slate-400">{label}</span><span className="whitespace-pre-line">{value}</span></div>)}<div className="mt-4 border-t border-white/8 pt-3"><div className="mb-2 text-slate-400">Conditions</div><div><span className="text-yellow-400">●</span> Demand (kW) &gt; 1,200 kW for 15 min</div><div className="mt-1"><span className="text-[#05ff5e]">●</span> OR Power Factor (PF) &lt; 0.90 for 10 min</div></div><div className="mt-4 border-t border-white/8 pt-3"><div className="mb-2 text-slate-400">Notifications</div><div>☑ In-Portal Alerts</div><div>✉ Email (3 recipients)</div><div>🔔 Push Notification</div></div><div className="mt-4"><div className="text-slate-400">Escalation</div><div>After 30 min to operations.manager@flex.com</div></div></div>;
}

function ConfigureRecentActivity() {
  const rows = [["↑", "High Demand Alert", "TXFR-01", "10:12 AM"], ["⚠", "Low Power Factor Alert", "Panel LP-3", "9:58 AM"], ["ⓘ", "Transformer Temp Alert", "T-2", "9:41 AM"]];
  return <div className="space-y-4 text-[10px]">{rows.map(([icon, title, asset, time]) => <div className="grid grid-cols-[18px_1fr_auto] gap-2" key={title}><span className={icon === "↑" ? "text-red-400" : icon === "⚠" ? "text-yellow-400" : "text-blue-400"}>{icon}</span><span>{title}<br /><span className="text-slate-500">{asset}</span></span><span className="text-slate-400">{time}</span></div>)}<a className="block pt-1 text-[#05ff5e]" href="/enterprise/alarms-events/alarm-events">View All Alerts →</a></div>;
}

function AlarmButton({ children, primary = false }: { children: ReactNode; primary?: boolean }) {
  return <button className={`rounded border px-6 py-2.5 ${primary ? "border-blue-500 bg-blue-600 text-white" : "border-slate-700 bg-[#061421] text-slate-300"}`}>{children}</button>;
}

function AlarmSummaryTile({ color = "#cbd5e1", detail, icon, title, value }: { color?: string; detail: string; icon?: string; title: string; value: string }) {
  return (
    <div className="border-r border-white/5 px-5 py-4 text-[10px] last:border-r-0">
      <div className="text-slate-400">{title}</div>
      <div className="mt-3 flex items-center gap-2 font-semibold" style={{ color }}>{icon ? <span className="text-[18px] leading-none">{icon}</span> : null}<span>{value}</span></div>
      <p className="mt-2 whitespace-pre-line leading-snug text-slate-300">{detail.replace("|", "\n")}</p>
    </div>
  );
}

function AlarmTabs() {
  const tabs = ["Overview", "Asset Details", "Metrics & Trends", "Notifications", "History", "Notes", "Actions Taken"];
  return <nav className="mt-3 flex h-[36px] gap-0 border-b border-cyan-300/10 text-[10px] text-slate-300">{tabs.map((tab, index) => <span className={index === 0 ? "bg-[#063052] px-8 py-3 text-white" : "px-8 py-3"} key={tab}>{tab}</span>)}</nav>;
}

function AlarmPanel({ action, children, className = "", compact = false, title }: { action?: string; children: ReactNode; className?: string; compact?: boolean; title: string }) {
  return <section className={`overflow-hidden rounded-md border border-cyan-300/12 bg-[#061521]/92 ${compact ? "p-3" : "p-4"} ${className}`}><div className={`${compact ? "mb-2" : "mb-3"} flex items-center justify-between`}><h2 className={compact ? "text-[10px] font-semibold" : "text-[12px] font-semibold"}>{title}</h2>{action ? <span className="rounded border border-cyan-300/12 bg-[#061421] px-2 py-1 text-[9px] text-slate-300">{action}</span> : null}</div>{children}</section>;
}

function AlarmTimelineWide({ data }: { data: AlarmDetailData }) {
  if (!data.timeline.length) {
    return <AlarmNoData message={data.message || "No alarm timeline records were found in tracking."} />;
  }

  return <div className="relative space-y-4 pl-3 text-[9px] before:absolute before:left-[8px] before:top-2 before:h-[246px] before:w-px before:bg-slate-600/70">{data.timeline.map((event) => <div className="grid grid-cols-[64px_1fr] gap-3" key={`${event.time}-${event.title}`}><span className="text-slate-400">{event.time}</span><div className="relative pl-4"><span className="absolute left-[-12px] top-0 grid size-3 place-items-center rounded-full" style={{ background: event.color }} /><div className="font-semibold" style={{ color: event.color }}>{event.title}</div><div className="mt-1 text-[8px] text-slate-400">{event.detail}</div></div></div>)}<a className="block pt-1 text-[9px] text-[#05ff5e]" href="/enterprise/alerts-events/alarm-detail-page">View Full History →</a></div>;
}

function DemandChartWide({ data }: { data: AlarmDetailData }) {
  const hasAlarm = data.state === "data";

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 text-[10px]">
        {data.demandStats.map((stat, index) => <AlarmStat key={stat.label} label={stat.label} red={index === 0 && hasAlarm} value={stat.value} />)}
      </div>
      {hasAlarm ? (
        <>
          <svg className="mt-4 h-[222px] w-full" viewBox="0 0 680 230" preserveAspectRatio="none">
            <defs><linearGradient id="alarmArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity=".26" /><stop offset="100%" stopColor="#ef4444" stopOpacity=".03" /></linearGradient></defs>
            {Array.from({ length: 7 }).map((_, index) => <line key={`h-${index}`} x1="0" x2="680" y1={28 + index * 30} y2={28 + index * 30} stroke="#123044" strokeWidth="1" />)}
            {Array.from({ length: 7 }).map((_, index) => <line key={`v-${index}`} x1={40 + index * 95} x2={40 + index * 95} y1="10" y2="210" stroke="#123044" strokeWidth="1" />)}
            <line x1="0" x2="680" y1="82" y2="82" stroke="#ef4444" strokeDasharray="5 5" />
            <line x1="410" x2="410" y1="45" y2="210" stroke="#ef4444" strokeWidth="2" />
            <polygon fill="url(#alarmArea)" points="0,172 35,168 70,174 105,164 140,170 175,154 210,160 245,138 280,126 315,100 350,92 385,82 420,88 455,78 490,91 525,80 560,91 595,74 630,92 680,84 680,230 0,230" />
            <polyline fill="none" points="0,172 35,168 70,174 105,164 140,170 175,154 210,160 245,138 280,126 315,100 350,92 385,82 420,88 455,78 490,91 525,80 560,91 595,74 630,92 680,84" stroke="#ef4444" strokeWidth="2.3" />
            <rect x="414" y="42" width="122" height="20" rx="3" fill="#ef4444" /><text x="424" y="56" fill="white" fontSize="10">Alarm Triggered</text>
          </svg>
          <div className="mt-1 flex justify-between text-[9px] text-slate-500"><span>-30m</span><span>-20m</span><span>-10m</span><span>Alarm</span><span>+10m</span><span>+20m</span></div>
          <div className="mt-2 flex justify-center gap-8 text-[9px] text-slate-300"><span className="text-red-400">━ Demand (kW)</span><span className="text-red-400">--- Threshold</span></div>
        </>
      ) : <div className="mt-4 h-[252px]"><AlarmNoData message="No alarm-specific demand trend was found in tracking." /></div>}
    </div>
  );
}

function AlarmStat({ label, red = false, value }: { label: string; red?: boolean; value: string }) {
  return <div className="rounded border border-cyan-300/12 bg-[#07131f] p-3"><div className="text-slate-400">{label}</div><div className={red ? "mt-2 text-[14px] font-semibold text-red-400" : "mt-2 text-[14px] font-semibold text-white"}>{value}</div></div>;
}

function AlarmImpactWide({ data }: { data: AlarmDetailData }) {
  return <div className="space-y-1.5 text-[8.5px]">{data.impactRows.map((row, index) => <div className="flex justify-between" key={row.label}><span className="text-slate-400">{row.label}</span><span className={index === 4 && row.value !== "No Data" ? "text-red-400" : "text-white"}>{row.value}</span></div>)}<div className="mt-1.5 h-1 rounded bg-slate-700"><div className={data.state === "data" ? "h-1 w-[92%] rounded bg-red-500" : "h-1 w-0 rounded bg-red-500"} /></div></div>;
}

function RecommendedActionsWide({ data }: { data: AlarmDetailData }) {
  return <div className="space-y-1.5 text-[8.5px] text-slate-300">{data.recommendedActions.map((item) => <div className="flex gap-2" key={item.text}><span className="text-[#05ff5e]">●</span><span>{item.text}</span></div>)}<a className="block pt-0.5 text-[#05ff5e]" href="/enterprise/alerts-events/alarm-detail-page">View Optimization Recommendations →</a></div>;
}

function RelatedAlarmsWide({ data }: { data: AlarmDetailData }) {
  if (!data.relatedAlarms.length) {
    return <AlarmNoData message="No related alarm records were found in tracking." />;
  }

  return <div className="space-y-1 text-[8px] text-slate-300">{data.relatedAlarms.map((alarm) => <div className="grid grid-cols-[14px_1fr_auto] gap-1.5" key={`${alarm.label}-${alarm.date}`}><span className={alarm.icon === "↑" ? "text-red-400" : alarm.icon === "⚠" ? "text-yellow-400" : "text-blue-400"}>{alarm.icon}</span><span>{alarm.label}<br /><span className="text-[7px] text-slate-500">{alarm.date}</span></span><span className="text-slate-500">Duration: {alarm.duration}</span></div>)}<a className="block text-[#05ff5e]" href="/enterprise/alarms-events/alarm-events">View All Alarms →</a></div>;
}

function TriggerConditionsWide({ data }: { data: AlarmDetailData }) {
  return (
    <div className="text-[8px]">
      <table className="w-full text-left">
        <thead className="text-slate-500"><tr>{["Parameter", "Condition", "Threshold", "Actual Value", "Duration", "Status"].map((h) => <th className="pb-1.5 font-medium" key={h}>{h}</th>)}</tr></thead>
        <tbody>{data.triggerConditions.map((row) => {
          const cells = [row.parameter, row.condition, row.threshold, row.actualValue, row.duration, `● ${row.status}`];
          return <tr className="border-t border-white/5" key={row.parameter}>{cells.map((cell, index) => <td className={`py-1 ${/Triggered/.test(cell) ? "text-red-400" : /Normal/.test(cell) ? "text-[#05ff5e]" : index === 0 ? "text-slate-200" : "text-slate-300"}`} key={`${row.parameter}-${index}`}>{cell}</td>)}</tr>;
        })}</tbody>
      </table>
      <a className="mt-1 block text-[#05ff5e]" href="/enterprise/alerts-events/alarm-detail-page">View All Conditions →</a>
    </div>
  );
}

function AlarmNoData({ message }: { message: string }) {
  return <div className="grid h-full place-items-center rounded border border-amber-400/25 bg-amber-500/8 p-3 text-center text-[9px] leading-relaxed text-amber-200">{message}</div>;
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

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-left text-[7px]"><thead className="text-slate-500"><tr>{headers.map((h) => <th className="pb-1 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-t border-white/5" key={index}>{row.map((cell, cellIndex) => <td className={`py-1 ${/Active|Normal|Enabled|●/.test(cell) ? "text-[#05ff5e]" : /Critical|Triggered|Unacknowledged/.test(cell) ? "text-red-400" : /Warning|Near/.test(cell) ? "text-yellow-400" : "text-slate-300"}`} key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table>;
}

function AuthScreen({ mode }: { mode: "forgot" | "login" | "mfa" | "reset" | "timeout" }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#02080d] text-slate-100">
      <div className="grid h-full grid-cols-[860px_1fr]">
        <AuthMarketing />
        <main className="flex flex-col justify-center bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.13),transparent_38%),linear-gradient(180deg,#091827,#07111c)] px-10">
          <div className="mx-auto w-full max-w-[540px] rounded-2xl border border-cyan-300/10 bg-[#0c1b29]/92 p-8 shadow-2xl shadow-black/40">
            {mode !== "login" ? <a className="mb-7 block text-[13px] text-sky-400" href="/login">← Back to Sign In</a> : null}
            <div className="mx-auto mb-6 grid size-18 place-items-center rounded-full border border-slate-500 bg-[#07131f] text-[34px] text-[#7ed321]">▣</div>
            {mode === "login" ? <LoginForm /> : null}
            {mode === "forgot" ? <ForgotForm /> : null}
            {mode === "mfa" ? <MfaForm /> : null}
            {mode === "reset" ? <ResetForm /> : null}
            {mode === "timeout" ? <TimeoutForm /> : null}
          </div>
          <div className="mx-auto mt-6 flex w-full max-w-[540px] justify-between text-[11px] text-slate-400">
            <span>© 2024 All rights reserved.</span>
            <span>Version 2.0.0</span>
          </div>
          <div className="mt-3 flex justify-center gap-6 text-[11px] text-slate-400"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></div>
        </main>
      </div>
    </div>
  );
}

function AuthMarketing() {
  const features = [
    ["Current Balance Intelligence™", "Understand how current is utilized across your entire electrical network.", "#7ed321"],
    ["Capacity Intelligence™", "Identify available and recovered capacity to optimize performance and defer capital.", "#00a6ff"],
    ["Digital Twin Intelligence™", "Interactive 3D model of your electrical infrastructure for better decisions.", "#a855f7"],
    ["Savings Intelligence™", "Quantify operational and financial value with real-time accuracy.", "#f59e0b"],
    ["Deployment Intelligence™", "Manage deployments, commissioning, and AI Checks Clear™ certification.", "#00c7b7"],
  ];

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_70%_22%,rgba(0,166,255,.24),transparent_22%),linear-gradient(90deg,#02080d,#07111c)] px-8 py-7">
      <div className="text-[66px] font-black leading-none tracking-[-0.08em]"><span className="text-white">ECB</span><span className="text-[#7ed321]">S</span><span className="align-top text-[14px]">™</span></div>
      <div className="mt-1 text-[17px] font-semibold uppercase tracking-[0.22em]">Operating System™</div>
      <div className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-300">Electrical Infrastructure Intelligence Platform</div>
      <div className="absolute left-[360px] top-[46px] h-[560px] w-[405px] rounded-xl border border-cyan-500/20 bg-[linear-gradient(150deg,rgba(14,165,233,.14),rgba(2,8,13,.15))]" />
      <div className="absolute left-[450px] top-[28px] text-[12px] font-bold uppercase text-cyan-400">Digital Twin Model</div>
      <div className="absolute left-[690px] top-[46px] text-[12px] font-bold uppercase text-cyan-400">PQ Meter</div>
      <div className="absolute left-[682px] top-[92px] grid h-[86px] w-[92px] place-items-center rounded border border-cyan-500/50 bg-[#07131f] text-[10px]">Meter</div>
      <div className="absolute left-[682px] top-[226px] grid h-[78px] w-[92px] place-items-center rounded border border-cyan-500/50 bg-[#111827] text-[15px]">ECBS</div>
      <div className="absolute left-[682px] top-[385px] grid h-[92px] w-[92px] place-items-center rounded border border-cyan-500/50 bg-[#07131f] text-[12px]">ECBS<br />Device</div>
      <div className="relative mt-10 w-[315px]">
        <h1 className="text-[34px] font-bold leading-tight">Intelligence That<br />Optimizes <span className="text-[#7ed321]">Every Amp.</span></h1>
        <p className="mt-4 text-[13px] leading-relaxed text-slate-200">The ECBS Operating System™ delivers network-wide visibility, intelligence, and optimization for electrical infrastructure.</p>
        <div className="mt-5 space-y-3">
          {features.map(([title, text, color]) => (
            <div className="grid grid-cols-[38px_1fr] gap-3" key={title}>
              <div className="grid size-9 place-items-center rounded-full border text-[16px]" style={{ borderColor: color, color }}>⌁</div>
              <div><div className="text-[12px] font-semibold" style={{ color }}>{title}</div><p className="text-[10px] leading-snug text-slate-300">{text}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[76px] left-8 right-8 rounded border border-cyan-300/10 bg-[#061421]/80 p-4">
        <div className="mb-2 text-center text-[9px] font-bold text-[#7ed321]">TRUSTED BY INDUSTRY LEADERS</div>
        <div className="flex items-center justify-around text-[24px] font-bold"><span className="text-sky-400">flex.</span><span>HCA</span><span className="text-purple-400">N:</span><span>Lineage</span><span className="text-[12px]">Data Centers</span><span className="text-[12px]">Manufacturing</span></div>
      </div>
      <footer className="absolute bottom-0 left-0 right-0 grid h-[64px] grid-cols-3 border-t border-white/8 px-8 text-[11px] text-slate-400">
        <div className="flex items-center gap-2"><span className="text-[#7ed321]">▣</span><span><b className="text-[#7ed321]">Enterprise Grade Security</b><br />SOC 2 Type II Compliant</span></div>
        <div className="grid place-items-center text-center"><b className="text-[#7ed321]">Powered by ECBS Technology™</b><br />Electricity Current Balance System™</div>
        <div className="grid place-items-center">ISO 27001 Aligned</div>
      </footer>
    </section>
  );
}

function AuthTitle({ subtitle, title }: { subtitle: string; title: string }) {
  return <div className="text-center"><h1 className="text-[25px] font-semibold">{title}</h1><p className="mt-2 text-[12px] text-slate-300">{subtitle}</p></div>;
}

function AuthInput({ label, value = "" }: { label: string; value?: string }) {
  return <label className="mt-4 block text-[11px] font-semibold text-slate-300">{label}<div className="mt-2 rounded border border-slate-600 bg-[#07131f] px-3 py-3 text-[13px] text-slate-300">▣ {value || `Enter your ${label.toLowerCase()}`}</div></label>;
}

function AuthButton({ children }: { children: ReactNode }) {
  return <button className="mt-5 w-full rounded-md bg-[#68bf20] py-3 text-[16px] font-semibold text-white shadow-lg shadow-green-900/20">{children} →</button>;
}

function LoginForm() {
  return (
    <div>
      <div className="text-center"><h1 className="text-[30px] font-semibold">Welcome Back</h1><p className="mt-3 text-[14px] text-slate-300">Sign in to access the ECBS Operating System™</p></div>
      <div className="mt-6 rounded-lg border border-red-500 bg-red-950/20 p-5 text-[14px]"><b className="text-red-400">● &nbsp; Login Failed</b><p className="mt-2 text-slate-300">The email or password you entered is incorrect. Please try again.</p></div>
      <LoginInput label="Email Address" value="user@ecbs.com" />
      <LoginInput label="Password" value="••••••••" />
      <div className="mt-3 text-[14px] text-red-400">● &nbsp; Invalid email or password.</div>
      <div className="mt-5 flex justify-between text-[13px] text-slate-300"><span>☐ Remember me</span><a className="text-sky-400" href="/login/forgot-password">Forgot Password?</a></div>
      <button className="mt-6 w-full rounded-md bg-[#68bf20] py-4 text-[18px] font-semibold text-white shadow-lg shadow-green-900/20" type="button">Sign In →</button>
      <div className="my-6 flex items-center gap-4 text-[13px] text-slate-400"><span className="h-px flex-1 bg-slate-700" />or continue with<span className="h-px flex-1 bg-slate-700" /></div>
      <div className="grid grid-cols-2 gap-4"><LoginSsoButton>▦ Microsoft SSO</LoginSsoButton><LoginSsoButton>G Google SSO</LoginSsoButton></div>
      <p className="mt-7 text-center text-[13px] text-slate-300">Need help? <a className="text-sky-400" href="/support">Contact Support</a></p>
    </div>
  );
}

function LoginInput({ label, value }: { label: string; value: string }) {
  return <label className="mt-5 block text-[13px] font-semibold text-slate-300">{label}<div className="mt-2 rounded border border-slate-600 bg-[#07131f] px-4 py-3.5 text-[15px] text-slate-300">▣ {value}</div></label>;
}

function LoginSsoButton({ children }: { children: ReactNode }) {
  return <button className="rounded-md border border-slate-600 bg-[#07131f] px-4 py-3 text-[14px] text-slate-200" type="button">{children}</button>;
}

function ForgotForm() {
  return (
    <div>
      <AuthTitle subtitle="" title="Forgot Password" />
      <Progress active={1} labels={["Request", "Verify", "Reset", "Complete"]} />
      <div className="mx-auto my-6 grid size-16 place-items-center rounded-full border border-sky-500 text-[30px] text-sky-400">✉</div>
      <AuthTitle subtitle="Enter your email address and we'll send you a secure link to reset your password." title="Let’s reset your password" />
      <AuthInput label="Email Address" />
      <AuthButton>Send Reset Link</AuthButton>
      <p className="mt-6 text-center text-[11px] text-slate-300">Remember your password? <a className="text-sky-400" href="/login">Sign In</a></p>
      <p className="mt-6 text-center text-[11px] text-slate-300">Need help? <a className="text-sky-400" href="/support">Contact Support</a></p>
    </div>
  );
}

function MfaForm() {
  return (
    <div>
      <div className="text-center"><h1 className="text-[30px] font-semibold">Multi-Factor Authentication</h1><p className="mt-3 text-[14px] text-slate-300">Enter the verification code sent to your device</p></div>
      <div className="mx-auto my-5 grid size-16 place-items-center rounded-full border border-sky-600 text-[30px] text-sky-400">▯</div>
      <p className="text-center text-[14px] text-slate-300">We sent a 6-digit code to<br /><b>g****y@ecbs.com</b></p>
      <div className="mt-5 text-[14px] font-semibold text-slate-300">Verification Code</div>
      <div className="mt-3 grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, index) => <div className={`grid h-16 place-items-center rounded-md border ${index === 0 ? "border-sky-500" : "border-slate-600"} bg-[#07131f] text-[24px]`} key={index}>{index === 0 ? "|" : ""}</div>)}</div>
      <div className="mt-5 text-[14px] text-slate-300">☐ Trust this device for 30 days ⓘ</div>
      <button className="mt-5 w-full rounded-md bg-[#68bf20] py-4 text-[18px] font-semibold text-white shadow-lg shadow-green-900/20" type="button">Verify Code →</button>
      <div className="my-5 flex items-center gap-4 text-[13px] text-slate-400"><span className="h-px flex-1 bg-slate-700" />or<span className="h-px flex-1 bg-slate-700" /></div>
      <button className="w-full rounded-md border border-slate-600 bg-[#07131f] px-4 py-3.5 text-[14px] text-slate-200" type="button">▿ Use Backup Code</button>
      <p className="mt-5 text-center text-[14px] text-slate-300">Didn’t receive the code? <a className="text-sky-400" href="/login/mfa">Resend Code</a> (00:45)</p>
      <p className="mt-5 text-center text-[14px]"><a className="text-sky-400" href="/login">Back to Sign In</a></p>
    </div>
  );
}

function ResetForm() {
  return (
    <div>
      <div className="text-center"><h1 className="text-[30px] font-semibold">Reset Password</h1><p className="mt-3 text-[14px] text-slate-300">Create a new password for your account.</p></div>
      <Progress active={3} labels={["Request", "Verify", "Reset", "Complete"]} />
      <LoginInput label="New Password" value="••••••••••••" />
      <div className="mt-4 space-y-2 text-[13px] text-slate-300">{["At least 8 characters", "One uppercase letter", "One lowercase letter", "One number", "One special character"].map((item) => <div key={item}><span className="text-[#7ed321]">●</span> {item}</div>)}</div>
      <LoginInput label="Confirm New Password" value="••••••••••••" />
      <button className="mt-6 w-full rounded-md bg-[#68bf20] py-4 text-[18px] font-semibold text-white shadow-lg shadow-green-900/20" type="button">Reset Password →</button>
      <p className="mt-6 text-center text-[14px] text-slate-300">Remember your password? <a className="text-sky-400" href="/login">Sign In</a></p>
      <p className="mt-5 text-center text-[14px] text-slate-300">Need help? <a className="text-sky-400" href="/support">Contact Support</a></p>
    </div>
  );
}

function TimeoutForm() {
  return (
    <div>
      <div className="text-center"><h1 className="text-[30px] font-semibold">Session Timed Out</h1><p className="mt-4 text-[16px] leading-relaxed text-slate-300">For your security, you have been signed out<br />due to inactivity.</p></div>
      <div className="mx-auto my-7 grid size-28 place-items-center rounded-full border-2 border-sky-600 text-[52px] text-sky-500">◷</div>
      <p className="text-center text-[16px] leading-relaxed text-slate-300">
        You will be redirected to the sign in page<br />in <span className="text-sky-400">15</span> seconds.
      </p>
      <div className="mx-auto mt-6 max-w-[390px] rounded-lg border border-cyan-300/10 bg-slate-700/20 p-5 text-[14px]">
        <div className="font-semibold text-slate-100"><span className="mr-3 text-sky-400">●</span>Why did this happen?</div>
        <p className="mt-2 leading-relaxed text-slate-300">Your session timed out after 15 minutes of inactivity.</p>
      </div>
      <button className="mt-6 w-full rounded-md bg-[#68bf20] py-4 text-[18px] font-semibold text-white shadow-lg shadow-green-900/20" type="button">Return to Sign In →</button>
      <p className="mt-6 text-center text-[15px]"><a className="text-sky-400" href="/login">Sign In Again Now</a></p>
      <div className="mx-auto my-6 h-px w-[350px] bg-slate-700" />
      <p className="text-center text-[14px] text-slate-300">Need help? <a className="text-sky-400" href="/support">Contact Support</a></p>
    </div>
  );
}

function Progress({ active, labels }: { active: number; labels: string[] }) {
  return <div className="my-6 grid grid-cols-4 gap-2 text-center text-[11px]">{labels.map((label, index) => <div className={index + 1 <= active ? "text-[#7ed321]" : "text-slate-400"} key={label}><span className={`mx-auto mb-2 grid size-7 place-items-center rounded-full border ${index + 1 <= active ? "border-[#7ed321] bg-[#7ed321] text-[#061421]" : "border-slate-500"}`}>{index + 1 < active ? "✓" : index + 1}</span>{label}</div>)}</div>;
}
