import { UBillTrackerUsageSummaryScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function UBillTrackerUsageSummaryPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <UBillTrackerUsageSummaryScreen data={data} />;
}
