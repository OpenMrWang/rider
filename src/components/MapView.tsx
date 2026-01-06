import { useEffect, useRef } from 'react';
import { MapFactory } from '../map/MapFactory';
import type { MapAdapter } from '../types/map';
import type { DayRecord, Point } from '../types';
import { mergeAllRoutes, collectAllPoints, calculateBounds, getDayRoute } from '../utils/mapUtils';
import { useTripDataContext } from '../context/TripDataContext';

interface MapViewProps {
  day?: DayRecord;
  showAllRoutes?: boolean;
  onMapClick?: (lat: number, lon: number) => void;
  focusPoint?: Point;
  // 当使用百度骑行规划生成路线时，可选地通知上层保存 GeoJSON
  onPlannedRouteChange?: (route: GeoJSON.LineString | GeoJSON.MultiLineString | null) => void;
  // 仅在该值变化时触发一次骑行规划（用于避免反复调用）
  planRouteRequestId?: number;
}

export function MapView({
  day,
  showAllRoutes = true,
  onMapClick,
  focusPoint,
  onPlannedRouteChange,
  planRouteRequestId,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapAdapterRef = useRef<MapAdapter | null>(null);
  const { tripData } = useTripDataContext();
  const lastPlannedRequestId = useRef<number | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 销毁旧地图
    if (mapAdapterRef.current) {
      mapAdapterRef.current.destroy();
    }

    // 始终使用百度地图适配器
    const adapter = MapFactory.create('baidu');
    adapter.init('map-container');

    // 如果需要监听地图点击事件，并且适配器实现了 setClickHandler，则注册
    if (onMapClick && (adapter as any).setClickHandler) {
      (adapter as any).setClickHandler(onMapClick);
    }

    mapAdapterRef.current = adapter;

    return () => {
      // 清理点击回调（如果支持）
      if ((adapter as any).setClickHandler) {
        (adapter as any).setClickHandler(null);
      }
      adapter.destroy();
    };
  }, [onMapClick]);

  useEffect(() => {
    if (!mapAdapterRef.current) return;

    const adapter = mapAdapterRef.current;

    // 使用 setTimeout 确保地图已完全初始化
    const timer = setTimeout(() => {
      // 清除旧数据
      adapter.clearRoute();
      adapter.clearPoints();

      if (showAllRoutes && tripData.days.length > 0) {
        // 显示所有路线
        const allRoutes = mergeAllRoutes(tripData.days);
        const allPoints = collectAllPoints(tripData.days);
        const bounds = calculateBounds(tripData.days);

        if (allRoutes) {
          adapter.drawRoute(allRoutes);
        }

        if (allPoints.length > 0) {
          adapter.drawPoints(allPoints);
        }

        if (bounds) {
          adapter.setCenter(bounds.center[0], bounds.center[1], bounds.zoom);
        }
      } else if (day) {
        // 显示单天路线，并根据地图类型选择绘制方式
        if (day.points.length > 0) {
          adapter.drawPoints(day.points);
        }

        const adapterAny = adapter as any;

        const shouldPlanRoute =
          day.points.length >= 2 &&
          typeof adapterAny.planRidingRoute === 'function' &&
          typeof planRouteRequestId === 'number' &&
          planRouteRequestId !== lastPlannedRequestId.current;

        if (shouldPlanRoute) {
          adapterAny.planRidingRoute(day.points, onPlannedRouteChange);
          lastPlannedRequestId.current = planRouteRequestId!;
        } else {
          // 使用已有的 routeGeoJSON 或按点连线
          const route = getDayRoute(day);
          if (route) {
            adapter.drawRoute(route);
          }
        }

        // 使用单天的所有点计算合适的视野范围
        if (day.points.length > 0) {
          const bounds = calculateBounds([day]);
          if (bounds) {
            adapter.setCenter(bounds.center[0], bounds.center[1], bounds.zoom);
          }
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [day, showAllRoutes, tripData.days, planRouteRequestId, onPlannedRouteChange]);

  // 当传入了 focusPoint 时，移动地图中心到该点
  useEffect(() => {
    if (!mapAdapterRef.current || !focusPoint) return;
    const adapter = mapAdapterRef.current;
    // 使用稍微大一点的缩放级别，方便查看周边
    adapter.setCenter(focusPoint.lat, focusPoint.lon, 13);
  }, [focusPoint]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">地图展示</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded bg-blue-500 text-white text-sm">
              百度地图
            </span>
          </div>
        </div>
      </div>
      <div
        id="map-container"
        ref={mapContainerRef}
        className="w-full h-96"
      />
      {!day && !showAllRoutes && tripData.days.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          请导入数据或选择一天查看地图
        </div>
      )}
    </div>
  );
}

