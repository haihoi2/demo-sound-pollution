import React, { useState } from 'react';
import { 
  Send, 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  Cpu, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { HttpMethod } from '../types';

interface SandboxTemplate {
  name: string;
  method: HttpMethod;
  url: string;
  description: string;
  body?: any;
}

const TEMPLATES: SandboxTemplate[] = [
  {
    name: '1. POST /api/v1/telemetry - Gửi dữ liệu đo từ cảm biến IoT',
    method: 'POST',
    url: '/api/v1/telemetry',
    description: 'Cảm biến âm thanh (MAX4466/INMP441) kết nối ESP32 định kỳ đẩy dữ liệu decibel đo được lên gateway.',
    body: {
      stationId: 'ST-01',
      decibel: 79.4,
      peakDb: 86.1,
      leq: 78.0,
      battery: 92,
      frequency: 240,
      temperature: 31.8,
      humidity: 71
    }
  },
  {
    name: '2. GET /api/v1/stations - Lấy danh sách toàn bộ các trạm',
    method: 'GET',
    url: '/api/v1/stations',
    description: 'Client hoặc ứng dụng trung tâm truy vấn danh sách tất cả các trạm đo và trạng thái hiện tại.',
  },
  {
    name: '3. GET /api/v1/stations/ST-01 - Chi tiết trạm Ngã tư Hàng Xanh',
    method: 'GET',
    url: '/api/v1/stations/ST-01',
    description: 'Truy vấn thông số chi tiết, cấu hình ngưỡng, địa chỉ MAC và IP của một trạm cụ thể.',
  },
  {
    name: '4. PUT /api/v1/stations/ST-01 - Cấu hình ngưỡng cảnh báo và chu kỳ',
    method: 'PUT',
    url: '/api/v1/stations/ST-01',
    description: 'Hạ tầng Cloud gửi lệnh điều khiển từ xa để thay đổi ngưỡng cảnh báo và chu kỳ gửi gói tin của trạm.',
    body: {
      thresholds: {
        warning: 68,
        critical: 78
      },
      samplingInterval: 3
    }
  },
  {
    name: '5. POST /api/v1/stations - Khởi tạo trạm đo mới',
    method: 'POST',
    url: '/api/v1/stations',
    description: 'Thêm một trạm đo IoT mới vào hệ thống quan trắc.',
    body: {
      name: 'Trạm KCNC TP. Thủ Đức',
      code: 'TD-NODE-09',
      location: {
        lat: 10.852,
        lng: 106.786,
        address: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM',
        zoneType: 'industrial',
        zoneLabel: 'Khu công nghệ cao'
      },
      thresholds: {
        warning: 70,
        critical: 80
      },
      samplingInterval: 2
    }
  },
  {
    name: '6. POST /api/v1/simulate/step - Kích hoạt bước đo tiếp theo',
    method: 'POST',
    url: '/api/v1/simulate/step',
    description: 'Yêu cầu máy chủ giả lập chu kỳ thu thập dữ liệu tiếp theo từ tất cả các trạm đang hoạt động.',
    body: {}
  }
];

export const RestSandboxView: React.FC = () => {
  const [method, setMethod] = useState<HttpMethod>('POST');
  const [url, setUrl] = useState<string>('/api/v1/telemetry');
  const [bodyText, setBodyText] = useState<string>(
    JSON.stringify(TEMPLATES[0].body, null, 2)
  );
  const [headersText, setHeadersText] = useState<string>(
    JSON.stringify({
      'Content-Type': 'application/json',
      'X-Client-Role': 'student-sandbox',
      'X-Device-Id': 'ST-01'
    }, null, 2)
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseStatusText, setResponseStatusText] = useState<string>('');
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<any>(null);
  const [roundtripMs, setRoundtripMs] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'esp32' | 'python' | 'micropython' | 'curl' | 'js'>('esp32');

  const applyTemplate = (t: SandboxTemplate) => {
    setMethod(t.method);
    setUrl(t.url);
    if (t.body) {
      setBodyText(JSON.stringify(t.body, null, 2));
    } else {
      setBodyText('');
    }
  };

  const handleSend = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseBody(null);
    const start = performance.now();

    try {
      let customHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Client-Role': 'student-sandbox'
      };

      try {
        if (headersText.trim()) {
          customHeaders = { ...customHeaders, ...JSON.parse(headersText) };
        }
      } catch (err) {
        console.warn('Headers parse failed, using defaults');
      }

      const options: RequestInit = {
        method,
        headers: customHeaders
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText.trim()) {
        options.body = bodyText;
      }

      const res = await fetch(url, options);
      const duration = Math.round(performance.now() - start);
      setRoundtripMs(duration);
      setResponseStatus(res.status);
      setResponseStatusText(res.statusText || (res.status === 201 ? 'Created' : 'OK'));

      const resH: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resH[k] = v;
      });
      setResponseHeaders(resH);

      const data = await res.json();
      setResponseBody(data);
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setRoundtripMs(duration);
      setResponseStatus(500);
      setResponseStatusText('Network / Execution Error');
      setResponseBody({
        error: true,
        message: err.message || 'Không thể gửi HTTP request đến endpoint'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copySnippet = (code: string, tab: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(tab);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // Generate code snippets for IoT students
  const parsedBody = (() => {
    try {
      return bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return {};
    }
  })();

  const esp32Code = `// Code C++ nạp trên vi điều khiển ESP32 / ESP8266
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.1.100:3000${url}";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Id", "${parsedBody.stationId || 'ST-01'}");

    // Chuẩn bị payload JSON từ cảm biến âm thanh
    StaticJsonDocument<256> doc;
    doc["stationId"] = "${parsedBody.stationId || 'ST-01'}";
    doc["decibel"] = ${parsedBody.decibel || 76.5};
    doc["peakDb"] = ${parsedBody.peakDb || 83.2};
    doc["battery"] = 95;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.${method === 'POST' ? 'POST(requestBody)' : method === 'GET' ? 'GET()' : 'PUT(requestBody)'};

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.printf("HTTP Code: %d\\n", httpResponseCode);
      Serial.println(response);
    } else {
      Serial.printf("Error code: %d\\n", httpResponseCode);
    }
    http.end();
  }
  delay(2000); // Chu kỳ gửi 2 giây
}`;

  const pythonCode = `# Code Python (Dành cho Raspberry Pi hoặc Gateway biên IoT)
import requests
import json
import time

url = "http://localhost:3000${url}"
headers = {
    "Content-Type": "application/json",
    "X-Device-Id": "${parsedBody.stationId || 'ST-01'}"
}
payload = ${JSON.stringify(parsedBody, null, 4)}

try:
    response = requests.${method.toLowerCase()}(url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Request failed: {e}")`;

  const micropythonCode = `# MicroPython trên ESP32 / Raspberry Pi Pico W
import network
import urequests
import ujson

url = "http://192.168.1.100:3000${url}"
headers = {"Content-Type": "application/json"}
data = ujson.dumps(${JSON.stringify(parsedBody)})

res = urequests.${method.toLowerCase()}(url, headers=headers, data=data)
print("HTTP Status:", res.status_code)
print("Response:", res.text)
res.close()`;

  const curlCode = `curl -X ${method} "http://localhost:3000${url}" \\
  -H "Content-Type: application/json" \\
  -H "X-Device-Id: ${parsedBody.stationId || 'ST-01'}" \\
  -d '${JSON.stringify(parsedBody)}'`;

  const jsCode = `// Fetch API (JavaScript / Node.js)
const res = await fetch('http://localhost:3000${url}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json',
    'X-Device-Id': '${parsedBody.stationId || 'ST-01'}'
  },
  body: JSON.stringify(${JSON.stringify(parsedBody, null, 2)})
});
const data = await res.json();
console.log('Status:', res.status, data);`;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              RESTful API Sandbox &amp; Trình Tạo Mã Nhúng Vi Điều Khiển IoT
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Môi trường thử nghiệm tương tự Postman thu nhỏ, cho phép sinh viên tự soạn thảo và gửi HTTP Request thực tế vào Cloud Gateway, quan sát phản hồi JSON và sao chép mã nguồn C++ (ESP32) hoặc Python sẵn sàng cho phần cứng.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Templates Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Chọn mẫu kịch bản RESTful IoT:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {TEMPLATES.map((t, idx) => (
            <button
              key={idx}
              onClick={() => applyTemplate(t)}
              className="text-left p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/60 transition group flex flex-col justify-between"
            >
              <div className="font-semibold text-slate-200 group-hover:text-cyan-300">
                {t.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {t.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Request & Response Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Request Builder (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                1. Soạn Thảo HTTP Request
              </span>
              <span className="text-[11px] text-slate-400 font-mono">REST Client</span>
            </div>

            {/* Method & URL Row */}
            <div className="mt-3 flex items-center gap-2">
              <select
                value={method}
                onChange={e => setMethod(e.target.value as HttpMethod)}
                className={`text-xs font-mono font-bold rounded-lg px-3 py-2 border focus:outline-none ${
                  method === 'GET' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                  method === 'POST' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                  method === 'PUT' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                  'bg-rose-950 text-rose-300 border-rose-800'
                }`}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="/api/v1/telemetry"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
              />

              <button
                onClick={handleSend}
                disabled={isLoading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Gửi</span>
              </button>
            </div>

            {/* Request Body Editor */}
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Request Body (JSON):</span>
                  <span className="text-[10px] font-mono text-slate-500">application/json</span>
                </div>
                <textarea
                  value={bodyText}
                  onChange={e => setBodyText(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:border-cyan-500 focus:outline-none leading-relaxed"
                />
              </div>
            )}

            {/* Custom Headers */}
            <div className="mt-2">
              <details className="text-xs text-slate-400">
                <summary className="cursor-pointer hover:text-slate-200">
                  Tùy chỉnh Headers (HTTP Request Headers)
                </summary>
                <textarea
                  value={headersText}
                  onChange={e => setHeadersText(e.target.value)}
                  rows={3}
                  className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
              </details>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Request gửi trực tiếp qua mạng nội bộ đến Express Gateway và lưu lại ở tab HTTP Inspector.</span>
          </div>
        </div>

        {/* Right: Response Inspector (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                2. Phản Hồi Từ IoT Gateway (Response)
              </span>

              {responseStatus !== null && (
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                    responseStatus >= 200 && responseStatus < 300 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    responseStatus >= 400 && responseStatus < 500 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {responseStatus} {responseStatusText}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {roundtripMs}ms
                  </span>
                </div>
              )}
            </div>

            {/* Response Output */}
            <div className="mt-3">
              {responseBody ? (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Response JSON:</span>
                    <button
                      onClick={() => copySnippet(JSON.stringify(responseBody, null, 2), 'resJson')}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedCode === 'resJson' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode === 'resJson' ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>

                  <pre className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 overflow-x-auto max-h-72 leading-relaxed">
                    {JSON.stringify(responseBody, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs p-6 bg-slate-950/40 rounded-lg border border-slate-800/80">
                  <Terminal className="w-8 h-8 mb-2 opacity-40" />
                  <p>Bấm nút "Gửi" ở bảng bên trái để thực hiện HTTP Call thực tế và nhận phản hồi tại đây.</p>
                </div>
              )}
            </div>
          </div>

          {/* Response Headers */}
          {responseStatus !== null && Object.keys(responseHeaders).length > 0 && (
            <div className="border-t border-slate-800 pt-2 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Response Headers:</span>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 max-h-20 overflow-y-auto space-y-0.5">
                {Object.entries(responseHeaders).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}:</span>
                    <span className="text-slate-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* IoT Code Generator Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Mã Nguồn Mẫu Cho Thiết Bị Cảm Biến IoT
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy đoạn mã tương ứng để nạp vào vi điều khiển thực tế hoặc script thu thập
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            {[
              { id: 'esp32', label: 'ESP32 (C++/Arduino)' },
              { id: 'python', label: 'Python (Raspberry Pi)' },
              { id: 'micropython', label: 'MicroPython' },
              { id: 'curl', label: 'cURL Terminal' },
              { id: 'js', label: 'JavaScript' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCodeTab(tab.id as any)}
                className={`px-3 py-1 rounded text-xs transition ${
                  activeCodeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Content Container */}
        <div className="relative mt-3">
          <div className="absolute right-3 top-3 z-10">
            <button
              onClick={() => {
                const map: Record<string, string> = {
                  esp32: esp32Code,
                  python: pythonCode,
                  micropython: micropythonCode,
                  curl: curlCode,
                  js: jsCode
                };
                copySnippet(map[activeCodeTab], activeCodeTab);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              {copiedCode === activeCodeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === activeCodeTab ? 'Đã sao chép!' : 'Sao chép mã'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-96">
            {activeCodeTab === 'esp32' && esp32Code}
            {activeCodeTab === 'python' && pythonCode}
            {activeCodeTab === 'micropython' && micropythonCode}
            {activeCodeTab === 'curl' && curlCode}
            {activeCodeTab === 'js' && jsCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
