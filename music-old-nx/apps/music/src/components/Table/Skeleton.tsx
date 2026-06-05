import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const SkeletonTable = ({ cols }: { cols: number }) => {
  return (
    <div className="table-skeleton mt-6">
      {/* Table header skeleton */}
      <div className="table-skeleton-header">
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton
            key={`skeleton-header-${index}`}
            containerClassName="flex-1"
            height={20}
          />
        ))}
      </div>

      {/* Table rows skeleton */}
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div key={`skeleton-row-${rowIndex}`} className="table-skeleton-row">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={`skeleton-cell-${rowIndex}-${colIndex}`}
              containerClassName="flex-1"
              height={16}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
