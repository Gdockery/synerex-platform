import { TransformerDashboardScreen } from "@/components/ecbs/TransformerDashboardScreen";
import { getOchsnerTransformerDashboardData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function TransformersPage() {
  const data = await getOchsnerTransformerDashboardData();

  return <TransformerDashboardScreen data={data} />;
}
