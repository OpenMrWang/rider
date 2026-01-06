import { useState, useCallback } from 'react';
import type { TripData, DayRecord } from '../types';
import {
  createDefaultTripData,
  importTripData,
  exportTripData,
  addDay,
  updateDay,
  deleteDay,
} from '../utils/dataManager';

export function useTripData() {
  const [tripData, setTripData] = useState<TripData>(createDefaultTripData);

  // 导入数据
  const handleImport = useCallback((jsonString: string) => {
    console.log('[useTripData] 开始导入数据');
    console.log('[useTripData] JSON 字符串长度:', jsonString.length);
    try {
      const data = importTripData(jsonString);
      console.log('[useTripData] 数据解析成功:', {
        meta: data.meta,
        daysCount: data.days.length,
        days: data.days,
      });
      setTripData(data);
      console.log('[useTripData] 状态已更新');
      return true;
    } catch (error) {
      console.error('[useTripData] 导入失败:', error);
      console.error('[useTripData] 错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }, []);

  // 导出数据
  const handleExport = useCallback(() => {
    return exportTripData(tripData);
  }, [tripData]);

  // 添加新的一天
  const handleAddDay = useCallback((day: DayRecord) => {
    setTripData((prev) => addDay(prev, day));
  }, []);

  // 更新某一天
  const handleUpdateDay = useCallback((dayIndex: number, day: Partial<DayRecord>) => {
    setTripData((prev) => updateDay(prev, dayIndex, day));
  }, []);

  // 删除某一天
  const handleDeleteDay = useCallback((dayIndex: number) => {
    setTripData((prev) => deleteDay(prev, dayIndex));
  }, []);

  // 重置数据
  const handleReset = useCallback(() => {
    setTripData(createDefaultTripData());
  }, []);

  return {
    tripData,
    handleImport,
    handleExport,
    handleAddDay,
    handleUpdateDay,
    handleDeleteDay,
    handleReset,
  };
}

