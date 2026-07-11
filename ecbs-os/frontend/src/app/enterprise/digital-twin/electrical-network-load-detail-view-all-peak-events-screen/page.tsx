import { ElectricalNetworkScreen } from "@/components/ecbs/DigitalTwinScreen";
import { getOchsnerDigitalTwinData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function ElectricalNetworkPeakEventsPage() {
  const data = await getOchsnerDigitalTwinData();

  return <ElectricalNetworkScreen data={data} variant="peakEvents" />;
}
