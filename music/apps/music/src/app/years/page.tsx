'use client';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { API_URL } from '../../constants';
import { YearsTable } from '../../components/Table/Years';
import { SortedYear, Year } from '../../types';
import { useScrollToTop } from '../../utils';

const sortYearsByField = (years: Year[], field: keyof Year) => {
  if (!years) return [];

  const sortedYears = [...years].sort((a, b) => b[field] - a[field]);

  return sortedYears;
};

const YearsPage = () => {
  const [years, setYears] = useState<SortedYear | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof SortedYear>('byYear');
  const [isFetchingYears, setIsFetchingYears] = useState(true);
  useScrollToTop();

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
    <div className="layout-container">
      <section className="layout-section">
        <div className="layout-header text-center">
          <h1 className="mb-component-sm">Years</h1>
          <p className="text-neutral-600">
            View your music collection organized by year with statistics
          </p>
        </div>

        <div className="layout-content">
          <YearsTable
            years={years}
            isLoading={isFetchingYears}
            sortColumn={sortColumn}
            setSortColumn={setSortColumn}
          />
        </div>
      </section>
    </div>
  );
};

export default YearsPage;
