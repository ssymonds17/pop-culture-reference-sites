interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const getScoreColor = (score: number, maxScore: number) => {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  if (percentage >= 80) return 'text-music-600 bg-music-100';
  if (percentage >= 60) return 'text-amber-600 bg-amber-100';
  if (percentage >= 40) return 'text-orange-600 bg-orange-100';
  if (percentage >= 20) return 'text-red-500 bg-red-100';
  return 'text-neutral-500 bg-neutral-100';
};

const getBarColor = (score: number, maxScore: number) => {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  if (percentage >= 80) return 'bg-music-500';
  if (percentage >= 60) return 'bg-amber-500';
  if (percentage >= 40) return 'bg-orange-500';
  if (percentage >= 20) return 'bg-red-500';
  return 'bg-neutral-400';
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        text: 'text-sm',
        padding: 'px-2 py-1',
        bar: 'h-1'
      };
    case 'lg':
      return {
        text: 'text-lg',
        padding: 'px-4 py-2',
        bar: 'h-3'
      };
    default: // md
      return {
        text: 'text-base',
        padding: 'px-3 py-1.5',
        bar: 'h-2'
      };
  }
};

export const ScoreDisplay = ({
  score,
  maxScore = 100,
  showBar = false,
  size = 'md',
  label,
  className = ''
}: ScoreDisplayProps) => {
  const percentage = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;
  const scoreColor = getScoreColor(score, maxScore);
  const barColor = getBarColor(score, maxScore);
  const sizeClasses = getSizeClasses(size);

  if (showBar) {
    return (
      <div className={`space-y-1 ${className}`}>
        {label && (
          <div className={`font-medium text-neutral-700 ${sizeClasses.text}`}>
            {label}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`${barColor} ${sizeClasses.bar} rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={`font-mono font-bold ${sizeClasses.text} ${scoreColor.split(' ')[0]}`}>
            {score}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {label && (
        <span className={`mr-2 text-neutral-600 ${sizeClasses.text}`}>
          {label}:
        </span>
      )}
      <span
        className={`
          font-mono font-bold rounded-md
          ${sizeClasses.text}
          ${sizeClasses.padding}
          ${scoreColor}
        `}
      >
        {score}
      </span>
    </div>
  );
};

// Compact score for tables
export const ScoreBadge = ({
  score,
  size = 'sm',
  className = ''
}: Pick<ScoreDisplayProps, 'score' | 'size' | 'className'>) => {
  // Use score itself as max for color calculation (dynamic max)
  const maxScore = Math.max(score, 50); // Minimum scale of 50
  const scoreColor = getScoreColor(score, maxScore);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-mono font-bold rounded-md
        ${sizeClasses.text}
        ${sizeClasses.padding}
        ${scoreColor}
        ${className}
      `}
    >
      {score}
    </span>
  );
};

// Score comparison component
export const ScoreComparison = ({
  scores,
  labels,
  className = ''
}: {
  scores: number[];
  labels?: string[];
  className?: string;
}) => {
  const maxScore = Math.max(...scores);

  return (
    <div className={`space-y-2 ${className}`}>
      {scores.map((score, index) => (
        <div key={index} className="flex items-center gap-3">
          {labels && (
            <span className="text-sm font-medium text-neutral-600 min-w-20">
              {labels[index]}
            </span>
          )}
          <div className="flex-1">
            <ScoreDisplay
              score={score}
              maxScore={maxScore}
              showBar={true}
              size="sm"
            />
          </div>
        </div>
      ))}
    </div>
  );
};