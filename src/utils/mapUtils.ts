import type { DayRecord, Point } from '../types';
import type { LineString, MultiLineString } from 'geojson';
import { pointsToLineString } from './geoCalculation';

/**
 * 获取单天的路线 GeoJSON
 */
export function getDayRoute(day: DayRecord): LineString | MultiLineString | null {
  if (day.routeGeoJSON) {
    return day.routeGeoJSON;
  }
  if (day.points.length >= 2) {
    return pointsToLineString(day.points);
  }
  return null;
}

/**
 * 合并所有天的路线为 MultiLineString
 */
export function mergeAllRoutes(days: DayRecord[]): MultiLineString | null {
  const lines: number[][][] = [];

  for (const day of days) {
    const route = getDayRoute(day);
    if (!route) continue;

    if (route.type === 'LineString') {
      if (route.coordinates.length >= 2) {
        lines.push(route.coordinates as number[][]);
      }
    } else if (route.type === 'MultiLineString') {
      for (const seg of route.coordinates || []) {
        if (seg && seg.length >= 2) {
          lines.push(seg as number[][]);
        }
      }
    }
  }

  if (lines.length === 0) {
    return null;
  }

  return {
    type: 'MultiLineString',
    coordinates: lines,
  };
}

/**
 * 收集所有点位
 */
export function collectAllPoints(days: DayRecord[]): Point[] {
  const allPoints: Point[] = [];
  
  for (const day of days) {
    allPoints.push(...day.points);
  }
  
  return allPoints;
}

/**
 * 计算所有路线的边界框
 */
export function calculateBounds(days: DayRecord[]): {
  center: [number, number];
  zoom: number;
} | null {
  const allPoints = collectAllPoints(days);
  
  if (allPoints.length === 0) {
    return null;
  }
  
  // 计算边界
  const lons = allPoints.map((p) => p.lon);
  const lats = allPoints.map((p) => p.lat);
  
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  
  // 计算中心点
  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;
  
  // 计算合适的缩放级别
  const lonDiff = maxLon - minLon;
  const latDiff = maxLat - minLat;
  const maxDiff = Math.max(lonDiff, latDiff);
  
  // 根据范围估算缩放级别
  let zoom = 10;
  if (maxDiff > 10) {
    zoom = 5;
  } else if (maxDiff > 5) {
    zoom = 6;
  } else if (maxDiff > 2) {
    zoom = 7;
  } else if (maxDiff > 1) {
    zoom = 8;
  } else if (maxDiff > 0.5) {
    zoom = 9;
  } else if (maxDiff > 0.2) {
    zoom = 10;
  } else if (maxDiff > 0.1) {
    zoom = 11;
  } else {
    zoom = 12;
  }
  
  return {
    center: [centerLat, centerLon],
    zoom,
  };
}

