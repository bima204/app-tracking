"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Check,
  RefreshCw,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  LogOut,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";

interface Activity {
  rowNumber: number;
  time: string;
  name: string;
  category: string;
  days: Record<number, boolean>;
}

interface MonthlySummary {
  totalTarget: number;
  totalDone: number;
  consistencyPct: number;
  dailyAvgPct: number;
}

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function MobileTrackerPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [syncingRow, setSyncingRow] = useState<number | null>(null);
  const [pin, setPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [needsPin, setNeedsPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("Semua");

  // State Modal Tambah Kegiatan
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Tugas Harian");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    // Default hari ini jika di November 2026
    if (now.getFullYear() === 2026 && now.getMonth() === 10) {
      setSelectedDay(now.getDate());
    }
  }, []);

  // Otomatis scroll pemilih tanggal ke tanggal yang terpilih
  useEffect(() => {
    if (dateListRef.current) {
      const selectedBtn = dateListRef.current.querySelector(
        `[data-day="${selectedDay}"]`
      ) as HTMLElement | null;
      if (selectedBtn) {
        selectedBtn.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [selectedDay]);

  const fetchData = useCallback(async (currentPin?: string) => {
    setLoading(true);
    setError(null);
    try {
      const savedPin = currentPin ?? localStorage.getItem("tracker_pin") ?? "";
      const res = await fetch("/api/tracker", {
        headers: savedPin ? { "x-app-pin": savedPin } : {},
      });

      if (res.status === 401) {
        setNeedsPin(true);
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Gagal memuat data dari Google Sheets");

      const data = await res.json();
      setActivities(data.activities || []);
      setSummary(data.monthlySummary || null);
      setNeedsPin(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (activity: Activity) => {
    const newStatus = !activity.days[selectedDay];
    const savedPin = localStorage.getItem("tracker_pin") ?? "";

    // Optimistic UI update
    setActivities((prev) =>
      prev.map((a) =>
        a.rowNumber === activity.rowNumber
          ? { ...a, days: { ...a.days, [selectedDay]: newStatus } }
          : a
      )
    );
    setSyncingRow(activity.rowNumber);

    try {
      const res = await fetch("/api/tracker", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(savedPin ? { "x-app-pin": savedPin } : {}),
        },
        body: JSON.stringify({
          rowNumber: activity.rowNumber,
          day: selectedDay,
          completed: newStatus,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");
    } catch {
      // Rollback jika request gagal
      setActivities((prev) =>
        prev.map((a) =>
          a.rowNumber === activity.rowNumber
            ? { ...a, days: { ...a.days, [selectedDay]: !newStatus } }
            : a
        )
      );
      setError("Gagal menyimpan perubahan ke Google Sheets.");
    } finally {
      setSyncingRow(null);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    setError(null);
    const savedPin = localStorage.getItem("tracker_pin") ?? "";

    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedPin ? { "x-app-pin": savedPin } : {}),
        },
        body: JSON.stringify({
          time: newTime.trim(),
          name: newName.trim(),
          category: newCategory.trim() || "Magang",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menambah kegiatan");
      }

      const data = await res.json();
      setActivities((prev) => [...prev, data.newActivity]);

      // Reset form
      setNewName("");
      setNewTime("");
      setIsAddModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan kegiatan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    localStorage.setItem("tracker_pin", pin);
    fetchData(pin);
  };

  const handleLogout = () => {
    localStorage.removeItem("tracker_pin");
    setActivities([]);
    setSummary(null);
    setNeedsPin(true);
  };

  // Kategori unik untuk filter
  const categories = [
    "Semua",
    ...Array.from(new Set(activities.map((a) => a.category).filter(Boolean))),
  ];

  const filteredActivities =
    filterCategory === "Semua"
      ? activities
      : activities.filter((a) => a.category === filterCategory);

  const completedToday = activities.filter((a) => a.days[selectedDay]).length;
  const totalActivities = activities.length || 1;
  const dailyPct = Math.round((completedToday / totalActivities) * 100);

  // Layar Login PIN Mobile-First
  if (needsPin) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-teal-900 via-teal-950 to-slate-950 text-white">
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Akses Pelacak Magang
            </h1>
            <p className="text-xs text-teal-200/80">
              Masukkan PIN aplikasi Anda untuk membuka jadwal dan menyinkronkan dengan Google Sheet.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ketik PIN..."
                autoFocus
                className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white/15 transition text-center text-lg tracking-widest font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-teal-200/70 hover:text-white transition"
                aria-label="Lihat PIN"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-teal-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <span>Buka Jadwal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-center text-teal-300/50">
            Terhubung langsung ke Google Sheets API
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-teal-200">
      {/* Container utama gaya Smartphone Mobile View */}
      <main className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col pb-24">
        
        {/* Sticky Mobile App Bar & Header */}
        <header className="sticky top-0 z-30 bg-teal-800 text-white shadow-md pt-safe">
          {/* Top Bar */}
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-700/80 border border-teal-600 flex items-center justify-center text-teal-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-teal-200 block">
                  Program Magang LPK
                </span>
                <h1 className="text-base font-bold leading-tight">
                  November 2026
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchData()}
                disabled={loading}
                className="p-2 rounded-xl bg-teal-700/60 hover:bg-teal-700 text-teal-100 active:scale-90 transition"
                aria-label="Muat ulang data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-teal-700/60 hover:bg-red-600/80 text-teal-100 hover:text-white active:scale-90 transition"
                title="Ganti / Kunci PIN"
                aria-label="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Kartu Hero Progres Hari Ini */}
          <div className="px-5 pb-4">
            <div className="bg-gradient-to-br from-teal-900/90 to-teal-950/90 p-4 rounded-2xl border border-teal-700/50 shadow-inner">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-1.5 text-teal-300 text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Target Tanggal {selectedDay} Nov</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-extrabold text-white">
                      {completedToday}
                    </span>
                    <span className="text-xs text-teal-200/70 font-medium">
                      / {activities.length} tugas selesai
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">
                    {dailyPct}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Animasi */}
              <div className="w-full bg-teal-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-teal-800">
                <div
                  className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${dailyPct}%` }}
                />
              </div>

              {/* Ringkasan Bulanan */}
              {summary && (
                <div className="mt-3 pt-2.5 border-t border-teal-800/80 flex items-center justify-between text-[11px] text-teal-200/80">
                  <span>Akumulasi Bulan:</span>
                  <span className="font-semibold text-teal-100">
                    {summary.totalDone}/{summary.totalTarget} ({Math.round(summary.consistencyPct * 100)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Date Picker Horizontal Carousel */}
          <div className="bg-teal-850 px-4 py-2.5 border-t border-teal-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-teal-200">
                <Calendar className="w-3 h-3 text-teal-300" />
                <span>PILIH TANGGAL (1 - 30)</span>
              </div>
              <span className="text-[10px] text-teal-300/80 font-medium">
                Tgl Terpilih: {selectedDay} Nov
              </span>
            </div>

            <div
              ref={dateListRef}
              className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth snap-x"
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                const dayName = DAY_NAMES[(day - 1) % 7];
                const isSelected = day === selectedDay;
                const isSunday = (day - 1) % 7 === 0;

                return (
                  <button
                    key={day}
                    data-day={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-shrink-0 w-11 h-14 rounded-2xl flex flex-col items-center justify-center transition-all snap-center select-none active:scale-95 ${
                      isSelected
                        ? "bg-white text-teal-900 font-bold shadow-md ring-2 ring-emerald-400 scale-105"
                        : "bg-teal-800/60 hover:bg-teal-700/60 text-white border border-teal-700/60"
                    }`}
                  >
                    <span
                      className={`text-[9px] uppercase font-semibold ${
                        isSelected
                          ? "text-teal-700"
                          : isSunday
                          ? "text-rose-300"
                          : "text-teal-300/80"
                      }`}
                    >
                      {dayName}
                    </span>
                    <span className="text-base font-extrabold leading-none mt-1">
                      {day}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Notifikasi Error */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center justify-between shadow-sm">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-rose-500 font-bold ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter Pills Kategori */}
        {categories.length > 2 && (
          <section className="px-4 pt-3 pb-1">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => {
                const isActive = filterCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`text-[11px] px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition active:scale-95 ${
                      isActive
                        ? "bg-teal-700 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* List Aktivitas (Mobile Cards) */}
        <section className="px-4 py-3 space-y-2.5 flex-1">
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold mb-1">
            <span>JADWAL KEGIATAN ({activities.length})</span>
            <span>
              {completedToday}/{activities.length} Selesai
            </span>
          </div>

          {loading && activities.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">
                Menyinkronkan data dari Google Sheets...
              </p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Belum ada kegiatan. Tekan tombol <span className="font-bold text-teal-700">+</span> di bawah untuk menambahkan.
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const isDone = !!activity.days[selectedDay];
              const isSyncing = syncingRow === activity.rowNumber;

              return (
                <div
                  key={activity.rowNumber}
                  onClick={() => handleToggle(activity)}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 select-none active:scale-[0.98] cursor-pointer ${
                    isDone
                      ? "bg-teal-50/70 border-teal-200 shadow-xs"
                      : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
                  }`}
                >
                  {/* Tombol Checkbox Touch Target Besar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
                      isDone
                        ? "bg-teal-600 text-white shadow-sm scale-105"
                        : "border-2 border-slate-300 bg-slate-50 text-transparent"
                    }`}
                  >
                    <Check
                      className={`w-4 h-4 stroke-[3] transition-opacity ${
                        isDone ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>

                  {/* Info Jadwal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {activity.time && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </span>
                      )}
                      {activity.category && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium truncate max-w-[130px]">
                          <Layers className="w-2.5 h-2.5 text-slate-400" />
                          {activity.category}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-sm font-semibold leading-snug line-clamp-2 transition-colors ${
                        isDone
                          ? "line-through text-slate-400"
                          : "text-slate-800"
                      }`}
                    >
                      {activity.name}
                    </p>
                  </div>

                  {/* Indikator Animasi Sync */}
                  {isSyncing ? (
                    <div className="flex-shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping inline-block" />
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </section>

        {/* Floating Action Button (FAB) Tambah Kegiatan */}
        <div className="fixed bottom-6 max-w-md w-full px-5 pointer-events-none flex justify-end z-20">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="pointer-events-auto h-14 px-5 rounded-full bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold shadow-xl shadow-teal-900/30 flex items-center gap-2 active:scale-95 transition"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span className="text-sm">Tambah Jadwal</span>
          </button>
        </div>

        {/* Modal Bottom Sheet: Tambah Kegiatan Baru */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
            <div
              className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>Tambah Kegiatan Magang</span>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddActivity} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kegiatan / Tugas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Morning Briefing, Standup Magang..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Waktu / Jam
                    </label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      placeholder="08:00 - 09:00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm bg-white"
                    >
                      <option value="Tugas Harian">Tugas Harian</option>
                      <option value="Briefing">Briefing</option>
                      <option value="Praktik LPK">Praktik LPK</option>
                      <option value="Evaluasi">Evaluasi</option>
                      <option value="Laporan">Laporan</option>
                      <option value="Magang">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan ke Sheets</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
