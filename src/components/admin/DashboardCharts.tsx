"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

export interface MonthlyLoanStat {
  month: string;
  total: number;
}

export interface PopularBookStat {
  title: string;
  count: number;
}

interface DashboardChartsProps {
  monthlyLoans: MonthlyLoanStat[];
  popularBooks: PopularBookStat[];
}

export function DashboardCharts({ monthlyLoans, popularBooks }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Grafik Tren Peminjaman per Bulan */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-stone-800">Tren Peminjaman Bulanan</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Aktivitas sirkulasi peminjaman buku dalam 6 bulan terakhir.
          </p>
        </div>

        <div className="h-64 w-full">
          {monthlyLoans.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyLoans} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="loanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716c" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e7e5e4",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#15803d"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#loanGradient)"
                  name="Jumlah Peminjaman"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              Belum ada data peminjaman yang cukup untuk menampilkan grafik.
            </div>
          )}
        </div>
      </div>

      {/* Grafik 5 Buku Terpopuler */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-stone-800">5 Buku Paling Populer</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Koleksi buku dengan frekuensi peminjaman tertinggi oleh warga.
          </p>
        </div>

        <div className="h-64 w-full">
          {popularBooks.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={popularBooks}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={110}
                  tick={{ fontSize: 10, fill: "#44403c" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e7e5e4",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#15803d"
                  radius={[0, 8, 8, 0]}
                  name="Total Dipinjam"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              Belum ada transaksi peminjaman buku yang tercatat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
