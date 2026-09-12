import React from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Activity, 
  Radio, 
  Layers, 
  MapPin, 
  Terminal, 
  Code2, 
  SlidersHorizontal,
  Flame,
  Sun,
  Moon
} from 'lucide-react';
import { SimulationScenario } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'map' | 'stations' | 'http-inspector' | 'sandbox';
  setActiveTab: (tab: 'dashboard' | 'map' | 'stations' | 'http-inspector' | 'sandbox') => void;
  isAutoRunning: boolean;
  setIsAutoRunning: (val: boolean | ((prev: boolean) => boolean)) => void;
  onStep: () => void;
  onReset: () => void;
  simulationSpeed: number;
  setSimulationSpeed: (spd: number) => void;
  scenario: SimulationScenario;
  onScenarioChange: (sc: SimulationScenario) => void;
  totalStations: number;
  criticalCount: number;
  isStepLoading: boolean;
  simStep: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAutoRunning,
  setIsAutoRunning,
  onStep,
  onReset,
  simulationSpeed,
  setSimulationSpeed,
  scenario,
  onScenarioChange,
  totalStations,
  criticalCount,
  isStepLoading,
  simStep,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md">
      {/* Top row: Brand & Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                IoT NoiseSense
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  RESTful IoT Lab
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Trạm Quan Trắc Ô Nhiễm Tiếng Ồn &amp; Phân Tích HTTP Telemetry Thời Gian Thực
            </p>
          </div>
        </div>

        {/* Right Header Area: Live Stats & PROMINENT Theme Switch */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Status step & stations (desktop) */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Bước:</span>
              <span className="font-mono text-cyan-300 font-bold">#{simStep}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-slate-400">Trạm:</span>
              <span className="font-semibold text-slate-200">{totalStations}</span>
              {criticalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                  {criticalCount} Báo động
                </span>
              )}
            </div>
          </div>

          {/* Prominent Segmented Theme Switch (Light / Dark) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-800/90 border border-slate-700 shadow-inner">
            <button
              id="theme-dark-btn"
              onClick={() => theme !== 'dark' && onToggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                theme === 'dark'
                  ? 'bg-slate-700 text-cyan-300 shadow-sm border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tối</span>
            </button>
            <button
              id="theme-light-btn"
              onClick={() => theme !== 'light' && onToggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                theme === 'light'
                  ? 'bg-amber-400/20 text-amber-500 border border-amber-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Sáng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle row: Simulator Control Hub */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/50">
        <div className="flex flex-wrap items-center gap-2">
          {/* Step button */}
          <button
            id="btn-step-simulate"
            onClick={onStep}
            disabled={isStepLoading}
            title="Gửi 1 lượt gói tin telemetry từ các cảm biến IoT"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition disabled:opacity-50"
          >
            <SkipForward className={`w-3.5 h-3.5 text-cyan-400 ${isStepLoading ? 'animate-spin' : ''}`} />
            <span>Mô phỏng 1 bước</span>
          </button>

          {/* Auto run toggle */}
          <button
            id="btn-auto-simulate"
            onClick={() => setIsAutoRunning(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 border ${
              isAutoRunning
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-900/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isAutoRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Tạm dừng</span>
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>Chạy tự động</span>
              </>
            )}
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-800 text-xs text-slate-400">
            <span className="hidden sm:inline text-[11px]">Tốc độ:</span>
            {[1000, 2000, 4000].map(speed => (
              <button
                key={speed}
                onClick={() => setSimulationSpeed(speed)}
                className={`px-2 py-1 rounded text-xs transition ${
                  simulationSpeed === speed
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed === 1000 ? '1s (Nhanh)' : speed === 2000 ? '2s' : '4s'}
              </button>
            ))}
          </div>

          {/* Scenario injector */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
            <Flame className="w-3.5 h-3.5 text-amber-400 hidden sm:inline" />
            <select
              id="select-scenario"
              value={scenario}
              onChange={e => onScenarioChange(e.target.value as SimulationScenario)}
              className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="normal">Kịch bản: Bình thường</option>
              <option value="rush_hour">Kịch bản: Giờ cao điểm (Kẹt xe)</option>
              <option value="construction">Kịch bản: Công trường thi công</option>
              <option value="emergency_siren">Kịch bản: Còi xe cứu thương</option>
              <option value="night_calm">Kịch bản: Đêm khuya thanh tĩnh</option>
            </select>
          </div>

          {/* Reset button */}
          <button
            id="btn-reset-sim"
            onClick={onReset}
            title="Khôi phục trạng thái ban đầu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 overflow-x-auto border-t border-slate-800/80 scrollbar-none">
        <div className="flex items-center gap-1">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Dashboard &amp; Biểu Đồ</span>
          </button>

          <button
            id="tab-map"
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'map'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Bản Đồ Tương Tác Vị Trí</span>
          </button>

          <button
            id="tab-stations"
            onClick={() => setActiveTab('stations')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'stations'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Quản Lý Tập Trung ({totalStations} trạm)</span>
          </button>

          <button
            id="tab-http-inspector"
            onClick={() => setActiveTab('http-inspector')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'http-inspector'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>HTTP Request/Response Inspector</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              Học IoT
            </span>
          </button>

          <button
            id="tab-sandbox"
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Code2 className="w-4 h-4 text-purple-400" />
            <span>REST API Sandbox &amp; Mã Nguồn ESP32</span>
          </button>
        </div>

        {/* Quick theme toggle in tab row */}
        <button
          id="btn-tab-theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Đổi sang giao diện Sáng' : 'Đổi sang giao diện Tối'}
          className="ml-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 shrink-0 transition"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Chế độ Sáng</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chế độ Tối</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
