import { useState } from 'react';
import type { Point, DayRecord } from '../types';
import { useTripDataContext } from '../context/TripDataContext';
import { pointsToLineString } from '../utils/geoCalculation';
import { updateDayDistance } from '../utils/geoCalculation';

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

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handleAddPoint}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            添加点位
          </button>
          <button
            onClick={handleRegenerateRoute}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
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
                      placeholder="点位名称"
                      className="w-full px-3 py-2 border rounded"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={editForm.lat}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            lat: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="纬度"
                        step="0.000001"
                        className="px-3 py-2 border rounded"
                      />
                      <input
                        type="number"
                        value={editForm.lon}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            lon: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="经度"
                        step="0.000001"
                        className="px-3 py-2 border rounded"
                      />
                    </div>
                    <div className="flex gap-2">
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
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

