import { useEffect, useRef, useState } from 'react';
import { MapFactory } from '../map/MapFactory';
import type { MapAdapter, MapType } from '../types/map';
import type { DayRecord } from '../types';
import { mergeAllRoutes, collectAllPoints, calculateBounds, getDayRoute } from '../utils/mapUtils';
import { useTripDataContext } from '../context/TripDataContext';

interface MapViewProps {
  day?: DayRecord;
  mapType?: MapType;
  onMapTypeChange?: (type: MapType) => void;
  showAllRoutes?: boolean;
}

export function MapView({ day, mapType = 'osm', onMapTypeChange, showAllRoutes = true }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapAdapterRef = useRef<MapAdapter | null>(null);
  const [currentMapType, setCurrentMapType] = useState<MapType>(mapType);
  const { tripData } = useTripDataContext();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 销毁旧地图
    if (mapAdapterRef.current) {
      mapAdapterRef.current.destroy();
    }

    // 创建新地图
    const adapter = MapFactory.create(currentMapType);
    adapter.init('map-container');
    mapAdapterRef.current = adapter;

    return () => {
      adapter.destroy();
    };
  }, [currentMapType]);

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
        // 显示单天路线
        if (day.points.length > 0) {
          adapter.drawPoints(day.points);

          // 设置地图中心到第一个点位
          const firstPoint = day.points[0];
          adapter.setCenter(firstPoint.lat, firstPoint.lon, 12);
        }

        // 绘制路线
        const route = getDayRoute(day);
        if (route) {
          adapter.drawRoute(route);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [day, showAllRoutes, tripData.days]);

  const handleMapTypeChange = (type: MapType) => {
    setCurrentMapType(type);
    onMapTypeChange?.(type);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">地图展示</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleMapTypeChange('osm')}
              className={`px-3 py-1 rounded ${
                currentMapType === 'osm'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              OSM
            </button>
            <button
              onClick={() => handleMapTypeChange('amap')}
              className={`px-3 py-1 rounded ${
                currentMapType === 'amap'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              高德
            </button>
            <button
              onClick={() => handleMapTypeChange('baidu')}
              className={`px-3 py-1 rounded ${
                currentMapType === 'baidu'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              百度
            </button>
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

