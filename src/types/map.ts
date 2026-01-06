import type { Point } from './index';
import type { LineString, MultiLineString } from 'geojson';

// 地图适配器接口
export interface MapAdapter {
  init(containerId: string): void;
  setCenter(lat: number, lon: number, zoom: number): void;
  drawRoute(route: LineString | MultiLineString): void;
  drawPoints(points: Point[]): void;
  clearRoute(): void;
  clearPoints(): void;
  destroy(): void;
}

// 地图类型
export type MapType = 'amap' | 'baidu' | 'osm';

