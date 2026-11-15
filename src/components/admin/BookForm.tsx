"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, BookOpen, AlertCircle, CheckCircle2, Save } from "lucide-react";
import { createBookAction, updateBookAction, BookActionResult } from "@/actions/books";

interface CategoryOption {
  id: string;
  name: string;
}

interface BookInitialData {
  id?: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn?: string | null;
  stock: number;
  categoryId: string;
  description?: string | null;
  coverUrl?: string | null;
}

interface BookFormProps {
  categories: CategoryOption[];
  initialData?: BookInitialData;
  isEdit?: boolean;
}

export function BookForm({ categories, initialData, isEdit = false }: BookFormProps) {
  const router = useRouter();

  // Action dispatcher
  const boundAction = isEdit && initialData?.id
    ? updateBookAction.bind(null, initialData.id)
    : createBookAction;

  const [state, formAction, isPending] = useActionState<BookActionResult | null, FormData>(
    boundAction,
    null
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.coverUrl || null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (!file) return;

    // Validasi ukuran client-side: 1 MB
    if (file.size > 1 * 1024 * 1024) {
      setFileError("Ukuran file melebihi 1 MB. Silakan pilih file gambar yang lebih kecil.");
      e.target.value = "";
      return;
    }

    // Validasi tipe format client-side
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFileError("Hanya format JPG, PNG, atau WEBP yang diperbolehkan.");
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8">
      {/* Alert Notifikasi */}
      {state && !state.success && state.message && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {state && state.success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{state.message}</span>
          </div>
          <Link
            href="/admin/buku"
            className="font-bold underline hover:text-emerald-900 ml-4"
          >
            Kembali ke Daftar Buku →
          </Link>
        </div>
      )}

      {fileError && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kolom Upload Sampul */}
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Sampul Buku (Maks. 1 MB)
            </label>

            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-300 hover:border-emerald-500 transition-colors flex flex-col items-center justify-center p-4 text-center group">
              {previewUrl ? (
                <>
                  <Image
                    src={previewUrl}
                    alt="Preview Sampul"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs">
                    <Upload className="w-6 h-6 mb-1" />
                    <span>Klik untuk Mengganti</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-400">
                  <BookOpen className="w-10 h-10 mb-2 opacity-40" />
                  <span className="text-xs font-semibold text-stone-600">Pilih File Sampul</span>
                  <span className="text-[11px] text-stone-400 mt-1">JPG, PNG, atau WEBP</span>
                </div>
              )}
              <input
                type="file"
                name="coverFile"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            <p className="mt-2 text-[11px] text-stone-400 leading-snug">
              Keamanan Poin 9: File divalidasi MIME & Magic Bytes di server dan nama diacak secara acak UUID.
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Atau URL Sampul Eksternal (Opsional)
              </label>
              <input
                type="url"
                name="coverUrl"
                defaultValue={initialData?.coverUrl || ""}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Kolom Isian Data Buku */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Judul Buku *
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={initialData?.title || ""}
                placeholder="Contoh: Prinsip Pertahanan Siber Modern"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {state?.errors?.title && (
                <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.title[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Pengarang / Penulis *
                </label>
                <input
                  type="text"
                  name="author"
                  required
                  defaultValue={initialData?.author || ""}
                  placeholder="Contoh: Andrea Hirata"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                {state?.errors?.author && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.author[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Penerbit *
                </label>
                <input
                  type="text"
                  name="publisher"
                  required
                  defaultValue={initialData?.publisher || ""}
                  placeholder="Contoh: Gramedia Pustaka Utama"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                {state?.errors?.publisher && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.publisher[0]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Kategori *
                </label>
                <select
                  name="categoryId"
                  required
                  defaultValue={initialData?.categoryId || ""}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {state?.errors?.categoryId && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.categoryId[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Tahun Terbit *
                </label>
                <input
                  type="number"
                  name="year"
                  required
                  min={1800}
                  max={new Date().getFullYear() + 1}
                  defaultValue={initialData?.year || new Date().getFullYear()}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                {state?.errors?.year && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.year[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Stok Buku *
                </label>
                <input
                  type="number"
                  name="stock"
                  required
                  min={0}
                  defaultValue={initialData?.stock ?? 1}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                {state?.errors?.stock && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.stock[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Nomor ISBN (Opsional)
              </label>
              <input
                type="text"
                name="isbn"
                defaultValue={initialData?.isbn || ""}
                placeholder="Contoh: 978-602-001-011"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
              {state?.errors?.isbn && (
                <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.isbn[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Sinopsis / Deskripsi Buku
              </label>
              <textarea
                name="description"
                rows={4}
                defaultValue={initialData?.description || ""}
                placeholder="Tuliskan ringkasan isi buku atau catatan untuk pembaca..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {state?.errors?.description && (
                <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.description[0]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
          <Link
            href="/admin/buku"
            className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isPending ? "Menyimpan Data..." : isEdit ? "Perbarui Buku" : "Simpan Buku"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
