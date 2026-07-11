export type DeviceDataRow = {
  id: string;
  name: string;
  kind: string;
  serialNumber: string;
  status: string;
  lastSeen: string;
  healthScore: string;
  firmware: string;
  location: string;
  isMain: boolean;
};

export type DeviceKindSummary = {
  kind: string;
  total: number;
  online: number;
  offline: number;
  warning: number;
};

export type DeviceTelemetrySummary = {
  kilowatts: string;
  kilovoltAmps: string;
  kilowattHours: string;
  powerFactor: string;
  timestamp: string;
};

export type DevicesData = {
  devices: DeviceDataRow[];
  summaries: DeviceKindSummary[];
  telemetry: DeviceTelemetrySummary;
  message: string;
  state: string;
  updatedAt: string;
};

