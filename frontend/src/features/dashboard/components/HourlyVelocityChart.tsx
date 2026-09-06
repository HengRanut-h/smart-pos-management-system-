import React, { useState } from 'react';
import { Clock, Flame } from 'lucide-react';

interface HourlyData {
  hour: string;
  revenue: number;
  orders: number;
  is_peak: boolean;
}

interface HourlyVelocityChartProps {
  data: HourlyData[];
}

export const HourlyVelocityChart: React.FC<HourlyVelocityChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return null;
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Peak Trading Hours & Store Velocity</span>
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Hourly retail sales distribution for cashier staffing optimization.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-bold">
          <span className="flex items-center space-x-1 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Peak Rush Hours</span>
          </span>
          <span className="flex items-center space-x-1 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span>Standard</span>
          </span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="pt-4 pb-2">
        <div className="h-36 flex items-end justify-between gap-2 px-1">
          {data.map((slot, idx) => {
            const heightPercent = Math.max(8, Math.round((slot.revenue / maxRevenue) * 100));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 bg-gray-900 text-white p-1.5 rounded-lg shadow-xl text-[10px] whitespace-nowrap text-center font-mono">
                    <span className="font-bold block">${slot.revenue.toFixed(2)}</span>
                    <span className="text-gray-400">{slot.orders} Orders</span>
                  </div>
                )}

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    slot.is_peak
                      ? isHovered
                        ? 'bg-emerald-600 shadow-md shadow-emerald-200'
                        : 'bg-emerald-500'
                      : isHovered
                      ? 'bg-gray-400'
                      : 'bg-gray-200'
                  }`}
                />

                {/* Hour Label */}
                <span
                  className={`text-[10px] font-mono mt-2 ${
                    slot.is_peak ? 'font-bold text-emerald-800' : 'text-gray-400'
                  }`}
                >
                  {slot.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytical Takeaway Banner */}
      <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Flame className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[11px] text-emerald-950 font-medium">
            <span className="font-bold">Peak Volumes:</span> Highest retail traffic occurs at{' '}
            <span className="font-bold font-mono">12:00</span> (Lunch) and{' '}
            <span className="font-bold font-mono">18:00</span> (Evening).
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 font-mono shrink-0 hidden sm:inline">
          +2 Registers Recommended
        </span>
      </div>
    </div>
  );
};
