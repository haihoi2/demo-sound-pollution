import { NoiseStation, NoiseCategory } from '../types';

export function getNoiseCategory(db: number, thresholdWarning = 70, thresholdCritical = 80): NoiseCategory {
  if (db < 55) return 'safe';
  if (db < thresholdWarning) return 'moderate';
  if (db < thresholdCritical) return 'high';
  return 'hazardous';
}

export const INITIAL_STATIONS: NoiseStation[] = [
  {
    id: 'ST-01',
    name: 'Trạm Ngã tư Hàng Xanh',
    code: 'HX-NODE-01',
    location: {
      lat: 10.8015,
      lng: 106.7118,
      address: 'Ngã tư Hàng Xanh, Phường 25, Quận Bình Thạnh, TP.HCM',
      zoneType: 'traffic',
      zoneLabel: 'Giao thông trọng điểm'
    },
    status: 'warning',
    currentDb: 76.4,
    peakDb: 84.2,
    leqDb: 74.8,
    l10Db: 79.1,
    l90Db: 64.3,
    batteryLevel: 94,
    temperature: 31.5,
    humidity: 72,
    dominantFrequency: 180, // Hz (tiếng động cơ xe tải/xe buýt)
    noiseCategory: 'high',
    thresholds: {
      warning: 70,
      critical: 80
    },
    samplingInterval: 2,
    lastSeen: new Date().toISOString(),
    macAddress: '24:6F:28:A1:3B:11',
    firmwareVersion: 'v2.4.2-esp32-s3',
    ipAddress: '192.168.10.101',
    totalPacketsSent: 420
  },
  {
    id: 'ST-02',
    name: 'Trạm Chợ Bến Thành',
    code: 'BT-NODE-02',
    location: {
      lat: 10.7725,
      lng: 106.6980,
      address: 'Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      zoneType: 'commercial',
      zoneLabel: 'Khu vực thương mại'
    },
    status: 'online',
    currentDb: 68.2,
    peakDb: 73.5,
    leqDb: 67.0,
    l10Db: 71.0,
    l90Db: 59.0,
    batteryLevel: 88,
    temperature: 32.0,
    humidity: 68,
    dominantFrequency: 850, // Hz (tiếng người nói, còi xe nhẹ)
    noiseCategory: 'moderate',
    thresholds: {
      warning: 70,
      critical: 80
    },
    samplingInterval: 3,
    lastSeen: new Date().toISOString(),
    macAddress: '24:6F:28:A1:3B:22',
    firmwareVersion: 'v2.4.2-esp32-s3',
    ipAddress: '192.168.10.102',
    totalPacketsSent: 388
  },
  {
    id: 'ST-03',
    name: 'Trạm KCN Tân Bình',
    code: 'TB-NODE-03',
    location: {
      lat: 10.8172,
      lng: 106.6215,
      address: 'Khu công nghiệp Tân Bình, Tây Thạnh, Tân Phú, TP.HCM',
      zoneType: 'industrial',
      zoneLabel: 'Khu công nghiệp sản xuất'
    },
    status: 'critical',
    currentDb: 82.7,
    peakDb: 89.4,
    leqDb: 81.2,
    l10Db: 85.3,
    l90Db: 71.8,
    batteryLevel: 100, // Cắm nguồn DC trực tiếp
    temperature: 34.2,
    humidity: 65,
    dominantFrequency: 350, // Hz (tiếng máy nén, máy cán cơ khí)
    noiseCategory: 'hazardous',
    thresholds: {
      warning: 75,
      critical: 80
    },
    samplingInterval: 2,
    lastSeen: new Date().toISOString(),
    macAddress: '24:6F:28:A1:3B:33',
    firmwareVersion: 'v2.4.0-esp32',
    ipAddress: '192.168.10.103',
    totalPacketsSent: 512
  },
  {
    id: 'ST-04',
    name: 'Trạm BV Chợ Rẫy (Khu yên tĩnh)',
    code: 'CR-NODE-04',
    location: {
      lat: 10.7578,
      lng: 106.6596,
      address: '201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM',
      zoneType: 'hospital_school',
      zoneLabel: 'Y tế & Giáo dục (Đặc biệt)'
    },
    status: 'online',
    currentDb: 52.8,
    peakDb: 61.2,
    leqDb: 51.5,
    l10Db: 56.4,
    l90Db: 46.2,
    batteryLevel: 91,
    temperature: 29.8,
    humidity: 70,
    dominantFrequency: 450,
    noiseCategory: 'safe',
    thresholds: {
      warning: 55, // Chuẩn đặc biệt nghiêm ngặt cho BV (QCVN 26)
      critical: 65
    },
    samplingInterval: 2,
    lastSeen: new Date().toISOString(),
    macAddress: '24:6F:28:A1:3B:44',
    firmwareVersion: 'v2.4.2-esp32-s3',
    ipAddress: '192.168.10.104',
    totalPacketsSent: 430
  },
  {
    id: 'ST-05',
    name: 'Trạm Sân bay Tân Sơn Nhất',
    code: 'TSN-NODE-05',
    location: {
      lat: 10.8185,
      lng: 106.6588,
      address: 'Đường Trường Sơn, Phường 2, Tân Bình, TP.HCM',
      zoneType: 'traffic',
      zoneLabel: 'Hành lang bay & Giao thông'
    },
    status: 'warning',
    currentDb: 77.9,
    peakDb: 91.5,
    leqDb: 76.1,
    l10Db: 83.2,
    l90Db: 62.1,
    batteryLevel: 85,
    temperature: 32.5,
    humidity: 64,
    dominantFrequency: 2400, // Tiếng tuabin phản lực rít
    noiseCategory: 'high',
    thresholds: {
      warning: 75,
      critical: 85
    },
    samplingInterval: 2,
    lastSeen: new Date().toISOString(),
    macAddress: '24:6F:28:A1:3B:55',
    firmwareVersion: 'v2.4.2-esp32-s3',
    ipAddress: '192.168.10.105',
    totalPacketsSent: 465
  },
  {
    id: 'ST-06',
    name: 'Trạm KĐT Sinh thái Sala',
    code: 'SL-NODE-06',
    location: {
      lat: 10.7682,
      lng: 106.7214,
      address: 'Đại lộ Mai Chí Thọ, Phường An Lợi Đông, TP. Thủ Đức',
      zoneType: 'residential',
      zoneLabel: 'Khu dân cư sinh thái'
    },
    status: 'online',
    currentDb: 49.3,
    peakDb: 55.8,
    leqDb: 48.0,
    l10Db: 52.4,
    l90Db: 43.1,
    batteryLevel: 96,
    temperature: 30.1,
    humidity: 74,
    dominantFrequency: 120, // Tiếng gió lá cây, chim chóc
    noiseCategory: 'safe',
    thresholds: {
      warning: 60,
      critical: 70
    },
    samplingInterval: 5,
    lastSeen: new Date().toISOString(),
    macAddress: '24:6F:28:A1:3B:66',
    firmwareVersion: 'v2.4.2-esp32-s3',
    ipAddress: '192.168.10.106',
    totalPacketsSent: 290
  },
  {
    id: 'ST-07',
    name: 'Trạm ĐH Bách Khoa (Cơ sở 1)',
    code: 'BK-NODE-07',
    location: {
      lat: 10.7723,
      lng: 106.6578,
      address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
      zoneType: 'hospital_school',
      zoneLabel: 'Khuôn viên giáo dục'
    },
    status: 'online',
    currentDb: 56.4,
    peakDb: 64.0,
    leqDb: 55.1,
    l10Db: 60.2,
    l90Db: 48.5,
    batteryLevel: 79,
    temperature: 31.0,
    humidity: 69,
    dominantFrequency: 500,
    noiseCategory: 'moderate',
    thresholds: {
      warning: 60,
      critical: 70
    },
    samplingInterval: 3,
    lastSeen: new Date().toISOString(),
    macAddress: '24:6F:28:A1:3B:77',
    firmwareVersion: 'v2.4.2-esp32-s3',
    ipAddress: '192.168.10.107',
    totalPacketsSent: 340
  }
];
