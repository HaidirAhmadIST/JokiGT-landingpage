import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { StatusAdvokasi } from '@/types';

// API Fetchers
const fetchAdvokasiStats = async () => {
  const { data } = await api.get('/advokasi/stats');
  if (data.status !== 'success') throw new Error('Failed to fetch stats');
  return data;
};

const fetchAdvokasiCases = async (params: any): Promise<any> => {
  const { data } = await api.get('/advokasi', { params });
  if (data.status !== 'success') throw new Error('Failed to fetch cases');
  return data.data;
};

const fetchAdvokasiDetail = async (id: string): Promise<StatusAdvokasi> => {
  const { data } = await api.get(`/advokasi/${id}`);
  if (data.status !== 'success') throw new Error(data.message || 'Failed to fetch detail');
  return data.data;
};

const updateAdvokasi = async ({ id, payload }: { id: string; payload: any | FormData }) => {
  const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await api.post(`/pekerja/${id}/advokasi`, payload, config);
  if (data.status !== 'success') throw new Error(data.message || 'Failed to update advokasi');
  return data;
};

// Hooks
export const useGetAdvokasiStats = () => {
  return useQuery({
    queryKey: ['advokasi', 'stats'],
    queryFn: fetchAdvokasiStats,
  });
};

export const useGetAdvokasiCases = (params: any = {}) => {
  return useQuery({
    queryKey: ['advokasi', 'cases', params],
    queryFn: () => fetchAdvokasiCases(params),
  });
};

export const useGetAdvokasiDetail = (id: string) => {
  return useQuery({
    queryKey: ['advokasi', 'detail', id],
    queryFn: () => fetchAdvokasiDetail(id),
    enabled: !!id,
  });
};

export const useUpdateAdvokasi = (pekerjaId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: any | FormData) => updateAdvokasi({ id: pekerjaId, payload }),
    onSuccess: () => {
      // Invalidate relevant queries to refetch fresh data intuitively
      queryClient.invalidateQueries({ queryKey: ['advokasi'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
