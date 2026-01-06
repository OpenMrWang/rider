import { useEffect, useRef, useState } from 'react';
import { MapFactory } from '../map/MapFactory';
import type { MapAdapter, MapType } from '../types/map';
import type { DayRecord } from '../types';
import { pointsToLineString } from '../utils/geoCalculation';

interface MapViewProps {
  day?: DayRecord;
  mapType?: MapType;
  onMapTypeChange?: (type: MapType) => void;
}

export function MapView({ day, mapType = 'osm', onMapTypeChange }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapAdapterRef = useRef<MapAdapter | null>(null);
  const [currentMapType, setCurrentMapType] = useState<MapType>(mapType);

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
    if (!mapAdapterRef.current || !day) return;

    const adapter = mapAdapterRef.current;

    // 使用 setTimeout 确保地图已完全初始化
    const timer = setTimeout(() => {
      // 清除旧数据
      adapter.clearRoute();
      adapter.clearPoints();

      // 绘制点位
      if (day.points.length > 0) {
        adapter.drawPoints(day.points);

        // 设置地图中心到第一个点位
        const firstPoint = day.points[0];
        adapter.setCenter(firstPoint.lat, firstPoint.lon, 12);
      }

      // 绘制路线
      if (day.routeGeoJSON) {
        adapter.drawRoute(day.routeGeoJSON);
      } else if (day.points.length >= 2) {
        // 如果没有路线，从点位生成简单路线
        const route = pointsToLineString(day.points);
        adapter.drawRoute(route);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [day]);

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
      {!day && (
        <div className="p-4 text-center text-gray-500">
          请选择一天查看地图
        </div>
      )}
    </div>
  );
}

