import type { MapAdapter, MapType } from '../types/map';
import { OSMAdapter } from './adapters/OSMAdapter';
import { AMapAdapter } from './adapters/AMapAdapter';
import { BaiduMapAdapter } from './adapters/BaiduMapAdapter';

export class MapFactory {
  static create(type: MapType): MapAdapter {
    switch (type) {
      case 'amap':
        return new AMapAdapter();
      case 'baidu':
        return new BaiduMapAdapter();
      case 'osm':
        return new OSMAdapter();
      default:
        throw new Error(`不支持的地图类型: ${type}`);
    }
  }
}

