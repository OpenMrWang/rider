import { useState } from 'react'
import { DataManager } from './components/DataManager'
import { DistanceStats } from './components/DistanceStats'
import { MapView } from './components/MapView'
import { DayList } from './components/DayList'
import { PointEditor } from './components/PointEditor'
import { ReadOnlyView } from './components/ReadOnlyView'
import { TripDataProvider, useTripDataContext } from './context/TripDataContext'

function AppContent() {
  const { tripData } = useTripDataContext();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | undefined>();
  const [editingDayIndex, setEditingDayIndex] = useState<number | undefined>();
  const [mapType, setMapType] = useState<'amap' | 'baidu' | 'osm'>('osm');
  const [isReadOnly, setIsReadOnly] = useState(false);

  // 检查 URL 参数，如果是只读模式
  const urlParams = new URLSearchParams(window.location.search);
  const readOnlyParam = urlParams.get('readonly');
  if (readOnlyParam === 'true' && !isReadOnly) {
    setIsReadOnly(true);
  }

  if (isReadOnly) {
    return <ReadOnlyView />;
  }

  const selectedDay = selectedDayIndex !== undefined ? tripData.days[selectedDayIndex] : undefined;
  const editingDay = editingDayIndex !== undefined ? tripData.days[editingDayIndex] : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">骑行旅行路径记录</h1>
            <button
              onClick={() => setIsReadOnly(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              只读模式
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <DistanceStats />
          {editingDayIndex !== undefined && editingDay ? (
            <PointEditor
              dayIndex={editingDayIndex}
              day={editingDay}
              onClose={() => setEditingDayIndex(undefined)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <DayList
                  selectedDayIndex={selectedDayIndex}
                  onSelectDay={setSelectedDayIndex}
                  onEditDay={setEditingDayIndex}
                />
              </div>
              <div className="lg:col-span-2">
                <MapView
                  day={selectedDay}
                  mapType={mapType}
                  onMapTypeChange={setMapType}
                />
              </div>
            </div>
          )}
          <DataManager />
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <TripDataProvider>
      <AppContent />
    </TripDataProvider>
  );
}

export default App

