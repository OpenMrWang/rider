import { useTripDataContext } from '../context/TripDataContext';
import { calculateDayDistance } from '../utils/geoCalculation';
import type { DayRecord } from '../types';

interface DayListProps {
  selectedDayIndex?: number;
  onSelectDay?: (index: number) => void;
  onEditDay?: (index: number) => void;
}

export function DayList({ selectedDayIndex, onSelectDay, onEditDay }: DayListProps) {
  const { tripData } = useTripDataContext();

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">每日记录</h2>
      </div>
      <div className="divide-y">
        {tripData.days.length === 0 ? (
          <div className="p-4 text-center text-gray-500">暂无记录</div>
        ) : (
          tripData.days.map((day, index) => (
            <DayListItem
              key={index}
              day={day}
              index={index}
              isSelected={selectedDayIndex === index}
              onSelect={() => onSelectDay?.(index)}
              onEdit={() => onEditDay?.(index)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface DayListItemProps {
  day: DayRecord;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

function DayListItem({ day, index, isSelected, onSelect, onEdit }: DayListItemProps) {
  const distance = calculateDayDistance(day);

  return (
    <div
      className={`p-4 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 cursor-pointer" onClick={onSelect}>
          <h3 className="font-semibold text-lg">
            第 {day.day} 天 - {day.date}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {day.vlog.platform} - {day.vlog.episode}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {day.points.length} 个点位
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            {distance !== null ? (
              <p className="text-lg font-bold text-blue-600">{distance.toFixed(2)} km</p>
            ) : (
              <p className="text-sm text-gray-400">未计算</p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
          >
            编辑
          </button>
        </div>
      </div>
    </div>
  );
}

