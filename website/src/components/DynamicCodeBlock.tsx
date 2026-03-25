"use client";

import { useState } from "react";
import { ChevronDown, Check, Copy, Code2, Cloud, HardDrive, Zap, Globe } from "lucide-react";

const EXAMPLES = {
  aws: {
    title: "AWS S3 Implementation",
    icon: <Cloud className="w-4 h-4 text-orange-400" />,
    code: `import { createUploader } from "upload-smith";

const upload = createUploader({
  fieldName: "file",
  allowedExtensions: ["jpg", "png", "pdf"],
  cloudStorage: {
    enabled: true,
    provider: "aws",
    aws: {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_BUCKET,
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET
    },
    keepLocalCopy: false
  }
});

app.post("/upload", upload.single(), (req, res) => {
  res.json({ url: req.file.publicUrl });
});`
  },
  azure: {
    title: "Azure Blob Storage",
    icon: <Cloud className="w-4 h-4 text-blue-400" />,
    code: `import { createUploader } from "upload-smith";

const upload = createUploader({
  fieldName: "assets",
  cloudStorage: {
    enabled: true,
    provider: "azure",
    azure: {
      connectionString: process.env.AZURE_CONN_STRING,
      containerName: "uploads",
      publicAccessLevel: "blob"
    }
  }
});

app.post("/azure-upload", upload.array("assets", 5), (req, res) => {
  res.json({ files: req.files.map(f => f.publicUrl) });
});`
  },
  gcs: {
    title: "Google Cloud (GCS)",
    icon: <Cloud className="w-4 h-4 text-blue-500" />,
    code: `import { createUploader } from "upload-smith";

const upload = createUploader({
  fieldName: "image",
  cloudStorage: {
    enabled: true,
    provider: "gcs",
    gcs: {
      projectId: process.env.GCP_PROJECT,
      keyFilename: "./service-account.json",
      bucket: "my-bucket",
      predefinedAcl: "publicRead"
    }
  }
});`
  },
  cloudinary: {
    title: "Cloudinary (Images/Video)",
    icon: <Zap className="w-4 h-4 text-indigo-400" />,
    code: `import { createUploader } from "upload-smith";

const upload = createUploader({
  fieldName: "media",
  cloudStorage: {
    enabled: true,
    provider: "cloudinary",
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
      folder: "user_uploads"
    }
  }
});`
  },
  ftp: {
    title: "FTP / SFTP Server",
    icon: <HardDrive className="w-4 h-4 text-green-400" />,
    code: `import { createUploader } from "upload-smith";

const upload = createUploader({
  fieldName: "doc",
  cloudStorage: {
    enabled: true,
    provider: "sftp", // or "ftp"
    sftp: {
      host: "ftp.example.com",
      username: "admin",
      password: "secure-password",
      remotePath: "/uploads/data"
    }
  }
});`
  },
  local: {
    title: "Local Disk Only",
    icon: <HardDrive className="w-4 h-4 text-slate-400" />,
    code: `import { createUploader } from "upload-smith";

const upload = createUploader({
  fieldName: "file",
  folderConfig: {
    basePath: "storage/raw",
    byExtension: true, // Auto-sort into subfolders
    byCategory: true   // Auto-sort by type (images, docs)
  },
  compressImage: true,
  imageQuality: 80
});`
  },
  url: {
    title: "URL Direct Import",
    icon: <Globe className="w-4 h-4 text-pink-400" />,
    code: `import { createUploader } from "upload-smith";

const upload = createUploader({
  fieldName: "image",
  urlUpload: {
    enabled: true,
    maxSizeMB: 100,
    allowedDomains: ["images.unsplash.com", "github.com"],
    timeout: 60000
  }
});

// Use it to download from a URL query param
app.post("/import", upload.urlUpload(), (req, res) => {
  res.json({ url: req.file.publicUrl });
});`
  }
};

export default function DynamicCodeBlock() {
  const [selected, setSelected] = useState<keyof typeof EXAMPLES>("aws");
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(EXAMPLES[selected].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group lg:scale-110">
      <div className="absolute inset-0 bg-accent/20 blur-[120px] rounded-full group-hover:bg-accent/30 transition-all duration-700" />
      
      <div className="relative bg-[#0d0d12] rounded-4xl border border-white/10 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
        {/* Code Header with Dropdown */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <div className="flex items-center gap-2">
                {EXAMPLES[selected].icon}
                <span className="uppercase tracking-widest font-black">{selected}</span>
              </div>
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#16161e] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in-up">
                {(Object.keys(EXAMPLES) as Array<keyof typeof EXAMPLES>).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelected(key);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-mono text-left transition-colors hover:bg-white/5 ${selected === key ? 'text-accent' : 'text-text-muted hover:text-white'}`}
                  >
                    {EXAMPLES[key].icon}
                    <span className="uppercase tracking-widest font-bold">{key}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-all active:scale-90"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Code Body */}
        <div className="p-8 font-mono text-[13px] leading-[1.8] overflow-y-auto whitespace-pre selection:bg-accent selection:text-black h-100 custom-scrollbar">
          {EXAMPLES[selected].code.split('\n').map((line, i) => (
            <div key={i} className="flex gap-6 group/line">
              <span className="w-6 text-white/10 text-right select-none group-hover/line:text-accent/30 transition-colors">{i + 1}</span>
              <span className="text-white/90">{line}</span>
            </div>
          ))}
        </div>

        {/* Info Area */}
        <div className="px-8 py-4 bg-accent/5 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
             <span className="text-[10px] uppercase tracking-[0.2em] font-black text-accent/80">
               {EXAMPLES[selected].title}
             </span>
          </div>
          <Code2 className="w-4 h-4 text-white/10" />
        </div>
      </div>
    </div>
  );
}
