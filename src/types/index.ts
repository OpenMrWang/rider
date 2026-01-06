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
  // 可选：每日标题（如「第五十天：爬黄山看日出！」）
  title?: string;
  // 可选：元信息、视频信息、分段等（在 everyday-merged.json 中存在）
  meta?: any;
  video?: any;
  segments?: any;
  clue?: string;
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

