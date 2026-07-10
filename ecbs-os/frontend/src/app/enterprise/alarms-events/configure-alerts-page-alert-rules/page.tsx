import { ConfigureAlertRuleScreen } from "@/components/ecbs/NextFiveScreens";
import { getConfigureAlertRuleDataFromApi } from "@/lib/ecbsApi";

export const dynamic = "force-dynamic";

export default async function ConfigureAlertRulesPage() {
  const data = await getConfigureAlertRuleDataFromApi();
  return <ConfigureAlertRuleScreen data={data} />;
}
