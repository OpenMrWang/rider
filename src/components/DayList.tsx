import { useEffect, useState } from 'react';
import { useTripDataContext } from '../context/TripDataContext';
import type { DayRecord } from '../types';
import { calculateDayDistance } from '../utils/geoCalculation';

interface DayListProps {
  selectedDayIndex?: number;
  onSelectDay?: (index: number | undefined) => void;
  onEditDay?: (index: number | undefined) => void;
}

export function DayList({ selectedDayIndex, onSelectDay, onEditDay }: DayListProps) {
  const { tripData } = useTripDataContext();
  const PAGE_SIZE = 5;

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(tripData.days.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [tripData.days.length, currentPage]);

  const sortedDays = tripData.days
    .map((day, index) => ({ day, index }))
    .sort((a, b) => {
      if (typeof a.day.day === 'number' && typeof b.day.day === 'number') {
        return b.day.day - a.day.day;
      }
      if (a.day.date && b.day.date) {
        return a.day.date < b.day.date ? 1 : -1;
      }
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(sortedDays.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = sortedDays.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">每日记录</h2>
      </div>
      <div className="divide-y">
        {tripData.days.length === 0 ? (
          <div className="p-4 text-center text-gray-500">暂无记录</div>
        ) : (
          <>
            {pageItems.map(({ day, index }) => (
              <DayListItem
                key={day.day ?? index}
                day={day}
                isSelected={selectedDayIndex === index}
                onSelect={() => onSelectDay?.(index)}
                // 只有在传入 onEditDay 时才传递 onEdit，确保只读模式下按钮完全隐藏
                onEdit={onEditDay ? () => onEditDay(index) : undefined}
              />
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-600 bg-gray-50">
                <span>
                  第 {currentPage} / {totalPages} 页（共 {sortedDays.length} 天）
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </button>
                  <button
                    className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface DayListItemProps {
  day: DayRecord;
  isSelected: boolean;
  onSelect: () => void;
  // 只在编辑模式下传入，只读模式不传则不显示编辑按钮
  onEdit?: () => void;
}

function DayListItem({ day, isSelected, onSelect, onEdit }: DayListItemProps) {
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
            {/* 可在此加入视频标题等信息 */}
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
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            >
              编辑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


