import type { DayRecord } from '../types';

interface DayDetailProps {
  day: DayRecord;
}

export function DayDetail({ day }: DayDetailProps) {
  const { video, goal, meta, segments, clue } = day as any;

  return (
    <div className="mt-4 bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            第 {day.day} 天 · {day.title || day.date}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{day.date}</p>
        </div>
        {video?.title && (
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            打开视频
          </a>
        )}
      </div>

      {goal && (
        <div className="border-t pt-3">
          <h4 className="text-sm font-semibold text-gray-700">目标</h4>
          <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
          {goal.deadline && (
            <p className="text-xs text-gray-400 mt-1">截止时间：{goal.deadline}</p>
          )}
        </div>
      )}

      {meta && Object.keys(meta).length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-sm font-semibold text-gray-700">元信息</h4>
          <dl className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            {Object.entries(meta).map(([key, value]) => (
              <div key={key} className="flex">
                <dt className="font-medium mr-1 break-all">{key}：</dt>
                <dd className="break-all">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {segments && Array.isArray(segments) && segments.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-sm font-semibold text-gray-700">分段路线</h4>
          <ol className="mt-1 space-y-2 text-sm text-gray-700">
            {segments.map((seg: any) => (
              <li key={seg.order} className="border rounded px-2 py-1 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>
                    序号 {seg.order} · {seg.type} / {seg.mode}
                  </span>
                  {(seg.time_est || seg.distance_km_est) && (
                    <span>
                      {seg.distance_km_est != null && `约 ${seg.distance_km_est} km`}
                      {seg.distance_km_est != null && seg.time_est && ' · '}
                      {seg.time_est && `用时 ${seg.time_est}`}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <span className="font-medium">
                    {seg.from?.name || '未知起点'}
                  </span>
                  <span className="mx-1 text-gray-400">→</span>
                  <span className="font-medium">
                    {seg.to?.name || '未知终点'}
                  </span>
                </div>
                {seg.from?.notes && (
                  <p className="text-xs text-gray-500 mt-1">起点备注：{seg.from.notes}</p>
                )}
                {seg.to?.notes && (
                  <p className="text-xs text-gray-500 mt-1">终点备注：{seg.to.notes}</p>
                )}
                {Array.isArray(seg.via) && seg.via.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    途经：{seg.via.map((v: any) => v.name).join('，')}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {clue && typeof clue === 'string' && (
        <div className="border-t pt-3">
          <h4 className="text-sm font-semibold text-gray-700">行程线索</h4>
          <pre className="mt-1 text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2 max-h-64 overflow-auto">
            {clue}
          </pre>
        </div>
      )}
    </div>
  );
}


