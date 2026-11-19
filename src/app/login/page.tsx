"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ChevronRight, Sparkles, Heart } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  const loginWithPin = (selectedPin: string) => {
    const cleanPin = selectedPin.trim();
    if (cleanPin === "0623") {
      router.push("/abun");
    } else if (cleanPin === "0224") {
      router.push("/flowee");
    } else {
      setError("PIN tidak terdaftar. Gunakan 0623 (Abun) atau 0224 (Flowee).");
      setLoadingUser(null);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setError(null);
    loginWithPin(pin);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white selection:bg-rose-500/30">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-teal-500/30 to-rose-500/30 border border-white/20 flex items-center justify-center text-white shadow-inner">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Portal Pelacak Harian
          </h1>
          <p className="text-xs text-slate-300">
            Pilih profil Anda untuk langsung masuk ke halaman tracker masing-masing.
          </p>
        </div>

        {/* Kartu Pilihan Akun (Bisa dibuka di tab berbeda) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setLoadingUser("abun");
              router.push("/abun");
            }}
            className="p-4 rounded-2xl bg-teal-950/80 hover:bg-teal-900 border border-teal-500/40 text-teal-100 flex flex-col items-center gap-2 transition active:scale-95 shadow-lg shadow-teal-950/50 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 group-hover:scale-110 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="text-base font-bold text-white block">Abun</span>
              <span className="text-[11px] text-teal-300/80 font-mono">PIN: 0623</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-medium">
              Buka Tracker &rarr;
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoadingUser("flowee");
              router.push("/flowee");
            }}
            className="p-4 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-100 flex flex-col items-center gap-2 transition active:scale-95 shadow-lg shadow-rose-950/50 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 group-hover:scale-110 transition">
              <Heart className="w-5 h-5 fill-rose-300" />
            </div>
            <div className="text-center">
              <span className="text-base font-bold text-white block">Flowee</span>
              <span className="text-[11px] text-rose-300/80 font-mono">PIN: 0224</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium">
              Buka Tracker &rarr;
            </span>
          </button>
        </div>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-slate-900/90 px-3 text-[10px] text-slate-400 uppercase tracking-widest absolute">
            atau masukkan PIN
          </span>
        </div>

        {/* Form Masuk Manual */}
        <form onSubmit={handleManualSubmit} className="space-y-3.5">
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ketik 0623 atau 0224..."
              className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white/15 transition text-center text-lg tracking-widest font-semibold"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-white transition"
              aria-label="Lihat PIN"
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-rose-500 hover:opacity-95 text-slate-950 font-bold rounded-2xl shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>Masuk Sekarang</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        {error && (
          <p className="text-xs text-rose-300 text-center font-medium bg-rose-950/60 p-2.5 rounded-xl border border-rose-800/60">
            {error}
          </p>
        )}

        <div className="text-center pt-1">
          <p className="text-[11px] text-slate-400">
            Tips: Buka <code className="text-teal-300 font-mono">/abun</code> dan <code className="text-rose-300 font-mono">/flowee</code> sekaligus di tab berbeda!
          </p>
        </div>
      </div>
    </main>
  );
}
