import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Wand2, Maximize2, Eraser, Layers, Type, Key, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { generateImage, editImage, upscaleImage, removeBackground, removeWatermark, enhanceImage } from '../services/geminiService';

type Tool = 'generate' | 'edit' | 'enhance' | 'upscale' | 'remove-bg' | 'remove-watermark';

export default function NanoStudio() {
  const [activeTool, setActiveTool] = useState<Tool>('generate');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true); // Fallback for environments without aistudio
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
  });

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check for API key only for premium tools (Upscale)
      if (activeTool === 'upscale' && window.aistudio) {
        const hasSelected = await window.aistudio.hasSelectedApiKey();
        if (!hasSelected) {
          await window.aistudio.openSelectKey();
          // After opening, we assume they might have selected or we just proceed 
          // but the platform will handle the actual key injection.
        }
      }

      let res = '';
      switch (activeTool) {
        case 'generate':
          if (!prompt) throw new Error('Please enter a prompt');
          res = await generateImage(prompt);
          break;
        case 'edit':
          if (!image || !prompt) throw new Error('Please upload an image and enter an edit prompt');
          res = await editImage(image, prompt);
          break;
        case 'enhance':
          if (!image) throw new Error('Please upload an image');
          res = await enhanceImage(image);
          break;
        case 'upscale':
          if (!image) throw new Error('Please upload an image');
          res = await upscaleImage(image);
          break;
        case 'remove-bg':
          if (!image) throw new Error('Please upload an image');
          res = await removeBackground(image);
          break;
        case 'remove-watermark':
          if (!image) throw new Error('Please upload an image');
          res = await removeWatermark(image);
          break;
      }
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const tools = [
    { id: 'generate', name: 'Generate', icon: ImageIcon, desc: 'Create from text' },
    { id: 'edit', name: 'Edit', icon: Wand2, desc: 'Modify with AI' },
    { id: 'enhance', name: 'Enhance', icon: Layers, desc: 'Improve quality' },
    { id: 'upscale', name: 'Upscale', icon: Maximize2, desc: '4K Resolution' },
    { id: 'remove-bg', name: 'Remove BG', icon: Eraser, desc: 'Clean cutout' },
    { id: 'remove-watermark', name: 'No Watermark', icon: Type, desc: 'Remove logos' },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-zinc-950 relative">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 glass border-r border-white/10 flex flex-col z-10">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-display font-bold text-emerald-500 tracking-tight">NANO STUDIO</h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-semibold">AI Image Suite</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id as Tool);
                setError(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative",
                activeTool === tool.id 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              )}
            >
              <tool.icon className={cn("w-5 h-5", activeTool === tool.id ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300")} />
              <div className="text-left">
                <p className="text-sm font-semibold flex items-center gap-2">
                  {tool.name}
                  {tool.id === 'upscale' && (
                    <span className="text-[8px] bg-emerald-500 text-emerald-950 px-1 rounded font-bold uppercase">Pro</span>
                  )}
                </p>
                <p className="text-[10px] opacity-60">{tool.desc}</p>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest font-bold mb-1">Powered By</p>
            <p className="text-xs font-mono text-emerald-400">Gemini 2.5 Flash Image</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-medium text-zinc-300 capitalize">{activeTool.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4">
            {image && (
              <button 
                onClick={() => { setImage(null); setResult(null); }}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear Image
              </button>
            )}
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
          <div className="w-full max-w-4xl space-y-8">
            
            {/* Image Preview Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Input / Upload */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Input</p>
                {activeTool === 'generate' ? (
                   <div className="aspect-square glass rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Ready to Generate</h3>
                        <p className="text-sm text-zinc-500 mt-1">Enter a prompt below to start creating</p>
                      </div>
                   </div>
                ) : (
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "aspect-square glass rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group",
                      isDragActive ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 hover:border-white/20",
                      image ? "border-none" : ""
                    )}
                  >
                    <input {...getInputProps()} />
                    {image ? (
                      <>
                        <img src={image} alt="Input" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-sm font-medium text-white">Click to change image</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-zinc-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Upload Image</h3>
                          <p className="text-sm text-zinc-500 mt-1">Drag & drop or click to browse</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Result */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Result</p>
                <div className="aspect-square glass rounded-2xl overflow-hidden relative flex items-center justify-center">
                  {loading ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                      <p className="text-sm text-emerald-400 font-mono animate-pulse">Processing with AI...</p>
                    </div>
                  ) : result ? (
                    <div className="relative w-full h-full group">
                      <img src={result} alt="Result" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={result} 
                          download={`nano-studio-${activeTool}.png`}
                          className="p-2 bg-emerald-500 text-emerald-950 rounded-lg hover:bg-emerald-400 transition-colors block"
                        >
                          <Upload className="w-4 h-4 rotate-180" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <p className="text-sm text-zinc-500 italic">Your AI generated result will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="glass p-6 rounded-2xl space-y-6">
              {(activeTool === 'generate' || activeTool === 'edit') && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={activeTool === 'generate' ? "A futuristic city with neon lights and flying cars..." : "Add a red hat to the person..."}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[100px] resize-none"
                  />
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                  <X className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleAction}
                disabled={loading || (activeTool === 'generate' && !prompt) || (activeTool !== 'generate' && !image)}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    {activeTool === 'generate' ? 'Generate Image' : `Apply ${activeTool.replace('-', ' ')}`}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
