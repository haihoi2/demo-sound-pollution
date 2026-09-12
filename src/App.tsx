import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InteractiveMap } from './components/InteractiveMap';
import { StationManagement } from './components/StationManagement';
import { HttpInspectorView } from './components/HttpInspectorView';
import { RestSandboxView } from './components/RestSandboxView';
import { api } from './services/api';
import { NoiseStation, NoiseTelemetryLog, HttpLogEntry, SimulationScenario } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'stations' | 'http-inspector' | 'sandbox'>('dashboard');
  const [stations, setStations] = useState<NoiseStation[]>([]);
  const [telemetryLogs, setTelemetryLogs] = useState<NoiseTelemetryLog[]>([]);
  const [httpLogs, setHttpLogs] = useState<HttpLogEntry[]>([]);
  const [selectedStation, setSelectedStation] = useState<NoiseStation | null>(null);

  // Simulation controls
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(2000);
  const [scenario, setScenario] = useState<SimulationScenario>('normal');
  const [simStep, setSimStep] = useState<number>(1);
  const [isStepLoading, setIsStepLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const autoRunTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initial load
  const loadData = useCallback(async () => {
    try {
      const [stRes, telRes, logsRes] = await Promise.all([
        api.getStations(),
        api.getTelemetryHistory(undefined, 80),
        api.getHttpLogs(80)
      ]);

      if (stRes?.data) setStations(stRes.data);
      if (telRes?.data) setTelemetryLogs(telRes.data);
      if (logsRes?.data) setHttpLogs(logsRes.data);
      if (stRes?.meta?.simulationStep) setSimStep(stRes.meta.simulationStep);
    } catch (err) {
      console.error('Error loading initial IoT data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep selectedStation synced with latest stations data
  useEffect(() => {
    if (selectedStation) {
      const found = stations.find(s => s.id === selectedStation.id);
      if (found) {
        setSelectedStation(found);
      }
    }
  }, [stations]);

  // Trigger 1 simulation step
  const handleSimulateStep = useCallback(async (targetId?: string) => {
    setIsStepLoading(true);
    try {
      const res = await api.stepSimulation(targetId);
      setSimStep(prev => prev + 1);

      // Refresh data
      const [stRes, telRes, logsRes] = await Promise.all([
        api.getStations(),
        api.getTelemetryHistory(undefined, 80),
        api.getHttpLogs(80)
      ]);

      if (stRes?.data) setStations(stRes.data);
      if (telRes?.data) setTelemetryLogs(telRes.data);
      if (logsRes?.data) setHttpLogs(logsRes.data);
    } catch (err: any) {
      console.error('Simulation step failed:', err);
      showToast('Lỗi khi thực hiện bước mô phỏng');
    } finally {
      setIsStepLoading(false);
    }
  }, []);

  // Auto-run simulation loop
  useEffect(() => {
    if (isAutoRunning) {
      autoRunTimerRef.current = setInterval(() => {
        handleSimulateStep();
      }, simulationSpeed);
    } else {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
      }
    }

    return () => {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
      }
    };
  }, [isAutoRunning, simulationSpeed, handleSimulateStep]);

  // Change Scenario
  const handleScenarioChange = async (sc: SimulationScenario) => {
    setScenario(sc);
    try {
      await api.setScenario(sc);
      showToast(`Đã chuyển kịch bản sang: ${sc}`);
      handleSimulateStep();
    } catch (err) {
      console.error('Failed to change scenario:', err);
    }
  };

  // Reset system
  const handleReset = async () => {
    try {
      await api.resetSystem();
      setScenario('normal');
      setSimStep(1);
      await loadData();
      showToast('Đã khôi phục dữ liệu các trạm đo về mặc định');
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  // Station CRUD Handlers
  const handleAddStation = async (payload: any) => {
    const res = await api.createStation(payload);
    if (res?.data) {
      setStations(prev => [...prev, res.data]);
      showToast(`Đã thêm trạm mới: ${res.data.name} (${res.data.code})`);
      // refresh http logs
      const logsRes = await api.getHttpLogs(60);
      if (logsRes?.data) setHttpLogs(logsRes.data);
    }
  };

  const handleUpdateStation = async (id: string, updates: any) => {
    const res = await api.updateStation(id, updates);
    if (res?.data) {
      setStations(prev => prev.map(s => (s.id === id ? res.data : s)));
      showToast(`Đã cập nhật cấu hình trạm ${res.data.code}`);
      const logsRes = await api.getHttpLogs(60);
      if (logsRes?.data) setHttpLogs(logsRes.data);
    }
  };

  const handleDeleteStation = async (id: string) => {
    await api.deleteStation(id);
    setStations(prev => prev.filter(s => s.id !== id));
    if (selectedStation?.id === id) {
      setSelectedStation(null);
    }
    showToast(`Đã xóa trạm đo ${id}`);
    const logsRes = await api.getHttpLogs(60);
    if (logsRes?.data) setHttpLogs(logsRes.data);
  };

  // Manual Trigger Telemetry from map or station list
  const handleTriggerTelemetry = async (stationId: string, testDb?: number) => {
    const target = stations.find(s => s.id === stationId);
    const dbVal = testDb !== undefined ? testDb : (target ? target.currentDb + (Math.random() - 0.5) * 5 : 75);
    
    try {
      await api.postTelemetry({
        stationId,
        decibel: +Number(dbVal).toFixed(1),
        peakDb: +(Number(dbVal) + 4).toFixed(1),
        battery: target?.batteryLevel || 90,
        frequency: target?.dominantFrequency || 440
      });

      showToast(`Đã gửi gói tin POST /api/v1/telemetry cho ${target?.code || stationId}`);
      // Refresh
      const [stRes, telRes, logsRes] = await Promise.all([
        api.getStations(),
        api.getTelemetryHistory(undefined, 80),
        api.getHttpLogs(80)
      ]);
      if (stRes?.data) setStations(stRes.data);
      if (telRes?.data) setTelemetryLogs(telRes.data);
      if (logsRes?.data) setHttpLogs(logsRes.data);
    } catch (err) {
      console.error('Trigger telemetry failed:', err);
    }
  };

  const criticalCount = stations.filter(s => s.status === 'critical').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAutoRunning={isAutoRunning}
        setIsAutoRunning={setIsAutoRunning}
        onStep={() => handleSimulateStep()}
        onReset={handleReset}
        simulationSpeed={simulationSpeed}
        setSimulationSpeed={setSimulationSpeed}
        scenario={scenario}
        onScenarioChange={handleScenarioChange}
        totalStations={stations.length}
        criticalCount={criticalCount}
        isStepLoading={isStepLoading}
        simStep={simStep}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            stations={stations}
            telemetryLogs={telemetryLogs}
            onSelectStation={(st) => {
              setSelectedStation(st);
              setActiveTab('map');
            }}
            onQuickSimulateStep={() => handleSimulateStep()}
          />
        )}

        {activeTab === 'map' && (
          <InteractiveMap
            stations={stations}
            selectedStation={selectedStation}
            onSelectStation={setSelectedStation}
            onTriggerTelemetry={handleTriggerTelemetry}
            onInspectHttp={() => setActiveTab('http-inspector')}
          />
        )}

        {activeTab === 'stations' && (
          <StationManagement
            stations={stations}
            onAddStation={handleAddStation}
            onUpdateStation={handleUpdateStation}
            onDeleteStation={handleDeleteStation}
            onTriggerTelemetry={handleTriggerTelemetry}
            onSelectStation={(st) => {
              setSelectedStation(st);
              setActiveTab('map');
            }}
          />
        )}

        {activeTab === 'http-inspector' && (
          <HttpInspectorView
            httpLogs={httpLogs}
            onRefreshLogs={async () => {
              const res = await api.getHttpLogs(80);
              if (res?.data) setHttpLogs(res.data);
            }}
          />
        )}

        {activeTab === 'sandbox' && (
          <RestSandboxView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Hệ thống Mô phỏng Trạm đo Ô nhiễm Tiếng ồn IoT &amp; RESTful API Gateway (QCVN 26:2010/BTNMT)
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>ESP32 / MEMS Micro</span>
            <span>·</span>
            <span>Express REST API</span>
            <span>·</span>
            <span>HTTP/1.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
