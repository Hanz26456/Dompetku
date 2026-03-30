import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { Transaction, formatRupiah, formatDate } from "./types"

export function generatePDFReport(
  transactions: Transaction[], 
  month: string, 
  userName: string,
  stats: { income: number; expense: number; balance: number }
) {
  const doc = new jsPDF()
  const monthName = new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  // --- Header ---
  doc.setFontSize(22)
  doc.setTextColor(16, 185, 129) // Primary color
  doc.text("Dompetku", 14, 22)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text("Laporan Keuangan Personal", 14, 28)
  
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(`Periode: ${monthName}`, 14, 40)
  doc.text(`Pembuat: ${userName}`, 14, 46)

  // --- Summary Box ---
  doc.setDrawColor(231, 224, 216)
  doc.setFillColor(250, 248, 245)
  doc.roundedRect(14, 55, 182, 30, 3, 3, "FD")

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text("Total Pemasukan", 20, 65)
  doc.text("Total Pengeluaran", 75, 65)
  doc.text("Saldo Akhir", 140, 65)

  doc.setFontSize(12)
  doc.setTextColor(16, 185, 129) // Emerald
  doc.text(formatRupiah(stats.income), 20, 75)
  doc.setTextColor(239, 68, 68) // Red
  doc.text(formatRupiah(stats.expense), 75, 75)
  doc.setTextColor(0)
  doc.text(formatRupiah(stats.balance), 140, 75)

  // --- Transaction Table ---
  doc.setFontSize(14)
  doc.text("Daftar Transaksi", 14, 100)

  const tableData = transactions.map(t => [
    formatDate(t.date),
    t.category,
    t.note || "-",
    t.type === "income" ? "+" + formatRupiah(t.amount) : "-" + formatRupiah(t.amount)
  ])

  autoTable(doc, {
    startY: 105,
    head: [["Tanggal", "Kategori", "Catatan", "Nominal"]],
    body: tableData,
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255] }, // Amber primary
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      3: { halign: "right", fontStyle: "bold" }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw as string
        if (val.startsWith('+')) data.cell.styles.textColor = [16, 185, 129]
        if (val.startsWith('-')) data.cell.styles.textColor = [239, 68, 68]
      }
    }
  })

  // --- Footer ---
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 285)
    doc.text(`Halaman ${i} dari ${pageCount}`, 180, 285)
  }

  doc.save(`Laporan_Dompetku_${month}.pdf`)
}

export function generateExcelReport(transactions: Transaction[], month: string) {
  const data = transactions.map(t => ({
    Tanggal: formatDate(t.date),
    Tipe: t.type === "income" ? "Pemasukan" : "Pengeluaran",
    Kategori: t.category,
    Catatan: t.note || "",
    Nominal: t.amount,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Transaksi")
  XLSX.utils.writeFile(wb, `Laporan_Dompetku_${month}.xlsx`)
}
