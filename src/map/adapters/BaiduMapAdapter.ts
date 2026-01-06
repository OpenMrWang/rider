import type { MapAdapter } from '../../types/map';
import type { Point } from '../../types';
import type { LineString, MultiLineString } from 'geojson';
import { wgs84ToBd09, wgs84LineStringToBd09, transformPoints } from '../../utils/coordinateTransform';

// 百度地图适配器
export class BaiduMapAdapter implements MapAdapter {
  private map: BMap.Map | null = null;
  private polyline: BMap.Polyline | null = null;
  private markers: BMap.Marker[] = [];

  init(containerId: string): void {
    // 检查 SDK 是否已加载
    if (!window.BMap) {
      console.warn('百度地图 SDK 未加载，请先在 HTML 中引入 SDK');
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`容器 ${containerId} 不存在`);
    }

    const point = new BMap.Point(116.3974, 39.9093); // 默认北京
    this.map = new BMap.Map(containerId);
    this.map.centerAndZoom(point, 10);
  }

  setCenter(lat: number, lon: number, zoom: number): void {
    if (!this.map) return;
    // 转换为 BD-09
    const [bdLon, bdLat] = this.wgs84ToBd09Coord(lon, lat);
    const point = new BMap.Point(bdLon, bdLat);
    this.map.centerAndZoom(point, zoom);
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
      const allPoints: BMap.Point[] = [];
      for (const line of route.coordinates) {
        // 转换为 BD-09
        const bdPoints = line.map(([lon, lat]) => {
          const [bdLon, bdLat] = this.wgs84ToBd09Coord(lon, lat);
          return new BMap.Point(bdLon, bdLat);
        });
        allPoints.push(...bdPoints);
      }
      
      this.polyline = new BMap.Polyline(allPoints, {
        strokeColor: '#3b82f6',
        strokeWeight: 4,
        strokeOpacity: 1,
      });
    } else {
      // 转换为 BD-09
      const bdRoute = wgs84LineStringToBd09(route);
      const points = bdRoute.coordinates.map(
        ([lon, lat]) => new BMap.Point(lon, lat)
      );

      this.polyline = new BMap.Polyline(points, {
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

    // 转换为 BD-09
    const bdPoints = transformPoints(points, wgs84ToBd09);

    // 创建新点位
    this.markers = bdPoints.map((point) => {
      const bdPoint = new BMap.Point(point.lon, point.lat);
      const marker = new BMap.Marker(bdPoint);
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

  private wgs84ToBd09Coord(lon: number, lat: number): [number, number] {
    // 使用 gcoord 进行转换
    const gcoord = require('gcoord');
    return gcoord.transform([lon, lat], gcoord.WGS84, gcoord.BD09);
  }
}

