'use client';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { API_URL } from '../../constants';
import { YearsTable } from '../../components/Table/Years';
import { SortedYear, Year } from '../../types';

const sortYearsByField = (years: Year[], field: keyof Year) => {
  if (!years) return [];

  const sortedYears = [...years].sort((a, b) => b[field] - a[field]);

  return sortedYears;
};

const YearsPage = () => {
  const [years, setYears] = useState<SortedYear | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof SortedYear>('byYear');
  const [isFetchingYears, setIsFetchingYears] = useState(true);

  const handleGetYears = async () => {
    try {
      setIsFetchingYears(true);
      const {
        data: { years },
      } = await axios.get(`${API_URL}/years`);
      const sortedYears: SortedYear = {
        byYear: years,
        byTotalScore: sortYearsByField(years, 'totalScore'),
        byGoldAlbums: sortYearsByField(years, 'goldAlbums'),
        bySilverAlbums: sortYearsByField(years, 'silverAlbums'),
        bySongs: sortYearsByField(years, 'songs'),
      };
      setYears(sortedYears);
    } catch (error) {
      setYears(null);
      console.log('error', error);
    } finally {
      setIsFetchingYears(false);
    }
  };

  useEffect(() => {
    handleGetYears();
  }, []);

  if (!isFetchingYears && !years) {
    return <div>No data available</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-center mb-2">
          Years
        </h1>
        <p className="text-center text-neutral-600">
          View your music collection organized by year with statistics
        </p>
      </div>
      <ul className="mt-4">
        <YearsTable
          years={years}
          isLoading={isFetchingYears}
          sortColumn={sortColumn}
          setSortColumn={setSortColumn}
        />
      </ul>
    </div>
  );
};

export default YearsPage;
