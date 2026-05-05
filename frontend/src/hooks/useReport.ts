import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const fetchReportSummary = async () => {
  const { data } = await api.get('/reports/summary');
  if (data.status !== 'success') throw new Error('Failed to fetch report summary');
  return data.data; // returns { summary, chart_data, sector_data, recent_successes }
};

const searchAdvocacyCases = async (query: string) => {
  const { data } = await api.get(`/reports/search${query ? `?query=${encodeURIComponent(query)}` : ''}`);
  if (data.status !== 'success') throw new Error('Search failed');
  return data.data;
};

export const useGetReportSummary = () => {
  return useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: fetchReportSummary,
  });
};

export const useSearchCases = (query: string) => {
  return useQuery({
    queryKey: ['reports', 'search', query],
    queryFn: () => searchAdvocacyCases(query),
    staleTime: 1000 * 30, // cache search results for 30s
  });
};
