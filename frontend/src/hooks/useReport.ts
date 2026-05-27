import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const fetchReportSummary = async (timeRange?: string, sector?: string) => {
  const params = new URLSearchParams();
  if (timeRange && timeRange !== 'all') params.append('time_range', timeRange);
  if (sector && sector !== 'all') params.append('sector', sector);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const { data } = await api.get(`/reports/summary${queryString}`);
  if (data.status !== 'success') throw new Error('Failed to fetch report summary');
  return data.data; // returns { summary, chart_data, sector_data, recent_successes }
};

const searchAdvocacyCases = async (query: string) => {
  const { data } = await api.get(`/reports/search${query ? `?query=${encodeURIComponent(query)}` : ''}`);
  if (data.status !== 'success') throw new Error('Search failed');
  return data.data;
};

const fetchSectors = async () => {
  const { data } = await api.get('/reports/sectors');
  if (data.status !== 'success') throw new Error('Failed to fetch sectors');
  return data.data;
};

export const useGetReportSummary = (timeRange?: string, sector?: string) => {
  return useQuery({
    queryKey: ['reports', 'summary', timeRange, sector],
    queryFn: () => fetchReportSummary(timeRange, sector),
  });
};

export const useGetSectors = () => {
  return useQuery({
    queryKey: ['reports', 'sectors'],
    queryFn: fetchSectors,
  });
};

export const useSearchCases = (query: string) => {
  return useQuery({
    queryKey: ['reports', 'search', query],
    queryFn: () => searchAdvocacyCases(query),
    staleTime: 1000 * 30, // cache search results for 30s
  });
};
