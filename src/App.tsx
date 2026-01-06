import { useState } from 'react'
import { DataManager } from './components/DataManager'
import { DistanceStats } from './components/DistanceStats'
import { MapView } from './components/MapView'
import { DayList } from './components/DayList'
import { PointEditor } from './components/PointEditor'
import { ReadOnlyView } from './components/ReadOnlyView'
import { DayDetail } from './components/DayDetail'
import { TripDataProvider, useTripDataContext } from './context/TripDataContext'

function AppContent() {
  const isDev = import.meta.env.DEV;
  const { tripData } = useTripDataContext();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | undefined>();
  const [editingDayIndex, setEditingDayIndex] = useState<number | undefined>();
  const [isReadOnly, setIsReadOnly] = useState(false);

  // 生产环境下始终使用只读视图，不暴露编辑/管理功能
  if (!isDev) {
    return <ReadOnlyView />;
  }

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
      <header className="bg-[#595eac] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/wsf.webp"
                alt="WSF Logo"
                className="h-8 w-8 rounded-md object-cover"
              />
              <h1 className="text-2xl font-bold text-white">王师傅骑行</h1>
            </div>
            <button
              onClick={() => setIsReadOnly(true)}
              className="px-4 py-2 bg-white/90 text-[#595eac] rounded hover:bg-white"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* 左侧：地图，贯穿两行 */}
              <div className="lg:col-span-2 lg:row-span-2">
                <MapView
                  day={selectedDay}
                  showAllRoutes={selectedDayIndex === undefined}
                />
              </div>

              {/* 右上：每日列表 */}
              <div className="lg:col-span-1">
                <DayList
                  selectedDayIndex={selectedDayIndex}
                  onSelectDay={setSelectedDayIndex}
                  onEditDay={setEditingDayIndex}
                />
              </div>

              {/* 右下：详情 */}
              <div className="lg:col-span-1">
                {selectedDay && <DayDetail day={selectedDay} />}
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

