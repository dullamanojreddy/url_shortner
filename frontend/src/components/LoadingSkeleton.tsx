import React from "react";

export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-card p-6 rounded-xl space-y-4 w-full">
      <div className="h-4 w-1/3 shimmer rounded"></div>
      <div className="h-8 w-2/3 shimmer rounded"></div>
      <div className="h-3 w-1/2 shimmer rounded"></div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="glass-card rounded-xl overflow-hidden w-full">
      <div className="h-12 bg-gray-900/60 border-b border-gray-800/80 px-6 flex items-center justify-between">
        <div className="h-4 w-1/4 shimmer rounded"></div>
        <div className="h-4 w-12 shimmer rounded"></div>
      </div>
      <div className="p-6 divide-y divide-gray-800/40">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="py-4 flex justify-between items-center">
            <div className="space-y-2 w-1/3">
              <div className="h-4 w-full shimmer rounded"></div>
              <div className="h-3 w-2/3 shimmer rounded"></div>
            </div>
            <div className="h-4 w-16 shimmer rounded"></div>
            <div className="h-6 w-24 shimmer rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const GraphSkeleton: React.FC = () => {
  return (
    <div className="glass-card p-6 rounded-xl space-y-4 w-full h-80 flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div className="h-4 w-1/4 shimmer rounded"></div>
        <div className="h-3 w-16 shimmer rounded"></div>
      </div>
      <div className="flex-1 flex items-end gap-3 px-4 pt-8 pb-4">
        {Array.from({ length: 12 }).map((_, idx) => {
          const heightPercent = [30, 45, 60, 40, 75, 90, 55, 65, 80, 50, 70, 85][idx];
          return (
            <div
              key={idx}
              className="flex-1 shimmer rounded-t"
              style={{ height: `${heightPercent}%` }}
            ></div>
          );
        })}
      </div>
      <div className="flex justify-between h-4">
        <div className="h-3 w-8 shimmer rounded"></div>
        <div className="h-3 w-8 shimmer rounded"></div>
        <div className="h-3 w-8 shimmer rounded"></div>
      </div>
    </div>
  );
};

export const MetricsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
};
