import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface LoanExportData {
  id: string;
  bookTitle: string;
  userName: string;
  userEmail: string;
  requestDate: string;
  loanDate: string;
  dueDate: string;
  returnDate: string;
  status: string;
  fine: number;
}

export interface PdfReportOptions {
  periodText: string;
  adminName: string;
  totalLoans: number;
  totalReturned: number;
  totalFine: number;
}

/**
 * Menghasilkan file PDF rekap peminjaman dengan format dokumen resmi perpustakaan.
 */
export function generateLoansPdf(
  data: LoanExportData[],
  options: PdfReportOptions
): Buffer {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Header Dokumen
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(21, 128, 61); // Emerald-700
  doc.text("TAMANBACA WARGA", 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(41, 37, 36);
  doc.text("Rekap Laporan Sirkulasi Peminjaman Buku", 14, 22);

  doc.setFontSize(8);
  doc.setTextColor(115, 115, 115);
  doc.text(`Periode: ${options.periodText}`, 14, 28);
  doc.text(
    `Dicetak oleh: ${options.adminName} pada ${new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    14,
    33
  );

  // Tabel Rekap Peminjaman
  const tableData = data.map((item, index) => [
    index + 1,
    item.bookTitle,
    `${item.userName}\n(${item.userEmail})`,
    item.requestDate,
    item.loanDate || "-",
    item.dueDate || "-",
    item.returnDate || "-",
    item.status,
    item.fine > 0 ? `Rp${item.fine.toLocaleString("id-ID")}` : "Rp0",
  ]);

  autoTable(doc, {
    startY: 38,
    head: [
      [
        "No",
        "Judul Buku",
        "Peminjam",
        "Tgl Pengajuan",
        "Tgl Pinjam",
        "Jatuh Tempo",
        "Tgl Kembali",
        "Status",
        "Denda",
      ],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [21, 128, 61], // Emerald
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [41, 37, 36],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 248],
    },
    margin: { left: 14, right: 14 },
  });

  // Ringkasan Statistik Laporan di bagian bawah
  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Ringkasan Periode: Total Transaksi: ${options.totalLoans} | Dikembalikan: ${
      options.totalReturned
    } | Total Denda: Rp${options.totalFine.toLocaleString("id-ID")}`,
    14,
    finalY + 10
  );

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
