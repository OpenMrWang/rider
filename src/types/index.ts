// 点位数据结构
export interface Point {
  name: string;
  lat: number;
  lon: number;
}

// Vlog 信息
export interface VlogInfo {
  platform: string;
  episode: string;
  notes?: string;
}

// 单日记录
export interface DayRecord {
  day: number;
  date: string;
  // vlog: VlogInfo;
  points: Point[];
  // 支持单段或多段路线
  routeGeoJSON: GeoJSON.LineString | GeoJSON.MultiLineString | null;
  distanceKm: number | null;
}

// 元数据
export interface TripMeta {
  title: string;
  author: string;
  description: string;
}

// 总数据结构
export interface TripData {
  meta: TripMeta;
  days: DayRecord[];
}

