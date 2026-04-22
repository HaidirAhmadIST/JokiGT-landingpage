import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const fetchReportSummary = async () => {
  const { data } = await api.get('/reports/summary');
  if (data.status !== 'success') throw new Error('Failed to fetch report summary');
  return data.data; // returns { summary, chart_data, sector_data, recent_successes }
};

const searchAdvocacyCases = async (query: string) => {
  if (!query) return [];
  const { data } = await api.get(`/reports/search?query=${encodeURIComponent(query)}`);
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
    enabled: query.length > 0, // only run if there is a query
    staleTime: 1000 * 30, // cache search results for 30s
  });
};
