import Link from "next/link";
import { Github } from "lucide-react";

export default function Header() {
  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Providers", href: "#providers" },
    { name: "Quickstart", href: "#quickstart" },
    { name: "Compare", href: "#compare" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass px-8 py-3 rounded-2xl border-white/5 shadow-2xl shadow-black/50">
        <Link href="/" className="flex items-center gap-2.5 font-display font-black text-xl tracking-tighter hover:opacity-80 transition-opacity">
          <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_rgba(232,255,71,0.5)]" />
          upload-smith
        </Link>
        
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((item) => (
            <a 
              key={item.name} 
              href={item.href} 
              className="text-sm font-medium text-text-muted hover:text-white transition-all hover:-translate-y-px"
            >
              {item.name}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <Link 
            href="https://github.com/PatelManan1612/upload-smith" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-text-muted hover:text-white transition-transform hover:scale-110"
          >
            <Github className="w-5 h-5" />
          </Link>
          <Link 
            href="https://www.npmjs.com/package/upload-smith" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-accent text-black px-5 py-2.5 rounded-xl text-xs font-mono font-bold hover:shadow-[0_0_20px_rgba(232,255,71,0.3)] hover:scale-105 active:scale-95 transition-all"
          >
            npm install
          </Link>
        </div>
      </div>
    </nav>
  );
}
