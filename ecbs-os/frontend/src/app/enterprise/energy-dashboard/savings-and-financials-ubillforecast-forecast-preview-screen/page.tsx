import { UBillForecastPreviewScreen } from "@/components/ecbs/EnergySavingsDashboardScreen";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function UBillForecastPreviewPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <UBillForecastPreviewScreen data={data} />;
}
