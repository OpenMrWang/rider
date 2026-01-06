import type { MapAdapter } from '../../types/map';
import type { Point } from '../../types';
import type { LineString, MultiLineString } from 'geojson';
import gcoord from 'gcoord';
import { wgs84ToBd09, wgs84LineStringToBd09, transformPoints } from '../../utils/coordinateTransform';

// 百度地图适配器
export class BaiduMapAdapter implements MapAdapter {
  private map: BMap.Map | null = null;
  private polyline: BMap.Polyline | null = null;
  private markers: BMap.Marker[] = [];
  private clickHandler: ((lat: number, lon: number) => void) | null = null;
  private ridingRoutes: any[] = [];

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
    // 开启滚轮缩放
    this.map.enableScrollWheelZoom(true);

    // 注册点击事件，将 BD-09 坐标转换为 WGS-84 并回调给外部
    this.map.addEventListener('click', (e: any) => {
      if (!this.clickHandler) return;
      const { lng, lat } = e.point || {};
      if (typeof lng !== 'number' || typeof lat !== 'number') return;
      const [wgsLon, wgsLat] = gcoord.transform([lng, lat], gcoord.BD09, gcoord.WGS84);
      this.clickHandler(wgsLat, wgsLon);
    });
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
      this.map.removeOverlay(this.polyline);
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
    
    this.map.addOverlay(this.polyline);
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
      this.map!.addOverlay(marker);
      return marker;
    });
  }

  clearRoute(): void {
    if (this.map && this.polyline) {
      this.map.removeOverlay(this.polyline);
    }
    this.polyline = null;

    // 清除骑行规划产生的路线
    this.ridingRoutes.forEach((route) => {
      if (route && typeof route.clearResults === 'function') {
        route.clearResults();
      }
    });
    this.ridingRoutes = [];
  }

  clearPoints(): void {
    if (this.map) {
      this.markers.forEach((marker) => this.map!.removeOverlay(marker));
    }
    this.markers = [];
  }

  destroy(): void {
    // 百度地图 V3 JS API 并没有公开的 destroy 方法
    // 这里仅清理覆盖物和内部引用，交给浏览器 GC
    this.clearRoute();
    this.clearPoints();
    this.map = null;
    this.clickHandler = null;
  }

  private wgs84ToBd09Coord(lon: number, lat: number): [number, number] {
    // 使用 gcoord 进行转换
    const [bdLon, bdLat] = gcoord.transform([lon, lat], gcoord.WGS84, gcoord.BD09);
    return [bdLon, bdLat];
  }

  // 可选：在地图上点击时回调 WGS-84 坐标
  setClickHandler(handler: ((lat: number, lon: number) => void) | null): void {
    this.clickHandler = handler;
  }

  /**
   * 使用百度骑行规划在地图上绘制从每个点到下一个点的骑行路线
   * 可选地将规划结果通过回调以 GeoJSON 形式返回（WGS-84 坐标）
   */
  planRidingRoute(points: Point[], onRouteReady?: (route: LineString | MultiLineString | null) => void): void {
    if (!this.map || !points || points.length < 2) return;

    // 清除旧路线（包括普通 polyline 和之前的骑行结果）
    this.clearRoute();

    // 先将点转换为 BD-09 坐标
    const bdPoints = transformPoints(points, wgs84ToBd09);

    const segmentCoords: [number, number][][] = [];
    let finished = 0;
    const segmentCount = bdPoints.length - 1;

    for (let i = 0; i < segmentCount; i++) {
      const start = bdPoints[i];
      const end = bdPoints[i + 1];

      const startPt = new BMap.Point(start.lon, start.lat);
      const endPt = new BMap.Point(end.lon, end.lat);

      const riding = new (window as any).BMap.RidingRoute(this.map, {
        renderOptions: {
          map: this.map,
          autoViewport: false,
        },
        onSearchComplete: (res: any) => {
          try {
            // 有的版本 getStatus / BMAP_STATUS_SUCCESS 表现不一，这里直接依据回调参数解析
            const results = res || (riding.getResults ? riding.getResults() : null);
            if (results && results.getNumPlans && results.getNumPlans() > 0) {
              const plan = results.getPlan(0);
              const routesCount = plan.getNumRoutes ? plan.getNumRoutes() : 1;
              const allPath: [number, number][] = [];

              for (let r = 0; r < routesCount; r++) {
                const route = plan.getRoute(r) || plan.getRoute(0);
                if (!route || !route.getPath) continue;
                const path: any[] = route.getPath(); // BMap.Point[]
                path.forEach((p) => {
                  const [wgsLon, wgsLat] = gcoord.transform(
                    [p.lng, p.lat],
                    gcoord.BD09,
                    gcoord.WGS84
                  );
                  allPath.push([wgsLon, wgsLat]);
                });
              }

              if (allPath.length > 0) {
                segmentCoords[i] = allPath;
              }
            }
          } finally {
            finished++;
            if (onRouteReady && finished === segmentCount) {
              const coords = segmentCoords.filter(Boolean);
              if (coords.length === 0) {
                onRouteReady(null);
              } else if (coords.length === 1) {
                onRouteReady({
                  type: 'LineString',
                  coordinates: coords[0],
                });
              } else {
                onRouteReady({
                  type: 'MultiLineString',
                  coordinates: coords,
                });
              }
            }
          }
        },
      });

      this.ridingRoutes.push(riding);
      riding.search(startPt, endPt);
    }
  }
}

