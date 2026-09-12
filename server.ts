import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_STATIONS, getNoiseCategory } from './src/data/initialData';
import { NoiseStation, NoiseTelemetryLog, HttpLogEntry, SimulationScenario } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store
let stations: NoiseStation[] = JSON.parse(JSON.stringify(INITIAL_STATIONS));
let telemetryHistory: NoiseTelemetryLog[] = [];
let httpLogs: HttpLogEntry[] = [];
let activeScenario: SimulationScenario = 'normal';
let simulationStepCounter = 0;

// Seed initial history
const now = Date.now();
stations.forEach(st => {
  for (let i = 15; i >= 0; i--) {
    const time = new Date(now - i * 15000).toISOString();
    const variation = (Math.random() - 0.5) * 6;
    const db = Math.max(35, Math.min(105, +(st.currentDb + variation).toFixed(1)));
    const peak = +(db + Math.random() * 5).toFixed(1);
    const cat = getNoiseCategory(db, st.thresholds.warning, st.thresholds.critical);
    telemetryHistory.push({
      id: `init-${st.id}-${i}`,
      stationId: st.id,
      stationName: st.name,
      timestamp: time,
      decibel: db,
      peakDb: peak,
      leq: +(db - 1.2).toFixed(1),
      battery: st.batteryLevel,
      frequency: Math.round(st.dominantFrequency + (Math.random() - 0.5) * 40),
      temperature: +(st.temperature + (Math.random() - 0.5)).toFixed(1),
      humidity: Math.round(st.humidity + (Math.random() - 0.5) * 4),
      exceeded: db >= st.thresholds.warning,
      noiseCategory: cat
    });
  }
});

// HTTP Logger Middleware for educational inspection
app.use((req: Request, res: Response, next: NextFunction) => {
  // Only capture /api/ routes
  if (!req.url.startsWith('/api/')) {
    return next();
  }

  // Avoid logging the http-logs poll itself to avoid recursive infinite log loop
  if (req.url.startsWith('/api/v1/http-logs')) {
    return next();
  }

  const startTime = performance.now();
  const reqBodyClone = req.body && Object.keys(req.body).length > 0 ? JSON.parse(JSON.stringify(req.body)) : undefined;

  // Intercept res.send / res.json
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let responseBodyData: any = undefined;

  res.json = function (body: any) {
    responseBodyData = body;
    return originalJson(body);
  };

  res.send = function (body: any) {
    if (responseBodyData === undefined) {
      try {
        responseBodyData = typeof body === 'string' ? JSON.parse(body) : body;
      } catch {
        responseBodyData = body;
      }
    }
    return originalSend(body);
  };

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startTime);
    const reqHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        reqHeaders[key] = value;
      }
    }

    const resHeaders: Record<string, string> = {
      'content-type': res.getHeader('content-type')?.toString() || 'application/json',
      'x-powered-by': 'Express-IoT-Gateway'
    };

    const source = req.headers['x-device-id']
      ? `IoT Sensor Node (${req.headers['x-device-id']})`
      : req.headers['x-client-role'] === 'student-sandbox'
      ? 'REST API Learning Sandbox'
      : 'Web Client Dashboard';

    const logItem: HttpLogEntry = {
      id: 'http-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      method: req.method as any,
      url: req.originalUrl || req.url,
      headers: reqHeaders,
      body: reqBodyClone,
      status: res.statusCode,
      statusText: getStatusText(res.statusCode),
      responseHeaders: resHeaders,
      responseBody: responseBodyData,
      durationMs: Math.max(4, durationMs),
      source
    };

    httpLogs.unshift(logItem);
    if (httpLogs.length > 200) {
      httpLogs.pop();
    }
  });

  next();
});

function getStatusText(code: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error'
  };
  return map[code] || 'Status ' + code;
}

// ======================== API RESTful Routes ========================

// 1. GET /api/v1/stations - Lấy danh sách tất cả các trạm
app.get('/api/v1/stations', (req: Request, res: Response) => {
  const { status, zone } = req.query;
  let filtered = [...stations];
  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }
  if (zone) {
    filtered = filtered.filter(s => s.location.zoneType === zone);
  }
  res.json({
    status: 'success',
    total: filtered.length,
    data: filtered,
    meta: {
      activeScenario,
      simulationStep: simulationStepCounter
    }
  });
});

