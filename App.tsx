
import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Newspaper, 
  Send, 
  Loader2, 
  Plus, 
  X,
  ChevronRight,
  BrainCircuit,
  Lightbulb,
  Split,
  Target,
  StepForward,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { AppView, NewsItem, AnalysisResult, ImageSize } from './types';
import { MOCK_NEWS } from './constants.tsx';
import { getClarityAnalysis, generateVisualConcept } from './geminiService';

const PROCESSING_TEXTS = [
  "Turning thoughts into decisions…",
  "Analyzing your challenges…",
  "Mapping possible paths…",
  "Extracting hidden assumptions...",
  "Synthesizing market signals..."
];

export default function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIdx, setProcessingIdx] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [visualPrompt, setVisualPrompt] = useState('');
  const [visualSize, setVisualSize] = useState<ImageSize>('1K');
  const [visualResult, setVisualResult] = useState<string | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setProcessingIdx((prev) => (prev + 1) % PROCESSING_TEXTS.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Fix: Explicitly cast Array.from result to File[] to avoid 'unknown' type inference on 'file'
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!input.trim() && images.length === 0) return;
    setIsProcessing(true);
    setAnalysis(null);
    try {
      const newsContext = MOCK_NEWS.map(n => n.title).join("; ");
      const result = await getClarityAnalysis(input, images, newsContext);
      setAnalysis(result);
      setView('dashboard');
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateVisual = async () => {
    if (!visualPrompt.trim()) return;
    
    // API KEY SELECTION: Mandatory for nano banana (gemini-3) models
    // Assume window.aistudio.hasSelectedApiKey and openSelectKey are available per guidelines
    // @ts-ignore
    const hasKey = await window.aistudio?.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio?.openSelectKey();
    }

    setIsGeneratingVisual(true);
    try {
      const result = await generateVisualConcept(visualPrompt, visualSize);
      setVisualResult(result);
    } catch (error: any) {
      // Graceful handling for missing API key/project config
      if (error.message.includes("Requested entity was not found")) {
        // @ts-ignore
        await window.aistudio?.openSelectKey();
      } else {
        alert("Failed to generate visual concept.");
      }
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      {/* Sidebar */}
      <nav className="w-16 md:w-64 bg-[#0a0a0a] border-r border-[#262626] flex flex-col items-center md:items-start p-4 transition-all duration-300">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <BrainCircuit className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="hidden md:block font-bold text-xl tracking-tight text-white">Clarity</span>
        </div>
        
        <div className="flex flex-col gap-2 w-full">
          <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavButton active={view === 'visualizer'} onClick={() => setView('visualizer')} icon={<ImageIcon size={20} />} label="Visualizer" />
          <NavButton active={view === 'news'} onClick={() => setView('news')} icon={<Newspaper size={20} />} label="Market Feed" />
        </div>

        <div className="mt-auto w-full pt-4 border-t border-[#262626]">
          <p className="hidden md:block text-[10px] text-slate-500 uppercase tracking-widest text-center">Built with Gemini 3</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-[#262626] flex items-center px-8 justify-between bg-[#050505]/80 backdrop-blur-sm z-10">
          <h1 className="text-lg font-medium text-slate-200 capitalize">{view} Mode</h1>
          <div className="flex items-center gap-4">
             {analysis && <button onClick={() => setAnalysis(null)} className="text-xs text-slate-400 hover:text-white transition-colors">Reset Session</button>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {view === 'dashboard' && (
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
              {/* Input Section */}
              {!analysis && (
                <div className="space-y-6">
                  <div className="bg-[#0a0a0a] rounded-2xl border border-[#262626] p-6 shadow-2xl transition-all duration-500 focus-within:border-emerald-500/50">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Dump everything on your mind as a founder. Confusion is allowed."
                      className="w-full h-40 bg-transparent border-none focus:ring-0 text-lg resize-none placeholder-slate-600 text-slate-200"
                    />
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group w-20 h-20">
                          <img src={img} className="w-full h-full object-cover rounded-lg border border-[#262626]" alt="upload" />
                          <button 
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 border-2 border-dashed border-[#262626] rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
                      >
                        <Plus size={24} />
                      </button>
                      <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileUpload} accept="image/*" />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      disabled={isProcessing || (!input && images.length === 0)}
                      onClick={handleAnalyze}
                      className="group flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/10"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{PROCESSING_TEXTS[processingIdx]}</span>
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          <span>Clarity On</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Analysis Result */}
              {analysis && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Problem Clarity */}
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-8">
                    <div className="flex items-center gap-2 mb-4 text-emerald-400">
                      <BrainCircuit size={20} />
                      <h2 className="uppercase text-xs tracking-widest font-bold">Problem Clarity</h2>
                    </div>
                    <p className="text-xl md:text-2xl text-slate-100 leading-relaxed font-light italic">
                      "{analysis.problemClarity}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assumptions */}
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4 text-amber-400">
                        <Lightbulb size={18} />
                        <h2 className="uppercase text-xs tracking-widest font-bold">Hidden Assumptions</h2>
                      </div>
                      <ul className="space-y-3">
                        {analysis.hiddenAssumptions.map((item, i) => (
                          <li key={i} className="flex gap-3 text-slate-400 text-sm leading-relaxed">
                            <span className="text-amber-500/50 text-xs">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* News Context */}
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4 text-sky-400">
                        <Newspaper size={18} />
                        <h2 className="uppercase text-xs tracking-widest font-bold">Market Signals</h2>
                      </div>
                      <div className="space-y-4">
                        {analysis.newsInsights?.map((insight, i) => (
                          <div key={i} className="p-3 bg-sky-500/5 rounded-lg border border-sky-500/10">
                            <p className="text-xs text-slate-300">{insight}</p>
                          </div>
                        )) || (
                          <p className="text-xs text-slate-500">No immediate external threats or signals detected from current data.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Viable Paths */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 px-2 text-slate-200">
                        <Split size={20} className="text-purple-400" />
                        <h2 className="uppercase text-xs tracking-widest font-bold">Strategic Options</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {analysis.viablePaths.map((path, i) => (
                          <div key={i} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5 hover:border-slate-700 transition-colors">
                            <div className="text-[10px] text-slate-500 mb-2 font-mono">PATH 0{i+1}</div>
                            <h3 className="text-white font-semibold mb-2">{path.option}</h3>
                            <p className="text-xs text-slate-400 mb-4">{path.description}</p>
                            <div className="pt-4 border-t border-[#262626] space-y-3">
                              <div className="text-[10px] uppercase tracking-tighter text-slate-500 flex items-center gap-1">
                                <TrendingUp size={10} /> Trade-offs
                              </div>
                              <p className="text-[11px] text-slate-300 italic">{path.tradeOffs}</p>
                              <div className="text-[10px] uppercase tracking-tighter text-amber-500 flex items-center gap-1">
                                <AlertTriangle size={10} /> Risk
                              </div>
                              <p className="text-[11px] text-amber-500/70">{path.risks}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>

                  {/* Data & Charts */}
                  {analysis.dataInsights && analysis.dataInsights.length > 0 && (
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <TrendingUp size={18} />
                          <h2 className="uppercase text-xs tracking-widest font-bold">Quantitative Snapshot</h2>
                        </div>
                      </div>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analysis.dataInsights}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                            <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', fontSize: '12px' }}
                              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {analysis.dataInsights.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#10b981', '#0ea5e9', '#6366f1'][index % 3]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Recommended Direction */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8">
                    <div className="flex items-center gap-2 mb-4 text-emerald-400">
                      <Target size={22} />
                      <h2 className="uppercase text-xs tracking-widest font-bold">Recommended Direction</h2>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{analysis.recommendedDirection.path}</h3>
                    <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                      {analysis.recommendedDirection.reasoning}
                    </p>
                  </div>

                  {/* Next Actions */}
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6 text-purple-400">
                      <StepForward size={18} />
                      <h2 className="uppercase text-xs tracking-widest font-bold">Next Actions (Today)</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analysis.nextActions.map((action, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-[#171717] rounded-xl border border-[#262626]">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                            {i+1}
                          </div>
                          <p className="text-sm text-slate-200">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'visualizer' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
               <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">Nano Banana Pro</h2>
                <p className="text-slate-400 text-sm">Visualize product concepts, architectural diagrams, or UI mockups.</p>
              </div>

              <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6 space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Visual Concept Prompt</label>
                  <textarea 
                    value={visualPrompt}
                    onChange={(e) => setVisualPrompt(e.target.value)}
                    placeholder="Describe a dashboard UI for a biotech startup, minimalist dark mode..."
                    className="w-full h-32 bg-[#171717] border border-[#262626] rounded-xl p-4 text-slate-200 focus:border-emerald-500/50 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-6 md:items-end">
                  <div className="flex-1">
                    <label className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Image Resolution</label>
                    <div className="flex gap-2">
                      {(['1K', '2K', '4K'] as ImageSize[]).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setVisualSize(sz)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                            visualSize === sz 
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                              : 'bg-[#171717] border-[#262626] text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    disabled={isGeneratingVisual || !visualPrompt}
                    onClick={handleGenerateVisual}
                    className="h-10 px-8 bg-white text-black rounded-lg font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                  >
                    {isGeneratingVisual ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                    Generate
                  </button>
                </div>
              </div>

              {isGeneratingVisual && (
                <div className="aspect-video w-full bg-[#0a0a0a] border border-[#262626] rounded-2xl flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="animate-spin text-emerald-500" size={32} />
                  <p className="text-slate-500 text-xs animate-pulse">Rendering high-fidelity concept...</p>
                </div>
              )}

              {visualResult && !isGeneratingVisual && (
                <div className="space-y-4 animate-in fade-in zoom-in-95">
                  <img src={visualResult} className="w-full rounded-2xl border border-[#262626] shadow-2xl" alt="result" />
                  <div className="flex justify-between items-center px-2">
                     <span className="text-[10px] text-slate-500 font-mono">RENDER_COMPLETE_RESOLVED_{visualSize}</span>
                     <a href={visualResult} download="concept.png" className="text-xs text-emerald-400 hover:underline">Download Original</a>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'news' && (
            <div className="max-w-2xl mx-auto space-y-6">
               <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">Market Signals</h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Live Updates</span>
                </div>
              </div>

              {MOCK_NEWS.map((item) => (
                <div key={item.id} className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-6 hover:border-slate-700 transition-all cursor-default group">
                   <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10 font-bold">{item.source}</span>
                      <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                   </div>
                   <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                   <p className="text-sm text-slate-400 leading-relaxed">{item.summary}</p>
                </div>
              ))}

              <div className="p-8 border-2 border-dashed border-[#262626] rounded-2xl flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                  <p className="text-xs text-slate-500">More updates scheduled for next analysis cycle.</p>
              </div>
            </div>
          )}
        </div>

        {/* Floating Mobile Footer */}
        <footer className="md:hidden sticky bottom-0 w-full p-4 bg-[#050505]/95 border-t border-[#262626] flex justify-around backdrop-blur-md">
            <MobileNavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} />
            <MobileNavButton active={view === 'visualizer'} onClick={() => setView('visualizer')} icon={<ImageIcon size={20} />} />
            <MobileNavButton active={view === 'news'} onClick={() => setView('news')} icon={<Newspaper size={20} />} />
        </footer>
      </main>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-white/5 text-white shadow-inner' 
          : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      <div className={`${active ? 'text-emerald-400' : 'text-slate-500'}`}>{icon}</div>
      <span className="hidden md:block font-medium text-sm">{label}</span>
      {active && <div className="hidden md:block ml-auto w-1 h-1 rounded-full bg-emerald-400" />}
    </button>
  );
}

function MobileNavButton({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-full transition-all ${
        active 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
          : 'text-slate-500'
      }`}
    >
      {icon}
    </button>
  );
}
