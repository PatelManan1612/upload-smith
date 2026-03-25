import { ArrowRight, FileText, Coffee, Terminal } from "lucide-react";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-24 px-6 text-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-accent/5 rounded-full blur-[150px] -z-10" />

      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <span className="font-mono text-md text-accent font-black uppercase tracking-[0.4em] mb-8 block animate-fade-in-up">
          Get Started
        </span>

        <h2 className="font-display text-[clamp(2.5rem,8vw,5.5rem)] font-black tracking-[-0.05em] mb-8 leading-[0.9] text-white animate-fade-in-up">
          One install.
          <br />
          Ship everything.
        </h2>

        <p className="text-text-muted text-lg md:text-xl mb-16 font-light max-w-sm mx-auto animate-fade-in-up delay-100">
          Your next upload feature starts here.
        </p>

        <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up delay-200">
          <Link
            href="https://www.npmjs.com/package/upload-smith"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-black px-8 py-4 rounded-xl text-sm font-mono font-black hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(232,255,71,0.2)] flex items-center gap-2.5"
          >
            <Terminal className="w-5 h-5" />
            Install from npm
          </Link>

          <Link
            href="https://github.com/PatelManan1612/upload-smith#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/3 border border-white/10 hover:bg-white/8 px-10 py-4 rounded-xl text-sm font-bold text-white/90 transition-all flex items-center gap-2.5"
          >
            <FileText className="w-5 h-5 text-accent" />
            Read the Docs
          </Link>

          <Link
            href="https://buymeacoffee.com/manan_patel"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/3 border border-white/10 hover:bg-white/8 px-10 py-4 rounded-xl text-sm font-bold text-white/90 transition-all flex items-center gap-2.5"
          >
            <Coffee className="w-5 h-5 text-[#ffdd00]" />
            Support the Author
          </Link>
        </div>
      </div>
    </section>
  );
}
