import { length, lineString } from '@turf/turf';
import type { Point, DayRecord } from '../types';
import type { LineString, MultiLineString } from 'geojson';

/**
 * 将点位数组转换为 GeoJSON LineString
 */
export function pointsToLineString(points: Point[]): LineString {
  const coordinates = points.map((point) => [point.lon, point.lat]);
  return {
    type: 'LineString',
    coordinates,
  };
}

/**
 * 计算路线的距离（单位：公里）
 * 支持 LineString 和 MultiLineString
 */
export function calculateDistance(route: LineString | MultiLineString | null): number | null {
  if (!route) return null;

  if (route.type === 'LineString') {
    if (route.coordinates.length < 2) return null;
    const turfLine = lineString(route.coordinates);
    const distanceKm = length(turfLine, { units: 'kilometers' });
    return Math.round(distanceKm * 100) / 100; // 保留两位小数
  }

  // MultiLineString：累加每一段的长度
  if (!route.coordinates || route.coordinates.length === 0) return null;

  let total = 0;
  for (const coords of route.coordinates) {
    if (!coords || coords.length < 2) continue;
    const turfLine = lineString(coords);
    total += length(turfLine, { units: 'kilometers' });
  }

  if (total === 0) return null;
  return Math.round(total * 100) / 100;
}

/**
 * 计算单日距离
 */
export function calculateDayDistance(day: DayRecord): number | null {
  if (day.routeGeoJSON) {
    return calculateDistance(day.routeGeoJSON);
  }
  // 如果没有路线，尝试从点位计算直线距离（不准确，仅供参考）
  if (day.points.length >= 2) {
    const route = pointsToLineString(day.points);
    return calculateDistance(route);
  }
  return null;
}

/**
 * 计算总里程
 */
export function calculateTotalDistance(days: DayRecord[]): number {
  let total = 0;
  for (const day of days) {
    const distance = calculateDayDistance(day);
    if (distance !== null) {
      total += distance;
    }
  }
  return Math.round(total * 100) / 100; // 保留两位小数
}

/**
 * 更新单日的距离
 */
export function updateDayDistance(day: DayRecord): DayRecord {
  const distance = calculateDayDistance(day);
  return {
    ...day,
    distanceKm: distance,
  };
}

