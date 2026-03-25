import { Github, Package, Bug } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-white/5 mt-20 bg-black/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12 text-text-muted">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="font-display font-black text-2xl text-white tracking-tighter">
            upload-smith{" "}
            <span className="text-accent decoration-accent/20 decoration-4">
              v-2.1.0
            </span>
          </div>
          <p className="text-[11px] font-mono opacity-50 uppercase tracking-[0.2em]">
            Simple. Secure. Scalable.
          </p>
        </div>

        <div className="flex items-center gap-10 font-medium text-sm">
          <Link
            href="https://github.com/PatelManan1612/upload-smith"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-2"
          >
            <Github className="w-4 h-4" />
            GitHub
          </Link>
          <Link
            href="https://www.npmjs.com/package/upload-smith"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-2"
          >
            <Package className="w-4 h-4 text-accent" />
            NPM
          </Link>
          <Link
            href="https://github.com/PatelManan1612/upload-smith/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors font-mono text-xs flex items-center gap-2"
          >
            <Bug className="w-3.5 h-3.5 text-red-500/80" />
            Report Bug
          </Link>
        </div>

        <div className="text-[11px] font-mono bg-white/3 border border-white/5 px-4 py-2 rounded-full flex items-center gap-2">
          Crafted with <PrecisionIcon className="w-3 h-3 text-accent" /> <span className="text-accent">Precision</span> by{" "}
          <Link
            href="https://github.com/PatelManan1612"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline font-bold"
          >
            Manan Patel
          </Link>
        </div>
      </div>
    </footer>
  );
}

function PrecisionIcon({ className }: { className?: string }) {
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
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
