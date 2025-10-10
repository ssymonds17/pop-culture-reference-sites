import { Rating } from '../../types';

interface RatingBadgeProps {
  rating: Rating;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
}

const getRatingConfig = (rating: Rating) => {
  switch (rating) {
    case Rating.GOLD:
      return {
        icon: '🥇',
        bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
        textColor: 'text-yellow-900',
        borderColor: 'border-yellow-300',
        label: 'Gold',
        description: 'Exceptional'
      };
    case Rating.SILVER:
      return {
        icon: '🥈',
        bgColor: 'bg-gradient-to-br from-gray-300 to-gray-500',
        textColor: 'text-gray-900',
        borderColor: 'border-gray-400',
        label: 'Silver',
        description: 'Great'
      };
    default:
      return {
        icon: '○',
        bgColor: 'bg-neutral-100',
        textColor: 'text-neutral-500',
        borderColor: 'border-neutral-300',
        label: 'Unrated',
        description: 'No rating'
      };
  }
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        container: 'px-2 py-1 text-xs',
        icon: 'text-sm',
        spacing: 'gap-1'
      };
    case 'lg':
      return {
        container: 'px-4 py-2 text-base',
        icon: 'text-xl',
        spacing: 'gap-2'
      };
    default: // md
      return {
        container: 'px-3 py-1.5 text-sm',
        icon: 'text-base',
        spacing: 'gap-1.5'
      };
  }
};

export const RatingBadge = ({
  rating,
  size = 'md',
  interactive = false,
  className = ''
}: RatingBadgeProps) => {
  const config = getRatingConfig(rating);
  const sizeClasses = getSizeClasses(size);

  const baseClasses = `
    inline-flex items-center font-medium rounded-full border
    ${sizeClasses.container}
    ${sizeClasses.spacing}
    ${config.bgColor}
    ${config.textColor}
    ${config.borderColor}
    ${interactive ? 'cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105' : ''}
    ${className}
  `.trim();

  return (
    <div className={baseClasses} title={config.description}>
      <span className={sizeClasses.icon}>{config.icon}</span>
      <span className="font-semibold">{config.label}</span>
    </div>
  );
};

// Compact version for tables
export const RatingIcon = ({
  rating,
  size = 'md',
  className = ''
}: Pick<RatingBadgeProps, 'rating' | 'size' | 'className'>) => {
  const config = getRatingConfig(rating);
  const iconSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <span
      className={`${iconSize} ${className}`}
      title={`${config.label} - ${config.description}`}
    >
      {config.icon}
    </span>
  );
};