import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Radio, 
  Volume2, 
  Battery, 
  Thermometer, 
  Droplets, 
  Send, 
  Cpu, 
  ExternalLink,
  Layers,
  X,
  Compass,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon
} from 'lucide-react';
import { NoiseStation, ZoneType } from '../types';

interface InteractiveMapProps {
  stations: NoiseStation[];
  selectedStation: NoiseStation | null;
  onSelectStation: (st: NoiseStation | null) => void;
  onTriggerTelemetry: (stationId: string, testDb?: number) => void;
  onInspectHttp: () => void;
}

// Bounding box for Central HCMC
const MAP_BOUNDS = {
  minLat: 10.740,
  maxLat: 10.835,
  minLng: 106.610,
  maxLng: 106.745
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  onTriggerTelemetry,
  onInspectHttp
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [showAcousticWaves, setShowAcousticWaves] = useState<boolean>(true);
  const [testDbInput, setTestDbInput] = useState<number>(75);

  // Convert GPS (lat, lng) to relative SVG percentage coordinates (x, y)
  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
    // Note: latitude increases upwards, SVG y increases downwards
    const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y))
    };
  };

  const filteredStations = useMemo(() => {
    if (selectedZone === 'ALL') return stations;
    return stations.filter(s => s.location.zoneType === selectedZone);
  }, [stations, selectedZone]);

  const getMarkerColor = (cat: string) => {
    switch (cat) {
      case 'safe': return { bg: '#10b981', ring: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald-400' };
      case 'moderate': return { bg: '#f59e0b', ring: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' };
      case 'high': return { bg: '#f97316', ring: 'rgba(249, 115, 22, 0.45)', text: 'text-orange-400' };
      case 'hazardous': return { bg: '#f43f5e', ring: 'rgba(244, 63, 94, 0.5)', text: 'text-rose-400' };
      default: return { bg: '#64748b', ring: 'rgba(100, 116, 139, 0.3)', text: 'text-slate-400' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Map Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Lọc khu vực:
          </span>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'traffic', label: 'Giao thông' },
            { id: 'commercial', label: 'Thương mại' },
            { id: 'industrial', label: 'Công nghiệp' },
            { id: 'hospital_school', label: 'Y tế / Trường học' },
            { id: 'residential', label: 'Dân cư' }
          ].map(z => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedZone === z.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAcousticWaves}
              onChange={e => setShowAcousticWaves(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Sóng âm dB (Wave animation)</span>
          </label>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 ml-2">
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.6, prev + 0.15))}
              title="Phóng to"
              className="p-1 text-slate-300 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-400 px-1 font-mono">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.85, prev - 0.15))}
              title="Thu nhỏ"
              className="p-1 text-slate-300 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              title="Mặc định"
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Display Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Map Canvas */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative shadow-inner min-h-[460px] h-[520px]">
          {/* Compass & Scale Badge */}
          <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-300 pointer-events-none">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span className="font-semibold">Bản Đồ Quan Trắc TP. Hồ Chí Minh</span>
            <span className="text-[10px] text-slate-500 font-mono">WGS84</span>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 p-2.5 rounded-lg text-[11px] text-slate-300 space-y-1 pointer-events-none shadow-md">
            <div className="font-bold text-slate-400 uppercase text-[10px]">Mức độ âm thanh</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>&lt;55 dB (An toàn / Khu đặc biệt)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>55-70 dB (Cho phép tiêu chuẩn)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>70-80 dB (Cảnh báo vượt mức)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>&gt;80 dB (Nguy hại thính lực)</span>
            </div>
          </div>

          {/* SVG Map Canvas with Zoom transform */}
          <div 
            className="w-full h-full transition-transform duration-200 origin-center relative cursor-grab active:cursor-grabbing"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <svg 
              viewBox="0 0 1000 700" 
              className="w-full h-full select-none"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {/* Grid pattern */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
                </pattern>
                {/* River gradient */}
                <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#083344" />
                  <stop offset="50%" stopColor="#0e7490" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#082f49" />
                </linearGradient>
              </defs>

              {/* Background dark grid */}
              <rect width="1000" height="700" fill="#090d16" />
              <rect width="1000" height="700" fill="url(#grid)" />

              {/* District polygons / zones */}
              {/* Tan Binh & TSN Airport area */}
              <rect x="220" y="80" width="280" height="180" rx="20" fill="#131c2e" opacity="0.5" stroke="#1e293b" />
              <text x="240" y="110" fill="#475569" fontSize="13" fontWeight="bold">QUẬN TÂN BÌNH / SÂN BAY TSN</text>

              {/* District 1 / Central Area */}
              <rect x="520" y="320" width="220" height="180" rx="20" fill="#131c2e" opacity="0.6" stroke="#1e293b" />
              <text x="540" y="350" fill="#475569" fontSize="13" fontWeight="bold">TRUNG TÂM QUẬN 1 &amp; 3</text>

              {/* Binh Thanh */}
              <rect x="580" y="140" width="240" height="160" rx="20" fill="#131c2e" opacity="0.5" stroke="#1e293b" />
              <text x="600" y="170" fill="#475569" fontSize="13" fontWeight="bold">QUẬN BÌNH THẠNH</text>

              {/* District 5 / Cho Ray */}
              <rect x="240" y="380" width="240" height="180" rx="20" fill="#131c2e" opacity="0.5" stroke="#1e293b" />
              <text x="260" y="410" fill="#475569" fontSize="13" fontWeight="bold">QUẬN 5 &amp; QUẬN 10</text>

              {/* Thu Duc / Sala */}
              <rect x="720" y="340" width="240" height="260" rx="20" fill="#131c2e" opacity="0.5" stroke="#1e293b" />
              <text x="740" y="370" fill="#475569" fontSize="13" fontWeight="bold">TP. THỦ ĐỨC (SALA)</text>

              {/* Major Roads / Arteries */}
              {/* Highway / Hanoi Highway & Dien Bien Phu */}
              <path 
                d="M 150 160 Q 420 220 620 230 T 960 210" 
                fill="none" 
                stroke="#334155" 
                strokeWidth="4" 
                strokeDasharray="6 3"
                opacity="0.8" 
              />
              <text x="440" y="210" fill="#64748b" fontSize="10" transform="rotate(7 440 210)">Đại lộ Điện Biên Phủ</text>

              {/* Mai Chi Tho / Vo Van Kiet */}
              <path 
                d="M 120 520 Q 450 490 680 460 T 960 440" 
                fill="none" 
                stroke="#334155" 
                strokeWidth="5" 
                opacity="0.8" 
              />
              <text x="750" y="450" fill="#64748b" fontSize="10">Đại lộ Mai Chí Thọ</text>

              {/* Ly Thuong Kiet / Truong Chinh */}
              <path 
                d="M 280 60 L 360 620" 
                fill="none" 
                stroke="#1e293b" 
                strokeWidth="3.5" 
                opacity="0.7" 
              />
              <text x="290" y="300" fill="#64748b" fontSize="10" transform="rotate(78 290 300)">Trục Trường Chinh - Lý Thường Kiệt</text>

              {/* Saigon River Winding Path */}
              <path
                d="M 880 30 C 780 90, 720 180, 700 240 C 670 330, 680 390, 730 450 C 780 500, 740 600, 800 680"
                fill="none"
                stroke="url(#riverGrad)"
                strokeWidth="28"
                strokeLinecap="round"
                opacity="0.85"
              />
              <text x="730" y="270" fill="#0891b2" fontSize="12" fontWeight="bold" opacity="0.7" transform="rotate(65 730 270)">
                SÔNG SÀI GÒN
              </text>

              {/* Landmark markers */}
              <g transform="translate(680, 240)">
                <circle r="4" fill="#38bdf8" />
                <text x="8" y="4" fill="#94a3b8" fontSize="10">Landmark 81</text>
              </g>
              <g transform="translate(380, 150)">
                <circle r="4" fill="#a855f7" />
                <text x="8" y="4" fill="#94a3b8" fontSize="10">Ga Hàng Không TSN</text>
              </g>
              <g transform="translate(570, 410)">
                <circle r="4" fill="#f59e0b" />
                <text x="8" y="4" fill="#94a3b8" fontSize="10">Chợ Bến Thành</text>
              </g>

              {/* Station Markers with Pulsing Sound Waves */}
              {filteredStations.map((st) => {
                const coords = projectCoords(st.location.lat, st.location.lng);
                const svgX = (coords.x / 100) * 1000;
                const svgY = (coords.y / 100) * 700;
                const colors = getMarkerColor(st.noiseCategory);
                const isSelected = selectedStation?.id === st.id;
                
                // Sound wave radius scales with decibels
                const waveRadius = Math.max(16, (st.currentDb - 30) * 0.9);

                return (
                  <g 
                    key={st.id} 
                    transform={`translate(${svgX}, ${svgY})`}
                    onClick={() => onSelectStation(st)}
                    className="cursor-pointer group"
                  >
                    {/* Acoustic wave ripple rings */}
                    {showAcousticWaves && st.status !== 'offline' && (
                      <>
                        <circle
                          r={waveRadius * 1.5}
                          fill="none"
                          stroke={colors.bg}
                          strokeWidth="1.5"
                          opacity="0.25"
                          className="animate-ping"
                          style={{
                            animationDuration: st.currentDb > 75 ? '1.2s' : '2.4s'
                          }}
                        />
                        <circle
                          r={waveRadius}
                          fill={colors.ring}
                          opacity="0.3"
                        />
                      </>
                    )}

                    {/* Outer selection ring if selected */}
                    {isSelected && (
                      <circle
                        r="24"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Main Station Icon Center */}
                    <circle
                      r={isSelected ? '14' : '11'}
                      fill={colors.bg}
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Sensor Icon or Text Inside */}
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {Math.round(st.currentDb)}
                    </text>

                    {/* Station Tag Floating Label */}
                    <g transform="translate(0, -18)">
                      <rect
                        x="-45"
                        y="-14"
                        width="90"
                        height="16"
                        rx="4"
                        fill="#0f172a"
                        stroke={colors.bg}
                        strokeWidth="1"
                        opacity="0.9"
                      />
                      <text
                        textAnchor="middle"
                        dy="-2.5"
                        fill="#f8fafc"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {st.code} · {st.currentDb}dB
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Station Details & IoT Action Drawer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          {selectedStation ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {selectedStation.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedStation.status === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                      selectedStation.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {selectedStation.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {selectedStation.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {selectedStation.location.address}
                  </p>
                </div>

                <button
                  onClick={() => onSelectStation(null)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Real-time Decibel Card */}
              <div className={`p-4 rounded-xl border ${
                selectedStation.noiseCategory === 'hazardous'
                  ? 'bg-rose-950/30 border-rose-800/60'
                  : selectedStation.noiseCategory === 'high'
                  ? 'bg-orange-950/30 border-orange-800/60'
                  : selectedStation.noiseCategory === 'moderate'
                  ? 'bg-amber-950/30 border-amber-800/60'
                  : 'bg-emerald-950/30 border-emerald-800/60'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Mức ồn tức thời (SPL)</span>
                  <span className="text-xs font-mono text-slate-400">QCVN 26:2010</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {selectedStation.currentDb}
                  </span>
                  <span className="text-sm font-bold text-slate-400">dBA</span>
                  <span className="text-xs ml-auto font-medium text-slate-300">
                    Đỉnh: <strong className="text-rose-400">{selectedStation.peakDb} dB</strong>
                  </span>
                </div>

                {/* Progress bar towards critical threshold */}
                <div className="mt-2.5">
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        selectedStation.currentDb >= selectedStation.thresholds.critical
                          ? 'bg-rose-500'
                          : selectedStation.currentDb >= selectedStation.thresholds.warning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (selectedStation.currentDb / 100) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>30 dB</span>
                    <span>Cảnh báo: {selectedStation.thresholds.warning} dB</span>
                    <span>Nguy hại: {selectedStation.thresholds.critical} dB</span>
                  </div>
                </div>
              </div>

              {/* Sensor & Node Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pin / Nguồn</span>
                  </div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {selectedStation.batteryLevel}% (Li-Po)
                  </div>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>Tần số ưu thế</span>
                  </div>
                  <div className="text-sm font-bold text-purple-300 mt-1">
                    {selectedStation.dominantFrequency} Hz
                  </div>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nhiệt độ</span>
                  </div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {selectedStation.temperature} °C
                  </div>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Độ ẩm</span>
                  </div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {selectedStation.humidity} %
                  </div>
                </div>
              </div>

              {/* Hardware / Firmware Metadata */}
              <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">MAC Addr:</span>
                  <span className="text-slate-300">{selectedStation.macAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Firmware:</span>
                  <span className="text-slate-300">{selectedStation.firmwareVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IP Trạm:</span>
                  <span className="text-slate-300">{selectedStation.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chu kỳ đo:</span>
                  <span className="text-cyan-400">{selectedStation.samplingInterval}s</span>
                </div>
              </div>

              {/* Interactive Telemetry Test Ingestion for IoT Students */}
              <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold">
                  <span>Mô phỏng gửi HTTP POST Telemetry:</span>
                  <span className="font-mono">{testDbInput} dBA</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={40}
                    max={100}
                    value={testDbInput}
                    onChange={e => setTestDbInput(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <button
                    onClick={() => onTriggerTelemetry(selectedStation.id, testDbInput)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 whitespace-nowrap active:scale-95 transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>Gửi</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Gửi payload <code className="text-cyan-300 font-mono">POST /api/v1/telemetry</code> mô phỏng cảm biến Node {selectedStation.code}.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="p-3 rounded-full bg-slate-800/80 mb-3 text-slate-400">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">Chọn 1 trạm đo trên bản đồ</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Click vào bất kỳ biểu tượng trạm nào trên bản đồ để xem chi tiết thông số cảm biến, chỉ số dBA, sóng âm và mô phỏng gửi dữ liệu RESTful.
              </p>
            </div>
          )}

          {/* Bottom Button to Inspect HTTP Logs */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={onInspectHttp}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xem nhật ký gói tin HTTP trạm này gửi lên</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
