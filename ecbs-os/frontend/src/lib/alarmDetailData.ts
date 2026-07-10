export type AlarmDetailData = {
  alarmId: string;
  demandStats: { label: string; value: string }[];
  impactRows: { label: string; value: string }[];
  message: string;
  priorityLabel: string;
  recommendedActions: { text: string }[];
  relatedAlarms: { date: string; duration: string; icon: string; label: string }[];
  state: "data" | "no-data";
  status: string;
  summaryTiles: { color: string; detail: string; icon: string; title: string; value: string }[];
  timeline: { color: string; detail: string; time: string; title: string }[];
  title: string;
  triggerConditions: {
    actualValue: string;
    condition: string;
    duration: string;
    parameter: string;
    status: string;
    threshold: string;
  }[];
  triggeredAt: string;
  updatedAt: string;
};

