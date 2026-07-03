import { CapacityIntelligenceScreen } from "@/components/ecbs/CapacityIntelligenceScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function DataAnalyticsCapacityIntelligencePage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <CapacityIntelligenceScreen activeHref="/data-analytics/capacity-intelligence" data={data} />;
}
