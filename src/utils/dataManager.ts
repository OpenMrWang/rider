import type { TripData, DayRecord } from '../types';

// 从 JSON 字符串导入数据
export function importTripData(jsonString: string): TripData {
  console.log('[dataManager] 开始解析 JSON');
  console.log('[dataManager] JSON 字符串:', jsonString.substring(0, 500));
  
  try {
    const data = JSON.parse(jsonString) as TripData;
    console.log('[dataManager] JSON 解析成功:', data);
    
    // 基本验证
    if (!data) {
      console.error('[dataManager] 数据为空');
      throw new Error('数据为空');
    }
    
    if (!data.meta) {
      console.error('[dataManager] 缺少 meta 字段');
      throw new Error('缺少 meta 字段');
    }
    
    if (!data.days) {
      console.error('[dataManager] 缺少 days 字段');
      throw new Error('缺少 days 字段');
    }
    
    if (!Array.isArray(data.days)) {
      console.error('[dataManager] days 不是数组:', typeof data.days);
      throw new Error('days 必须是数组');
    }
    
    console.log('[dataManager] 数据验证通过:', {
      meta: data.meta,
      daysCount: data.days.length,
    });
    
    return data;
  } catch (error) {
    console.error('[dataManager] 解析失败:', error);
    if (error instanceof SyntaxError) {
      console.error('[dataManager] JSON 语法错误');
      throw new Error(`JSON 格式错误: ${error.message}`);
    }
    throw new Error(`导入数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 导出数据为 JSON 字符串
export function exportTripData(data: TripData): string {
  return JSON.stringify(data, null, 2);
}

// 创建默认数据
export function createDefaultTripData(): TripData {
  return {
    meta: {
      title: '骑行旅行记录',
      author: '',
      description: '',
    },
    days: [],
  };
}

// 添加新的一天
export function addDay(data: TripData, day: DayRecord): TripData {
  return {
    ...data,
    days: [...data.days, day],
  };
}

// 更新某一天的数据
export function updateDay(data: TripData, dayIndex: number, day: Partial<DayRecord>): TripData {
  const newDays = [...data.days];
  if (dayIndex >= 0 && dayIndex < newDays.length) {
    newDays[dayIndex] = { ...newDays[dayIndex], ...day };
  }
  return {
    ...data,
    days: newDays,
  };
}

// 删除某一天
export function deleteDay(data: TripData, dayIndex: number): TripData {
  const newDays = data.days.filter((_, index) => index !== dayIndex);
  return {
    ...data,
    days: newDays,
  };
}

