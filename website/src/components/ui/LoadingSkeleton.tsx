import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'text' | 'circular' | 'restaurant' | 'food';
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({ type = 'text', count = 1, className = '' }: LoadingSkeletonProps) {
  const elements = Array.from({ length: count }, (_, i) => i);

  const getSkeletonType = () => {
    switch (type) {
      case 'restaurant':
        return (
          <div className={`bg-white rounded-3xl h-64 shadow-card border border-gray-100 flex flex-col overflow-hidden animate-pulse ${className}`}>
            <div className="w-full h-40 bg-gray-200"></div>
            <div className="p-4 flex-1 flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        );
      case 'food':
        return (
          <div className={`flex gap-4 p-4 border border-gray-100 rounded-2xl bg-white shadow-sm animate-pulse ${className}`}>
            <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-5 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/4 pt-2"></div>
            </div>
          </div>
        );
      case 'card':
        return <div className={`bg-gray-200 rounded-2xl h-32 animate-pulse ${className}`}></div>;
      case 'circular':
        return <div className={`bg-gray-200 rounded-full h-12 w-12 animate-pulse ${className}`}></div>;
      case 'text':
      default:
        return <div className={`bg-gray-200 rounded h-4 w-full animate-pulse ${className}`}></div>;
    }
  };

  return (
    <>
      {elements.map((key) => (
        <React.Fragment key={key}>{getSkeletonType()}</React.Fragment>
      ))}
    </>
  );
}
