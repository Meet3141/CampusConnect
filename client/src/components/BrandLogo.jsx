export default function BrandLogo({ compact = false, className = "", logoSize = 44 }) {
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src="/client/public/image-1778485331816.jpeg"
          alt="DEPSTAR"
          width={logoSize}
          height={logoSize}
          className="shrink-0 rounded-xl"
        />
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-[0.28em] uppercase text-cc">
            DEPSTAR
          </div>
          <div className="text-[11px] text-cc-muted">Campus network</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <img
        src="/depstar-logo.svg"
        alt="DEPSTAR"
        width={logoSize}
        height={logoSize}
        className="shrink-0 rounded-[1.5rem] shadow-[0_12px_40px_rgba(37,99,235,0.18)]"
      />
      <div className="mt-4 text-3xl sm:text-4xl font-black tracking-[0.22em] uppercase text-white">
        DEPSTAR
      </div>
      <div className="mt-2 text-sm text-slate-500">
        Your campus, connected.
      </div>
    </div>
  );
}