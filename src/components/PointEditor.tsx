import { useEffect, useRef, useState } from 'react';
import gcoord from 'gcoord';
import type { Point, DayRecord } from '../types';
import { useTripDataContext } from '../context/TripDataContext';
import { pointsToLineString, updateDayDistance } from '../utils/geoCalculation';
import { MapView } from './MapView';
import { DayDetail } from './DayDetail';

interface PointEditorProps {
  dayIndex: number;
  day: DayRecord;
  onClose: () => void;
}

export function PointEditor({ dayIndex, day, onClose }: PointEditorProps) {
  const { handleUpdateDay } = useTripDataContext();
  const [points, setPoints] = useState<Point[]>(day.points);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Point>({ name: '', lat: 0, lon: 0 });
  const [focusPoint, setFocusPoint] = useState<Point | null>(null);
  const [planRouteRequestId, setPlanRouteRequestId] = useState(0);
  const geocoderRef = useRef<any | null>(null);
  const segments: any[] = (day as any).segments || [];

  // 初始化百度地图地址解析器
  useEffect(() => {
    const win = window as any;
    if (win.BMap && win.BMap.Geocoder) {
      geocoderRef.current = new win.BMap.Geocoder();
    } else {
      console.warn('百度地图 SDK 未加载，地址解析功能不可用');
    }
  }, []);

  const handleAddPoint = () => {
    const newPoint: Point = {
      name: `点位 ${points.length + 1}`,
      lat: 0,
      lon: 0,
    };
    setPoints([...points, newPoint]);
    setEditingIndex(points.length);
    setEditForm(newPoint);
  };

  const handleGeneratePointsFromSegments = () => {
    if (!segments || segments.length === 0) {
      alert('当前天没有分段信息，无法从 segments 生成点位');
      return;
    }

    const uniquePoints: Point[] = [];
    const seen = new Set<string>();

    const addLocationAsPoint = (loc: any) => {
      if (!loc || !loc.name) return;
      const key = `${loc.name}|${loc.city || ''}|${loc.province || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      uniquePoints.push({
        name: loc.name,
        lat: 0,
        lon: 0,
      });
    };

    // 按顺序把每个分段的 from / to 加入为点位（去重）
    segments.forEach((seg) => {
      addLocationAsPoint(seg.from);
      addLocationAsPoint(seg.to);
    });

    if (uniquePoints.length === 0) {
      alert('分段中没有有效的起点/终点名称，无法生成点位');
      return;
    }

    setPoints(uniquePoints);
    setEditingIndex(0);
    setEditForm(uniquePoints[0]);
  };

  const handleEditPoint = (index: number) => {
    setEditingIndex(index);
    setEditForm(points[index]);
  };

  const handleSavePoint = () => {
    if (editingIndex === null) return;
    const newPoints = [...points];
    newPoints[editingIndex] = { ...editForm };
    setPoints(newPoints);
    setEditingIndex(null);
  };

  const handleGeocodeCurrentPoint = () => {
    if (editingIndex === null) {
      alert('请先选择要编辑的点位');
      return;
    }

    const address = editForm.name?.trim();
    if (!address) {
      alert('请先填写点位名称（用于地址解析）');
      return;
    }

    const win = window as any;
    if (!win.BMap || !win.BMap.Geocoder) {
      alert('百度地图 SDK 未加载或地址解析不可用');
      return;
    }

    if (!geocoderRef.current) {
      geocoderRef.current = new win.BMap.Geocoder();
    }

    geocoderRef.current.getPoint(
      address,
      (pt: any) => {
        if (!pt) {
          alert('未能根据该名称找到位置，请尝试更具体的地址描述');
          return;
        }

        // Baidu 返回的是 BD-09，需要转换为 WGS-84 与内部坐标系统一致
        const [wgsLon, wgsLat] = gcoord.transform(
          [pt.lng, pt.lat],
          gcoord.BD09,
          gcoord.WGS84
        );

        setEditForm((prev) => ({
          ...prev,
          lat: wgsLat,
          lon: wgsLon,
        }));

        setPoints((prev) => {
          const list = [...prev];
          list[editingIndex] = {
            ...list[editingIndex],
            lat: wgsLat,
            lon: wgsLon,
          };
          return list;
        });
      },
      // 可选城市参数，优先使用 meta.location 中的城市信息（简单传入整段文本）
      day.meta?.location || undefined
    );
  };

  const handleMapClick = (lat: number, lon: number) => {
    setPoints((prev) => {
      // 如果当前正在编辑某个点，则更新该点坐标
      if (editingIndex !== null && editingIndex >= 0 && editingIndex < prev.length) {
        const list = [...prev];
        list[editingIndex] = {
          ...list[editingIndex],
          lat,
          lon,
        };
        setEditForm((cur) => ({
          ...cur,
          lat,
          lon,
        }));
        return list;
      }

      // 否则，新建一个点位
      const newPoint: Point = {
        name: `地图点 ${prev.length + 1}`,
        lat,
        lon,
      };
      setEditingIndex(prev.length);
      setEditForm(newPoint);
      return [...prev, newPoint];
    });
  };

  const handleDeletePoint = (index: number) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newPoints = [...points];
    [newPoints[index - 1], newPoints[index]] = [newPoints[index], newPoints[index - 1]];
    setPoints(newPoints);
  };

  const handleMoveDown = (index: number) => {
    if (index === points.length - 1) return;
    const newPoints = [...points];
    [newPoints[index], newPoints[index + 1]] = [newPoints[index + 1], newPoints[index]];
    setPoints(newPoints);
  };

  const handleLocatePoint = (index: number) => {
    const p = points[index];
    if (!p || !p.lat || !p.lon) {
      alert('该点尚未设置有效坐标，请先在地图上点击或使用地址解析设置经纬度');
      return;
    }
    setFocusPoint(p);
  };

  const handleRegenerateRoute = () => {
    if (points.length < 2) {
      alert('至少需要 2 个点位才能生成路线');
      return;
    }
    const route = pointsToLineString(points);
    const updatedDay: DayRecord = {
      ...day,
      points,
      routeGeoJSON: route,
    };
    const finalDay = updateDayDistance(updatedDay);
    handleUpdateDay(dayIndex, finalDay);
    alert('路线已重新生成');
  };

  const handleSave = () => {
    const updatedDay: DayRecord = {
      ...day,
      points,
    };
    const finalDay = updateDayDistance(updatedDay);
    handleUpdateDay(dayIndex, finalDay);
    onClose();
  };

  // 为地图构造一个使用当前 points 的 day 对象（只影响展示，不直接写回全局 state）
  const dayForMap: DayRecord = {
    ...day,
    points,
  };

  const handlePlannedRouteChange = (route: GeoJSON.LineString | GeoJSON.MultiLineString | null) => {
    if (!route) return;
    const updatedDay: DayRecord = {
      ...day,
      points,
      routeGeoJSON: route,
    };
    const finalDay = updateDayDistance(updatedDay);
    handleUpdateDay(dayIndex, finalDay);
  };

  const previewJson = JSON.stringify(dayForMap, null, 2);

  const handleCopyPointsAndRoute = async () => {
    // 仅输出字段本身，不包裹最外层花括号，便于粘贴进已有对象
    const pointsJson = JSON.stringify(points, null, 2)
      .split('\n')
      .map((line) => (line.length ? `  ${line}` : line))
      .join('\n');

    // 展平 MultiLineString，复制时统一为 LineString 的坐标数组，方便编辑
    const route = day.routeGeoJSON;
    let routeForCopy: any = route ?? null;
    if (route && route.type === 'MultiLineString') {
      const flatCoords = (route.coordinates || []).reduce(
        (acc: number[][], seg: number[][]) => (seg ? acc.concat(seg) : acc),
        []
      );
      routeForCopy = {
        type: 'LineString',
        coordinates: flatCoords,
      };
    }

    const routeJson = JSON.stringify(routeForCopy, null, 2)
      .split('\n')
      .map((line) => (line.length ? `  ${line}` : line))
      .join('\n');

    const text =
`  "points": ${pointsJson},
  "routeGeoJSON": ${routeJson},
  "distanceKm": ${day.distanceKm ?? null},`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert('已复制 points 和 routeGeoJSON 到剪贴板');
      } else {
        window.prompt('当前环境无法直接写入剪贴板，请手动复制以下内容：', text);
      }
    } catch (err) {
      console.error('复制失败:', err);
      window.prompt('复制失败，请手动复制以下内容：', text);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">编辑点位 - 第 {day.day} 天</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          关闭
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 左侧：地图 + 详情 */}
        <div className="lg:col-span-2 lg:row-span-2 space-y-4">
          <MapView
            day={dayForMap}
            showAllRoutes={false}
            onMapClick={handleMapClick}
            focusPoint={focusPoint || undefined}
            onPlannedRouteChange={handlePlannedRouteChange}
            planRouteRequestId={planRouteRequestId}
          />
          <DayDetail day={day} />
        </div>

        {/* 右侧：点位编辑及百度地址解析 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAddPoint}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              添加点位
            </button>
            <button
              onClick={handleGeneratePointsFromSegments}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
              disabled={!segments || segments.length === 0}
            >
              从分段生成点位
            </button>
            <button
              onClick={() => setPlanRouteRequestId((id) => id + 1)}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
              disabled={points.length < 2}
            >
              使用百度骑行重新规划
            </button>
            <button
              onClick={handleRegenerateRoute}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={points.length < 2}
            >
              重新生成路线
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              保存
            </button>
          </div>

          <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
            {points.length === 0 ? (
              <div className="p-4 text-center text-gray-500">暂无点位</div>
            ) : (
              points.map((point, index) => (
                <div
                  key={index}
                  className={`p-4 ${
                    editingIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        placeholder="点位名称 / 地址关键词"
                        className="w-full px-3 py-2 border rounded"
                      />
                      <p className="text-xs text-gray-600">
                        坐标（WGS-84）：
                        {editForm.lat && editForm.lon
                          ? ` ${editForm.lat.toFixed(6)}, ${editForm.lon.toFixed(6)}（点击地图可更新）`
                          : ' 暂无，请在地图上点击选择位置'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleGeocodeCurrentPoint}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          地址解析
                        </button>
                        <button
                          onClick={handleSavePoint}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{point.name}</p>
                        <p className="text-sm text-gray-600">
                          {point.lat.toFixed(6)}, {point.lon.toFixed(6)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                        >
                          上移
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === points.length - 1}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                        >
                          下移
                        </button>
                        <button
                          onClick={() => handleEditPoint(index)}
                          className="px-2 py-1 bg-blue-200 text-blue-700 rounded text-sm hover:bg-blue-300"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeletePoint(index)}
                          className="px-2 py-1 bg-red-200 text-red-700 rounded text-sm hover:bg-red-300"
                        >
                          删除
                        </button>
                        <button
                          onClick={() => handleLocatePoint(index)}
                          className="px-2 py-1 bg-indigo-200 text-indigo-700 rounded text-sm hover:bg-indigo-300"
                        >
                          定位
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 当天 JSON 数据预览 */}
          <div className="border rounded-lg bg-gray-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">当天 JSON 数据</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPointsAndRoute}
                  className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  复制 points + routeGeoJSON
                </button>
                <span className="text-xs text-gray-400">只读预览</span>
              </div>
            </div>
            <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap break-all max-h-64 overflow-auto">
{previewJson}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

