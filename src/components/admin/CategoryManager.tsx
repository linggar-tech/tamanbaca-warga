"use client";

import { useActionState, useState } from "react";
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  CategoryActionResult,
} from "@/actions/categories";

interface CategoryItem {
  id: string;
  name: string;
  _count: {
    books: number;
  };
}

export function CategoryManager({ categories }: { categories: CategoryItem[] }) {
  const [createState, createAction, isCreating] = useActionState<CategoryActionResult | null, FormData>(
    createCategoryAction,
    null
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleEditClick = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const formData = new FormData();
    formData.append("name", editName);

    const result = await updateCategoryAction(editingId, null, formData);
    if (result.success) {
      setEditingId(null);
      setDeleteSuccess(result.message || "Kategori berhasil diperbarui.");
      setDeleteError(null);
    } else {
      setDeleteError(result.message || "Gagal memperbarui kategori.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus kategori "${name}"?`)) return;

    setIsDeleting(id);
    setDeleteError(null);
    setDeleteSuccess(null);

    const result = await deleteCategoryAction(id);
    setIsDeleting(null);

    if (result.success) {
      setDeleteSuccess(result.message || "Kategori berhasil dihapus.");
    } else {
      setDeleteError(result.message || "Gagal menghapus kategori.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi */}
      {createState && !createState.success && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{createState.message}</span>
        </div>
      )}

      {createState && createState.success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{createState.message}</span>
        </div>
      )}

      {deleteError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {deleteSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {/* Form Tambah Kategori */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-stone-800 mb-3">Tambah Kategori Baru</h3>
        <form action={createAction} className="flex gap-3">
          <input
            type="text"
            name="name"
            required
            placeholder="Contoh: Novel Remaja, Sejarah Nusantara..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? "Menyimpan..." : "Tambah Kategori"}</span>
          </button>
        </form>
      </div>

      {/* Tabel Kategori */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-800">
            Daftar Kategori ({categories.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Nama Kategori</th>
                <th className="py-3 px-4 text-center">Jumlah Buku</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3 px-4">
                    {editingId === cat.id ? (
                      <form onSubmit={handleUpdate} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                          className="px-2.5 py-1 border border-emerald-500 rounded-lg text-xs focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-800"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-stone-200 text-stone-700 rounded-lg text-[11px]"
                        >
                          Batal
                        </button>
                      </form>
                    ) : (
                      <span className="font-semibold text-stone-800">{cat.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
                      {cat._count.books} buku
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditClick(cat)}
                        className="p-1.5 text-stone-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Edit Kategori"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={isDeleting === cat.id}
                        className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
