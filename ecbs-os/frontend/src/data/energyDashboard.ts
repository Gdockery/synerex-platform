export type EnergyKpi = {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "blue" | "cyan" | "yellow";
};

export type EnergySite = {
  metric: string;
  baseline: string;
  current: string;
  change: string;
};

export type EnergyEvent = {
  label: string;
  value: string;
  note: string;
};

export type EnergyDashboardData = {
  updatedAt: string;
  dateRange: string;
  kpis: EnergyKpi[];
  sites: EnergySite[];
  events: EnergyEvent[];
  summary: string[];
  liveSnapshot: EnergyEvent[];
  alarms: EnergyEvent[];
};

export const energyDashboardData: EnergyDashboardData = {
  updatedAt: "May 18, 2025 10:15 AM",
  dateRange: "Last 30 Days",
  kpis: [
    { label: "Annual Savings", value: "$184,200", detail: "+12.6% vs last month", tone: "green" },
    { label: "Energy Reduction", value: "18%", detail: "Weather-normalized", tone: "green" },
    { label: "Peak Demand Relief", value: "425 kVA", detail: "+25% vs baseline", tone: "blue" },
    { label: "Power Factor (Avg)", value: "0.99", detail: "Optimal", tone: "green" },
    { label: "THD (Avg)", value: "4.8%", detail: "Good (<5%)", tone: "green" },
    { label: "CO2e Avoided", value: "1,124 t", detail: "Current program", tone: "cyan" },
  ],
  summary: [
    "Energy savings remain positive across normalized reporting periods.",
    "Savings variance is concentrated in weather-sensitive HVAC operation.",
    "Ochsner chiller load requires engineering review before customer-facing finalization.",
  ],
  events: [
    { label: "May 18, 10:10 AM", value: "Savings model updated", note: "Weather/R² screening completed" },
    { label: "May 18, 08:42 AM", value: "Baseline comparison reviewed", note: "Engineering exception added" },
    { label: "May 17, 11:00 PM", value: "Monthly performance report", note: "Generated" },
  ],
  sites: [
    { metric: "Baseline Utility Cost", baseline: "$250K", current: "$184K", change: "-26%" },
    { metric: "Demand Savings", baseline: "$0", current: "$82K", change: "+$82K" },
    { metric: "Energy Savings", baseline: "$0", current: "$64K", change: "+$64K" },
    { metric: "PF & Other Savings", baseline: "$0", current: "$38K", change: "+$38K" },
  ],
  liveSnapshot: [
    { label: "Voltage (L-L)", value: "481 V", note: "Stable" },
    { label: "Current", value: "1,248 A", note: "Normal" },
    { label: "Real Power", value: "912 kW", note: "Live" },
    { label: "Power Factor", value: "0.99", note: "Optimal" },
    { label: "Frequency", value: "60.01 Hz", note: "Live" },
  ],
  alarms: [
    { label: "High THD Detected", value: "Panel B", note: "Today 9:23 AM" },
    { label: "Transformer T1 Overload", value: "Load 92%", note: "Today 7:45 AM" },
    { label: "Communication Restored", value: "ECBS Rack 03", note: "Today 8:02 AM" },
  ],
};
