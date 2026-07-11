import { ElectricalNetworkScreen } from "@/components/ecbs/DigitalTwinScreen";
import { getOchsnerDigitalTwinData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function ElectricalNetworkLowPfEventsPage() {
  const data = await getOchsnerDigitalTwinData();

  return <ElectricalNetworkScreen data={data} variant="lowPfEvents" />;
}
