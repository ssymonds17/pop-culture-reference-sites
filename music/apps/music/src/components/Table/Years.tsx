import { SortedYear, Year } from '../../types';
import { SkeletonTable } from './Skeleton';

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
}: {
  years: SortedYear | null;
  isLoading: boolean;
  sortColumn: keyof SortedYear;
}) => {
  if (isLoading || !years) {
    return <SkeletonTable cols={5} />;
  }

  return (
    <table className="w-full mt-4 table-auto border-collapse border border-gray-400">
      <thead>
        <tr>
          <th className="border border-gray-300">Year</th>
          <th className="border border-gray-300">Gold Albums</th>
          <th className="border border-gray-300">Silver Albums</th>
          <th className="border border-gray-300">Songs</th>
          <th className="border border-gray-300">Total Score</th>
        </tr>
      </thead>

      <tbody>
        {renderYears(years, sortColumn).map((year: Year) => (
          <tr key={year.year}>
            <td className="border border-gray-300 text-center">{year.year}</td>
            <td className="border border-gray-300 text-center">
              {year.goldAlbums}
            </td>
            <td className="border border-gray-300 text-center">
              {year.silverAlbums}
            </td>
            <td className="border border-gray-300 text-center">{year.songs}</td>
            <td className="border border-gray-300 text-center">
              {year.totalScore}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
