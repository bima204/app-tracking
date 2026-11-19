import { google } from "googleapis";

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;
export const SHEET_NAME = "November 2026";

export function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    // Normalisasi format newline: menangani \\n ganda maupun \n literal dari env Vercel
    privateKey = privateKey.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");
    // Hapus tanda kutip luar jika pengguna memasukkannya langsung di Vercel UI
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
  }

  if (!clientEmail || !privateKey || !SPREADSHEET_ID) {
    const missing: string[] = [];
    if (!clientEmail) missing.push("GOOGLE_CLIENT_EMAIL");
    if (!privateKey) missing.push("GOOGLE_PRIVATE_KEY");
    if (!SPREADSHEET_ID) missing.push("SPREADSHEET_ID");
    throw new Error(`Environment variables belum lengkap di Vercel: ${missing.join(", ")}`);
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
