import type { MapAdapter } from '../../types/map';
import type { Point } from '../../types';
import type { LineString, MultiLineString } from 'geojson';
import { wgs84ToGcj02, wgs84LineStringToGcj02, transformPoints } from '../../utils/coordinateTransform';

// 高德地图适配器
export class AMapAdapter implements MapAdapter {
  private map: AMap.Map | null = null;
  private polyline: AMap.Polyline | null = null;
  private markers: AMap.Marker[] = [];

  init(containerId: string): void {
    // 检查 SDK 是否已加载
    if (!window.AMap) {
      console.warn('高德地图 SDK 未加载，请先在 HTML 中引入 SDK');
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`容器 ${containerId} 不存在`);
    }

    this.map = new AMap.Map(containerId, {
      zoom: 10,
      center: [116.3974, 39.9093], // 默认北京
    });
  }

  setCenter(lat: number, lon: number, zoom: number): void {
    if (!this.map) return;
    // 转换为 GCJ-02
    const [gcjLon, gcjLat] = this.wgs84ToGcj02Coord(lon, lat);
    this.map.setCenter([gcjLon, gcjLat]);
    this.map.setZoom(zoom);
  }

  drawRoute(route: LineString | MultiLineString): void {
    if (!this.map) return;

    // 清除旧路线
    if (this.polyline) {
      this.polyline.setMap(null);
      this.polyline = null;
    }

    // 处理 MultiLineString 或 LineString
    if (route.type === 'MultiLineString') {
      // 对于 MultiLineString，合并所有线段
      const allCoordinates: number[][] = [];
      for (const line of route.coordinates) {
        // 转换为 GCJ-02
        const gcjLine = line.map(([lon, lat]) => {
          const [gcjLon, gcjLat] = this.wgs84ToGcj02Coord(lon, lat);
          return [gcjLon, gcjLat];
        });
        allCoordinates.push(...gcjLine);
      }
      
      this.polyline = new AMap.Polyline({
        path: allCoordinates,
        strokeColor: '#3b82f6',
        strokeWeight: 4,
        strokeOpacity: 1,
      });
    } else {
      // 转换为 GCJ-02
      const gcjRoute = wgs84LineStringToGcj02(route);
      const path = gcjRoute.coordinates.map(([lon, lat]) => [lon, lat]);

      this.polyline = new AMap.Polyline({
        path,
        strokeColor: '#3b82f6',
        strokeWeight: 4,
        strokeOpacity: 1,
      });
    }
    
    this.polyline.setMap(this.map);
  }

  drawPoints(points: Point[]): void {
    if (!this.map) return;

    // 清除旧点位
    this.clearPoints();

    // 转换为 GCJ-02
    const gcjPoints = transformPoints(points, wgs84ToGcj02);

    // 创建新点位
    this.markers = gcjPoints.map((point) => {
      const marker = new AMap.Marker({
        position: [point.lon, point.lat],
        title: point.name,
      });
      marker.setMap(this.map);
      return marker;
    });
  }

  clearRoute(): void {
    if (this.polyline) {
      this.polyline.setMap(null);
      this.polyline = null;
    }
  }

  clearPoints(): void {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers = [];
  }

  destroy(): void {
    this.clearRoute();
    this.clearPoints();
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
  }

  private wgs84ToGcj02Coord(lon: number, lat: number): [number, number] {
    // 使用 gcoord 进行转换
    const gcoord = require('gcoord');
    return gcoord.transform([lon, lat], gcoord.WGS84, gcoord.GCJ02);
  }
}

