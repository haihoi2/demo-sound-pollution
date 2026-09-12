import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Sliders, 
  Trash2, 
  Power, 
  RefreshCw, 
  MapPin, 
  Battery, 
  Volume2, 
  Cpu, 
  Thermometer, 
  Droplets, 
  Send,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Shield,
  Layers
} from 'lucide-react';
import { NoiseStation, StationStatus } from '../types';
import { StationModal } from './StationModal';

interface StationManagementProps {
  stations: NoiseStation[];
  onAddStation: (data: any) => Promise<void>;
  onUpdateStation: (id: string, data: any) => Promise<void>;
  onDeleteStation: (id: string) => Promise<void>;
  onTriggerTelemetry: (id: string, testDb?: number) => void;
  onSelectStation: (st: NoiseStation) => void;
}

export const StationManagement: React.FC<StationManagementProps> = ({
  stations,
  onAddStation,
  onUpdateStation,
  onDeleteStation,
  onTriggerTelemetry,
  onSelectStation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<NoiseStation | null>(null);

  const filteredStations = useMemo(() => {
    return stations.filter(st => {
      const matchSearch = 
        st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.location.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || st.status === statusFilter;
      const matchZone = zoneFilter === 'ALL' || st.location.zoneType === zoneFilter;

      return matchSearch && matchStatus && matchZone;
    });
  }, [stations, searchTerm, statusFilter, zoneFilter]);

  const handleOpenEdit = (st: NoiseStation) => {
    setStationToEdit(st);
    setModalOpen(true);
  };

  const handleOpenAdd = () => {
    setStationToEdit(null);
    setModalOpen(true);
  };

  const handleToggleOnline = async (st: NoiseStation) => {
    const newStatus: StationStatus = st.status === 'offline' ? 'online' : 'offline';
    await onUpdateStation(st.id, { status: newStatus });
  };

  const handleSaveModal = async (payload: any) => {
    if (stationToEdit) {
      await onUpdateStation(stationToEdit.id, payload);
    } else {
      await onAddStation(payload);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Controls: Search, Filters & Add Station */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm trạm đo theo tên, mã code, địa chỉ..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'online', label: 'Online' },
            { id: 'warning', label: 'Cảnh báo' },
            { id: 'critical', label: 'Nguy hại' },
            { id: 'offline', label: 'Offline' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded text-xs transition ${
                statusFilter === f.id
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Add Station Button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Đăng ký trạm mới (POST)</span>
        </button>
      </div>

      {/* Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map(st => {
          const isCritical = st.status === 'critical';
          const isWarning = st.status === 'warning';
          const isOffline = st.status === 'offline';

          return (
            <div
              key={st.id}
              className={`bg-slate-900/90 border rounded-xl p-4 shadow-sm transition hover:border-slate-700 flex flex-col justify-between ${
                isCritical
                  ? 'border-rose-800/80 bg-rose-950/10'
                  : isWarning
                  ? 'border-amber-800/80 bg-amber-950/10'
                  : isOffline
                  ? 'border-slate-800 opacity-70'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Station Card Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        {st.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isCritical ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        isWarning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        isOffline ? 'bg-slate-700 text-slate-400' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {st.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-1">
                      {st.name}
                    </h3>
                  </div>

                  {/* Power toggle online/offline */}
                  <button
                    onClick={() => handleToggleOnline(st)}
                    title={isOffline ? 'Kích hoạt lại trạm' : 'Tắt kết nối trạm (Simulate Offline)'}
                    className={`p-1.5 rounded-lg border transition ${
                      isOffline
                        ? 'bg-slate-800 text-slate-500 border-slate-700 hover:text-emerald-400'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Location & Zone info */}
                <div className="mt-2.5 text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{st.location.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {st.location.zoneLabel}
                    </span>
                    <span className="font-mono text-slate-500">
                      {st.location.lat.toFixed(4)}, {st.location.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Live Decibel Indicator */}
                <div className="mt-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Cường độ âm (SPL)</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white mt-0.5">
                      {st.currentDb} <span className="text-xs font-semibold text-slate-400">dBA</span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 space-y-0.5">
                    <div>Đỉnh: <strong className="text-rose-400">{st.peakDb} dB</strong></div>
                    <div>Leq: <span className="text-slate-300">{st.leqDb} dB</span></div>
                    <div>Ngưỡng: <span className="text-amber-400">{st.thresholds.warning}</span>/<span className="text-rose-400">{st.thresholds.critical}</span></div>
                  </div>
                </div>

                {/* Hardware Specs Row */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
                  <div className="bg-slate-800/40 p-1.5 rounded border border-slate-800">
                    <div className="flex items-center justify-center gap-1 text-slate-500">
                      <Battery className="w-3 h-3 text-emerald-400" />
                      <span>Pin</span>
                    </div>
                    <span className="font-bold text-slate-300">{st.batteryLevel}%</span>
                  </div>

                  <div className="bg-slate-800/40 p-1.5 rounded border border-slate-800">
                    <div className="flex items-center justify-center gap-1 text-slate-500">
                      <Cpu className="w-3 h-3 text-purple-400" />
                      <span>Tần số</span>
                    </div>
                    <span className="font-bold text-purple-300">{st.dominantFrequency}Hz</span>
                  </div>

                  <div className="bg-slate-800/40 p-1.5 rounded border border-slate-800">
                    <div className="flex items-center justify-center gap-1 text-slate-500">
                      <Send className="w-3 h-3 text-cyan-400" />
                      <span>Đã gửi</span>
                    </div>
                    <span className="font-bold text-slate-300">{st.totalPacketsSent}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Quick Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onTriggerTelemetry(st.id)}
                  title="Mô phỏng trạm gửi 1 gói tin POST /api/v1/telemetry"
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1 transition"
                >
                  <Send className="w-3 h-3" />
                  <span>Gửi Telemetry</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(st)}
                  title="Cập nhật cấu hình (PUT /api/v1/stations/:id)"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc chắn muốn xóa trạm đo "${st.name}" (${st.code})? Hành động này sẽ gửi request DELETE /api/v1/stations/${st.id}.`)) {
                      onDeleteStation(st.id);
                    }
                  }}
                  title="Xóa trạm đo (DELETE /api/v1/stations/:id)"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStations.length === 0 && (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
          <p className="text-slate-400 text-sm">Không tìm thấy trạm đo nào phù hợp với bộ lọc.</p>
        </div>
      )}

      {/* Station Modal for Add / Edit */}
      <StationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        stationToEdit={stationToEdit}
      />
    </div>
  );
};
