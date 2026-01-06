import { useState } from 'react';
import { DistanceStats } from './DistanceStats';
import { MapView } from './MapView';
import { DayList } from './DayList';
import { DayDetail } from './DayDetail';
import { useTripDataContext } from '../context/TripDataContext';

export function ReadOnlyView() {
  const { tripData } = useTripDataContext();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | undefined>();
  // 只读模式下也默认使用百度地图
  const [mapType, setMapType] = useState<'amap' | 'baidu' | 'osm'>('baidu');

  const selectedDay = selectedDayIndex !== undefined ? tripData.days[selectedDayIndex] : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#595eac] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/wsf.webp"
                alt="WSF Logo"
                className="h-8 w-8 rounded-md object-cover"
              />
              <h1 className="text-2xl font-bold text-white">{tripData.meta.title}</h1>
              {tripData.meta.author && (
                <p className="text-sm text-gray-100 mt-1">作者: {tripData.meta.author}</p>
              )}
            </div>
          </div>
          {tripData.meta.description && (
            <p className="text-sm text-gray-100 mt-2">{tripData.meta.description}</p>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <DistanceStats />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* 左侧：地图，贯穿两行 */}
            <div className="lg:col-span-2 lg:row-span-2">
              <MapView
                day={selectedDay}
                mapType={mapType}
                onMapTypeChange={setMapType}
                showAllRoutes={selectedDayIndex === undefined}
              />
            </div>

            {/* 右上：每日列表 */}
            <div className="lg:col-span-1">
              <DayList
                selectedDayIndex={selectedDayIndex}
                onSelectDay={setSelectedDayIndex}
              />
            </div>

            {/* 右下：详情 */}
            <div className="lg:col-span-1">
              {selectedDay && <DayDetail day={selectedDay} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

