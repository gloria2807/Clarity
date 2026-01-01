
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
  BrainCircuit,
  Lightbulb,
  Split,
  Target,
  StepForward,
  TrendingUp,
  AlertTriangle,
  StickyNote,
  History,
  Link as LinkIcon,
  ChevronDown,
  Flag,
  Zap,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  BarChart3,
  Lightbulb as InspirationIcon,
  Info
} from 'lucide-react';
import { AppView, NewsItem, AnalysisResult, ImageSize, Note, Milestone, QuickDecision, HubRisk, HubTrend, HubInspiration } from './types';
import { MOCK_NEWS } from './constants.tsx';
import { getClarityAnalysis, generateVisualConcept, analyzeNote, analyzeQuickDecision, getMilestoneStep, analyzeHubEntry } from './geminiService';

const PROCESSING_TEXTS = [
  "Turning thoughts into decisions…",
  "Analyzing your challenges…",
  "Mapping possible paths…",
  "Extracting hidden assumptions...",
  "Synthesizing market signals..."
];

const NOTE_PROCESSING_TEXTS = [
  "Organizing your thoughts…",
  "Highlighting key ideas…",
  "Summarizing decisions…",
  "Linking to dashboard context..."
];

const HUB_PROCESSING_TEXTS = [
  "Turning insights into clarity…",
  "Finding hidden patterns…",
  "Suggesting mitigation & opportunities…"
];