// 2. GET /api/v1/stations/:id - Lấy chi tiết 1 trạm
app.get('/api/v1/stations/:id', (req: Request, res: Response) => {
  const station = stations.find(s => s.id === req.params.id);
  if (!station) {
    res.status(404).json({
      status: 'error',
      code: 404,
      message: `Station with ID '${req.params.id}' not found`
    });
    return;
  }
  res.json({
    status: 'success',
    data: station
  });
});

// 3. POST /api/v1/stations - Đăng ký trạm mới
app.post('/api/v1/stations', (req: Request, res: Response) => {
  const { name, code, location, thresholds, samplingInterval } = req.body;

  if (!name || !code || !location) {
    res.status(400).json({
      status: 'error',
      code: 400,
      message: 'Missing required fields: name, code, and location are required'
    });
    return;
  }

  // Check code uniqueness
  if (stations.some(s => s.code.toLowerCase() === code.toLowerCase())) {
    res.status(409).json({
      status: 'error',
      code: 409,
      message: `Station code '${code}' already exists`
    });
    return;
  }

  const newId = `ST-${String(stations.length + 1).padStart(2, '0')}`;
  const newStation: NoiseStation = {
    id: newId,
    name,
    code,
    location: {
      lat: location.lat || 10.7769,
      lng: location.lng || 106.7009,
      address: location.address || 'TP. Hồ Chí Minh',
      zoneType: location.zoneType || 'residential',
      zoneLabel: location.zoneLabel || 'Khu dân cư'
    },
    status: 'online',
    currentDb: 50.0,
    peakDb: 55.0,
    leqDb: 49.0,
    l10Db: 53.0,
    l90Db: 44.0,
    batteryLevel: 100,
    temperature: 30.0,
    humidity: 70,
    dominantFrequency: 440,
    noiseCategory: 'safe',
    thresholds: {
      warning: thresholds?.warning || 70,
      critical: thresholds?.critical || 80
    },
    samplingInterval: samplingInterval || 2,
    lastSeen: new Date().toISOString(),
    macAddress: `24:6F:28:A1:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
    firmwareVersion: 'v2.4.2-esp32-s3',
    ipAddress: `192.168.10.${110 + stations.length}`,
    totalPacketsSent: 0
  };

  stations.push(newStation);

  res.status(201).json({
    status: 'success',
    code: 201,
    message: 'Station created successfully',
    data: newStation
  });
});

// 4. PUT /api/v1/stations/:id - Cập nhật cấu hình trạm
app.put('/api/v1/stations/:id', (req: Request, res: Response) => {
  const index = stations.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({
      status: 'error',
      code: 404,
      message: `Station with ID '${req.params.id}' not found`
    });
    return;
  }

  const existing = stations[index];
  const updates = req.body;

  if (updates.thresholds) {
    existing.thresholds = {
      ...existing.thresholds,
      ...updates.thresholds
    };
  }
  if (updates.samplingInterval) {
    existing.samplingInterval = Number(updates.samplingInterval);
  }
  if (updates.name) {
    existing.name = updates.name;
  }
  if (updates.status) {
    existing.status = updates.status;
  }
  if (updates.location) {
    existing.location = {
      ...existing.location,
      ...updates.location
    };
  }

  stations[index] = existing;

  res.json({
    status: 'success',
    code: 200,
    message: `Station ${existing.id} updated successfully`,
    data: existing
  });
});

// 5. DELETE /api/v1/stations/:id - Xóa / hủy đăng ký trạm
app.delete('/api/v1/stations/:id', (req: Request, res: Response) => {
  const index = stations.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({
      status: 'error',
      code: 404,
      message: `Station with ID '${req.params.id}' not found`
    });
    return;
  }

  const removed = stations.splice(index, 1)[0];
  telemetryHistory = telemetryHistory.filter(t => t.stationId !== req.params.id);

  res.json({
    status: 'success',
    code: 200,
    message: `Station ${removed.name} (${removed.id}) deleted`,
    data: { id: removed.id, name: removed.name }
  });
});

// 6. POST /api/v1/telemetry - Gửi dữ liệu đo từ thiết bị IoT (cảm biến âm thanh)
app.post('/api/v1/telemetry', (req: Request, res: Response) => {
  const { stationId, decibel, peakDb, leq, battery, frequency, temperature, humidity } = req.body;

  if (!stationId || decibel === undefined) {
    res.status(400).json({
      status: 'error',
      code: 400,
      message: 'Missing stationId or decibel level in telemetry payload'
    });
    return;
  }

  const station = stations.find(s => s.id === stationId);
  if (!station) {
    res.status(404).json({
      status: 'error',
      code: 404,
      message: `Station '${stationId}' not recognized by IoT Gateway`
    });
    return;
  }

  const db = Number(decibel);
  const peak = peakDb !== undefined ? Number(peakDb) : +(db + Math.random() * 3).toFixed(1);
  const leqVal = leq !== undefined ? Number(leq) : +(db - 1.0).toFixed(1);
  const cat = getNoiseCategory(db, station.thresholds.warning, station.thresholds.critical);

  let newStatus: any = 'online';
  let alertTriggered = false;
  let alertMessage = 'Level within acceptable boundaries';

  if (db >= station.thresholds.critical) {
    newStatus = 'critical';
    alertTriggered = true;
    alertMessage = `CRITICAL ALERT: Noise level (${db} dBA) exceeded dangerous limit (${station.thresholds.critical} dBA)`;
  } else if (db >= station.thresholds.warning) {
    newStatus = 'warning';
    alertTriggered = true;
    alertMessage = `WARNING ALERT: Noise level (${db} dBA) exceeded permissible standard (${station.thresholds.warning} dBA)`;
  }

  // Update station live state
  station.currentDb = db;
  station.peakDb = Math.max(station.peakDb, peak);
  station.leqDb = leqVal;
  station.status = newStatus;
  station.noiseCategory = cat;
  station.lastSeen = new Date().toISOString();
  station.totalPacketsSent += 1;
  if (battery !== undefined) station.batteryLevel = Number(battery);
  if (frequency !== undefined) station.dominantFrequency = Number(frequency);
  if (temperature !== undefined) station.temperature = Number(temperature);
  if (humidity !== undefined) station.humidity = Number(humidity);

  const logEntry: NoiseTelemetryLog = {
    id: `tel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    stationId: station.id,
    stationName: station.name,
    timestamp: new Date().toISOString(),
    decibel: db,
    peakDb: peak,
    leq: leqVal,
    battery: station.batteryLevel,
    frequency: station.dominantFrequency,
    temperature: station.temperature,
    humidity: station.humidity,
    exceeded: db >= station.thresholds.warning,
    noiseCategory: cat
  };

  telemetryHistory.push(logEntry);
  if (telemetryHistory.length > 500) {
    telemetryHistory.shift();
  }

  res.status(201).json({
    status: 'success',
    code: 201,
    message: 'Telemetry ingested successfully',
    data: {
      telemetryId: logEntry.id,
      stationId: station.id,
      evaluatedCategory: cat,
      alertTriggered,
      alertMessage,
      serverTimestamp: logEntry.timestamp
    }
  });
});

