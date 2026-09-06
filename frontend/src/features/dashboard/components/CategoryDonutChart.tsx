import React, { useState } from 'react';
import { PieChart, Tag } from 'lucide-react';

interface CategoryShare {
  name: string;
  revenue: number;
  qty_sold: number;
  percentage: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: CategoryShare[];
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-gray-400">
        No category distribution data.
      </div>
    );
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  // SVG Donut geometry
  const radius = 65;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const slices = data.map((item, idx) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += item.percentage;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      idx,
    };
  });

  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
          <PieChart className="w-3.5 h-3.5 text-emerald-600" />
          <span>Category Sales Contribution</span>
        </h3>
        <span className="text-[10px] text-gray-400 font-mono">
          ${totalRevenue.toFixed(2)} Total
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
        {/* SVG Donut Circle */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />

            {/* Segment slices */}
            {slices.map((slice) => {
              const isHovered = hoveredIdx === slice.idx;
              return (
                <circle
                  key={slice.idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(slice.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Text inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
            {activeItem ? (
              <>
                <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[90px]">
                  {activeItem.name.split(' ')[0]}
                </span>
                <span className="text-base font-black text-gray-900 font-mono">
                  {activeItem.percentage}%
                </span>
                <span className="text-[9px] text-emerald-600 font-mono font-bold">
                  ${activeItem.revenue.toFixed(2)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[9px] font-bold text-gray-400 uppercase">Catalog</span>
                <span className="text-base font-black text-gray-900 font-mono">
                  ${totalRevenue.toFixed(0)}
                </span>
                <span className="text-[9px] text-gray-400">Total Rev</span>
              </>
            )}
          </div>
        </div>

        {/* Categories Legend List */}
        <div className="flex-1 w-full space-y-2 text-xs">
          {data.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-1.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                  isHovered ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-gray-800 truncate block">
                    {item.name}
                  </span>
                </div>

                <div className="text-right shrink-0 flex items-center space-x-2">
                  <span className="font-mono text-gray-500 font-medium">
                    ${item.revenue.toFixed(2)}
                  </span>
                  <span className="font-mono font-bold text-gray-900 w-10 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
