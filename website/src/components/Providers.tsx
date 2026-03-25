export default function Providers() {
  const providers = [
    { name: "AWS S3", color: "#ff9900" },
    { name: "Azure Blob", color: "#0078d4" },
    { name: "Google Cloud Storage", color: "#4285f4" },
    { name: "Cloudinary", color: "#3448c5" },
    { name: "SFTP", color: "#27c93f" },
    { name: "FTP", color: "#ff6b6b" },
    { name: "Local Disk", color: "#8888a0" },
  ];

  return (
    <section id="providers" className="py-15 px-6 max-w-7xl mx-auto text-center">
      <div className="animate-fade-in-up">
        <span className="font-mono text-md text-accent font-bold uppercase tracking-[0.3em] mb-4 block">Providers</span>
        <h2 className="font-display text-[clamp(2rem,6vw,4rem)] font-black tracking-[-0.03em] mb-6">
          One package.<br/>Every cloud.
        </h2>
        <p className="text-text-muted max-w-md mx-auto font-light text-lg mb-12">
          Switch providers by changing a single string. Your application code stays identical.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {providers.map((p, i) => (
            <div 
              key={i}
              className="px-6 py-3 rounded-full bg-surface border border-white/5 flex items-center gap-3 hover:border-accent/30 transition-all hover:-translate-y-0.5 cursor-default shadow-lg"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-sm font-display font-bold text-text-muted hover:text-white transition-colors">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
