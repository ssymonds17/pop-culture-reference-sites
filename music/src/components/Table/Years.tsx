import { SortedYear, Year } from '../../types';
import { SkeletonTable } from './Skeleton';
import { ScoreBadge } from '../Rating';

const renderYears = (years: SortedYear, sortColumn: keyof SortedYear) => {
  switch (sortColumn) {
    case 'byYear':
      return years.byYear;
    case 'byTotalScore':
      return years.byTotalScore;
    case 'byGoldAlbums':
      return years.byGoldAlbums;
    case 'bySilverAlbums':
      return years.bySilverAlbums;
    case 'bySongs':
      return years.bySongs;
    default:
      return years.byYear;
  }
};

export const YearsTable = ({
  years,
  isLoading,
  sortColumn,
  setSortColumn,
}: {
  years: SortedYear | null;
  isLoading: boolean;
  sortColumn: keyof SortedYear;
  setSortColumn: (column: keyof SortedYear) => void;
}) => {
  if (isLoading || !years) {
    return <SkeletonTable cols={5} />;
  }

  const handleColumnClick = (column: keyof SortedYear) => {
    console.log(`Sorting by ${column}`);
    console.log(years[column]);
    setSortColumn(column);
  };

  return (
    <div className="table-modern mt-6">
      <table>
        <thead>
          <tr>
            <th
              className="text-center cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => handleColumnClick('byYear')}
            >
              Year
            </th>
            <th
              className="text-center cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => handleColumnClick('byGoldAlbums')}
            >
              Gold Albums
            </th>
            <th
              className="text-center cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => handleColumnClick('bySilverAlbums')}
            >
              Silver Albums
            </th>
            <th
              className="text-center cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => handleColumnClick('bySongs')}
            >
              Songs
            </th>
            <th
              className="text-center cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => handleColumnClick('byTotalScore')}
            >
              Total Score
            </th>
          </tr>
        </thead>

        <tbody>
          {renderYears(years, sortColumn).map((year: Year) => (
            <tr key={year.year}>
              <td className="text-center table-number font-semibold">
                {year.year}
              </td>
              <td className="text-center table-number">
                {year.goldAlbums}
              </td>
              <td className="text-center table-number">
                {year.silverAlbums}
              </td>
              <td className="text-center table-number">
                {year.songs}
              </td>
              <td className="text-center">
                <ScoreBadge score={year.totalScore} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
