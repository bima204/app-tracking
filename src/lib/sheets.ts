import { google } from "googleapis";

// Default credentials jika environment variables di hosting belum diset
const FALLBACK_SPREADSHEET_ID = "13u1dyVDCLZYafI5nsDyIagUug349c1y8P2ZQaLQm1ys";
const FALLBACK_CLIENT_EMAIL = "tracker-bot@magang-tracker.iam.gserviceaccount.com";
const FALLBACK_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDIz8VSs5P7/nkA
Xcv7+mPsUj6tal6Dp4DzeLArp7+Yz75MOqqlokZIQkUywWPlwVNHs/bFVzVmrX8i
HQ5lOnrXAiZSBuvqcMjcVG+FgkRDI4TrwTfumLjsdOcXXzAnJfPFQxYNb9CzVqRK
LPZOri0Srv1ALDEylluIoMswnSk3fqUwDTk+pEULnmkqsc1sAqKOzdZx2+eLw1O/
jIGPSqaNKLsgLprgcGyGJQIYPmtUw5tb7iviU03CvuYsTySjQ9WpCOTV+sLpQDzo
F7LkFjNysVSueOas10dn37+GZlKIG1CcxS4lfJprTM6UK/oLwJUj1mywYDhNekV7
CR3YVKtnAgMBAAECggEAKpuXKSyMNjgw0WiVewIOSJrMzLvYkQOuAzr02lZt+0z8
+iyqf5l2YyeYiiPpf9rswjaHoiiWXpJqesECiG0Hmm5M1jO8w9IpdEKAJSpWNI6p
SeKF7Ry/hABr9hQO4geV+SF6YOB8Pkkgc9Klcl1Xl/LELmUSDUNE6bEAW/DEyY63
NyDxvC17nz5MF9IQ6Z3GuVaXA2fJkMjxAWssS268D7d460kcgzhA28BpJN41eP5l
5o2c5Tx4IR+emQfOz833WaX4ZOQrvysPJD0IC0Z34YJwlcsaMmwI4qw2VJxrJ9fK
MIpERQ5wsuQ9C3mxjXwvAxCcc/MHvMueCZeV9jskGQKBgQD/MJ8QbEFN3pciSxQg
H/ugXvNAAHhwNs5TuHBTGhkzQgolRsz8MWY3pBkas7ubg9//gfi3gYT4qDbx8VEQ
w/+9Qsfhp5tHGNfOHWiA+sltOyHpwh6g55knb0QZRIWy5sGwAiiDJMF3Er/yUey2
narfo1uZxR9HLDisGbwhxgfF3wKBgQDJcvWO5MrkwKZ9SDM55AHrzreOY34f0/CT
jK4v5qmcx/5m9qABe+kTjTexphSyBl9aenwBQQ0fRWmcPLcvBlhjtA7OwIdUWvJW
FH75Wafh5ZfUTDW/UA8SkJlZH22CnttHcDbwG6R9NUciPYn607QbyHz35PB6Rz0c
NO4udCp7eQKBgDrU9cbufju6lnNEhdZGKVe2rDPUJ/AO4pBwlAzEloy3q+keIoH9
zYgEX/lE+HqI86pPR4ze4k4FUe2DaeIInbv/Wl+OqYDBnHcbVo1tw+RX3qCqrS8B
VdC+mR+OKZiuFHdEeByL68JM4021T3JmdQ9r9OFFjcl1y3b50+KhagdXAoGAB4l5
joMY5D4g/Ib7A6t4Nu5hB77JNT+kvKCC09/5cJg6+Hc5vVR5f/XEo6znEVITtzrl
8NYSO51JOkM7R1Mhc3mFJE8nwQw2DOpvZbzo/xar+5FuYV4JclReqGr4me5/ncih
BZLDMLwRkUJkKzJIhtGVe2DhbnHD445Haw2FmWECgYBVcl7VTcORVpXEMJ6umG+Z
e6kWcoqQdKg15XUKdlLEP+QGYEzn7a7abdLyP5hoyFO/i2ZtQIy2RhAwEYjoUpCX
OUBcEcjKNfRpj/cV0BC2Rs9PEqOOcaVWrMPjK/L/pjixoQ/4DtLwU8xsJC3hoKfz
Oswf4aWKq0xaDvk+4vsJAQ==
-----END PRIVATE KEY-----`;

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID || FALLBACK_SPREADSHEET_ID;

export interface UserConfig {
  name: string;
  pin: string;
  sheetName: string;
  theme: "teal" | "rose";
  subtitle: string;
}

export const USERS: Record<string, UserConfig> = {
  "0623": {
    name: "Abun",
    pin: "0623",
    sheetName: "November 2026",
    theme: "teal",
    subtitle: "Program Magang LPK • Rutinitas & Belajar",
  },
  "0224": {
    name: "Flowee",
    pin: "0224",
    sheetName: "Flowee",
    theme: "rose",
    subtitle: "Kegiatan KKN & Produktivitas Harian",
  },
};

export function getUserByPin(pin: string): UserConfig | null {
  return USERS[pin] || null;
}

export function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || FALLBACK_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || FALLBACK_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
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
