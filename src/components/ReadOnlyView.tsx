import { useState } from 'react';
import { DistanceStats } from './DistanceStats';
import { MapView } from './MapView';
import { DayList } from './DayList';
import { useTripDataContext } from '../context/TripDataContext';

export function ReadOnlyView() {
  const { tripData } = useTripDataContext();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | undefined>();
  const [mapType, setMapType] = useState<'amap' | 'baidu' | 'osm'>('osm');

  const selectedDay = selectedDayIndex !== undefined ? tripData.days[selectedDayIndex] : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tripData.meta.title}</h1>
              {tripData.meta.author && (
                <p className="text-sm text-gray-600 mt-1">作者: {tripData.meta.author}</p>
              )}
            </div>
          </div>
          {tripData.meta.description && (
            <p className="text-sm text-gray-600 mt-2">{tripData.meta.description}</p>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <DistanceStats />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <DayList
                selectedDayIndex={selectedDayIndex}
                onSelectDay={setSelectedDayIndex}
              />
            </div>
            <div className="lg:col-span-2">
              <MapView
                day={selectedDay}
                mapType={mapType}
                onMapTypeChange={setMapType}
                showAllRoutes={selectedDayIndex === undefined}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

