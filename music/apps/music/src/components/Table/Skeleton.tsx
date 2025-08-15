import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const SkeletonTable = ({ cols }: { cols: number }) => {
  return (
    <div className="w-full">
      <div className="flex gap-2.5">
        {Array.from({ length: cols }).map((col) => (
          <Skeleton
            key={`skeleton-header-${col}`}
            containerClassName="flex-1"
            height={30}
          />
        ))}
      </div>
      <Skeleton height={40} containerClassName="flex-1" />
    </div>
  );
};
