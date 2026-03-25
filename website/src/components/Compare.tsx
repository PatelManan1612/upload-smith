export default function Compare() {
  const data = [
    { name: "AWS S3 uploads", multer: "Manual SDK setup", smith: "Built-in" },
    { name: "Azure Blob Storage", multer: null, smith: "Built-in" },
    { name: "Google Cloud Storage", multer: null, smith: "Built-in" },
    { name: "Cloudinary", multer: null, smith: "Built-in" },
    { name: "FTP / SFTP", multer: null, smith: "Built-in" },
    { name: "Extension validation", multer: "Manual fileFilter", smith: "Config option" },
    { name: "Per-extension size limits", multer: null, smith: "Config option" },
    { name: "Image compression", multer: null, smith: "Via Sharp" },
    { name: "URL download support", multer: null, smith: "Built-in" }
  ];

  return (
    <section id="compare" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-left mb-16">
        <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-black tracking-[-0.04em] mb-6 leading-tight">
          Why not just<br />
          use raw Multer?
        </h2>
        <p className="text-text-muted max-w-xl font-light text-lg">
          Multer is great — Upload Smith just removes the 200 lines you'd write around it.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/5 bg-surface shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/3">
              <th className="p-6 text-sm font-bold text-white tracking-tight">Capability</th>
              <th className="p-6 text-sm font-bold text-text-muted">Raw Multer</th>
              <th className="p-6 text-sm font-bold text-accent">upload-smith</th>
            </tr>
          </thead>
          <tbody className="">
            {data.map((row, i) => (
              <tr key={i} className={`group transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/2'}`}>
                <td className="px-6 py-5 text-[15px] font-semibold text-white/90">{row.name}</td>
                <td className="px-6 py-5 text-[15px] text-[#ff6a42]">
                  {row.multer ? (
                    <span className="opacity-70 font-medium">{row.multer}</span>
                  ) : (
                    <span className="opacity-50 font-bold ml-1">X</span>
                  )}
                </td>
                <td className="px-6 py-5 text-[15px] text-accent font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    <span>{row.smith}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
