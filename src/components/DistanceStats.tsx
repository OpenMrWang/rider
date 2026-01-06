import { useMemo } from 'react';
import { useTripDataContext } from '../context/TripDataContext';
import { calculateTotalDistance, calculateDayDistance } from '../utils/geoCalculation';

export function DistanceStats() {
  const { tripData } = useTripDataContext();

  const stats = useMemo(() => {
    const totalDistance = calculateTotalDistance(tripData.days);
    const daysWithDistance = tripData.days.filter(
      (day) => calculateDayDistance(day) !== null
    ).length;

    return {
      totalDistance,
      daysWithDistance,
      totalDays: tripData.days.length,
    };
  }, [tripData.days]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">里程统计</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">总里程</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalDistance.toFixed(2)} km
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">已计算天数</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.daysWithDistance} / {stats.totalDays}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">平均每日</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.daysWithDistance > 0
              ? (stats.totalDistance / stats.daysWithDistance).toFixed(2)
              : '0.00'}{' '}
            km
          </p>
        </div>
      </div>
    </div>
  );
}

