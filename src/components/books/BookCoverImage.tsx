"use client";

import { useState } from "react";
import Image from "next/image";
import { BookOpen } from "lucide-react";

interface BookCoverImageProps {
  bookId: string;
  title: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Komponen gambar sampul buku terisolasi:
 * Mengambil file gambar dari route `/api/buku/[id]/cover` dengan browser-side caching.
 * Menangani graceful fallback jika sampul belum diunggah atau 404 tanpa merusak layout.
 */
export function BookCoverImage({
  bookId,
  title,
  fill,
  width,
  height,
  sizes,
  priority,
  className,
  compact = false,
}: BookCoverImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    if (compact) {
      return (
        <div className="w-full h-full flex items-center justify-center text-stone-400">
          <BookOpen className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4 text-center">
        <BookOpen className="w-10 h-10 mb-2 opacity-40" />
        <span className="text-xs">Sampul Belum Tersedia</span>
      </div>
    );
  }

  return (
    <Image
      src={`/api/buku/${bookId}/cover`}
      alt={title}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}
