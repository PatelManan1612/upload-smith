import { Star } from "lucide-react";
import CopyButton from "./CopyButton";

export default function Hero() {
  const chips = [
    "MIT License",
    "TypeScript Ready",
    "ESM + CJS",
    "Built on Multer"
  ];

  const stats = [
    { label: "Cloud Providers", val: "6+" },
    { label: "Config Object", val: "1" },
    { label: "Boilerplate", val: "0%" },
    { label: "File Types", val: "∞" },
  ];

  return (
    <section className="relative pt-44 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
      {/* Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-bg">
        <div className="absolute top-[-10%] left-[-10%] w-150 h-150 bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Pill Badge */}
      <div className="animate-fade-in-down inline-flex items-center gap-2.5 bg-accent/10 border border-accent/20 px-5 py-2 rounded-full text-[11px] font-mono font-bold text-accent mb-10 tracking-[0.15em] uppercase shadow-[0_0_20px_rgba(232,255,71,0.1)]">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        v2.1.0 — now with FTP & SFTP support
      </div>

      {/* Main Title */}
      <h1 className="animate-fade-in-up font-display text-[clamp(2.5rem,10.6vw,8rem)] font-black leading-[0.82] tracking-[-0.05em] mb-12 selection:bg-accent selection:text-black">
        File uploads.<br />
        <span className="text-accent">Done right.</span>
      </h1>

      {/* Sub Heading */}
      <h2 className="animate-fade-in-up font-display text-xl md:text-2xl font-bold text-white/90 mb-6 tracking-tight">
        Make Uploads Effortless.
      </h2>

      {/* Description */}
      <p className="animate-fade-in-up delay-100 max-w-2xl text-md md:text-lg text-text-muted font-light leading-relaxed mb-12">
        The <strong className="text-white font-semibold">Express.js upload middleware</strong> that handles AWS S3, Azure, GCS, Cloudinary, FTP & SFTP — with validation, compression & TypeScript in one clean config object.
      </p>

      {/* Feature Chips */}
      <div className="animate-fade-in-up delay-200 flex flex-wrap justify-center gap-3 mb-10 max-w-xl">
        {chips.map((chip) => (
          <span key={chip} className="chip">
            {chip}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="animate-fade-in-up delay-300 flex flex-wrap justify-center gap-4 mb-16">
        <a 
          href="https://www.npmjs.com/package/upload-smith" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-primary"
        >
          View on npm <ArrowUpRight className="w-4 h-4" />
        </a>
        <a 
          href="https://github.com/PatelManan1612/upload-smith" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-secondary"
        >
          <Star className="w-4 h-4 text-accent" /> Star on GitHub
        </a>
      </div>

      {/* Install Snippet */}
      <div className="animate-fade-in-up delay-400 flex flex-wrap justify-center gap-5 mb-24">
        <div className="flex items-center gap-3 px-6 py-3 bg-surface rounded-2xl border border-white/5 shadow-2xl group hover:border-white/10 transition-all">
          <code className="text-sm font-mono font-semibold text-accent/90">
            npm install upload-smith
          </code>
          <div className="w-px h-4 bg-white/10 mx-2" />
          <CopyButton text="npm install upload-smith" />
        </div>
      </div>

      {/* Stats Divider Section */}
      <div className="animate-fade-in-up delay-500 flex flex-wrap justify-center gap-10 md:gap-20 py-10 border-y border-white/5 w-screen max-w-5xl">
        {stats.map((stat, i) => (
          <div key={i} className="text-center group cursor-default">
            <span className="font-display text-4xl font-black text-white group-hover:text-accent transition-colors duration-300">
              {stat.val}
            </span>
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mt-2 font-bold">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="7" y1="17" x2="17" y2="7"></line>
      <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
  );
}
