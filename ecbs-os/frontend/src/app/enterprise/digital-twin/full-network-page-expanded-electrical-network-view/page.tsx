import { ElectricalNetworkScreen } from "@/components/ecbs/DigitalTwinScreen";
import { getOchsnerDigitalTwinData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function FullNetworkPageExpandedElectricalNetworkViewPage() {
  const data = await getOchsnerDigitalTwinData();

  return <ElectricalNetworkScreen data={data} variant="fullNetworkExpanded" />;
}
