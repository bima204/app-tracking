import { google } from "googleapis";

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;
export const SHEET_NAME = "November 2026";

export function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
    throw new Error("Environment variables Google Sheets belum lengkap.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// Konversi tanggal 1-30 ke huruf kolom (Tanggal 1 = E, Tanggal 30 = AH)
export function dayToColumnLetter(day: number): string {
  if (day < 1 || day > 30) {
    throw new Error("Tanggal harus antara 1 sampai 30.");
  }

  let colNum = 4 + day; // E adalah kolom ke-5
  let letter = "";
  while (colNum > 0) {
    const mod = (colNum - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    colNum = Math.floor((colNum - mod) / 26);
  }
  return letter;
}
