import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
  badge?: string;
  icon: IconName;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Enterprise",
    items: [
      { label: "Enterprise Dashboard", href: "/enterprise/dashboard", icon: "home" },
      { label: "Energy Dashboard", href: "/enterprise/energy-dashboard", icon: "energy" },
      { label: "Capacity Intelligence", href: "/enterprise/capacity-intelligence", icon: "gauge" },
      { label: "Digital Twin", href: "/enterprise/digital-twin", icon: "network" },
      { label: "Sites", href: "/enterprise/sites", icon: "site" },
      { label: "Transformers", href: "/enterprise/transformers", icon: "transformer" },
      { label: "Current Analysis", href: "/enterprise/current-analysis", icon: "wave" },
      { label: "Savings & Forecast", href: "/enterprise/savings-forecast", icon: "savings" },
      { label: "Alerts & Events", href: "/enterprise/alerts-events", badge: "3", icon: "alert" },
      { label: "Reports", href: "/enterprise/reports", icon: "report" },
    ],
  },
  {
    title: "Devices",
    items: [
      { label: "Gateways", href: "/devices/gateways", icon: "chevron" },
      { label: "Meters", href: "/devices/meters", icon: "chevron" },
      { label: "Switches", href: "/devices/switches", icon: "chevron" },
      { label: "Repeaters", href: "/devices/repeaters", icon: "chevron" },
    ],
  },
  {
    title: "Client Management",
    items: [
      { label: "Clients", href: "/client-management/clients", icon: "user" },
      { label: "Users", href: "/client-management/users", icon: "user" },
      { label: "Roles & Permissions", href: "/client-management/roles-permissions", icon: "shield" },
    ],
  },
  {
    title: "Data & Analytics",
    items: [
      { label: "Energy Intelligence", href: "/data-analytics/energy-intelligence", icon: "wave" },
      { label: "Capacity Intelligence", href: "/data-analytics/capacity-intelligence", icon: "building" },
      { label: "Power Quality", href: "/data-analytics/power-quality", icon: "power" },
      { label: "Digital Twin", href: "/data-analytics/digital-twin", icon: "network" },
      { label: "Savings & Forecast", href: "/data-analytics/savings-forecast", icon: "savings" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Deployment App", href: "/operations/deployment-app", icon: "deployment" },
      { label: "Forms & Checklists", href: "/operations/forms-checklists", icon: "form" },
      { label: "Commissioning", href: "/operations/commissioning", icon: "commissioning" },
      { label: "Maintenance", href: "/operations/maintenance", icon: "settings" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Settings", href: "/administration/settings", icon: "settings" },
      { label: "Audit Logs", href: "/administration/audit-logs", icon: "audit" },
    ],
  },
];

type IconName =
  | "alert"
  | "audit"
  | "building"
  | "chevron"
  | "commissioning"
  | "deployment"
  | "energy"
  | "form"
  | "gauge"
  | "home"
  | "monitor"
  | "network"
  | "power"
  | "report"
  | "savings"
  | "settings"
  | "shield"
  | "site"
  | "support"
  | "transformer"
  | "user"
  | "wave";

export function EcbsAppShell({
  activeHref = "/enterprise/dashboard",
  children,
}: {
  activeHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="ecbs-dashboard-frame h-[682px] w-[1024px] overflow-hidden bg-[#020a12] text-slate-100">
      <div className="grid h-full grid-cols-[138px_886px]">
        <aside className="h-full overflow-y-auto overflow-x-hidden border-r border-cyan-300/10 bg-[#030c15] px-2.5 py-2 shadow-2xl shadow-black/50 [scrollbar-color:#0ea5b7_#061521] [scrollbar-width:thin]">
          <div className="mb-3 border-b border-white/8 pb-2.5">
            <div className="text-[26px] font-black italic leading-none tracking-[-0.12em]">
              <span className="text-[#03f45f]">X</span>
              <span className="text-white">ECO</span>
            </div>
            <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.48em] text-[#16ff5d]">
              Energy
            </div>
          </div>

          <nav className="space-y-3">
            {navSections.map((section) => (
              <section key={section.title}>
                {section.title ? (
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="whitespace-nowrap text-[9px] font-bold uppercase tracking-wide text-[#05ff5e]">
                      {section.title}
                    </h2>
                    {section.title === "Devices" ? <span className="text-[9px] text-slate-400">⌄</span> : null}
                  </div>
                ) : null}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = item.href === activeHref;

                    return (
                    <a
                      className={`group flex h-[22px] items-center justify-between rounded px-1.5 text-[9px] transition ${
                        isActive
                          ? "border-l-2 border-[#05ff5e] bg-[#063b27] text-[#05ff5e]"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                      href={item.href}
                      key={`${section.title}-${item.label}`}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="grid size-3 shrink-0 place-items-center text-slate-400 group-hover:text-cyan-300">
                          <NavIcon name={item.icon} />
                        </span>
                        <span className="whitespace-nowrap">{item.label}</span>
                      </span>
                      {item.badge ? (
                        <span className="ml-1 grid size-4 shrink-0 place-items-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </a>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          <div className="mt-3 rounded-md border border-slate-700/70 bg-[#041722] p-2">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full border border-slate-500 text-slate-300">
                <NavIcon name="support" />
              </span>
              <div>
                <div className="text-[9px] font-semibold text-slate-200">Need Help?</div>
                <a className="text-[9px] text-slate-400" href="/support">
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-[radial-gradient(circle_at_top_right,rgba(0,220,255,0.1),transparent_30%),linear-gradient(180deg,#04111c,#020910)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: IconName }) {
  if (name === "transformer") {
    return <TransformerNavIcon />;
  }

  const paths: Record<Exclude<IconName, "transformer">, ReactNode> = {
    alert: <path d="M8 2.5 14 13H2L8 2.5Zm0 3.5v3.2M8 11.5h.01" />,
    audit: <path d="M4 2.5h6l2 2v9H4V2.5Zm5.5 0V5H12M6 8h4M6 10.5h4" />,
    building: <path d="M3 13.5V5l5-2.5L13 5v8.5M5 13.5V7h6v6.5M7 7v6.5M9 7v6.5" />,
    chevron: <path d="m6 4 4 4-4 4" />,
    commissioning: <path d="M3 8.5 6.3 12 13 4M3 3.5h6M3 13.5h10" />,
    deployment: <path d="M8 2.5 13 5v5.8L8 13.5l-5-2.7V5l5-2.5Zm0 0v5.7M3 5l5 3.2L13 5" />,
    energy: <path d="M9 1.8 4 8h3l-1 6.2L12 6H8.8L9 1.8Z" />,
    form: <path d="M4 2.5h8v11H4v-11Zm2 3h4M6 8h4M6 10.5h3" />,
    gauge: <path d="M3 10a5 5 0 1 1 10 0M8 10l3-3M5 12h6" />,
    home: <path d="M2.5 7.5 8 3l5.5 4.5M4 7v6h8V7M6.5 13V9.5h3V13" />,
    monitor: <path d="M3 3h10v7H3V3Zm3 10h4M8 10v3" />,
    network: <path d="M8 3v10M3 5.5h3v3H3v-3Zm7 0h3v3h-3v-3ZM5 8.5v2h6v-2" />,
    power: <path d="M8 2v5M5 4.5a5 5 0 1 0 6 0" />,
    report: <path d="M4 2.5h8v11H4v-11Zm2 3h4M6 8h4M6 10.5h2" />,
    savings: <path d="M3 11c2-4 4-4 6-2s3 1 4-2M3 13h10M4 8V5M8 8V3M12 8V4.5" />,
    settings: <path d="M8 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0-3v2M8 11.5v2M3.2 4.2l1.4 1.4M11.4 10.4l1.4 1.4M2 8h2M12 8h2M3.2 11.8l1.4-1.4M11.4 5.6l1.4-1.4" />,
    shield: <path d="M8 2.5 13 4v4.3c0 2.5-1.8 4.5-5 5.2-3.2-.7-5-2.7-5-5.2V4l5-1.5Zm-2 5 1.4 1.4L10 6.2" />,
    site: <path d="M8 2.5a4 4 0 0 1 4 4c0 3-4 7-4 7s-4-4-4-7a4 4 0 0 1 4-4Zm0 2.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />,
    support: <path d="M3 9V8a5 5 0 0 1 10 0v1M3 9.5h2v3H3v-3Zm8 0h2v3h-2v-3ZM10.5 13c-.5 1-1.3 1.5-2.5 1.5" />,
    user: <path d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-5 5c.7-2.3 2.3-3.5 5-3.5s4.3 1.2 5 3.5" />,
    wave: <path d="M2 9c1.5-4 3-4 4.5 0S9.5 13 11 9s2-4 3-2" />,
  };

  return (
    <svg aria-hidden="true" className="size-3.5" viewBox="0 0 16 16">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3">
        {paths[name]}
      </g>
    </svg>
  );
}

function TransformerNavIcon() {
  return (
    <svg aria-hidden="true" className="size-3" viewBox="0 0 16 16">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2">
        <path d="M4 2v12M12 2v12" />
        <path d="M2.5 4h3M2.5 6h3M2.5 8h3M2.5 10h3M2.5 12h3" />
        <path d="M10.5 4h3M10.5 6h3M10.5 8h3M10.5 10h3M10.5 12h3" />
        <path d="M6 5.5h4M6 10.5h4" />
      </g>
    </svg>
  );
}
