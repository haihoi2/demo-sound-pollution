import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Volume2, 
  ShieldAlert, 
  Radio, 
  CheckCircle2, 
  Zap, 
  Info,
  TrendingUp,
  Cpu,
  BarChart3
} from 'lucide-react';
import { NoiseStation, NoiseTelemetryLog } from '../types';

interface DashboardViewProps {
  stations: NoiseStation[];
  telemetryLogs: NoiseTelemetryLog[];
  onSelectStation: (st: NoiseStation) => void;
  onQuickSimulateStep: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stations,
  telemetryLogs,
  onSelectStation,
  onQuickSimulateStep
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>('ALL');
  const [timeWindow, setTimeWindow] = useState<number>(20);

  // Aggregated KPI stats
  const stats = useMemo(() => {
    const total = stations.length;
    const online = stations.filter(s => s.status !== 'offline').length;
    const warning = stations.filter(s => s.status === 'warning').length;
    const critical = stations.filter(s => s.status === 'critical').length;
    const avgDb = total > 0 ? (stations.reduce((acc, s) => acc + s.currentDb, 0) / total).toFixed(1) : '0';
    const maxDb = total > 0 ? Math.max(...stations.map(s => s.peakDb)).toFixed(1) : '0';
    const totalPackets = stations.reduce((acc, s) => acc + s.totalPacketsSent, 0);

    return { total, online, warning, critical, avgDb, maxDb, totalPackets };
  }, [stations]);

