import { Globe, ShieldCheck, Scaling, Zap, ExternalLink, FileCode2 } from "lucide-react";

export default function Features() {
  const features = [
    { 
      title: "6 Cloud Providers", 
      desc: "AWS S3, Azure Blob, Google Cloud Storage, Cloudinary, FTP, and SFTP — all from one unified API.",
      icon: <Globe className="w-6 h-6 text-accent" />,
      bg: "hover:bg-accent/[0.03]"
    },
    { 
      title: "Extension Validation", 
      desc: "Whitelist exactly which file types are allowed per upload endpoint. Rejects everything else automatically.",
      icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
      bg: "hover:bg-blue-400/[0.03]"
    },
    { 
      title: "Per-Extension Size Limits", 
      desc: "Set different size caps for different file types — 5MB for images, 20MB for PDFs, 100MB for video.",
      icon: <Scaling className="w-6 h-6 text-pink-400" />,
      bg: "hover:bg-pink-400/[0.03]"
    },
    { 
      title: "Image Compression", 
      desc: "Built-in Sharp integration compresses JPEG, PNG, WebP on the fly before uploading to cloud or disk.",
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      bg: "hover:bg-yellow-500/[0.03]"
    },
    { 
      title: "URL Import", 
      desc: "Download and process files directly from URLs. Supports domain whitelisting and blacklisting for security.",
      icon: <ExternalLink className="w-6 h-6 text-blue-500" />,
      bg: "hover:bg-blue-500/[0.03]"
    },
    { 
      title: "TypeScript Ready", 
      desc: "First-class TypeScript support with full type inference for your config and return values.",
      icon: <FileCode2 className="w-6 h-6 text-accent" />,
      bg: "hover:bg-accent/[0.03]"
    }
  ];

  return (
    <section id="features" className="py-15 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <span className="font-mono text-md text-accent font-bold uppercase tracking-[0.3em] mb-4 block">Core Features</span>
        <h2 className="font-display text-[clamp(2rem,6vw,4rem)] font-black tracking-[-0.03em] mb-6 decoration-accent/5">
          Everything you need.<br/>Nothing you don't.
        </h2>
        <p className="text-text-muted max-w-xl mx-auto font-light text-lg">
          Stop patching together five libraries. Upload Smith gives you a production-ready upload pipeline in minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-4xl border border-white/5 overflow-hidden shadow-2xl">
        {features.map((feat, i) => (
          <div 
            key={i}
            className={`bg-bg p-12 transition-all duration-500 ${feat.bg} flex flex-col items-start gap-6 border-transparent hover:border-white/5`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              {feat.icon}
            </div>
            <div>
              <h3 className="font-display font-black text-xl mb-3 tracking-tight">{feat.title}</h3>
              <p className="text-[15px] text-text-muted leading-relaxed font-light">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
