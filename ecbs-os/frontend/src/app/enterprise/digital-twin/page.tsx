import { DigitalTwinScreen } from "@/components/ecbs/DigitalTwinScreen";
import { getOchsnerDigitalTwinData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function DigitalTwinPage() {
  const data = await getOchsnerDigitalTwinData();

  return <DigitalTwinScreen data={data} />;
}
