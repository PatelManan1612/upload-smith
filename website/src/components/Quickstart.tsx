import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import DynamicCodeBlock from "./DynamicCodeBlock";

export default function Quickstart() {
  const steps = [
    "Single unified configuration object",
    "Middleware handles multipart/form-data seamlessly",
    "Automatic cleanup of local temporary files",
    "Supports single, multiple, or complex field uploads"
  ];

  return (
    <section id="quickstart" className="py-25 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
      <div className="animate-fade-in-left">
        <span className="font-mono text-md text-accent font-bold uppercase tracking-[0.3em] mb-4 block">Implementation</span>
        <h2 className="font-display text-[clamp(2.5rem,5vw,3.5rem)] font-black tracking-[-0.03em] mb-8 leading-tight">
          Go from zero to cloud<br/>in 5 lines of code.
        </h2>
        <div className="space-y-6 mb-12">
          {steps.map((text, i) => (
            <div key={i} className="flex items-center gap-4 text-md text-text-muted">
              <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="font-light tracking-tight">{text}</span>
            </div>
          ))}
        </div>
        <Link 
          href="https://github.com/PatelManan1612/upload-smith" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-accent text-black px-8 py-4 rounded-2xl font-black transition-all hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(232,255,71,0.2)]"
        >
          Read Documentation <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="relative group lg:scale-110">
        <DynamicCodeBlock />
      </div>
    </section>
  );
}
