export type ConfigureAlertRuleData = {
  advancedRows: { label: string; value: string }[];
  message: string;
  notificationRows: { label: string; value: string }[];
  recentActivity: { asset: string; icon: string; time: string; title: string }[];
  ruleName: string;
  ruleSummary: { label: string; value: string }[];
  scopeRows: { label: string; value: string }[];
  state: "data" | "no-data";
  triggerRows: { label: string; value: string }[];
};
