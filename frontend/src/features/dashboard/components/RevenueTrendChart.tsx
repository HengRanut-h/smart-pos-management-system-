import React, { useState } from 'react';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface TrendDataPoint {
  date: string;
  day: string;
  label: string;
  revenue: number;
  revenue_khr: number;
  orders: number;
  cogs: number;
  profit: number;
  margin_percent: number;
}

interface RevenueTrendChartProps {
  data: TrendDataPoint[];
  exchangeRate?: number;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  data,
  exchangeRate = 4100,
}) => {
  const [metricMode, setMetricMode] = useState<'revenue' | 'profit' | 'orders'>('revenue');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-gray-400">
        No trend data available.
      </div>
    );
  }

  // Chart dimensions
  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 25;

  const values = data.map((d) =>
    metricMode === 'revenue' ? d.revenue : metricMode === 'profit' ? d.profit : d.orders
  );

  const maxValue = Math.max(...values, 10);
  const chartHeight = height - paddingY * 2;
  const chartWidth = width - paddingX * 2;
  const stepX = chartWidth / (data.length - 1);

  // Calculate points
  const points = data.map((d, idx) => {
    const val = metricMode === 'revenue' ? d.revenue : metricMode === 'profit' ? d.profit : d.orders;
    const x = paddingX + idx * stepX;
    const y = height - paddingY - (val / maxValue) * chartHeight;
    return { x, y, val, data: d };
  });

  // Generate smooth SVG path (curved bezier)
  const pathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }, '');

  // Fill area under path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  // Format value for Y-axis labels
  const formatY = (val: number) => {
    if (metricMode === 'orders') return `${Math.round(val)}`;
    return `$${Math.round(val)}`;
  };

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className="space-y-4">
      {/* Chart Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              {metricMode === 'revenue'
                ? 'Revenue Trend'
                : metricMode === 'profit'
                ? 'Gross Profit Trend'
                : 'Transaction Volume'}
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
              7-Day Rolling
            </span>
          </div>
          {activePoint && (
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-black text-gray-900 font-mono tracking-tight">
                {metricMode === 'orders'
                  ? `${activePoint.data.orders} Orders`
                  : `$${(metricMode === 'revenue' ? activePoint.data.revenue : activePoint.data.profit).toFixed(2)}`}
              </span>
              {metricMode === 'revenue' && (
                <span className="text-xs text-gray-400 font-mono">
                  ≈ ៛{(activePoint.data.revenue * exchangeRate).toLocaleString()} KHR
                </span>
              )}
              <span className="text-[11px] text-gray-400">
                on {activePoint.data.label} ({activePoint.data.day})
              </span>
            </div>
          )}
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricMode('revenue')}
            className={`px-2.5 py-1 rounded-lg transition ${
              metricMode === 'revenue'
                ? 'bg-white shadow-xs text-emerald-700'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Revenue ($)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('profit')}
            className={`px-2.5 py-1 rounded-lg transition ${
              metricMode === 'profit'
                ? 'bg-white shadow-xs text-blue-700'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Gross Profit ($)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('orders')}
            className={`px-2.5 py-1 rounded-lg transition ${
              metricMode === 'orders'
                ? 'bg-white shadow-xs text-purple-700'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* Responsive SVG Area Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="80%" stopColor="#10B981" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
              <stop offset="80%" stopColor="#3B82F6" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
              <stop offset="80%" stopColor="#8B5CF6" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingY + chartHeight * (1 - ratio);
            const val = maxValue * ratio;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#9CA3AF"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {formatY(val)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path
            d={areaD}
            fill={`url(#${
              metricMode === 'revenue'
                ? 'revenueGradient'
                : metricMode === 'profit'
                ? 'profitGradient'
                : 'ordersGradient'
            })`}
          />

          {/* Line Path */}
          <path
            d={pathD}
            fill="none"
            stroke={
              metricMode === 'revenue'
                ? '#10B981'
                : metricMode === 'profit'
                ? '#3B82F6'
                : '#8B5CF6'
            }
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Points */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                {/* Vertical hover crosshair */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={height - paddingY}
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Outer Ring on Hover */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill={
                      metricMode === 'revenue'
                        ? '#A7F3D0'
                        : metricMode === 'profit'
                        ? '#BFDBFE'
                        : '#DDD6FE'
                    }
                    opacity="0.8"
                  />
                )}

                {/* Main Data Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3.5}
                  fill="#FFFFFF"
                  stroke={
                    metricMode === 'revenue'
                      ? '#10B981'
                      : metricMode === 'profit'
                      ? '#3B82F6'
                      : '#8B5CF6'
                  }
                  strokeWidth="2.5"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredIndex(i)}
                />

                {/* Invisible hover zone */}
                <rect
                  x={pt.x - stepX / 2}
                  y={0}
                  width={stepX}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* X-axis Day labels */}
                <text
                  x={pt.x}
                  y={height - 6}
                  textAnchor="middle"
                  fill={isHovered ? '#111827' : '#9CA3AF'}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  fontSize="10"
                >
                  {pt.data.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Summary Pill */}
      <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-2xl border border-gray-100 text-center text-xs">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">7-Day Total</span>
          <span className="font-mono font-bold text-gray-900">
            ${data.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Avg Daily Sales</span>
          <span className="font-mono font-bold text-emerald-600">
            ${(data.reduce((sum, d) => sum + d.revenue, 0) / data.length).toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Orders</span>
          <span className="font-mono font-bold text-gray-900">
            {data.reduce((sum, d) => sum + d.orders, 0)} Orders
          </span>
        </div>
      </div>
    </div>
  );
};