export default function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIdx, setProcessingIdx] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  // Notes State
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteProcessingIdx, setNoteProcessingIdx] = useState(0);

  // Milestones & Decisions State
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [quickDecisions, setQuickDecisions] = useState<QuickDecision[]>([]);
  const [mTitle, setMTitle] = useState('');
  const [mDeadline, setMDeadline] = useState('');
  const [dInput, setDInput] = useState('');
  const [isAnalyzingDecision, setIsAnalyzingDecision] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  // Hub State
  const [risks, setRisks] = useState<HubRisk[]>([]);
  const [trends, setTrends] = useState<HubTrend[]>([]);
  const [inspirations, setInspirations] = useState<HubInspiration[]>([]);
  const [isAnalyzingHub, setIsAnalyzingHub] = useState(false);
  const [hubProcessingIdx, setHubProcessingIdx] = useState(0);
  
  // Hub Form States
  const [riskType, setRiskType] = useState<HubRisk['type']>('Financial');
  const [riskDesc, setRiskDesc] = useState('');
  const [riskImpact, setRiskImpact] = useState<HubRisk['impact']>('Medium');
  const [riskImages, setRiskImages] = useState<string[]>([]);
  const [trendObs, setTrendObs] = useState('');
  const [trendSource, setTrendSource] = useState('Dashboard');
  const [inspLesson, setInspLesson] = useState('');
  const [inspTakeaway, setInspTakeaway] = useState('');
  const [inspSource, setInspSource] = useState('');

  // Visualizer State
  const [visualPrompt, setVisualPrompt] = useState('');
  const [visualSize, setVisualSize] = useState<ImageSize>('1K');
  const [visualResult, setVisualResult] = useState<string | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noteFileInputRef = useRef<HTMLInputElement>(null);
  const hubFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (isProcessing || isAnalyzingDecision) {
      interval = setInterval(() => {
        setProcessingIdx((prev) => (prev + 1) % PROCESSING_TEXTS.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isProcessing, isAnalyzingDecision]);

  useEffect(() => {
    let interval: any;
    if (isSavingNote) {
      interval = setInterval(() => {
        setNoteProcessingIdx((prev) => (prev + 1) % NOTE_PROCESSING_TEXTS.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isSavingNote]);

  useEffect(() => {
    let interval: any;
    if (isAnalyzingHub) {
      interval = setInterval(() => {
        setHubProcessingIdx((prev) => (prev + 1) % HUB_PROCESSING_TEXTS.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzingHub]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'dashboard' | 'notes' | 'hub') => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'dashboard') {
          setImages(prev => [...prev, reader.result as string]);
        } else if (target === 'notes') {
          setNoteImages(prev => [...prev, reader.result as string]);
        } else if (target === 'hub') {
          setRiskImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number, target: 'dashboard' | 'notes' | 'hub') => {
    if (target === 'dashboard') {
      setImages(prev => prev.filter((_, i) => i !== index));
    } else if (target === 'notes') {
      setNoteImages(prev => prev.filter((_, i) => i !== index));
    } else if (target === 'hub') {
      setRiskImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAnalyze = async () => {
    if (!input.trim() && images.length === 0) return;
    setIsProcessing(true);
    setAnalysis(null);
    try {
      const newsContext = MOCK_NEWS.map(n => n.title).join("; ");
      const result = await getClarityAnalysis(input, images, newsContext);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim() && noteImages.length === 0) return;
    setIsSavingNote(true);
    try {
      const aiAnalysis = await analyzeNote(noteInput, noteImages);
      const newNote: Note = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        text: noteInput,
        images: [...noteImages],
        summary: aiAnalysis.summary || 'Summary unavailable.',
        connections: aiAnalysis.connections || [],
        tags: aiAnalysis.tags || []
      };
      setNotes(prev => [newNote, ...prev]);
      setNoteInput('');
      setNoteImages([]);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze and save note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleAnalyzeHub = async (type: 'Risk' | 'Trend' | 'Inspiration') => {
    setIsAnalyzingHub(true);
    try {
      let data = {};
      let imgArray: string[] = [];
      if (type === 'Risk') {
        data = { type: riskType, description: riskDesc, impact: riskImpact };
        imgArray = riskImages;
      } else if (type === 'Trend') {
        data = { observation: trendObs, source: trendSource };
      } else if (type === 'Inspiration') {
        data = { lesson: inspLesson, takeaway: inspTakeaway, source: inspSource };
      }

      const aiResult = await analyzeHubEntry(type, data, imgArray);

      if (type === 'Risk') {
        setRisks(prev => [{
          id: Date.now().toString(),
          type: riskType,
          description: riskDesc,
          impact: riskImpact,
          mitigation: aiResult.mitigation || "Monitor closely.",
          timestamp: new Date().toLocaleString(),
          images: [...riskImages]
        }, ...prev]);
        setRiskDesc('');
        setRiskImages([]);
      } else if (type === 'Trend') {
        setTrends(prev => [{
          id: Date.now().toString(),
          observation: trendObs,
          source: trendSource,
          pattern: aiResult.pattern || "No pattern detected yet.",
          timestamp: new Date().toLocaleString()
        }, ...prev]);
        setTrendObs('');
      } else if (type === 'Inspiration') {
        setInspirations(prev => [{
          id: Date.now().toString(),
          lesson: inspLesson,
          takeaway: aiResult.takeaway || inspTakeaway,
          source: inspSource,
          timestamp: new Date().toLocaleString()
        }, ...prev]);
        setInspLesson('');
        setInspTakeaway('');
        setInspSource('');
      }
    } catch (error) {
      console.error(error);
      alert("Hub analysis failed.");
    } finally {
      setIsAnalyzingHub(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!mTitle.trim()) return;
    setIsAddingMilestone(true);
    try {
      const nextStep = await getMilestoneStep(mTitle, mDeadline);
      const newM: Milestone = {
        id: Date.now().toString(),
        title: mTitle,
        deadline: mDeadline || 'TBD',
        status: 'planned',
        nextStep
      };
      setMilestones(prev => [newM, ...prev]);
      setMTitle('');
      setMDeadline('');
    } catch (error) {
      console.error(error);
      alert("Failed to add milestone.");
    } finally {
      setIsAddingMilestone(false);
    }
  };

  const handleQuickDecision = async () => {
    if (!dInput.trim()) return;
    setIsAnalyzingDecision(true);
    try {
      const decision = await analyzeQuickDecision(dInput);
      setQuickDecisions(prev => [decision, ...prev]);
      setDInput('');
    } catch (error) {
      console.error(error);
      alert("Decision analysis failed.");
    } finally {
      setIsAnalyzingDecision(false);
    }
  };

  const handleGenerateVisual = async () => {
    if (!visualPrompt.trim()) return;
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
    <div className="flex h-screen overflow-hidden bg-[#050505] text-slate-200 font-['Inter']">
      {/* Sidebar */}
      <nav className="w-16 md:w-64 bg-[#0a0a0a] border-r border-[#262626] flex flex-col items-center md:items-start p-4 transition-all duration-300">
        <div className="flex items-center gap-3 mb-10 px-2 mt-2">
          <div className="bg-emerald-500/10 p-2 rounded-xl">
            <BrainCircuit className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="hidden md:block font-bold text-xl tracking-tight text-white">Clarity</span>
        </div>
        
        <div className="flex flex-col gap-1 w-full overflow-y-auto custom-scrollbar">
          <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavButton active={view === 'hub'} onClick={() => setView('hub')} icon={<ShieldAlert size={18} />} label="Risk & Insight" />
          <NavButton active={view === 'milestones'} onClick={() => setView('milestones')} icon={<Flag size={18} />} label="Milestones" />
          <NavButton active={view === 'notes'} onClick={() => setView('notes')} icon={<StickyNote size={18} />} label="Notes" />
          <NavButton active={view === 'visualizer'} onClick={() => setView('visualizer')} icon={<ImageIcon size={18} />} label="Visualizer" />
          <NavButton active={view === 'news'} onClick={() => setView('news')} icon={<Newspaper size={18} />} label="Market Feed" />
        </div>

        <div className="mt-auto w-full pt-4 border-t border-[#262626]">
          <p className="hidden md:block text-[9px] text-slate-500 uppercase tracking-[0.2em] text-center font-semibold">Built with Gemini 3</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-[#262626] flex items-center px-8 justify-between bg-[#050505]/80 backdrop-blur-md z-10">
          <h1 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{view} Mode</h1>
          <div className="flex items-center gap-4">
             {analysis && <button onClick={() => setAnalysis(null)} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">New Session</button>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-[#050505]">
          {view === 'dashboard' && (
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
              {!analysis && (
                <div className="space-y-6">
                  <div className="bg-[#0a0a0a] rounded-3xl border border-[#262626] p-8 shadow-2xl transition-all duration-500 focus-within:border-emerald-500/30">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Dump everything on your mind as a founder. Confusion is allowed."
                      className="w-full h-48 bg-transparent border-none focus:ring-0 text-lg resize-none placeholder-slate-600 text-slate-200 leading-relaxed"
                    />
                    <div className="mt-6 flex flex-wrap gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group w-24 h-24">
                          <img src={img} className="w-full h-full object-cover rounded-xl border border-[#262626]" />
                          <button onClick={() => removeImage(idx, 'dashboard')} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                        </div>
                      ))}
                      <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-[#262626] rounded-xl flex flex-col items-center justify-center text-slate-600 hover:text-emerald-400 hover:border-emerald-500/50 transition-all gap-2">
                        <Plus size={20} /><span className="text-[10px] font-bold uppercase tracking-widest">Add Asset</span>
                      </button>
                      <input type="file" ref={fileInputRef} hidden multiple onChange={(e) => handleFileUpload(e, 'dashboard')} accept="image/*" />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button disabled={isProcessing || (!input && images.length === 0)} onClick={handleAnalyze} className="group flex items-center gap-3 bg-white text-black px-12 py-4 rounded-full font-bold hover:bg-emerald-400 transition-all disabled:opacity-30 active:scale-95 shadow-xl shadow-emerald-500/10">
                      {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="animate-pulse">{PROCESSING_TEXTS[processingIdx]}</span></> : <><Send size={18} /><span>Clarity On</span></>}
                    </button>
                  </div>
                </div>
              )}

              {analysis && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-10 shadow-lg">
                    <div className="flex items-center gap-2 mb-6 text-emerald-400">
                      <BrainCircuit size={20} /><h2 className="uppercase text-[10px] tracking-[0.2em] font-black">Core Problem Statement</h2>
                    </div>
                    <p className="text-2xl md:text-3xl text-white leading-snug font-medium">{analysis.problemClarity}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-8 shadow-lg">
                      <div className="flex items-center gap-2 mb-6 text-amber-400">
                        <Lightbulb size={18} /><h2 className="uppercase text-[10px] tracking-[0.2em] font-black">Implicit Assumptions</h2>
                      </div>
                      <ul className="space-y-4">
                        {analysis.hiddenAssumptions.map((item, i) => (
                          <li key={i} className="flex gap-4 text-slate-400 text-sm leading-relaxed"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-8 shadow-lg">
                      <div className="flex items-center gap-2 mb-6 text-indigo-400">
                        <Newspaper size={18} /><h2 className="uppercase text-[10px] tracking-[0.2em] font-black">Market Context</h2>
                      </div>
                      <div className="space-y-4">
                        {analysis.newsInsights?.map((insight, i) => (
                          <div key={i} className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10"><p className="text-xs text-slate-300 leading-relaxed">{insight}</p></div>
                        )) || <p className="text-xs text-slate-400 italic">No external market factors identified.</p>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2 text-white">
                        <Split size={20} className="text-violet-400" /><h2 className="uppercase text-[10px] tracking-[0.2em] font-black">Strategic Paths</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {analysis.viablePaths.map((path, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 hover:border-slate-700 transition-all group">
                          <div className="text-[10px] text-slate-500 mb-4 font-bold tracking-widest border-b border-[#262626] pb-2">OPTION 0{i+1}</div>
                          <h3 className="text-white font-bold mb-3 group-hover:text-violet-400 transition-colors">{path.option}</h3>
                          <p className="text-xs text-slate-400 mb-6 leading-relaxed">{path.description}</p>
                          <div className="pt-6 border-t border-[#262626] space-y-4">
                            <div><div className="text-[9px] uppercase tracking-widest text-slate-500 font-black mb-1 flex items-center gap-1"><TrendingUp size={10} /> Dynamics</div><p className="text-[11px] text-slate-400 italic">{path.tradeOffs}</p></div>
                            <div><div className="text-[9px] uppercase tracking-widest text-amber-500 font-black mb-1 flex items-center gap-1"><AlertTriangle size={10} /> Critical Risk</div><p className="text-[11px] text-amber-500/80 font-medium">{path.risks}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-white rounded-3xl p-10 shadow-2xl shadow-emerald-500/5">
                    <div className="flex items-center gap-2 mb-6 text-emerald-400">
                      <Target size={24} /><h2 className="uppercase text-[10px] tracking-[0.3em] font-black">Strategic Recommendation</h2>
                    </div>
                    <h3 className="text-3xl font-bold mb-4 text-emerald-50">{analysis.recommendedDirection.path}</h3>
                    <p className="text-slate-300 leading-relaxed text-lg font-light opacity-90">{analysis.recommendedDirection.reasoning}</p>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-8 shadow-lg">
                    <div className="flex items-center gap-2 mb-8 text-violet-400">
                      <StepForward size={18} /><h2 className="uppercase text-[10px] tracking-[0.2em] font-black">Action Protocol</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {analysis.nextActions.map((action, i) => (
                        <div key={i} className="flex flex-col gap-4 p-6 bg-[#171717] rounded-2xl border border-[#262626] hover:border-violet-500/30 transition-colors group">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all">0{i+1}</div>
                          <p className="text-sm text-slate-200 font-medium leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'hub' && (
            <div className="max-w-4xl mx-auto w-full space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tight">Risk & Insights Hub</h2>
                <div className="flex items-center gap-2 text-slate-500 bg-[#0a0a0a] p-4 border border-[#262626] rounded-2xl">
                   <Info size={16} className="flex-shrink-0" />
                   <p className="text-xs">Log a risk, trend, or inspiration. Structured input is preferred. Confusion is fine.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Risk Logging */}
                <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 shadow-lg space-y-5">
                  <div className="flex items-center gap-2 text-red-400">
                    <ShieldAlert size={18} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Risk Logging</h3>
                  </div>
                  <div className="space-y-4">
                    <select 
                      value={riskType} 
                      onChange={e => setRiskType(e.target.value as any)}
                      className="w-full bg-[#171717] border border-[#262626] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                    >
                      <option>Financial</option>
                      <option>Operational</option>
                      <option>Technical</option>
                      <option>Market</option>
                    </select>
                    <textarea 
                      value={riskDesc}
                      onChange={e => setRiskDesc(e.target.value)}
                      placeholder="Short description of the risk..."
                      className="w-full h-24 bg-[#171717] border border-[#262626] rounded-xl p-4 text-xs text-white outline-none resize-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between">
                       <div className="flex gap-2">
                        {(['Low', 'Medium', 'High'] as const).map(impact => (
                          <button 
                            key={impact} 
                            onClick={() => setRiskImpact(impact)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all border ${riskImpact === impact ? 'bg-white text-black border-white' : 'bg-transparent text-slate-500 border-[#262626]'}`}
                          >
                            {impact}
                          </button>
                        ))}
                       </div>
                       <div className="flex gap-2">
                          {riskImages.length > 0 && <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400">{riskImages.length}</div>}
                          <button onClick={() => hubFileInputRef.current?.click()} className="p-2 bg-[#171717] border border-[#262626] rounded-lg text-slate-500 hover:text-white"><ImageIcon size={14} /></button>
                          <input type="file" ref={hubFileInputRef} hidden multiple onChange={(e) => handleFileUpload(e, 'hub')} accept="image/*" />
                       </div>
                    </div>
                    <button 
                      disabled={isAnalyzingHub || !riskDesc}
                      onClick={() => handleAnalyzeHub('Risk')}
                      className="w-full bg-white text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-20"
                    >
                      {isAnalyzingHub ? HUB_PROCESSING_TEXTS[hubProcessingIdx] : "Analyze & Save Risk"}
                    </button>
                  </div>
                </div>

                {/* Trend/Pattern */}
                <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 shadow-lg space-y-5">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <BarChart3 size={18} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Trend Observation</h3>
                  </div>
                  <div className="space-y-4">
                    <textarea 
                      value={trendObs}
                      onChange={e => setTrendObs(e.target.value)}
                      placeholder="What pattern or trend are you seeing?"
                      className="w-full h-24 bg-[#171717] border border-[#262626] rounded-xl p-4 text-xs text-white outline-none resize-none leading-relaxed"
                    />
                    <select 
                      value={trendSource}
                      onChange={e => setTrendSource(e.target.value)}
                      className="w-full bg-[#171717] border border-[#262626] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                    >
                      <option>Notes</option>
                      <option>Dashboard</option>
                      <option>Decisions</option>
                      <option>External</option>
                    </select>
                    <button 
                      disabled={isAnalyzingHub || !trendObs}
                      onClick={() => handleAnalyzeHub('Trend')}
                      className="w-full bg-white text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-20"
                    >
                      {isAnalyzingHub ? HUB_PROCESSING_TEXTS[hubProcessingIdx] : "Analyze & Save Trend"}
                    </button>
                  </div>
                </div>

                {/* Inspiration Feed */}
                <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 shadow-lg space-y-5">
                  <div className="flex items-center gap-2 text-amber-400">
                    <InspirationIcon size={18} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Inspiration Feed</h3>
                  </div>
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      value={inspSource}
                      onChange={e => setInspSource(e.target.value)}
                      placeholder="Source (Lesson, Framework, URL)"
                      className="w-full bg-[#171717] border border-[#262626] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                    />
                    <textarea 
                      value={inspLesson}
                      onChange={e => setInspLesson(e.target.value)}
                      placeholder="Key lesson or takeaway..."
                      className="w-full h-24 bg-[#171717] border border-[#262626] rounded-xl p-4 text-xs text-white outline-none resize-none leading-relaxed"
                    />
                    <button 
                      disabled={isAnalyzingHub || !inspLesson}
                      onClick={() => handleAnalyzeHub('Inspiration')}
                      className="w-full bg-white text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-20"
                    >
                      {isAnalyzingHub ? HUB_PROCESSING_TEXTS[hubProcessingIdx] : "Analyze & Save Insight"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Hub Display Archive */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Risks Matrix */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 px-2 flex items-center gap-2">
                    <ShieldAlert size={14} /> Risk & Constraint Matrix
                  </h3>
                  {risks.length === 0 && <div className="p-10 text-center text-slate-700 bg-[#0a0a0a] rounded-3xl border border-dashed border-[#262626] text-xs">No active risks logged.</div>}
                  {risks.map(risk => (
                    <div key={risk.id} className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 space-y-4 hover:border-red-500/20 transition-all group">
                       <div className="flex justify-between items-start">
                          <div className="flex gap-2">
                            <span className="text-[9px] font-black uppercase bg-[#171717] text-slate-400 px-2 py-0.5 rounded border border-[#262626]">{risk.type}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${risk.impact === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : risk.impact === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{risk.impact} Impact</span>
                          </div>
                          <span className="text-[8px] font-bold text-slate-600">{risk.timestamp}</span>
                       </div>
                       <p className="text-sm font-medium text-white">{risk.description}</p>
                       <div className="bg-[#050505] p-4 border border-[#262626] rounded-2xl">
                          <h4 className="text-[9px] font-black uppercase text-amber-400/80 mb-2">Mitigation Strategy</h4>
                          <p className="text-xs text-slate-400 leading-relaxed italic">"{risk.mitigation}"</p>
                       </div>
                    </div>
                  ))}
                </div>

                {/* Trends & Insights */}
                <div className="space-y-8">
                   <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 px-2 flex items-center gap-2">
                        <BarChart3 size={14} /> Analytics & Trends
                      </h3>
                      {trends.length === 0 && <div className="p-10 text-center text-slate-700 bg-[#0a0a0a] rounded-3xl border border-dashed border-[#262626] text-xs">No patterns detected yet.</div>}
                      {trends.map(trend => (
                        <div key={trend.id} className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 space-y-4 group">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase bg-indigo-500/5 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10">Source: {trend.source}</span>
                            <span className="text-[8px] font-bold text-slate-600">{trend.timestamp}</span>
                          </div>
                          <p className="text-sm font-medium text-white">{trend.observation}</p>
                          <div className="flex items-center gap-3 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                             <TrendingUp size={12} className="text-indigo-400" />
                             <p className="text-[10px] text-slate-300 font-medium">{trend.pattern}</p>
                          </div>
                        </div>
                      ))}
                   </div>

                   <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 px-2 flex items-center gap-2">
                        <InspirationIcon size={14} /> Inspiration & Learning
                      </h3>
                      {inspirations.length === 0 && <div className="p-10 text-center text-slate-700 bg-[#0a0a0a] rounded-3xl border border-dashed border-[#262626] text-xs">Feed is currently empty.</div>}
                      {inspirations.map(insp => (
                        <div key={insp.id} className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase text-amber-500/60 truncate max-w-[150px]">{insp.source || 'General Insight'}</span>
                              <span className="text-[8px] font-bold text-slate-600">{insp.timestamp}</span>
                           </div>
                           <p className="text-sm font-medium text-white leading-relaxed">{insp.lesson}</p>
                           <div className="pt-4 border-t border-[#262626]">
                              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-emerald-400 mb-1">
                                <CheckCircle2 size={10} /> Actionable Takeaway
                              </div>
                              <p className="text-xs text-slate-400 font-medium">{insp.takeaway}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {view === 'milestones' && (
            <div className="max-w-4xl mx-auto w-full space-y-12 pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Milestones Input */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Flag className="text-emerald-400" size={20} />
                    <h2 className="text-2xl font-bold text-white tracking-tight">Milestones</h2>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 shadow-lg space-y-4">
                    <input 
                      type="text" 
                      value={mTitle}
                      onChange={e => setMTitle(e.target.value)}
                      placeholder="Milestone title (e.g., Close Series A)"
                      className="w-full bg-[#171717] border border-[#262626] rounded-xl px-4 py-3 text-white focus:border-emerald-500/30 outline-none"
                    />
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Calendar className="absolute left-4 top-3 text-slate-500" size={16} />
                        <input 
                          type="text" 
                          value={mDeadline}
                          onChange={e => setMDeadline(e.target.value)}
                          placeholder="Deadline"
                          className="w-full bg-[#171717] border border-[#262626] rounded-xl pl-11 pr-4 py-3 text-white focus:border-emerald-500/30 outline-none"
                        />
                      </div>
                      <button 
                        disabled={isAddingMilestone || !mTitle}
                        onClick={handleAddMilestone}
                        className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-20"
                      >
                        {isAddingMilestone ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {milestones.length === 0 && <p className="text-slate-500 italic text-center text-sm py-10 opacity-50">No milestones tracked yet.</p>}
                    {milestones.map(m => (
                      <div key={m.id} className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-5 shadow-sm group">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{m.title}</h3>
                          <span className="text-[10px] font-black uppercase text-slate-500 border border-[#262626] px-2 py-0.5 rounded">{m.deadline}</span>
                        </div>
                        <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400 mb-1">
                            <StepForward size={12} /> Next Low-Pressure Step
                          </div>
                          <p className="text-xs text-emerald-50/80 leading-relaxed font-medium">{m.nextStep}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Decisions Input */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Zap className="text-violet-400" size={20} />
                    <h2 className="text-2xl font-bold text-white tracking-tight">Quick Decisions</h2>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 shadow-lg space-y-4">
                    <textarea 
                      value={dInput}
                      onChange={e => setDInput(e.target.value)}
                      placeholder="Short messy problem or decision needing clarity..."
                      className="w-full h-32 bg-[#171717] border border-[#262626] rounded-xl p-4 text-white focus:border-violet-500/30 outline-none resize-none leading-relaxed"
                    />
                    <button 
                      disabled={isAnalyzingDecision || !dInput}
                      onClick={handleQuickDecision}
                      className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold hover:bg-violet-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10 disabled:opacity-20"
                    >
                      {isAnalyzingDecision ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                      {isAnalyzingDecision ? PROCESSING_TEXTS[processingIdx] : "Decide Clearly"}
                    </button>
                  </div>

                  <div className="space-y-6">
                    {quickDecisions.length === 0 && <p className="text-slate-500 italic text-center text-sm py-10 opacity-50">Capture quick decisions as they arise.</p>}
                    {quickDecisions.map(d => (
                      <div key={d.id} className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-[#262626] pb-3">
                          <h3 className="text-sm font-bold text-white">{d.problemClarity}</h3>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">{d.timestamp}</span>
                        </div>
                        <div className="space-y-4">
                           <div>
                              <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Recommended Path</div>
                              <p className="text-xs text-white font-medium">{d.recommendedDirection.path}</p>
                              <p className="text-[10px] text-slate-400 italic mt-1">{d.recommendedDirection.reasoning}</p>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {d.nextActions.map((a, i) => (
                                <span key={i} className="text-[9px] bg-white/5 border border-white/10 px-2 py-1 rounded-full text-slate-300">
                                  {a}
                                </span>
                              ))}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'notes' && (
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
               <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight">Notes</h2>
                  <p className="text-slate-500 text-sm mt-1">Ideas, decisions, and reflections captured in real-time.</p>
                </div>
              </div>
              <div className="bg-[#0a0a0a] rounded-3xl border border-[#262626] p-8 shadow-lg space-y-6">
                 <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Capture your ideas, decisions, and reflections here. Images are welcome."
                  className="w-full h-32 bg-transparent border-none focus:ring-0 text-lg resize-none placeholder-slate-600 text-slate-200 leading-relaxed"
                />
                <div className="flex items-center justify-between pt-4 border-t border-[#262626]">
                  <div className="flex gap-2">
                    {noteImages.map((img, idx) => (
                      <div key={idx} className="relative group w-12 h-12 shadow-sm">
                        <img src={img} className="w-full h-full object-cover rounded-lg" />
                        <button onClick={() => removeImage(idx, 'notes')} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={8} /></button>
                      </div>
                    ))}
                    <button onClick={() => noteFileInputRef.current?.click()} className="w-12 h-12 border-2 border-dashed border-[#262626] rounded-lg flex items-center justify-center text-slate-600 hover:text-emerald-400 hover:border-emerald-500/50 transition-all">
                      <ImageIcon size={18} />
                    </button>
                    <input type="file" ref={noteFileInputRef} hidden multiple onChange={(e) => handleFileUpload(e, 'notes')} accept="image/*" />
                  </div>
                  <button 
                    disabled={isSavingNote || (!noteInput && noteImages.length === 0)}
                    onClick={handleSaveNote}
                    className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg disabled:opacity-20 active:scale-95"
                  >
                    {isSavingNote ? <><Loader2 className="w-3 h-3 animate-spin" /><span>{NOTE_PROCESSING_TEXTS[noteProcessingIdx]}</span></> : <><span>Save Note</span></>}
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <History size={16} className="text-slate-600" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Chronological Archive</h2>
                </div>
                {notes.length === 0 && <div className="p-12 text-center text-slate-500 border-2 border-dashed border-[#262626] rounded-3xl"><p className="text-sm italic opacity-50">No entries in your thinking archive yet.</p></div>}
                {notes.map((note) => <NoteCard key={note.id} note={note} />)}
              </div>
            </div>
          )}

          {view === 'visualizer' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
               <div className="text-center space-y-3 mb-12">
                <h2 className="text-4xl font-black text-white tracking-tight">Concept Engine</h2>
                <p className="text-slate-500 text-sm max-w-md mx-auto">Generate high-fidelity architectural diagrams or product concepts.</p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-8 space-y-8 shadow-lg">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-4">Prompt Specification</label>
                  <textarea value={visualPrompt} onChange={(e) => setVisualPrompt(e.target.value)} placeholder="Describe a clean, professional dashboard UI..." className="w-full h-40 bg-[#171717] border border-[#262626] rounded-2xl p-6 text-slate-200 outline-none transition-all resize-none leading-relaxed focus:border-emerald-500/30" />
                </div>
                <div className="flex flex-col md:flex-row gap-8 md:items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-4">Output Fidelity</label>
                    <div className="flex gap-3">
                      {(['1K', '2K', '4K'] as ImageSize[]).map((sz) => (
                        <button key={sz} onClick={() => setVisualSize(sz)} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${visualSize === sz ? 'bg-white border-white text-black shadow-emerald-500/10 shadow-lg' : 'bg-[#171717] border-[#262626] text-slate-500 hover:border-slate-500'}`}>{sz}</button>
                      ))}
                    </div>
                  </div>
                  <button disabled={isGeneratingVisual || !visualPrompt} onClick={handleGenerateVisual} className="h-12 px-10 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-20 shadow-xl shadow-emerald-600/10">
                    {isGeneratingVisual ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}Generate Concept
                  </button>
                </div>
              </div>
              {visualResult && !isGeneratingVisual && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
                  <img src={visualResult} className="w-full rounded-3xl border border-[#262626] shadow-2xl" />
                  <div className="flex justify-between items-center px-4">
                     <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Render Output: {visualSize}</span>
                     <a href={visualResult} download="founder-concept.png" className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">Save Asset</a>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'news' && (
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
               <div className="flex items-end justify-between mb-12">
                <div><h2 className="text-4xl font-black text-white tracking-tight">Market Signals</h2><p className="text-slate-500 text-sm mt-1">Real-time pulses from the global startup ecosystem.</p></div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Live Feed</span></div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {MOCK_NEWS.map((item) => (
                  <div key={item.id} className="bg-[#0a0a0a] border border-[#262626] rounded-3xl p-8 hover:shadow-2xl hover:border-slate-700 transition-all shadow-lg group">
                    <div className="flex justify-between items-center mb-6"><span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full font-black uppercase tracking-wider border border-indigo-500/20">{item.source}</span><span className="text-[10px] font-bold text-slate-500">{item.timestamp}</span></div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        <footer className="md:hidden sticky bottom-0 w-full p-4 bg-[#0a0a0a]/95 border-t border-[#262626] flex justify-around backdrop-blur-xl z-20 overflow-x-auto no-scrollbar">
            <MobileNavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} />
            <MobileNavButton active={view === 'hub'} onClick={() => setView('hub')} icon={<ShieldAlert size={20} />} />
            <MobileNavButton active={view === 'milestones'} onClick={() => setView('milestones')} icon={<Flag size={20} />} />
            <MobileNavButton active={view === 'notes'} onClick={() => setView('notes')} icon={<StickyNote size={20} />} />
            <MobileNavButton active={view === 'visualizer'} onClick={() => setView('visualizer')} icon={<ImageIcon size={20} />} />
            <MobileNavButton active={view === 'news'} onClick={() => setView('news')} icon={<Newspaper size={20} />} />
        </footer>
      </main>
    </div>
  );
}

function NoteCard({ note }: { note: Note }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-[#0a0a0a] border border-[#262626] rounded-3xl shadow-lg overflow-hidden hover:border-slate-700 transition-all">
      <div className="p-6 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
            {note.tags.map(tag => (
              <span key={tag} className="text-[9px] font-black uppercase bg-[#171717] text-slate-400 px-2 py-0.5 rounded border border-[#262626]">{tag}</span>
            ))}
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{note.timestamp}</span>
        </div>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <StickyNote size={12} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Distilled Summary</h3>
             </div>
             <p className="text-slate-200 text-sm font-medium leading-relaxed">{note.summary}</p>
          </div>
          <ChevronDown size={16} className={`text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {expanded && (
        <div className="px-6 pb-8 pt-4 bg-[#050505]/50 border-t border-[#262626] space-y-6 animate-in slide-in-from-top-2 duration-300">
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Original Note</h4>
            <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">{note.text}</p>
            {note.images.length > 0 && (
              <div className="mt-4 flex gap-2">
                {note.images.map((img, i) => (
                  <img key={i} src={img} className="w-20 h-20 object-cover rounded-xl border border-[#262626]" />
                ))}
              </div>
            )}
          </div>
          {note.connections.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-violet-400 mb-3">
                <LinkIcon size={12} />
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em]">Contextual Connections</h4>
              </div>
              <ul className="space-y-2">
                {note.connections.map((conn, i) => (
                  <li key={i} className="text-[11px] text-slate-500 flex gap-2"><span className="text-violet-500 opacity-50">•</span>{conn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-white/10 text-white border border-white/10 shadow-lg' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      <div className={`${active ? 'text-emerald-400' : 'text-slate-500'}`}>{icon}</div>
      <span className="hidden md:block font-bold text-xs uppercase tracking-wider">{label}</span>
      {active && <div className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
    </button>
  );
}

function MobileNavButton({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3.5 rounded-2xl flex-shrink-0 transition-all ${
        active 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-90' 
          : 'text-slate-500 active:scale-95'
      }`}
    >
      {icon}
    </button>
  );
}
