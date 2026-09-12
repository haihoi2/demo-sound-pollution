import React, { useState } from 'react';
import { 
  Terminal, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Copy, 
  Check, 
  Filter, 
  Trash2, 
  RefreshCw, 
  BookOpen, 
  Radio, 
  Code2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { HttpLogEntry, HttpMethod } from '../types';

interface HttpInspectorViewProps {
  httpLogs: HttpLogEntry[];
  onRefreshLogs: () => void;
  onClearLogs?: () => void;
  onSelectSandboxTemplate?: (template: any) => void;
}

export const HttpInspectorView: React.FC<HttpInspectorViewProps> = ({
  httpLogs,
  onRefreshLogs,
  onClearLogs,
  onSelectSandboxTemplate
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(
    httpLogs.length > 0 ? httpLogs[0].id : null
  );
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const filteredLogs = httpLogs.filter(log => {
    if (methodFilter === 'ALL') return true;
    return log.method === methodFilter;
  });

  const activeLog = httpLogs.find(l => l.id === selectedLogId) || filteredLogs[0] || null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 1500);
  };

  const getMethodBadge = (method: HttpMethod) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'POST':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'PUT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'DELETE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (status >= 400 && status < 500) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Educational Overview of RESTful IoT */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Giám Sát Giao Thức HTTP &amp; RESTful API Trong Hệ Thống IoT
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono">
                Real-time Traffic
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Mỗi trạm đo tiếng ồn IoT (ESP32/Raspberry Pi) gửi dữ liệu cảm biến dBA qua các phương thức HTTP chuẩn (<code className="text-emerald-300 font-mono">POST</code>, <code className="text-blue-300 font-mono">GET</code>, <code className="text-amber-300 font-mono">PUT</code>, <code className="text-rose-300 font-mono">DELETE</code>). Tại đây bạn có thể kiểm tra từng byte của Request Headers, Request Body, Status Code và Response JSON trả về từ Cloud Gateway.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={onRefreshLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Panel Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[560px]">
        {/* Left Column: HTTP Logs Stream (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col shadow-sm">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 text-[11px] mr-1">Method:</span>
              {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map(m => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                    methodFilter === m
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              {filteredLogs.length} cuộc gọi
            </span>
          </div>

          {/* Scrollable Logs List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 mt-2 pr-1 max-h-[500px] scrollbar-thin">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Chưa có gói tin HTTP nào ghi nhận. Hãy bấm nút "Mô phỏng 1 bước" hoặc bật "Chạy tự động".
              </div>
            ) : (
              filteredLogs.map(log => {
                const isSelected = activeLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500/70 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getMethodBadge(log.method)}`}>
                          {log.method}
                        </span>
                        <span className="font-mono text-slate-200 text-[11px] truncate max-w-[180px]">
                          {log.url}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border ${getStatusBadge(log.status)}`}>
                          {log.status} {log.statusText}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[170px] text-slate-400">
                        {log.source}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-cyan-400">{log.durationMs}ms</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Request & Response Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          {activeLog ? (
            <div className="space-y-4">
              {/* Header: Method & Endpoint URL */}
              <div className="pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${getMethodBadge(activeLog.method)}`}>
                      {activeLog.method}
                    </span>
                    <span className="font-mono text-sm font-semibold text-white break-all">
                      {activeLog.url}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getStatusBadge(activeLog.status)}`}>
                      {activeLog.status} {activeLog.statusText}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {activeLog.durationMs}ms
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                  <span>Nguồn gửi: <strong className="text-slate-200">{activeLog.source}</strong></span>
                  <span className="font-mono">{new Date(activeLog.timestamp).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              {/* Request Details Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                    HTTP Request (Client &rarr; Server)
                  </span>
                  {activeLog.body && (
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(activeLog.body, null, 2), 'reqBody')}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedSection === 'reqBody' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'reqBody' ? 'Đã sao chép' : 'Sao chép Body JSON'}</span>
                    </button>
                  )}
                </div>

                {/* Request Headers Table */}
                <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="text-slate-500 font-bold text-[10px] uppercase mb-1">Request Headers:</div>
                  {Object.entries(activeLog.headers).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-cyan-300 font-medium truncate max-w-[280px]">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Request Body JSON */}
                {activeLog.body ? (
                  <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800 text-xs font-mono overflow-x-auto max-h-40">
                    <div className="text-slate-500 font-bold text-[10px] uppercase mb-1">Request Body (JSON Payload):</div>
                    <pre className="text-emerald-400 leading-relaxed">
                      {JSON.stringify(activeLog.body, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="p-2 rounded bg-slate-950/40 text-[11px] text-slate-500 italic">
                    Không có Request Body (Phương thức {activeLog.method})
                  </div>
                )}
              </div>

              {/* Response Details Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    HTTP Response (Server &rarr; Client)
                  </span>
                  {activeLog.responseBody && (
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(activeLog.responseBody, null, 2), 'resBody')}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedSection === 'resBody' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'resBody' ? 'Đã sao chép' : 'Sao chép Response'}</span>
                    </button>
                  )}
                </div>

                {/* Response Body JSON */}
                {activeLog.responseBody ? (
                  <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800 text-xs font-mono overflow-x-auto max-h-44">
                    <div className="text-slate-500 font-bold text-[10px] uppercase mb-1">Response Body:</div>
                    <pre className="text-cyan-300 leading-relaxed">
                      {JSON.stringify(activeLog.responseBody, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="p-2 rounded bg-slate-950/40 text-[11px] text-slate-500 italic">
                    Không có Response Body
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Terminal className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">Chọn một HTTP Request từ danh sách bên trái để kiểm tra chi tiết headers và payload.</p>
            </div>
          )}

          {/* Bottom Educational Tip for IoT students */}
          <div className="mt-4 pt-3 border-t border-slate-800 bg-slate-950/40 -mx-4 -mb-4 p-3 rounded-b-xl text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gợi ý môn IoT: Mã <strong>201 Created</strong> được trả về khi cảm biến gửi bản ghi đo mới vào CSDL.</span>
            </span>
            <span className="font-mono text-slate-500">HTTP/1.1 REST</span>
          </div>
        </div>
      </div>
    </div>
  );
};
