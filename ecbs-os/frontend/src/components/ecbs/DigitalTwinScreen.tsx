import type { DigitalTwinAsset, DigitalTwinData, DigitalTwinRelationship } from "@/lib/trackingDashboardData";
import { DashboardFooter, DashboardHeader, DashboardPanel } from "./DashboardCards";
import { EcbsAppShell } from "./EcbsAppShell";

type PositionedAsset = DigitalTwinAsset & {
  badges: DigitalTwinAsset[];
  x: number;
  y: number;
};

const healthColor = {
  healthy: "#05ff5e",
  warning: "#ffd740",
  critical: "#ef4444",
  offline: "#94a3b8",
};

export function DigitalTwinScreen({ data }: { data: DigitalTwinData }) {
  const positioned = positionAssets(data.assets, data.relationships);
  const transformer = data.assets.find((asset) => asset.type === "transformer");
  const switchgear = data.assets.find((asset) => asset.type === "switchgear");
  const feeders = data.assets.filter((asset) => asset.type === "circuit");
  const panels = data.assets.filter((asset) => asset.type === "panel");
  const selected = transformer ?? data.assets[0];
  const selectedLoad = data.currentLoadKva;
  const selectedUtilization = data.transformerKva > 0 ? Math.min(100, (selectedLoad / data.transformerKva) * 100) : 0;
  const recoveredCapacity = data.recoveredCapacityKva;
  const panelCapacity = sumAmpCapacity(panels);
  const feederCapacity = sumAmpCapacity(feeders);
  const switchgearCapacity = sumAmpCapacity(switchgear ? [switchgear] : []);

  return (
    <EcbsAppShell activeHref="/enterprise/digital-twin">
      <div className="flex h-[682px] flex-col overflow-hidden px-3 py-2">
        <DashboardHeader
          dateRange={data.dateRange}
          subtitle={`${data.siteName} - Last updated ${data.updatedAt}`}
          title="Digital Twin - Electrical Network"
          variant="enterprise"
        />

        <section className="mt-2 grid h-[532px] grid-cols-[1fr_220px] gap-2">
          <DashboardPanel title="Digital Twin View" variant="enterprise">
            <div className="flex h-[500px] flex-col">
              <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                <div>
                  <span className="font-semibold text-slate-200">{data.twinLabel}</span>
                  <span className="ml-2 text-[#05ff5e]">Status: {titleCase(data.status)}</span>
                  <span className="ml-2">Version {data.version}</span>
                </div>
                <div className="flex gap-2">
                  <span className="rounded border border-slate-700 bg-[#061421] px-2 py-1">View: Load Flow (kVA)</span>
                  <span className="rounded border border-slate-700 bg-[#061421] px-2 py-1">Overlay: Utilization</span>
                  <span className="rounded border border-slate-700 bg-[#061421] px-2 py-1">3D View</span>
                </div>
              </div>

              <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-cyan-300/12 bg-[#03111d]">
                <DigitalTwinSvg
                  currentLoadKva={data.currentLoadKva}
                  positioned={positioned}
                  relationships={data.relationships}
                  transformerKva={data.transformerKva}
                />
                <div className="absolute bottom-2 left-3 rounded border border-cyan-300/12 bg-[#061521]/90 px-3 py-2 text-[9px] text-slate-400">
                  <span className="mr-4 font-semibold text-slate-300">Legend</span>
                  <LegendDot color={healthColor.healthy} label="Healthy" />
                  <LegendDot color={healthColor.warning} label="Warning" />
                  <LegendDot color={healthColor.critical} label="Critical" />
                  <LegendDot color={healthColor.offline} label="Offline" />
                </div>
                <div className="absolute bottom-2 right-3 rounded border border-cyan-300/12 bg-[#061521]/90 px-3 py-2 text-[9px] text-slate-400">
                  <div className="mb-1 font-semibold text-slate-300">Utilization Scale (Load / Rating)</div>
                  <div className="h-2 w-56 rounded-full bg-gradient-to-r from-[#05ff5e] via-[#ffd740] to-[#ef4444]" />
                  <div className="mt-1 flex justify-between">
                    <span>0%</span>
                    <span>50%</span>
                    <span>80%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </DashboardPanel>

          <div className="space-y-2 overflow-hidden">
            <DashboardPanel title="Selected Asset" variant="enterprise">
              {selected ? (
                <SelectedAssetCard
                  asset={selected}
                  loadKva={selectedLoad}
                  recoveredCapacityKva={recoveredCapacity}
                  utilization={selectedUtilization}
                />
              ) : (
                <div className="p-4 text-[11px] text-slate-400">No asset selected.</div>
              )}
            </DashboardPanel>

            <DashboardPanel title="Asset Summary" variant="enterprise">
              <div className="space-y-1.5 text-[10px]">
                <MetricLine label="Total Connected Load" value={`${formatNumber(data.currentLoadKva)} kVA`} />
                <MetricLine label="Total Available Capacity" value={`${formatNumber(data.headroomKva)} kVA`} />
                <MetricLine label="Network Efficiency" value={`${formatNumber(data.cbiScore)}%`} />
                <MetricLine label="Active Devices" value={String(data.assets.length)} />
                <MetricLine label="Active Meters" value={String(data.activeMeters)} />
              </div>
            </DashboardPanel>

            <DashboardPanel title="Capacity By Level" variant="enterprise">
              <CapacityByLevel
                levels={[
                  { color: "#05ff5e", label: "Transformer", value: Math.max(0, data.headroomKva), total: data.transformerKva },
                  { color: "#29b6f6", label: "Switchgear", value: switchgearCapacity, total: data.transformerKva },
                  { color: "#ffd740", label: "Feeders", value: feederCapacity, total: data.transformerKva },
                  { color: "#ff8a00", label: "Panels", value: panelCapacity, total: data.transformerKva },
                ]}
                totalRecovered={recoveredCapacity}
              />
            </DashboardPanel>
          </div>
        </section>

        <DashboardFooter updatedAt={data.updatedAt} variant="enterprise" />
      </div>
    </EcbsAppShell>
  );
}

function DigitalTwinSvg({
  currentLoadKva,
  positioned,
  relationships,
  transformerKva,
}: {
  currentLoadKva: number;
  positioned: PositionedAsset[];
  relationships: DigitalTwinRelationship[];
  transformerKva: number;
}) {
  const byId = new Map(positioned.map((asset) => [asset.id, asset]));
  const feeds = relationships.filter((relationship) => relationship.type === "feeds");
  const busY = 210;
  const feeders = positioned.filter((asset) => asset.type === "circuit");
  const panels = positioned.filter((asset) => asset.type === "panel");

  return (
    <svg className="h-full w-full" viewBox="0 0 780 470" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <pattern id="dtGrid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(41,182,246,0.08)" strokeWidth="0.7" />
        </pattern>
        <filter id="dtGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="780" height="470" fill="url(#dtGrid)" />

      {feeds.map((relationship) => {
        const parent = byId.get(relationship.parentId);
        const child = byId.get(relationship.childId);
        if (!parent || !child || child.type === "ecbs") {
          return null;
        }

        return (
          <path
            d={`M ${parent.x} ${parent.y + 25} V ${(parent.y + child.y) / 2} H ${child.x} V ${child.y - 28}`}
            fill="none"
            key={relationship.id}
            stroke={child.type === "ats" || parent.type === "generator" ? "#ffd740" : "#05ff5e"}
            strokeDasharray={child.type === "ats" || parent.type === "generator" ? "5 4" : undefined}
            strokeWidth="2"
          />
        );
      })}

      <rect filter="url(#dtGlow)" height="6" rx="3" width="600" x="90" y={busY} fill="#05ff5e" opacity="0.9" />
      <text fill="#05ff5e" fontSize="9" fontWeight="700" letterSpacing="0.08em" textAnchor="middle" x="390" y={busY - 12}>
        MAIN SWITCHGEAR / 480V BUS
      </text>

      {positioned.map((asset) => (
        <AssetNode asset={asset} currentLoadKva={currentLoadKva} key={asset.id} transformerKva={transformerKva} />
      ))}

      {feeders.map((feeder) => (
        <line key={`feeder-drop-${feeder.id}`} stroke="#05ff5e" strokeWidth="2" x1={feeder.x} x2={feeder.x} y1={busY + 6} y2={feeder.y - 26} />
      ))}
      {panels.map((panel) => (
        <line key={`panel-drop-${panel.id}`} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1.5" x1={panel.x} x2={panel.x} y1="318" y2={panel.y - 22} />
      ))}
    </svg>
  );
}

function AssetNode({
  asset,
  currentLoadKva,
  transformerKva,
}: {
  asset: PositionedAsset;
  currentLoadKva: number;
  transformerKva: number;
}) {
  const tone = assetTone(asset);
  const load = asset.type === "transformer" || asset.type === "switchgear" ? currentLoadKva : branchLoad(asset);
  const utilization = asset.type === "transformer" && transformerKva > 0 ? (currentLoadKva / transformerKva) * 100 : branchUtilization(asset);
  const status = utilization >= 80 ? "Warning" : "Healthy";
  const statusColor = utilization >= 80 ? healthColor.warning : healthColor.healthy;

  if (asset.type === "utility_service") {
    return (
      <g transform={`translate(${asset.x} ${asset.y})`}>
        <rect fill="#061521" height="42" rx="5" stroke="#1e3a5f" width="76" x="-38" y="-21" />
        <text fill="#cbd5e1" fontSize="8" fontWeight="700" textAnchor="middle" y="-3">UTILITY</text>
        <text fill="#cbd5e1" fontSize="8" textAnchor="middle" y="10">480 V</text>
        <text fill="#94a3b8" fontSize="22" textAnchor="middle" x="44" y="7">⌁</text>
      </g>
    );
  }

  if (asset.type === "transformer") {
    return (
      <g filter="url(#dtGlow)" transform={`translate(${asset.x} ${asset.y})`}>
        <rect fill="#061521" height="62" rx="6" stroke={tone} width="150" x="-75" y="-31" />
        <TransformerIcon x="-60" y="-10" />
        <text fill="#e2e8f0" fontSize="8" fontWeight="700" x="-26" y="-12">{asset.name.toUpperCase()}</text>
        <text fill="#e2e8f0" fontSize="14" fontWeight="700" x="-26" y="4">{formatNumber(transformerKva)} kVA</text>
        <text fill="#94a3b8" fontSize="8" x="-26" y="18">Load</text>
        <text fill="#e2e8f0" fontSize="8" x="20" y="18">{formatNumber(load)} kVA ({formatNumber(utilization)}%)</text>
        <circle cx="66" cy="-20" fill={statusColor} r="5" />
      </g>
    );
  }

  if (asset.type === "switchgear") {
    return (
      <g transform={`translate(${asset.x} ${asset.y})`}>
        <rect fill="#061521" height="48" rx="6" stroke="#1e3a5f" width="140" x="-70" y="-24" />
        <SwitchgearIcon x="-58" y="-12" />
        <text fill="#e2e8f0" fontSize="8" fontWeight="700" x="-24" y="-4">{asset.name.toUpperCase()}</text>
        <text fill="#94a3b8" fontSize="8" x="-24" y="11">Health</text>
        <circle cx="30" cy="8" fill={statusColor} r="4" />
        <text fill={statusColor} fontSize="8" x="39" y="11">{status}</text>
      </g>
    );
  }

  if (asset.type === "generator" || asset.type === "ats") {
    return (
      <g transform={`translate(${asset.x} ${asset.y})`}>
        <rect fill="#061521" height="38" rx="5" stroke="#ffd740" strokeDasharray="4 3" width="86" x="-43" y="-19" />
        <text fill="#ffd740" fontSize="8" fontWeight="700" textAnchor="middle" y="-3">{asset.type === "ats" ? "ATS" : "GENERATOR"}</text>
        <text fill="#94a3b8" fontSize="8" textAnchor="middle" y="10">{asset.kvaRating ? `${formatNumber(asset.kvaRating)} kVA` : `${formatNumber(asset.ampRating)} A`}</text>
      </g>
    );
  }

  const isPanel = asset.type === "panel";
  return (
    <g transform={`translate(${asset.x} ${asset.y})`}>
      <rect fill="#061521" height={isPanel ? 42 : 48} rx="5" stroke={utilization >= 80 ? "#ffd740" : "#1e3a5f"} width={isPanel ? 74 : 88} x={isPanel ? -37 : -44} y={isPanel ? -21 : -24} />
      <text fill="#e2e8f0" fontSize="7.5" fontWeight="700" textAnchor="middle" y="-6">{short(asset.name, isPanel ? 12 : 14)}</text>
      <text fill="#94a3b8" fontSize="7" textAnchor="middle" y="6">{asset.ampRating ? `${formatNumber(asset.ampRating)} A` : "Load"}</text>
      <circle cx={isPanel ? -30 : -36} cy={isPanel ? 15 : 18} fill={statusColor} r="3.5" />
      <text fill={statusColor} fontSize="7" x={isPanel ? -20 : -26} y={isPanel ? 18 : 21}>{status}</text>
      {asset.badges.map((badge, index) => (
        <g key={badge.id} transform={`translate(${-30 + index * 30} 30)`}>
          <rect fill="rgba(5,255,94,0.12)" height="12" rx="3" stroke="#05ff5e" width="26" />
          <text fill="#05ff5e" fontSize="6" fontWeight="700" textAnchor="middle" x="13" y="9">APF</text>
        </g>
      ))}
    </g>
  );
}

function SelectedAssetCard({
  asset,
  loadKva,
  recoveredCapacityKva,
  utilization,
}: {
  asset: DigitalTwinAsset;
  loadKva: number;
  recoveredCapacityKva: number;
  utilization: number;
}) {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="flex items-start gap-2">
        <div className="grid size-9 place-items-center rounded border border-slate-600 bg-[#061421] text-slate-300">
          <TransformerMiniIcon />
        </div>
        <div>
          <div className="text-[12px] font-semibold text-slate-100">{asset.name}</div>
          <div className="text-[10px] text-slate-400">{formatNumber(asset.kvaRating)} kVA</div>
        </div>
        <span className="ml-auto size-3 rounded-full bg-[#05ff5e]" />
      </div>
      <div className="grid grid-cols-4 border-b border-[#05ff5e]/60 text-center text-[8px] text-slate-400">
        <span className="pb-1 text-[#05ff5e]">Overview</span>
        <span>Measurements</span>
        <span>Health</span>
        <span>Events</span>
      </div>
      <MetricLine label="Load" value={`${formatNumber(loadKva)} kVA (${formatNumber(utilization)}%)`} />
      <MeterBar value={utilization} />
      <MetricLine label="Available Capacity" value={`${formatNumber(Math.max(0, asset.kvaRating - loadKva))} kVA`} valueClass="text-[#29b6f6]" />
      <MetricLine label="Recovered Capacity" value={`${formatNumber(recoveredCapacityKva)} kVA`} valueClass="text-[#05ff5e]" />
      <MetricLine label="Utilization" value={`${formatNumber(utilization)}%`} />
      <MetricLine label="Health Status" value={utilization >= 80 ? "Warning" : "Healthy"} valueClass={utilization >= 80 ? "text-yellow-300" : "text-[#05ff5e]"} />
    </div>
  );
}

function CapacityByLevel({
  levels,
  totalRecovered,
}: {
  levels: { color: string; label: string; total: number; value: number }[];
  totalRecovered: number;
}) {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="grid grid-cols-[70px_1fr] gap-2">
        <svg className="h-[72px] w-[72px]" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" fill="none" r="25" stroke="#0f2533" strokeWidth="18" />
          <circle cx="40" cy="40" fill="none" r="25" stroke="#05ff5e" strokeDasharray="54 157" strokeWidth="18" transform="rotate(-90 40 40)" />
          <circle cx="40" cy="40" fill="none" r="25" stroke="#29b6f6" strokeDasharray="38 157" strokeDashoffset="-58" strokeWidth="18" transform="rotate(-90 40 40)" />
          <circle cx="40" cy="40" fill="none" r="25" stroke="#ffd740" strokeDasharray="31 157" strokeDashoffset="-100" strokeWidth="18" transform="rotate(-90 40 40)" />
          <circle cx="40" cy="40" fill="none" r="25" stroke="#ff8a00" strokeDasharray="22 157" strokeDashoffset="-134" strokeWidth="18" transform="rotate(-90 40 40)" />
        </svg>
        <div className="space-y-1">
          {levels.map((level) => {
            const pct = level.total > 0 ? (level.value / level.total) * 100 : 0;
            return (
              <div className="flex items-center justify-between gap-2" key={level.label}>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <span className="size-2 rounded-full" style={{ backgroundColor: level.color }} />
                  {level.label}
                </span>
                <span className="text-slate-200">{formatNumber(level.value)} kVA ({formatNumber(pct)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-white/10 pt-2 text-right text-[16px] font-semibold text-[#05ff5e]">
        {formatNumber(totalRecovered)} kVA
      </div>
    </div>
  );
}

function MetricLine({ label, value, valueClass = "text-slate-100" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-white/5 pb-1">
      <span className="text-slate-400">{label}</span>
      <span className={`text-right font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function MeterBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-[#05ff5e]" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="mr-4 inline-flex items-center gap-1">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function positionAssets(assets: DigitalTwinAsset[], relationships: DigitalTwinRelationship[]): PositionedAsset[] {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const childrenByParent = new Map<number, number[]>();
  const containsByParent = new Map<number, DigitalTwinAsset[]>();

  relationships.forEach((relationship) => {
    if (relationship.type === "contains") {
      const child = byId.get(relationship.childId);
      if (child) {
        containsByParent.set(relationship.parentId, [...(containsByParent.get(relationship.parentId) ?? []), child]);
      }
      return;
    }

    childrenByParent.set(relationship.parentId, [...(childrenByParent.get(relationship.parentId) ?? []), relationship.childId]);
  });

  const positioned: PositionedAsset[] = [];
  const push = (asset: DigitalTwinAsset | undefined, x: number, y: number) => {
    if (!asset || positioned.some((row) => row.id === asset.id)) {
      return;
    }

    positioned.push({ ...asset, badges: containsByParent.get(asset.id) ?? [], x, y });
  };

  const utility = assets.find((asset) => asset.type === "utility_service");
  const transformer = assets.find((asset) => asset.type === "transformer");
  const switchgear = assets.find((asset) => asset.type === "switchgear");
  const generator = assets.find((asset) => asset.type === "generator");
  const ats = assets.find((asset) => asset.type === "ats");
  const switchgearChildren = (switchgear ? childrenByParent.get(switchgear.id) ?? [] : [])
    .map((id) => byId.get(id))
    .filter((asset): asset is DigitalTwinAsset => Boolean(asset));
  const circuits = switchgearChildren.filter((asset) => asset.type === "circuit");
  const panels = switchgearChildren.filter((asset) => asset.type === "panel");

  push(utility, 390, 52);
  push(transformer, 390, 126);
  push(switchgear, 390, 184);
  push(generator, 690, 92);
  push(ats, 690, 150);

  distribute(circuits, 84, 650).forEach(([asset, x]) => push(asset, x, 266));
  distribute(panels, 72, 650).forEach(([asset, x]) => push(asset, x, 362));

  return positioned;
}

function distribute(assets: DigitalTwinAsset[], start: number, end: number): Array<[DigitalTwinAsset, number]> {
  if (assets.length === 0) {
    return [];
  }

  if (assets.length === 1) {
    return [[assets[0], (start + end) / 2]];
  }

  return assets.map((asset, index) => [asset, start + ((end - start) / (assets.length - 1)) * index]);
}

function assetTone(asset: DigitalTwinAsset) {
  if (asset.type === "generator" || asset.type === "ats") {
    return "#ffd740";
  }
  if (asset.type === "panel") {
    return "#ab47bc";
  }
  if (asset.type === "ecbs") {
    return "#05ff5e";
  }
  return "#29b6f6";
}

function branchLoad(asset: DigitalTwinAsset) {
  if (asset.ampRating > 0) {
    return Math.round((Math.sqrt(3) * 480 * asset.ampRating) / 1000);
  }

  return asset.kvaRating;
}

function branchUtilization(asset: DigitalTwinAsset) {
  const rating = asset.kvaRating || branchLoad(asset) || 1;
  return Math.min(100, (branchLoad(asset) / rating) * 100);
}

function sumAmpCapacity(assets: DigitalTwinAsset[]) {
  return assets.reduce((sum, asset) => sum + branchLoad(asset), 0);
}

function short(value: string, max: number) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}...`;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function TransformerIcon({ x, y }: { x: string; y: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect fill="#263747" height="28" rx="2" stroke="#94a3b8" width="24" />
      <circle cx="12" cy="9" fill="none" r="5" stroke="#cbd5e1" />
      <circle cx="12" cy="19" fill="none" r="5" stroke="#cbd5e1" />
    </g>
  );
}

function SwitchgearIcon({ x, y }: { x: string; y: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect fill="#263747" height="24" rx="2" stroke="#94a3b8" width="22" />
      <path d="M6 5h10M6 12h10M6 19h10M11 4v16" stroke="#cbd5e1" strokeWidth="1" />
    </g>
  );
}

function TransformerMiniIcon() {
  return (
    <svg className="size-6" viewBox="0 0 28 28" aria-hidden="true">
      <rect fill="none" height="22" rx="2" stroke="currentColor" width="18" x="5" y="3" />
      <circle cx="14" cy="10" fill="none" r="4" stroke="currentColor" />
      <circle cx="14" cy="18" fill="none" r="4" stroke="currentColor" />
    </svg>
  );
}
