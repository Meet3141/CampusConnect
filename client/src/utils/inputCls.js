export const inputCls = (err) =>
  `w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all ${
    err
      ? "border-red-800 focus:border-red-600"
      : "border-white/[0.08] focus:border-indigo-500/60 focus:bg-white/[0.06]"
  }`;