  // Color mapping
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'safe':
        return { label: 'An toàn (<55dB)', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'moderate':
        return { label: 'Cho phép (55-70dB)', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'high':
        return { label: 'Cảnh báo (70-80dB)', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30' };
      case 'hazardous':
        return { label: 'Nguy hại (>80dB)', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      default:
        return { label: 'Chưa rõ', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
    }
  };

  const getStationColor = (index: number) => {
    const colors = [
      '#06b6d4', // cyan
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#f43f5e', // rose
      '#a855f7', // purple
      '#14b8a6', // teal
      '#eab308'  // yellow
    ];
    return colors[index % colors.length];
  };

  // Prepare chart time-series data
  const chartData = useMemo(() => {
    if (telemetryLogs.length === 0) return [];

    if (selectedStationId === 'ALL') {
      // Group recent logs by timestamp step or aligned time
      // Let's create uniform time points from last N logs
      const stationMap: Record<string, string> = {};
      stations.forEach(s => {
        stationMap[s.id] = s.name.replace('Trạm ', '');
      });

      // Get unique timestamps or chunk by seconds
      const recent = telemetryLogs.slice(-timeWindow * stations.length);
      const timeSlots: Record<string, any> = {};

      recent.forEach(log => {
        const timeKey = new Date(log.timestamp).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        if (!timeSlots[timeKey]) {
          timeSlots[timeKey] = { time: timeKey };
        }
        timeSlots[timeKey][log.stationId] = log.decibel;
      });

      return Object.values(timeSlots).slice(-timeWindow);
    } else {
      // Single station detailed view
      const singleLogs = telemetryLogs
        .filter(l => l.stationId === selectedStationId)
        .slice(-timeWindow);

      return singleLogs.map(l => ({
        time: new Date(l.timestamp).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        decibel: l.decibel,
        peakDb: l.peakDb,
        leq: l.leq,
        frequency: l.frequency
      }));
    }
  }, [telemetryLogs, selectedStationId, timeWindow, stations]);

  // Frequency spectrum data for active selected station or city average
  const spectrumData = useMemo(() => {
    const target = selectedStationId === 'ALL' 
      ? stations[0] 
      : stations.find(s => s.id === selectedStationId) || stations[0];
    
    if (!target) return [];

    const baseFreq = target.dominantFrequency || 440;
    const bands = [
      { band: '63Hz', label: 'Rung chấn', factor: 0.7 },
      { band: '125Hz', label: 'Động cơ nặng', factor: 0.85 },
      { band: '250Hz', label: 'Giao thông nền', factor: 0.95 },
      { band: '500Hz', label: 'Tiếng nói/xe', factor: 1.05 },
      { band: '1kHz', label: 'Còi xe/tiếng ồn', factor: 1.15 },
      { band: '2kHz', label: 'Tiếng rít/máy bay', factor: 0.9 },
      { band: '4kHz', label: 'Kim loại/khoan', factor: 0.75 },
      { band: '8kHz', label: 'Tần số cao', factor: 0.55 },
    ];

    return bands.map(b => {
      // simulate spectral distribution based on current dB and dominant frequency
      const freqNum = parseInt(b.band);
      const closeness = 1 / (1 + Math.abs(Math.log10(freqNum || 100) - Math.log10(baseFreq)));
      const level = +(target.currentDb * 0.7 + closeness * 20 * b.factor).toFixed(1);
      return {
        band: b.band,
        label: b.label,
        level: Math.min(100, Math.max(25, level))
      };
    });
  }, [stations, selectedStationId]);

  return (
    <div className="space-y-6">
      {/* 1. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Online Stations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Trạng Thái Trạm Đo</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{stats.online}</span>
            <span className="text-xs text-slate-400 font-medium">/ {stats.total} trạm online</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-medium">Hoạt động thời gian thực</span>
          </div>
        </div>

        {/* Card 2: City Average dB */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Độ Ồn Trung Bình TP</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Volume2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{stats.avgDb}</span>
            <span className="text-xs text-slate-400 font-semibold">dBA</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Mức trung bình toàn mạng lưới IoT
          </div>
        </div>

        {/* Card 3: Warnings & Critical */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Vượt Ngưỡng QCVN 26</span>
            <div className={`p-2 rounded-lg ${stats.critical > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${stats.critical > 0 ? 'text-rose-400' : 'text-amber-300'}`}>
              {stats.critical + stats.warning}
            </span>
            <span className="text-xs text-slate-400">
              ({stats.critical} nguy hại, {stats.warning} cảnh báo)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Đỉnh cao nhất: <span className="font-semibold text-rose-400">{stats.maxDb} dBA</span>
          </div>
        </div>

        {/* Card 4: Packets collected */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gói HTTP Telemetry</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-purple-300">
              {stats.totalPackets.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">payloads</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            HTTP POST <code className="text-purple-300 font-mono">/api/v1/telemetry</code>
          </div>
        </div>
      </div>

      {/* 2. Main Real-time Chart Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        {/* Chart Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Biểu Đồ Dao Động Mức Độ Ô Nhiễm Tiếng Ồn (dBA)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Thu thập từ cảm biến âm thanh IoT qua giao thức HTTP RESTful thời gian thực
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Station selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Chọn trạm:</span>
              <select
                id="select-chart-station"
                value={selectedStationId}
                onChange={e => setSelectedStationId(e.target.value)}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Tất cả các trạm ({stations.length})</option>
                {stations.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.code} - {st.name} ({st.currentDb} dB)
                  </option>
                ))}
              </select>
            </div>

            {/* Time window */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              {[10, 20, 30].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setTimeWindow(cnt)}
                  className={`px-2 py-1 rounded text-xs transition ${
                    timeWindow === cnt
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cnt} mẫu
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Legend & Reference indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
              <span>An toàn &lt; 55 dBA</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
              <span>Ngưỡng cảnh báo: 70 dBA (QCVN 26)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
              <span>Ngưỡng nguy hại: 80 dBA</span>
            </span>
          </div>

          <button
            id="btn-chart-quick-step"
            onClick={onQuickSimulateStep}
            className="text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1"
          >
            + Kích hoạt 1 lần đo tiếp theo
          </button>
        </div>

        {/* Recharts Component */}
        <div className="h-72 w-full mt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Đang kết nối cổng HTTP IoT và nạp luồng telemetry...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  domain={[35, 105]} 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  unit="dB" 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc'
                  }}
                />
                
                {/* QCVN Threshold reference lines */}
                <ReferenceLine 
                  y={55} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  label={{ value: '55dB An toàn', fill: '#10b981', fontSize: 10, position: 'insideRight' }} 
                />
                <ReferenceLine 
                  y={70} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  label={{ value: '70dB Cảnh báo', fill: '#f59e0b', fontSize: 10, position: 'insideRight' }} 
                />
                <ReferenceLine 
                  y={80} 
                  stroke="#f43f5e" 
                  strokeDasharray="4 4" 
                  label={{ value: '80dB Nguy hại', fill: '#f43f5e', fontSize: 10, position: 'insideRight' }} 
                />

                {selectedStationId === 'ALL' ? (
                  stations.map((st, i) => (
                    <Line
                      key={st.id}
                      type="monotone"
                      dataKey={st.id}
                      name={st.code}
                      stroke={getStationColor(i)}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="decibel"
                      name="Mức ồn tức thời (SPL)"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#06b6d4' }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="peakDb"
                      name="Đỉnh ồn (Peak Lmax)"
                      stroke="#f43f5e"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="leq"
                      name="Mức ồn tương đương (Leq)"
                      stroke="#a855f7"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </>
                )}
                <Legend 
                  verticalAlign="bottom" 
                  height={30} 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Station Comparative Bar Chart & Frequency Spectrum */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Station Comparative Bars */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                So Sánh Mức Ồn Tức Thời Hiện Tại Giữa Các Trạm
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cập nhật liên tục theo telemetry mới nhất
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Đơn vị: dBA</span>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stations.map(s => ({
                  name: s.code,
                  fullName: s.name,
                  db: s.currentDb,
                  category: s.noiseCategory,
                  station: s
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  domain={[30, 100]} 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <Tooltip
                  formatter={(val: any) => [`${val} dBA`, 'Mức ồn']}
                  labelFormatter={label => `Mã trạm: ${label}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc'
                  }}
                />
                <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" />
                <Bar 
                  dataKey="db" 
                  radius={[4, 4, 0, 0]}
                  onClick={(entry: any) => {
                    if (entry?.station) onSelectStation(entry.station);
                  }}
                  className="cursor-pointer"
                >
                  {stations.map(st => {
                    let fillColor = '#10b981';
                    if (st.noiseCategory === 'moderate') fillColor = '#f59e0b';
                    if (st.noiseCategory === 'high') fillColor = '#f97316';
                    if (st.noiseCategory === 'hazardous') fillColor = '#f43f5e';
                    return <Cell key={st.id} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-2 text-center text-[10px]">
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              &lt;55dB An toàn
            </span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              55-70dB Vừa phải
            </span>
            <span className="p-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
              70-80dB Cảnh báo
            </span>
            <span className="p-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              &gt;80dB Nguy hại
            </span>
          </div>
        </div>

        {/* Right: Audio Frequency Analysis (FFT Spectrum) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Phổ Tần Số Âm Thanh Cảm Biến IoT (FFT Spectrum)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Phân tích dải tần để nhận diện nguồn gây ồn (xe cộ, còi xe, động cơ)
              </p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
              DSP / FFT
            </span>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spectrumData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="band" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val} dBA (${item.payload.label})`,
                    'Cường độ tần số'
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc'
                  }}
                />
                <Bar dataKey="level" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {spectrumData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.level > 75 ? '#f43f5e' : entry.level > 65 ? '#f59e0b' : '#8b5cf6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Âm trầm (Động cơ xe 63-250Hz)</span>
            <span>Tiếng nói/còi (500-1kHz)</span>
            <span>Âm cao (Rít, phanh 2k-8kHz)</span>
          </div>
        </div>
      </div>

      {/* 4. Educational Note: QCVN 26 Standards */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Kiến Thức IoT &amp; Môi Trường: Tiêu Chuẩn QCVN 26:2010/BTNMT
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Các thiết bị IoT đo ô nhiễm tiếng ồn sử dụng cảm biến micro (như MAX4466/INMP441) kết hợp thuật toán tính trọng số A (A-weighting). Khi trạm đo ghi nhận mức âm vượt 70 dBA (khu dân cư) hoặc 55 dBA (bệnh viện/trường học), trạm gửi gói tin <code className="text-cyan-300 font-mono">POST /api/v1/telemetry</code> kèm cờ báo động để kích hoạt cảnh báo tức thời.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => onSelectStation(stations[0])}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-600 transition"
          >
            Xem trạm mẫu ST-01
          </button>
        </div>
      </div>
    </div>
  );
};
