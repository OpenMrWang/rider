import * as gcoord from 'gcoord';
import type { Point } from '../types';
import type { LineString } from 'geojson';

/**
 * WGS-84 转 GCJ-02（高德地图）
 */
export function wgs84ToGcj02(point: Point): Point {
  const [lon, lat] = gcoord.transform(
    [point.lon, point.lat],
    gcoord.WGS84,
    gcoord.GCJ02
  );
  return {
    ...point,
    lon,
    lat,
  };
}

/**
 * WGS-84 转 BD-09（百度地图）
 */
export function wgs84ToBd09(point: Point): Point {
  const [lon, lat] = gcoord.transform(
    [point.lon, point.lat],
    gcoord.WGS84,
    gcoord.BD09
  );
  return {
    ...point,
    lon,
    lat,
  };
}

/**
 * 转换点位数组
 */
export function transformPoints(points: Point[], transform: (p: Point) => Point): Point[] {
  return points.map(transform);
}

/**
 * 转换 LineString 坐标
 */
export function transformLineString(
  route: LineString,
  transform: (lon: number, lat: number) => [number, number]
): LineString {
  return {
    ...route,
    coordinates: route.coordinates.map(([lon, lat]) => transform(lon, lat)),
  };
}

/**
 * WGS-84 LineString 转 GCJ-02
 */
export function wgs84LineStringToGcj02(route: LineString): LineString {
  return transformLineString(route, (lon, lat) => {
    const [newLon, newLat] = gcoord.transform([lon, lat], gcoord.WGS84, gcoord.GCJ02);
    return [newLon, newLat];
  });
}

/**
 * WGS-84 LineString 转 BD-09
 */
export function wgs84LineStringToBd09(route: LineString): LineString {
  return transformLineString(route, (lon, lat) => {
    const [newLon, newLat] = gcoord.transform([lon, lat], gcoord.WGS84, gcoord.BD09);
    return [newLon, newLat];
  });
}

