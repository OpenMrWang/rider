import { useState, useCallback, useEffect } from 'react';
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
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

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

  // 自动从 public/everyday-merged.json 加载默认数据（仅在首次加载且当前没有任何天的数据时）
  useEffect(() => {
    if (hasLoadedInitial || tripData.days.length > 0) return;
    setHasLoadedInitial(true);

    // 使用 BASE_URL，确保在 GitHub Pages 的 /rider/ 子路径下也能正确访问
    const baseUrl = import.meta.env.BASE_URL || '/';
    const url = `${baseUrl}everyday-merged.json`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          console.warn('[useTripData] 默认数据文件不存在或无法访问:', url, res.status);
          return null;
        }
        return res.text();
      })
      .then((text) => {
        if (!text) return;
        try {
          const data = importTripData(text);
          console.log('[useTripData] 已从 everyday-merged.json 加载默认数据:', {
            meta: data.meta,
            daysCount: data.days.length,
          });
          setTripData(data);
        } catch (err) {
          console.error('[useTripData] 加载默认 everyday-merged.json 失败:', err);
        }
      })
      .catch((err) => {
        console.error('[useTripData] 获取 everyday-merged.json 失败:', err);
      });
  }, [hasLoadedInitial, tripData.days.length]);

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

