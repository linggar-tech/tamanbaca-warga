"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { deleteBookAction } from "@/actions/books";
import { BookCoverImage } from "@/components/books/BookCoverImage";

interface BookItem {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string | null;
  stock: number;
  category: {
    name: string;
  };
}

export function BookTable({ books }: { books: BookItem[] }) {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus buku "${title}" dari database perpustakaan?`)) return;

    setIsDeleting(id);
    setDeleteError(null);
    setDeleteSuccess(null);

    const result = await deleteBookAction(id);
    setIsDeleting(null);

    if (result.success) {
      setDeleteSuccess(result.message || "Buku berhasil dihapus.");
    } else {
      setDeleteError(result.message || "Gagal menghapus buku.");
    }
  };

  return (
    <div className="space-y-4">
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

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Sampul</th>
                <th className="py-3 px-4">Judul & Pengarang</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Tahun</th>
                <th className="py-3 px-4">ISBN</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {books.length > 0 ? (
                books.map((book) => (
                  <tr key={book.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <div className="relative w-10 h-14 rounded-md overflow-hidden bg-stone-100 mx-auto border border-stone-200">
                        <BookCoverImage
                          bookId={book.id}
                          title={book.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                          compact
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-800 line-clamp-1">{book.title}</div>
                      <div className="text-stone-500 text-[11px] mt-0.5">
                        {book.author} • {book.publisher}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium text-[11px]">
                        {book.category.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{book.year}</td>
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {book.isbn || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                          book.stock > 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {book.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/buku/${book.id}/edit`}
                          className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Buku"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(book.id, book.title)}
                          disabled={isDeleting === book.id}
                          className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                          title="Hapus Buku"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400 text-xs">
                    Belum ada data koleksi buku yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
