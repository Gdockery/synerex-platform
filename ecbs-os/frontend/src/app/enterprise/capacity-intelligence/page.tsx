import { CapacityIntelligenceScreen } from "@/components/ecbs/CapacityIntelligenceScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function CapacityIntelligencePage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <CapacityIntelligenceScreen data={data} />;
}
