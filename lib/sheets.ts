import { google } from "googleapis"
import { Transaction, Debt } from "@prisma/client"
import { format } from "date-fns"

// Helper to handle both object parsing and string parsing for the service account key
const getCredentials = () => {
  const envKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!envKey) return null

  try {
    return JSON.parse(envKey)
  } catch (error) {
    // If it's not a JSON string, it might be base64 encoded or just invalid
    console.error("GOOGLE_SERVICE_ACCOUNT_KEY is not a valid JSON string.")
    return null
  }
}

const getAuth = () => {
  const credentials = getCredentials()
  if (!credentials) return null

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
}

const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

// Format dates nicely for sheets
const formatDate = (date: Date) => format(date, "yyyy-MM-dd HH:mm:ss")
const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`

async function ensureSheetsExist(sheets: any) {
  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const existingTitles = spreadsheet.data.sheets?.map((s: any) => s.properties.title) || []

    const requests = []

    if (!existingTitles.includes("Transaksi")) {
      requests.push({
        addSheet: { properties: { title: "Transaksi" } }
      })
    }
    
    if (!existingTitles.includes("Hutang")) {
      requests.push({
        addSheet: { properties: { title: "Hutang" } }
      })
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      })

      // Add Headers
      if (!existingTitles.includes("Transaksi")) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "Transaksi!A1:G1",
          valueInputOption: "RAW",
          requestBody: {
            values: [["ID", "Tanggal", "Tipe", "Kategori", "Catatan", "Nominal", "User ID"]]
          }
        })
      }
      
      if (!existingTitles.includes("Hutang")) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "Hutang!A1:H1",
          valueInputOption: "RAW",
          requestBody: {
            values: [["ID", "Nama", "Tipe", "Nominal", "Jatuh Tempo", "Lunas", "Catatan", "User ID"]]
          }
        })
      }
    }
  } catch (error) {
    console.error("Error ensuring sheets exist:", error)
  }
}

export async function appendTransaction(tx: Transaction) {
  const auth = getAuth()
  if (!auth || !spreadsheetId) return

  try {
    const sheets = google.sheets({ version: "v4", auth })
    await ensureSheetsExist(sheets)

    const values = [
      [
        tx.id,
        formatDate(tx.date),
        tx.type === "income" ? "Pemasukan" : "Pengeluaran",
        tx.category,
        tx.note || "",
        formatCurrency(tx.amount),
        tx.userId
      ]
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Transaksi!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    })
  } catch (error) {
    console.error("Error appending transaction to sheet:", error)
  }
}

export async function deleteTransactionRow(id: string) {
  const auth = getAuth()
  if (!auth || !spreadsheetId) return

  try {
    const sheets = google.sheets({ version: "v4", auth })
    
    // Find row with this ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Transaksi!A:A", // Assumes ID is in column A
    })
    
    const rows = response.data.values
    if (!rows) return
    
    const rowIndex = rows.findIndex((row) => row[0] === id)
    if (rowIndex === -1) return // Not found
    
    // Convert sheet name to sheet ID
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const sheetId = spreadsheet.data.sheets?.find(s => s.properties?.title === "Transaksi")?.properties?.sheetId
    
    if (sheetId === undefined) return
    
    // Delete the row (rowIndex is 0-based index of values, which maps perfectly to 0-based bounds)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }
        ]
      }
    })
  } catch (error) {
    console.error("Error deleting transaction from sheet:", error)
  }
}

export async function appendDebt(debt: Debt) {
  const auth = getAuth()
  if (!auth || !spreadsheetId) return

  try {
    const sheets = google.sheets({ version: "v4", auth })
    await ensureSheetsExist(sheets)

    const values = [
      [
        debt.id,
        debt.name,
        debt.type === "owe" ? "Hutang" : "Piutang",
        formatCurrency(debt.amount),
        debt.dueDate ? formatDate(debt.dueDate) : "-",
        debt.isPaid ? "Ya" : "Belum",
        debt.note || "",
        debt.userId
      ]
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Hutang!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    })
  } catch (error) {
    console.error("Error appending debt to sheet:", error)
  }
}

export async function updateDebtRow(debt: Debt) {
  const auth = getAuth()
  if (!auth || !spreadsheetId) return

  try {
    const sheets = google.sheets({ version: "v4", auth })
    
    // Find row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Hutang!A:A",
    })
    
    const rows = response.data.values
    if (!rows) return
    
    const rowIndex = rows.findIndex((row) => row[0] === debt.id)
    if (rowIndex === -1) return
    
    // Update the row values
    const values = [
      [
        debt.id,
        debt.name,
        debt.type === "owe" ? "Hutang" : "Piutang",
        formatCurrency(debt.amount),
        debt.dueDate ? formatDate(debt.dueDate) : "-",
        debt.isPaid ? "Ya" : "Belum",
        debt.note || "",
        debt.userId
      ]
    ]

    // Row index from array is 0-based. But range string is 1-based.
    const rowNum = rowIndex + 1
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Hutang!A${rowNum}:H${rowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    })
  } catch (error) {
    console.error("Error updating debt in sheet:", error)
  }
}

export async function deleteDebtRow(id: string) {
  const auth = getAuth()
  if (!auth || !spreadsheetId) return

  try {
    const sheets = google.sheets({ version: "v4", auth })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Hutang!A:A",
    })
    
    const rows = response.data.values
    if (!rows) return
    
    const rowIndex = rows.findIndex((row) => row[0] === id)
    if (rowIndex === -1) return
    
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const sheetId = spreadsheet.data.sheets?.find(s => s.properties?.title === "Hutang")?.properties?.sheetId
    
    if (sheetId === undefined) return
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }
        ]
      }
    })
  } catch (error) {
    console.error("Error deleting debt from sheet:", error)
  }
}

export async function syncAllTransactions(transactions: Transaction[]) {
    // This is a batch process to recreate the transactions sheet completely
    const auth = getAuth()
    if (!auth || !spreadsheetId) return false
    
    try {
        const sheets = google.sheets({ version: "v4", auth })
        await ensureSheetsExist(sheets)
        
        // Clear existing data (except header)
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: "Transaksi!A2:G",
        })
        
        if (transactions.length === 0) return true
        
        // Build values array
        const values = transactions.map(tx => [
            tx.id,
            formatDate(tx.date),
            tx.type === "income" ? "Pemasukan" : "Pengeluaran",
            tx.category,
            tx.note || "",
            formatCurrency(tx.amount),
            tx.userId
        ])
        
        // Write all at once
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: "Transaksi!A2:G",
            valueInputOption: "USER_ENTERED",
            requestBody: { values },
        })
        
        return true
    } catch (error) {
        console.error("Failed to sync all transactions:", error)
        return false
    }
}

export async function syncAllDebts(debts: Debt[]) {
    const auth = getAuth()
    if (!auth || !spreadsheetId) return false
    
    try {
        const sheets = google.sheets({ version: "v4", auth })
        await ensureSheetsExist(sheets)
        
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: "Hutang!A2:H",
        })
        
        if (debts.length === 0) return true
        
        const values = debts.map(debt => [
            debt.id,
            debt.name,
            debt.type === "owe" ? "Hutang" : "Piutang",
            formatCurrency(debt.amount),
            debt.dueDate ? formatDate(debt.dueDate) : "-",
            debt.isPaid ? "Ya" : "Belum",
            debt.note || "",
            debt.userId
        ])
        
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: "Hutang!A2:H",
            valueInputOption: "USER_ENTERED",
            requestBody: { values },
        })
        
        return true
    } catch (error) {
        console.error("Failed to sync all debts:", error)
        return false
    }
}
