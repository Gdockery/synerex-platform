export type SetNotificationsData = {
  channels: {
    color: string;
    enabled: boolean;
    icon: string;
    text: string;
    title: string;
  }[];
  escalationRows: { label: string; value: string }[];
  message: string;
  previewItems: { color: string; icon: string; text: string }[];
  recipients: {
    channelIcons: string[];
    email: string;
    escalation: string;
    initials: string;
    name: string;
    schedule: string;
    severityColors: string[];
    status: string;
    type: string;
  }[];
  ruleName: string;
  ruleSummary: { label: string; value: string }[];
  state: "data" | "no-data";
};