// 7. GET /api/v1/telemetry/history - Lấy lịch sử dữ liệu đo
app.get('/api/v1/telemetry/history', (req: Request, res: Response) => {
  const { stationId, limit = 50 } = req.query;
  let results = [...telemetryHistory];

  if (stationId) {
    results = results.filter(t => t.stationId === stationId);
  }

  results = results.slice(-Number(limit));

  res.json({
    status: 'success',
    count: results.length,
    data: results
  });
});

// 8. GET /api/v1/http-logs - Lấy nhật ký giao thức HTTP
app.get('/api/v1/http-logs', (req: Request, res: Response) => {
  const { method, limit = 50 } = req.query;
  let logs = [...httpLogs];
  if (method) {
    logs = logs.filter(l => l.method === method);
  }
  res.json({
    status: 'success',
    count: Math.min(logs.length, Number(limit)),
    data: logs.slice(0, Number(limit))
  });
});

// 9. POST /api/v1/simulate/step - Kích hoạt 1 bước mô phỏng
app.post('/api/v1/simulate/step', (req: Request, res: Response) => {
  simulationStepCounter++;
  const { targetStationId } = req.body || {};
  const activeStations = targetStationId
    ? stations.filter(s => s.id === targetStationId)
    : stations.filter(s => s.status !== 'offline');

  const updatedReadings = activeStations.map(st => {
    // Generate realistic noise depending on scenario and zone type
    let baseDelta = 0;
    let freqDelta = 0;

    if (activeScenario === 'rush_hour') {
      // Traffic and commercial zones get loud
      if (st.location.zoneType === 'traffic') baseDelta = 8 + Math.random() * 8;
      else if (st.location.zoneType === 'commercial') baseDelta = 5 + Math.random() * 5;
      else baseDelta = 2 + Math.random() * 4;
      freqDelta = 1500; // Horns
    } else if (activeScenario === 'construction') {
      if (st.id === 'ST-01' || st.id === 'ST-03') {
        baseDelta = 14 + Math.random() * 10;
        freqDelta = 350; // Drilling / pneumatic
      }
    } else if (activeScenario === 'emergency_siren') {
      if (st.id === 'ST-04' || st.id === 'ST-01') {
        baseDelta = 16 + Math.random() * 8;
        freqDelta = 950; // Siren pitch
      }
    } else if (activeScenario === 'night_calm') {
      baseDelta = -15 - Math.random() * 5;
      freqDelta = 100;
    }

    const randomJitter = (Math.random() - 0.5) * 4;
    // Keep within physical boundaries (30dB - 105dB)
    let newDb = +(st.currentDb + randomJitter + (baseDelta * 0.3)).toFixed(1);
    newDb = Math.max(38, Math.min(102, newDb));

    const peak = +(newDb + 1 + Math.random() * 4).toFixed(1);
    const leq = +(newDb - 0.8).toFixed(1);

    // Battery drain slightly
    if (st.batteryLevel > 15 && Math.random() > 0.85) {
      st.batteryLevel = Math.max(10, st.batteryLevel - 1);
    }

    // Update station
    st.currentDb = newDb;
    st.peakDb = Math.max(st.peakDb, peak);
    st.leqDb = leq;
    st.lastSeen = new Date().toISOString();
    st.totalPacketsSent += 1;
    st.noiseCategory = getNoiseCategory(newDb, st.thresholds.warning, st.thresholds.critical);

    if (newDb >= st.thresholds.critical) {
      st.status = 'critical';
    } else if (newDb >= st.thresholds.warning) {
      st.status = 'warning';
    } else {
      st.status = 'online';
    }

    const log: NoiseTelemetryLog = {
      id: `sim-${Date.now()}-${st.id}`,
      stationId: st.id,
      stationName: st.name,
      timestamp: new Date().toISOString(),
      decibel: newDb,
      peakDb: peak,
      leq,
      battery: st.batteryLevel,
      frequency: Math.round(st.dominantFrequency + freqDelta + (Math.random() - 0.5) * 30),
      temperature: +(st.temperature + (Math.random() - 0.5) * 0.3).toFixed(1),
      humidity: Math.round(st.humidity + (Math.random() - 0.5) * 1),
      exceeded: newDb >= st.thresholds.warning,
      noiseCategory: st.noiseCategory
    };

    telemetryHistory.push(log);
    return {
      stationId: st.id,
      stationName: st.name,
      decibel: newDb,
      status: st.status
    };
  });

  if (telemetryHistory.length > 500) {
    telemetryHistory = telemetryHistory.slice(-500);
  }

  res.json({
    status: 'success',
    message: `Step ${simulationStepCounter} simulated successfully`,
    scenario: activeScenario,
    affectedStations: updatedReadings.length,
    readings: updatedReadings
  });
});

