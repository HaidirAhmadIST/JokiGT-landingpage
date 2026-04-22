import * as z from "zod";

export const simpanKasusSchema = z.object({
  pekerja_id: z.string().min(1, "Data pekerja wajib dipilih"),
  pekerja_name: z.string().optional(),
  perusahaan: z.string().optional(),
  jenis_kasus: z.string().min(1, "Jenis kasus wajib dipilih"),
  tahap: z.string().min(1, "Tahap wajib diisi"),
  status_detail: z.string().min(1, "Status detail wajib diisi"),
  tanggal_pelaporan: z.string().min(1, "Tanggal pelaporan wajib diisi"),
  catatan: z.string().optional(),
});

export type SimpanKasusFormData = z.infer<typeof simpanKasusSchema>;
