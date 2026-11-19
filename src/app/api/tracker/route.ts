import { NextRequest, NextResponse } from "next/server";
import { dayToColumnLetter, getSheetsClient, getUserByPin, SPREADSHEET_ID, UserConfig } from "@/lib/sheets";

function getAuthenticatedUser(req: NextRequest): UserConfig | null {
  const pin = req.headers.get("x-app-pin")?.trim();
  if (!pin) return null;
  return getUserByPin(pin);
}

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "PIN salah atau belum diisi. Masukkan PIN yang benar." }, { status: 401 });
  }

  const sheetName = user.sheetName;

  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [
        `'${sheetName}'!B9:AH50`, // Mendukung hingga baris 50 (dinamis)
        `'${sheetName}'!B6:E6`,    // Ringkasan bulanan
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
      user: {
        name: user.name,
        theme: user.theme,
        subtitle: user.subtitle,
      },
      activities,
      monthlySummary: {
        totalTarget: Number(summaryRow[0] || (activities.length * 30)),
        totalDone: Number(summaryRow[1] || 0),
        consistencyPct: Number(summaryRow[2] || 0),
        dailyAvgPct: Number(summaryRow[3] || 0),
      },
    });
  } catch (error) {
    console.error("Tracker API GET Error:", error);
    const msg = error instanceof Error ? error.message : "Gagal mengambil data dari Google Sheets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "PIN salah atau belum diisi" }, { status: 401 });
  }

  const sheetName = user.sheetName;

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
    const range = `'${sheetName}'!${colLetter}${rowNumber}`;

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

// POST: Menambahkan kegiatan baru ke baris kosong berikutnya di Sheet pengguna
export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "PIN salah atau belum diisi" }, { status: 401 });
  }

  const sheetName = user.sheetName;

  try {
    const { name, time, category } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nama kegiatan wajib diisi" }, { status: 400 });
    }

    const sheets = getSheetsClient();

    // 1. Cek baris 9 sampai 50 untuk mencari baris kosong pertama
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!B9:C50`,
    });

    const rows = res.data.values || [];
    let targetRow = 9;

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
    const range = `'${sheetName}'!B${targetRow}:D${targetRow}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[time?.trim() || "", name.trim(), category?.trim() || "Kegiatan"]],
      },
    });

    return NextResponse.json({
      success: true,
      newActivity: {
        rowNumber: targetRow,
        time: time?.trim() || "",
        name: name.trim(),
        category: category?.trim() || "Kegiatan",
        days: {},
      },
    });
  } catch (error) {
    console.error("Gagal menambah kegiatan:", error);
    return NextResponse.json({ error: "Gagal menambahkan kegiatan ke Google Sheets" }, { status: 500 });
  }
}
