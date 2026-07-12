import { DashboardKpiCard, DashboardPanel } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";
import type { ClientSitesOverviewData } from "@/lib/trackingDashboardData";

export function ClientSitesOverviewScreen({ data }: { data: ClientSitesOverviewData }) {
  return (
    <EcbsAppShell activeHref="/enterprise/sites">
      <div className="flex h-screen min-h-0 flex-col overflow-hidden px-4 py-3">
        <header className="flex h-[82px] shrink-0 items-start justify-between border-b border-cyan-300/10">
          <div>
            <div className="text-[10px] text-slate-400">Enterprise &nbsp; &gt; &nbsp; <span className="text-white">Sites</span></div>
            <h1 className="mt-3 text-[22px] font-semibold leading-none text-slate-100">Sites</h1>
            <p className="mt-2 text-[10px] text-slate-300">All sites for the currently selected client: <span className="text-[#05ff5e]">{data.clientName}</span></p>
          </div>
          <div className="mt-2 rounded border border-cyan-300/12 bg-[#061421] px-4 py-2 text-right text-[10px] text-slate-300">
            Selected Client<br />
            <span className="text-[#05ff5e]">{data.clientName}</span>
          </div>
        </header>

        <section className="mt-3 grid h-[92px] shrink-0 grid-cols-5 gap-3">
          {data.kpis.map((kpi) => <DashboardKpiCard key={kpi.label} kpi={kpi} />)}
        </section>

        <section className="mt-3 grid min-h-0 flex-1 grid-cols-[1fr_320px] gap-3">
          <DashboardPanel title="Client Sites">
            <div className="h-full overflow-hidden rounded border border-cyan-300/10 bg-[#04111c]/80">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-[#061521] text-slate-300">
                  <tr>
                    {["Site", "Project", "Location", "Status", "Meters", "PF", "THD", "Annual Savings", "Last Updated"].map((heading) => (
                      <th className="border-b border-cyan-300/12 px-3 py-2 font-medium" key={heading}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr className="border-b border-cyan-300/8 text-slate-200" key={`${row.projectName}-${row.siteName}`}>
                      <td className="px-3 py-2 font-semibold text-white">{row.siteName}</td>
                      <td className="px-3 py-2">{row.projectName}</td>
                      <td className="max-w-[260px] px-3 py-2 text-slate-300">{row.location}</td>
                      <td className="px-3 py-2 text-[#05ff5e]">{row.status}</td>
                      <td className="px-3 py-2">{row.meterCount}</td>
                      <td className="px-3 py-2">{row.powerFactor}</td>
                      <td className="px-3 py-2">{row.thd}</td>
                      <td className="px-3 py-2">{row.annualSavings}</td>
                      <td className="px-3 py-2 text-slate-400">{row.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.rows.length === 0 ? (
                <div className="grid h-[220px] place-items-center text-center text-[11px] text-slate-300">
                  <span><b className="text-[#05ff5e]">No Data</b><br />{data.message}</span>
                </div>
              ) : null}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Client Scope">
            <div className="space-y-3 text-[10px] text-slate-300">
              <p>This page is intentionally client-scoped and may show multiple sites for the selected client.</p>
              <div className="rounded border border-[#05ff5e]/25 bg-[#061421] p-3">
                <div className="text-slate-400">Current client context</div>
                <div className="mt-1 text-[16px] font-semibold text-[#05ff5e]">{data.clientName}</div>
              </div>
              <div className="rounded border border-cyan-300/12 bg-[#061421] p-3">
                <div className="text-slate-400">Data source</div>
                <div className="mt-1">tracking DB project/site/current balance rollups</div>
              </div>
              {data.message ? <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-100">{data.message}</div> : null}
            </div>
          </DashboardPanel>
        </section>

        <footer className="mt-3 flex h-[28px] shrink-0 items-center justify-between border-t border-cyan-300/10 text-[9px] text-slate-500">
          <span>© 2025 XECO Energy Corporation. All rights reserved.</span>
          <span>Data updated: {data.updatedAt} <b className="ml-4 text-[#05ff5e]">{data.state === "data" ? "Live" : "No Data"}</b></span>
        </footer>
      </div>
    </EcbsAppShell>
  );
}
