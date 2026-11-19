import { NextRequest, NextResponse } from "next/server";
import { dayToColumnLetter, getSheetsClient, SHEET_NAME, SPREADSHEET_ID } from "@/lib/sheets";

function isAuthorized(req: NextRequest) {
  const requiredPin = process.env.APP_PIN;
  if (!requiredPin) return true; // Jika APP_PIN tidak diset, akses terbuka
  const providedPin = req.headers.get("x-app-pin");
  return providedPin === requiredPin;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "PIN salah atau belum diisi" }, { status: 401 });
  }

  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [
        `'${SHEET_NAME}'!B9:AH50`, // Mendukung hingga baris 50 (dinamis)
        `'${SHEET_NAME}'!B6:E6`,    // Ringkasan bulanan
      ],
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const rows = res.data.valueRanges?.[0]?.values || [];
    const summaryRow = res.data.valueRanges?.[1]?.values?.[0] || [];

    const activities = rows
      .map((row, index) => {
        const time = String(row[0] || "").trim();
        const name = String(row[1] || "").trim();
        const category = String(row[2] || "").trim();

        // Lewati baris yang kosong nama & waktunya
        if (!name && !time) return null;

        const days: Record<number, boolean> = {};
        for (let d = 1; d <= 30; d++) {
          const val = row[2 + d];
          days[d] = val === true || val === "TRUE";
        }

        return {
          rowNumber: 9 + index,
          time,
          name,
          category,
          days,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      activities,
      monthlySummary: {
        totalTarget: Number(summaryRow[0] || (activities.length * 30)),
        totalDone: Number(summaryRow[1] || 0),
        consistencyPct: Number(summaryRow[2] || 0),
        dailyAvgPct: Number(summaryRow[3] || 0),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengambil data dari Google Sheets" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "PIN salah atau belum diisi" }, { status: 401 });
  }

  try {
    const { rowNumber, day, completed } = await req.json();

    if (
      typeof rowNumber !== "number" ||
      rowNumber < 9 ||
      typeof day !== "number" ||
      day < 1 ||
      day > 30 ||
      typeof completed !== "boolean"
    ) {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const colLetter = dayToColumnLetter(day);
    const range = `'${SHEET_NAME}'!${colLetter}${rowNumber}`;

    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[completed]],
      },
    });

    return NextResponse.json({ success: true, range, completed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui Google Sheets" }, { status: 500 });
  }
}

// POST: Menambahkan kegiatan baru ke baris kosong berikutnya di Sheet
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "PIN salah atau belum diisi" }, { status: 401 });
  }

  try {
    const { name, time, category } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nama kegiatan wajib diisi" }, { status: 400 });
    }

    const sheets = getSheetsClient();

    // 1. Cek baris 9 sampai 50 untuk mencari baris kosong pertama
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!B9:C50`,
    });

    const rows = res.data.values || [];
    let targetRow = 9;

    // Cari indeks baris pertama yang nama (kolom C) kosong
    let foundEmpty = false;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || (!row[0] && !row[1])) {
        targetRow = 9 + i;
        foundEmpty = true;
        break;
      }
    }

    if (!foundEmpty) {
      targetRow = 9 + rows.length;
    }

    // 2. Tulis baris baru: Kolom B (Waktu), Kolom C (Nama), Kolom D (Kategori)
    const range = `'${SHEET_NAME}'!B${targetRow}:D${targetRow}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[time?.trim() || "", name.trim(), category?.trim() || "Magang"]],
      },
    });

    return NextResponse.json({
      success: true,
      newActivity: {
        rowNumber: targetRow,
        time: time?.trim() || "",
        name: name.trim(),
        category: category?.trim() || "Magang",
        days: {},
      },
    });
  } catch (error) {
    console.error("Gagal menambah kegiatan:", error);
    return NextResponse.json({ error: "Gagal menambahkan kegiatan ke Google Sheets" }, { status: 500 });
  }
}
