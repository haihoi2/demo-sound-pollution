export type ZoneType = 'residential' | 'commercial' | 'traffic' | 'industrial' | 'hospital_school';

export type StationStatus = 'online' | 'warning' | 'critical' | 'offline';

export type NoiseCategory = 'safe' | 'moderate' | 'high' | 'hazardous';

export interface NoiseStation {
  id: string;
  name: string;
  code: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    zoneType: ZoneType;
    zoneLabel: string;
  };
  status: StationStatus;
  currentDb: number;
  peakDb: number;
  leqDb: number; // Equivalent continuous sound level
  l10Db: number; // Level exceeded 10% of time (peak traffic)
  l90Db: number; // Level exceeded 90% of time (background noise)
  batteryLevel: number;
  temperature: number;
  humidity: number;
  dominantFrequency: number;
  noiseCategory: NoiseCategory;
  thresholds: {
    warning: number;
    critical: number;
  };
  samplingInterval: number; // in seconds
  lastSeen: string;
  macAddress: string;
  firmwareVersion: string;
  ipAddress: string;
  totalPacketsSent: number;
}

export interface NoiseTelemetryLog {
  id: string;
  stationId: string;
  stationName: string;
  timestamp: string;
  decibel: number;
  peakDb: number;
  leq: number;
  battery: number;
  frequency: number;
  temperature: number;
  humidity: number;
  exceeded: boolean;
  noiseCategory: NoiseCategory;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface HttpLogEntry {
  id: string;
  timestamp: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: any;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody?: any;
  durationMs: number;
  source: string;
  description?: string;
}

export interface SystemStats {
  totalStations: number;
  onlineStations: number;
  warningStations: number;
  criticalStations: number;
  offlineStations: number;
  avgDecibel: number;
  maxDecibel: number;
  totalTelemetryReceived: number;
  totalHttpCalls: number;
}

export type SimulationScenario = 'normal' | 'rush_hour' | 'construction' | 'emergency_siren' | 'night_calm';
