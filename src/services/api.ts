import { NoiseStation, NoiseTelemetryLog, HttpLogEntry, SimulationScenario } from '../types';

export const api = {
  // Stations
  async getStations(): Promise<{ data: NoiseStation[]; meta: any }> {
    const res = await fetch('/api/v1/stations', {
      headers: { 'x-client-role': 'dashboard-client' }
    });
    return res.json();
  },

  async getStationById(id: string): Promise<{ data: NoiseStation }> {
    const res = await fetch(`/api/v1/stations/${id}`, {
      headers: { 'x-client-role': 'dashboard-client' }
    });
    return res.json();
  },

  async createStation(payload: Partial<NoiseStation>): Promise<{ status: string; message: string; data: NoiseStation }> {
    const res = await fetch('/api/v1/stations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-role': 'dashboard-client'
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateStation(id: string, payload: any): Promise<{ status: string; data: NoiseStation }> {
    const res = await fetch(`/api/v1/stations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-client-role': 'dashboard-client'
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteStation(id: string): Promise<{ status: string; data: any }> {
    const res = await fetch(`/api/v1/stations/${id}`, {
      method: 'DELETE',
      headers: { 'x-client-role': 'dashboard-client' }
    });
    return res.json();
  },

  // Telemetry
  async postTelemetry(payload: {
    stationId: string;
    decibel: number;
    peakDb?: number;
    leq?: number;
    battery?: number;
    frequency?: number;
    temperature?: number;
    humidity?: number;
  }): Promise<any> {
    const res = await fetch('/api/v1/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': payload.stationId,
        'x-sensor-type': 'MEMS-Microphone-MAX4466'
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getTelemetryHistory(stationId?: string, limit = 50): Promise<{ data: NoiseTelemetryLog[] }> {
    const url = stationId 
      ? `/api/v1/telemetry/history?stationId=${stationId}&limit=${limit}` 
      : `/api/v1/telemetry/history?limit=${limit}`;
    const res = await fetch(url, {
      headers: { 'x-client-role': 'dashboard-client' }
    });
    return res.json();
  },

  // HTTP Logs
  async getHttpLogs(limit = 60, method?: string): Promise<{ data: HttpLogEntry[] }> {
    const url = method 
      ? `/api/v1/http-logs?limit=${limit}&method=${method}` 
      : `/api/v1/http-logs?limit=${limit}`;
    const res = await fetch(url);
    return res.json();
  },

  // Simulation
  async stepSimulation(targetStationId?: string): Promise<any> {
    const res = await fetch('/api/v1/simulate/step', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-role': 'simulation-engine'
      },
      body: JSON.stringify({ targetStationId })
    });
    return res.json();
  },

  async setScenario(scenario: SimulationScenario): Promise<any> {
    const res = await fetch('/api/v1/simulate/scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-role': 'simulation-engine'
      },
      body: JSON.stringify({ scenario })
    });
    return res.json();
  },

  async resetSystem(): Promise<any> {
    const res = await fetch('/api/v1/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-role': 'admin'
      }
    });
    return res.json();
  }
};
