import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Sliders, MapPin } from 'lucide-react';
import { NoiseStation, ZoneType } from '../types';

interface StationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  stationToEdit: NoiseStation | null;
}

export const StationModal: React.FC<StationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stationToEdit
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(10.7769);
  const [lng, setLng] = useState(106.7009);
  const [zoneType, setZoneType] = useState<ZoneType>('residential');
  const [warningThreshold, setWarningThreshold] = useState(70);
  const [criticalThreshold, setCriticalThreshold] = useState(80);
  const [samplingInterval, setSamplingInterval] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (stationToEdit) {
      setName(stationToEdit.name);
      setCode(stationToEdit.code);
      setAddress(stationToEdit.location.address);
      setLat(stationToEdit.location.lat);
      setLng(stationToEdit.location.lng);
      setZoneType(stationToEdit.location.zoneType);
      setWarningThreshold(stationToEdit.thresholds.warning);
      setCriticalThreshold(stationToEdit.thresholds.critical);
      setSamplingInterval(stationToEdit.samplingInterval);
    } else {
      setName('');
      setCode(`NODE-${Math.floor(10 + Math.random() * 89)}`);
      setAddress('Khu Công nghệ cao, TP. Thủ Đức, TP.HCM');
      setLat(10.785);
      setLng(106.715);
      setZoneType('residential');
      setWarningThreshold(70);
      setCriticalThreshold(80);
      setSamplingInterval(2);
    }
    setErrorMsg('');
  }, [stationToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên trạm đo');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập mã thiết bị IoT');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const zoneLabels: Record<ZoneType, string> = {
        residential: 'Khu dân cư',
        commercial: 'Khu thương mại',
        traffic: 'Giao thông trọng điểm',
        industrial: 'Khu công nghiệp',
        hospital_school: 'Khu yên tĩnh (Y tế/Trường học)'
      };

      const payload = {
        name,
        code,
        location: {
          lat: Number(lat),
          lng: Number(lng),
          address,
          zoneType,
          zoneLabel: zoneLabels[zoneType]
        },
        thresholds: {
          warning: Number(warningThreshold),
          critical: Number(criticalThreshold)
        },
        samplingInterval: Number(samplingInterval)
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu thông tin trạm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              {stationToEdit ? <Sliders className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {stationToEdit ? `Cấu Hình Trạm Đo: ${stationToEdit.code}` : 'Đăng Ký Trạm Đo IoT Mới'}
              </h3>
              <p className="text-xs text-slate-400">
                {stationToEdit ? 'Cập nhật ngưỡng dB và chu kỳ HTTP qua PUT /api/v1/stations/:id' : 'Gửi POST /api/v1/stations để khởi tạo node mới'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Mã thiết bị (Station Code)</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="VD: TD-NODE-08"
                disabled={!!stationToEdit}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Loại khu vực quy hoạch</label>
              <select
                value={zoneType}
                onChange={e => setZoneType(e.target.value as ZoneType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="traffic">Giao thông trọng điểm</option>
                <option value="commercial">Khu thương mại</option>
                <option value="industrial">Khu công nghiệp</option>
                <option value="hospital_school">Khu yên tĩnh (Bệnh viện/Trường học)</option>
                <option value="residential">Khu dân cư</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Tên trạm đo hiển thị</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="VD: Trạm Vòng xoay Hàng Xanh"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Địa chỉ vị trí trạm</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="VD: Đường Nguyễn Huệ, Quận 1, TP.HCM"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tọa độ Vĩ độ (Latitude)</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={e => setLat(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tọa độ Kinh độ (Longitude)</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={e => setLng(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-3">
            <span className="font-semibold text-slate-200 block">Cấu hình Ngưỡng &amp; Chu kỳ Telemetry</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Ngưỡng cảnh báo (dBA)</label>
                <input
                  type="number"
                  value={warningThreshold}
                  onChange={e => setWarningThreshold(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Ngưỡng nguy hại (dBA)</label>
                <input
                  type="number"
                  value={criticalThreshold}
                  onChange={e => setCriticalThreshold(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-rose-400 font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Chu kỳ HTTP (giây)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={samplingInterval}
                  onChange={e => setSamplingInterval(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{stationToEdit ? 'Lưu cập nhật (PUT)' : 'Tạo trạm mới (POST)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
