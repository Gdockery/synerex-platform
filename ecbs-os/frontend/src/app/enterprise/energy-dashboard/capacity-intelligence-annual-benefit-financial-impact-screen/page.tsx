import { CapacityDrilldownScreen } from "@/components/ecbs/CapacityDrilldownScreens";
import { getOchsnerCapacityIntelligenceData } from "@/lib/trackingDashboardData";

export const dynamic = "force-dynamic";

export default async function CapacityIntelligenceAnnualBenefitFinancialImpactScreenPage() {
  const data = await getOchsnerCapacityIntelligenceData();

  return <CapacityDrilldownScreen capacityData={data} variant="financialImpact" />;
}
