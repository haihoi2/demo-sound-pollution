import { NoiseStation, NoiseTelemetryLog, HttpLogEntry, SimulationScenario } from '../types';
import { INITIAL_STATIONS, getNoiseCategory } from '../data/initialData';

// Fallback in-memory state in client in case server is reloading
let fallbackStations: NoiseStation[] = JSON.parse(JSON.stringify(INITIAL_STATIONS));
let fallbackTelemetry: NoiseTelemetryLog[] = [];

// Helper to safely fetch JSON from server with error guarding
async function safeFetch<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json'
  };

  try {
    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options?.headers as Record<string, string> || {})
      }
    };

    const res = await fetch(url, mergedOptions);
    const contentType = res.headers.get('content-type') || '';

    // Check if the response is actually JSON
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return data;
    }

    // If server returned non-JSON (e.g. HTML during reload/proxy error)
    const text = await res.text();
    console.warn(`[API] Server returned non-JSON for ${url} (status ${res.status}):`, text.slice(0, 100));

    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error(`Server returned non-JSON response (${res.status})`);
  } catch (err: any) {
    console.warn(`[API] Request failed for ${url}:`, err.message);
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

export const api = {
  // Stations
  async getStations(): Promise<{ data: NoiseStation[]; meta: any }> {
    return safeFetch<{ data: NoiseStation[]; meta: any }>(
      '/api/v1/stations',
      { headers: { 'x-client-role': 'dashboard-client' } },
      { data: fallbackStations, meta: { total: fallbackStations.length, simulationStep: 1 } }
    );
  },

  async getStationById(id: string): Promise<{ data: NoiseStation }> {
    const local = fallbackStations.find(s => s.id === id) || fallbackStations[0];
    return safeFetch<{ data: NoiseStation }>(
      `/api/v1/stations/${id}`,
      { headers: { 'x-client-role': 'dashboard-client' } },
      { data: local }
    );
  },

  async createStation(payload: Partial<NoiseStation>): Promise<{ status: string; message: string; data: NoiseStation }> {
    return safeFetch(
      '/api/v1/stations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-role': 'dashboard-client'
        },
        body: JSON.stringify(payload)
      },
      {
        status: 'success',
        message: 'Station created (local)',
        data: {
          ...fallbackStations[0],
          ...payload,
          id: `ST-${Date.now().toString().slice(-3)}`
        } as NoiseStation
      }
    );
  },

  async updateStation(id: string, payload: any): Promise<{ status: string; data: NoiseStation }> {
    return safeFetch(
      `/api/v1/stations/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-client-role': 'dashboard-client'
        },
        body: JSON.stringify(payload)
      },
      {
        status: 'success',
        data: { ...fallbackStations[0], ...payload }
      }
    );
  },

  async deleteStation(id: string): Promise<{ status: string; data: any }> {
    return safeFetch(
      `/api/v1/stations/${id}`,
      {
        method: 'DELETE',
        headers: { 'x-client-role': 'dashboard-client' }
      },
      { status: 'success', data: { id } }
    );
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
    return safeFetch(
      '/api/v1/telemetry',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': payload.stationId,
          'x-sensor-type': 'MEMS-Microphone-MAX4466'
        },
        body: JSON.stringify(payload)
      },
      {
        status: 'success',
        code: 201,
        message: 'Telemetry ingested (local fallback)',
        data: {
          telemetryId: `tel-${Date.now()}`,
          stationId: payload.stationId,
          evaluatedCategory: getNoiseCategory(payload.decibel),
          alertTriggered: payload.decibel >= 70,
          serverTimestamp: new Date().toISOString()
        }
      }
    );
  },

  async getTelemetryHistory(stationId?: string, limit = 50): Promise<{ data: NoiseTelemetryLog[] }> {
    const url = stationId 
      ? `/api/v1/telemetry/history?stationId=${stationId}&limit=${limit}` 
      : `/api/v1/telemetry/history?limit=${limit}`;
    return safeFetch<{ data: NoiseTelemetryLog[] }>(
      url,
      { headers: { 'x-client-role': 'dashboard-client' } },
      { data: fallbackTelemetry }
    );
  },

  // HTTP Logs
  async getHttpLogs(limit = 60, method?: string): Promise<{ data: HttpLogEntry[] }> {
    const url = method 
      ? `/api/v1/http-logs?limit=${limit}&method=${method}` 
      : `/api/v1/http-logs?limit=${limit}`;
    return safeFetch<{ data: HttpLogEntry[] }>(
      url,
      undefined,
      { data: [] }
    );
  },

  // Simulation
  async stepSimulation(targetStationId?: string): Promise<any> {
    return safeFetch(
      '/api/v1/simulate/step',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-role': 'simulation-engine'
        },
        body: JSON.stringify({ targetStationId })
      },
      {
        status: 'success',
        message: 'Step simulated locally',
        scenario: 'normal',
        affectedStations: fallbackStations.length,
        readings: []
      }
    );
  },

  async setScenario(scenario: SimulationScenario): Promise<any> {
    return safeFetch(
      '/api/v1/simulate/scenario',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-role': 'simulation-engine'
        },
        body: JSON.stringify({ scenario })
      },
      {
        status: 'success',
        message: `Scenario updated to ${scenario}`,
        activeScenario: scenario
      }
    );
  },

  async resetSystem(): Promise<any> {
    return safeFetch(
      '/api/v1/reset',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-role': 'admin'
        }
      },
      {
        status: 'success',
        message: 'System reset',
        stationsCount: fallbackStations.length
      }
    );
  }
};
