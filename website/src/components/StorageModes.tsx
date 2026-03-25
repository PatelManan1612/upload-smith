export default function StorageModes() {
  const modes = [
    { 
      emoji: "💾", 
      title: "Local Only", 
      desc: "Files saved to disk. No cloud config needed. Perfect for development and simple apps.",
      code: "no cloudStorage config",
      border: "border-white/5"
    },
    { 
      emoji: "☁️", 
      title: "Cloud Only", 
      desc: "Files go straight to cloud. No disk usage. Ideal for production and serverless deployments.",
      code: "keepLocalCopy: false",
      border: "border-accent",
      badge: "RECOMMENDED"
    },
    { 
      emoji: "🔄", 
      title: "Cloud + Local Copy", 
      desc: "Uploads to cloud AND saves a local copy. Great for backups and migration periods.",
      code: "keepLocalCopy: true",
      border: "border-white/5"
    }
  ];

  return (
    <section className="py-15 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20 animate-fade-in-up">
        <span className="font-mono text-md text-accent font-bold uppercase tracking-[0.3em] mb-4 block">Storage Modes</span>
        <h2 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-black tracking-[-0.03em] mb-6">
          Deploy anywhere.
        </h2>
        <p className="text-text-muted max-w-xl mx-auto font-light text-lg">
          Three storage strategies to match any architecture — dev, prod, or hybrid.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
        {modes.map((mode, i) => (
          <div 
            key={i} 
            className={`relative bg-surface p-10 rounded-2xl border ${mode.border} transition-all duration-300 hover:-translate-y-1.25 hover:shadow-2xl shadow-black group flex flex-col`}
          >
            {mode.badge && (
              <div className="absolute -top-px left-8 bg-accent text-black font-mono text-[10px] font-black px-4 py-1.5 rounded-b-xl tracking-widest shadow-[0_5px_15px_rgba(232,255,71,0.2)]">
                {mode.badge}
              </div>
            )}
            <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-500">
              {mode.emoji}
            </div>
            <h3 className="font-display font-black text-2xl mb-3 tracking-tight">{mode.title}</h3>
            <p className="text-[15px] text-text-muted font-light leading-relaxed mb-10 grow">{mode.desc}</p>
            <div className="mt-auto">
               <code className={`font-mono text-[10px] ${mode.badge ? 'text-accent' : 'text-text-muted'} font-bold bg-white/3 px-3 py-1.5 rounded-md border border-white/5`}>
                {mode.code}
              </code>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