// 10. POST /api/v1/simulate/scenario - Đổi kịch bản mô phỏng
app.post('/api/v1/simulate/scenario', (req: Request, res: Response) => {
  const { scenario } = req.body;
  const validScenarios: SimulationScenario[] = ['normal', 'rush_hour', 'construction', 'emergency_siren', 'night_calm'];
  if (!scenario || !validScenarios.includes(scenario)) {
    res.status(400).json({
      status: 'error',
      code: 400,
      message: `Invalid scenario. Allowed values: ${validScenarios.join(', ')}`
    });
    return;
  }

  activeScenario = scenario;

  res.json({
    status: 'success',
    message: `Simulation scenario updated to '${scenario}'`,
    activeScenario
  });
});

// 11. POST /api/v1/reset - Khôi phục dữ liệu mẫu
app.post('/api/v1/reset', (req: Request, res: Response) => {
  stations = JSON.parse(JSON.stringify(INITIAL_STATIONS));
  activeScenario = 'normal';
  simulationStepCounter = 0;
  res.json({
    status: 'success',
    message: 'System reset to default stations and parameters',
    stationsCount: stations.length
  });
});

// Explicit 404 handler for all /api/* routes to prevent Vite from returning index.html
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    code: 404,
    message: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`
  });
});

// Global Express error handler for API routes
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error caught by middleware:', err);
  if (req.url && req.url.startsWith('/api/')) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: err?.message || 'Internal server error occurred in IoT Gateway'
    });
    return;
  }
  next(err);
});

// ======================== Vite / Static Serving ========================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IoT Noise Pollution Gateway running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
