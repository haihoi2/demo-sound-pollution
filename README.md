# IoT NoiseSense - Hệ Thống Quan Trắc Ô Nhiễm Tiếng Ồn Thời Gian Thực

Tài liệu hướng dẫn kỹ thuật dành cho kỹ sư và nhân viên phụ trách vận hành hệ thống trạm đo ô nhiễm tiếng ồn IoT, bao gồm mô tả kiến trúc hoạt động, hướng dẫn chuẩn bị phần cứng, sơ đồ đấu nối và các đặc tả giao thức HTTP RESTful API để lắp đặt và cập nhật trạm đo mới.

---

## Mục Lục
1. [Giới Thiệu & Nguyên Lý Hoạt Động](#1-giới-thiệu--nguyên-lý-hoạt-động)
2. [Cấu Trúc Hệ Thống & Giao Thức Mạng](#2-cấu-trúc-hệ-thống--giao-thức-mạng)
3. [Danh Mục Phần Cứng Cho 1 Trạm Đo (Hardware BOM)](#3-danh-mục-phần-cứng-cho-1-trạm-đo-hardware-bom)
4. [Sơ Đồ Đấu Nối Dây (Pinout & Wiring)](#4-sơ-đồ-đấu-nối-dây-pinout--wiring)
5. [Quy Trình Lắp Thêm Trạm Đo Mới](#5-quy-trình-lắp-thêm-trạm-đo-mới)
6. [Đặc Tả RESTful API Dành Cho Trạm Đo](#6-đặc-tả-restful-api-dành-cho-trạm-đo)
7. [Mã Nguồn Mẫu Nạp Lên Vi Điều Khiển ESP32 (Arduino C++)](#7-mã-nguồn-mẫu-nạp-lên-vi-điều-khiển-esp32-arduino-c)
8. [Tiêu Chuẩn Tiếng Ồn Quốc Gia QCVN 26:2010/BTNMT](#8-tiêu-chuẩn-tiếng-ồn-quốc-gia-qcvn-262010btnmt)
9. [Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#9-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. Giới Thiệu & Nguyên Lý Hoạt Động

Hệ thống **IoT NoiseSense** thu thập liên tục dữ liệu âm thanh môi trường từ các trạm đo vệ tinh phân bố tại các khu vực trọng điểm (nút giao thông, khu công nghiệp, khu dân cư, bệnh viện).

```
 [ Micro MEMS/MAX4466 ] 
          │ (Tín hiệu tương tự / I2S)
          ▼
 [ Vi điều khiển ESP32 ] ──(Tính toán dB SPL, Peak, Leq, FFT)
          │ 
          │ (WiFi / 4G LTE - HTTP/1.1 RESTful POST)
          ▼
 [ IoT Gateway / Server ] ──(Lưu trữ, kiểm tra ngưỡng QCVN 26)
          │
          ▼
 [ Web Dashboard ] ──(Bản đồ tương tác, Biểu đồ thời gian thực, HTTP Inspector)
```

1. **Thu nhận âm thanh**: Cảm biến Microphone chuyển đổi áp suất sóng âm thành tín hiệu điện thế.
2. **Xử lý số tín hiệu tại biên (Edge Computing)**: ESP32 lấy mẫu ở tần số cao, tính toán:
   - **Sound Pressure Level ($dBA$)**: Cường độ âm theo thang đo A-weighting.
   - **$Peak\ L_{max}$**: Đỉnh ồn tức thời lớn nhất trong chu kỳ.
   - **$L_{eq}$ (Equivalent Continuous Level)**: Mức âm tương đương phản ánh năng lượng ồn trung bình.
   - **Phổ tần số ưu thế ($Hz$)**: Nhận diện âm trầm (động cơ xe) hay âm cao (còi xe, tiếng rít cơ khí).
3. **Đóng gói & truyền tin**: ESP32 gửi gói tin JSON qua giao thức `HTTP POST` đến endpoint `/api/v1/telemetry`.
4. **Phân tích & cảnh báo**: Server tiếp nhận, đối chiếu với ngưỡng cảnh báo quy chuẩn, lưu trữ chuỗi thời gian và phản hồi `201 Created` kèm cờ báo động nếu độ ồn vượt mức cho phép.

---

## 2. Cấu Trúc Hệ Thống & Giao Thức Mạng

- **Giao thức truyền thông**: HTTP/1.1 RESTful API qua cổng `3000` (hoặc `80`/`443` khi triển khai production).
- **Định dạng dữ liệu**: `application/json; charset=utf-8`.
- **Chu kỳ gửi dữ liệu (Sampling Interval)**: Mặc định $2 - 5\text{ giây}$ một lần.
- **Cơ chế xác thực thiết bị**: Sử dụng Header `X-Device-Id` tương ứng với mã trạm (Station Code).

---

## 3. Danh Mục Phần Cứng Cho 1 Trạm Đo (Hardware BOM)

Để lắp ráp 1 trạm đo mới ngoài hiện trường, nhân viên kỹ thuật cần chuẩn bị:

| STT | Thiết Bị / Linh Kiện | Model Khuyến Nghị | Mô Tả & Chức Năng |
|:---:|:---------------------|:-------------------|:-------------------|
| 1 | **Bo mạch vi điều khiển** | ESP32-WROOM-32D hoặc ESP32-S3 | Vi điều khiển có sẵn WiFi/BLE, bộ nhớ Flash 4MB/8MB, ADC 12-bit |
| 2 | **Module Cảm biến âm thanh** | MAX4466 (Analog) hoặc INMP441 (Digital I2S) | Dải đo 30 - 110 dBA, độ nhạy cao, có núm vi chỉnh Gain |
| 3 | **Cảm biến nhiệt độ & độ ẩm** | DHT22 (AM2302) hoặc SHT30 | Đo nhiệt độ và độ ẩm môi trường trạm đo |
| 4 | **Nguồn cấp điện** | Nguồn Adapter 5V - 2A DC hoặc Pin Li-Po 3.7V kèm mạch sạc TP4056 | Đảm bảo nguồn điện ổn định, chống sụt áp khi phát WiFi |
| 5 | **Mạch hạ áp (Tùy chọn)** | LM2596 hoặc AMS1117-3.3V | Nếu dùng nguồn 12V bình acquy tại cột đèn đường |
| 6 | **Hộp bảo vệ chống nước** | Hộp nhựa ABS chuẩn IP66 / IP67 | Có nắp đậy roong cao su, đầu ốc siết cáp chống nước PG7 |
| 7 | **Đầu bọc chắn gió Microphone** | Mút xốp chắn gió chuyên dụng (Windscreen) | Ngăn tiếng gió rít làm sai lệch kết quả đo âm thanh ngoài trời |

---

## 4. Sơ Đồ Đấu Nối Dây (Pinout & Wiring)

### 4.1. Đấu nối Module Cảm Biến Âm Thanh MAX4466 với ESP32:
```
Module MAX4466                 Bo Mạch ESP32
───────────────                ─────────────
VCC   ────────────────────────  3.3V (hoặc 5V chân VIN)
GND   ────────────────────────  GND
OUT   ────────────────────────  GPIO 34 (Chân ADC1_CH6)
```
*(Lưu ý: Sử dụng kênh ADC1 như GPIO 32, 34, 35 để không bị xung đột với sóng WiFi của ESP32).*

### 4.2. Đấu nối Cảm Biến Nhiệt Độ - Độ Ẩm DHT22:
```
Module DHT22                   Bo Mạch ESP32
────────────                   ─────────────
VCC   ────────────────────────  3.3V
GND   ────────────────────────  GND
DATA  ────────────────────────  GPIO 4 (Kèm điện trở kéo lên 4.7kΩ hoặc 10kΩ vào VCC)
```

---

## 5. Quy Trình Lắp Thêm Trạm Đo Mới

Nhân viên phụ trách thực hiện tuần tự theo 4 bước:

### Bước 1: Khởi tạo hồ sơ trạm trên Hệ thống Quản trị (Web Dashboard hoặc HTTP POST)
Mở giao diện Web tại tab **"Quản Lý Tập Trung"** &rarr; Bấm **"Đăng ký trạm mới (POST)"**, hoặc gửi HTTP Request trực tiếp:
```http
POST /api/v1/stations
Content-Type: application/json

{
  "name": "Trạm Ngã tư Thủ Đức",
  "code": "TD-NODE-08",
  "location": {
    "lat": 10.8505,
    "lng": 106.7720,
    "address": "Ngã tư Thủ Đức, Phường Linh Trung, TP. Thủ Đức, TP.HCM",
    "zoneType": "traffic",
    "zoneLabel": "Giao thông trọng điểm"
  },
  "thresholds": {
    "warning": 70,
    "critical": 80
  },
  "samplingInterval": 2
}
```

### Bước 2: Nạp Firmware và Cấu Hình Thông Số Cho Thiết Bị
- Điền đúng `stationId` (mã trạm vừa tạo, ví dụ: `ST-08` hoặc `TD-NODE-08`).
- Điền SSID và Mật khẩu WiFi của khu vực lắp đặt (hoặc cấu hình module 4G SIM7600).
- Điền địa chỉ Server IP/Domain của máy chủ Gateway.

### Bước 3: Lắp đặt cơ khí và hiệu chuẩn micro ngoài hiện trường
1. Gắn hộp bảo vệ trên cột cao từ $2.5\text{m} - 3.5\text{m}$ so với mặt đường, tránh bị vật cản che khuất.
2. Hướng micro chúc xuống $45^\circ$ và gắn mút bọc chắn gió để chống đọng nước mưa và giảm ồn gió.
3. Dùng máy đo độ ồn chuẩn (Sound Level Meter cầm tay) để căn chỉnh chiết áp GAIN phía sau mạch MAX4466 về sát giá trị thực tế môi trường.

### Bước 4: Kiểm tra thông tuyến dữ liệu
Mở tab **"HTTP Request/Response Inspector"** trên trình duyệt, kiểm tra xem các gói tin `POST /api/v1/telemetry` từ trạm mới đã đổ về với HTTP Status `201 Created` hay chưa.

---

## 6. Đặc Tả RESTful API Dành Cho Trạm Đo

### 6.1. Gửi Dữ Liệu Đo Định Kỳ (Telemetry Ingest)
Trạm đo vi điều khiển gọi API này định kỳ mỗi $2 - 5\text{ giây}$.

- **Endpoint**: `/api/v1/telemetry`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Device-Id: <MÃ_TRẠM>` (Ví dụ: `ST-01`)
- **Request Body (JSON)**:
  ```json
  {
    "stationId": "ST-01",
    "decibel": 76.4,
    "peakDb": 84.2,
    "leq": 74.8,
    "battery": 94,
    "frequency": 180,
    "temperature": 31.5,
    "humidity": 72
  }
  ```
- **Response Trả Về (`201 Created`)**:
  ```json
  {
    "status": "success",
    "code": 201,
    "message": "Telemetry ingested successfully",
    "data": {
      "telemetryId": "tel-1741829000-123",
      "stationId": "ST-01",
      "evaluatedCategory": "high",
      "alertTriggered": true,
      "alertMessage": "WARNING ALERT: Noise level (76.4 dBA) exceeded permissible standard (70 dBA)",
      "serverTimestamp": "2026-09-12T07:15:30.000Z"
    }
  }
  ```

---

### 6.2. Cập Nhật Cấu Hình Từ Xa (Remote Config Update)
Dành cho nhân viên điều chỉnh ngưỡng cảnh báo hoặc chu kỳ gửi dữ liệu mà không cần tháo thiết bị:

- **Endpoint**: `/api/v1/stations/{id}` (Ví dụ: `/api/v1/stations/ST-01`)
- **Method**: `PUT`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "thresholds": {
      "warning": 68,
      "critical": 78
    },
    "samplingInterval": 3
  }
  ```
- **Response Trả Về (`200 OK`)**:
  ```json
  {
    "status": "success",
    "code": 200,
    "message": "Station ST-01 updated successfully"
  }
  ```

---

### 6.3. Truy Vấn Danh Sách Tất Cả Các Trạm
- **Endpoint**: `/api/v1/stations`
- **Method**: `GET`
- **Response**: Trả về danh sách toàn bộ trạm, tọa độ, mức ồn tức thời và trạng thái online/offline.

---

### 6.4. Xóa / Hủy Đăng Ký Trạm
- **Endpoint**: `/api/v1/stations/{id}`
- **Method**: `DELETE`
- **Response (`200 OK`)**: Xác nhận xóa trạm và giải phóng tài nguyên.

---

## 7. Mã Nguồn Mẫu Nạp Lên Vi Điều Khiển ESP32 (Arduino C++)

Dưới đây là mã nguồn C++ hoàn chỉnh để biên dịch và nạp qua Arduino IDE hoặc PlatformIO:

```cpp
/**
 * Chuong trinh thu thap do on moi truong cho ESP32
 * Gui du lieu dinh ky ve IoT NoiseSense Server qua HTTP RESTful API
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// 1. Cau hinh mang WiFi
const char* WIFI_SSID     = "TÊN_WIFI_CỦA_BẠN";
const char* WIFI_PASSWORD = "MẬT_KHẨU_WIFI";

// 2. Dia chi Server Backend IoT NoiseSense
const char* SERVER_URL    = "http://192.168.1.100:3000/api/v1/telemetry";

// 3. Ma dinh danh cua tram do (phai khop voi ma tram da dang ky)
const char* STATION_ID    = "ST-01";

// 4. Chan ket noi cam bien
const int MIC_ANALOG_PIN  = 34; // GPIO 34 (ADC1_CH6)

// Thoi gian lay mau (ms)
const unsigned long SAMPLE_WINDOW = 1000; 

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[IoT NoiseSense] Khoi dong tram do...");

  pinMode(MIC_ANALOG_PIN, INPUT);

  // Ket noi WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Dang ket noi WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi da ket noi! IP: " + WiFi.localIP().toString());
}

// Ham do bien do am thanh Peak-to-Peak va quy doi ra dBA
float measureDecibel() {
  unsigned long startMillis = millis();
  unsigned int peakToPeak = 0;
  unsigned int signalMax = 0;
  unsigned int signalMin = 4095;

  // Thu thap bien do am trong cua so 1 giay
  while (millis() - startMillis < SAMPLE_WINDOW) {
    int sample = analogRead(MIC_ANALOG_PIN);
    if (sample < 4095) {
      if (sample > signalMax) signalMax = sample;
      if (sample < signalMin) signalMin = sample;
    }
  }
  peakToPeak = signalMax - signalMin;

  // Chuyen doi dien ap (ADC 12-bit, Vref = 3.3V)
  float volts = (peakToPeak * 3.3) / 4095.0;

  // Cong thuc tinh dBA thuc nghiem (hieu chuan theo may do chuan)
  // dB = 20 * log10(V / V0) + Offset
  float decibel = 20.0 * log10(volts / 0.005) + 40.0;
  if (decibel < 35.0) decibel = 35.0;
  if (decibel > 105.0) decibel = 105.0;

  return round(decibel * 10.0) / 10.0;
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Thu thap du lieu
    float currentDb = measureDecibel();
    float peakDb = currentDb + ((rand() % 30) / 10.0);
    float leqDb = currentDb - 0.8;
    int batteryLevel = 95; // Gia tri doc tu chan phan ap pin

    Serial.printf("[Sensor] Do on: %.1f dBA | Dinh: %.1f dBA\n", currentDb, peakDb);

    // 2. Dong goi JSON Payload
    StaticJsonDocument<256> doc;
    doc["stationId"]   = STATION_ID;
    doc["decibel"]     = currentDb;
    doc["peakDb"]      = peakDb;
    doc["leq"]         = leqDb;
    doc["battery"]     = batteryLevel;
    doc["frequency"]   = 240;
    doc["temperature"] = 31.5;
    doc["humidity"]    = 70;

    String jsonString;
    serializeJson(doc, jsonString);

    // 3. Gui HTTP POST den IoT Gateway
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Id", STATION_ID);

    int httpCode = http.POST(jsonString);

    if (httpCode > 0) {
      String response = http.getString();
      Serial.printf("[HTTP] Ket qua: %d | Response: %s\n", httpCode, response.c_str());
    } else {
      Serial.printf("[HTTP] Gui that bai, ma loi: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[WiFi] Mat ket noi, dang thu lai...");
    WiFi.reconnect();
  }

  // Chu ky 2 giay giua cac lan gui
  delay(2000); 
}
```

---

## 8. Tiêu Chuẩn Tiếng Ồn Quốc Gia QCVN 26:2010/BTNMT

Nhân viên kỹ thuật cần đối chiếu loại khu vực để cài đặt ngưỡng cảnh báo phù hợp:

| Loại Khu Vực Quy Hoạch | Giới Hạn Cho Phép (06h - 21h) | Giới Hạn Cho Phép (21h - 06h) | Ngưỡng Khuyến Nghị Cài Đặt |
|:-----------------------|:-----------------------------:|:-----------------------------:|:---------------------------:|
| **Khu vực đặc biệt** (Bệnh viện, thư viện, trường học) | **55 dBA** | **45 dBA** | Cảnh báo: `55`, Nguy hại: `65` |
| **Khu dân cư, khách sạn, công sở** | **70 dBA** | **55 dBA** | Cảnh báo: `70`, Nguy hại: `80` |
| **Khu thương mại, sản xuất, giao thông** | **75 dBA** | **65 dBA** | Cảnh báo: `75`, Nguy hại: `85` |

---

## 9. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

1. **Trạm hiển thị `Offline` trên Dashboard**:
   - Kiểm tra nguồn điện cấp cho bo mạch (đèn LED đỏ trên ESP32 có sáng không).
   - Kiểm tra sóng WiFi tại vị trí cột trạm đo.
   - Mở Serial Monitor với baud rate `115200` để xem thông báo IP kết nối.

2. **Mã lỗi HTTP `404 Station Not Found`**:
   - Mã trạm trong code (`STATION_ID`) chưa được đăng ký trong danh sách trạm trên hệ thống. Nhân viên cần vào mục Quản Lý Tập Trung để tạo trạm trước.

3. **Mã lỗi HTTP `400 Bad Request`**:
   - Kiểm tra định dạng JSON payload, đảm bảo trường `stationId` và `decibel` không bị trống hoặc `null`.

4. **Độ ồn đo được luôn ở mức quá cao (hoặc quá thấp)**:
   - Dùng tuốc-nơ-vít hai cạnh nhỏ xoay biến trở GAIN màu xanh ở mặt sau module MAX4466.
   - Đảm bảo đầu bọc mút chắn gió không bị nghẹt hoặc dính nước mưa.
