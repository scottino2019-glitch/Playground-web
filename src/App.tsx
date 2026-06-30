import { useState, useEffect } from 'react';
import { Project, LayoutMode, ActiveTab, ConsoleLog } from './types';
import { CodeEditor } from './components/CodeEditor';
import { PreviewFrame } from './components/PreviewFrame';
import { ProjectList } from './components/ProjectList';
import { templates } from './templates';
import { 
  Code, 
  Download, 
  Copy, 
  HelpCircle, 
  Settings, 
  Grid, 
  BookOpen, 
  Layers, 
  ChevronRight, 
  RotateCw, 
  Laptop,
  Check,
  FolderOpen
} from 'lucide-react';

const STORAGE_PROJECTS_KEY = 'web-playground-projects-db';
const STORAGE_DRAFT_KEY = 'web-playground-current-draft-v1';

export default function App() {
  // Master states
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState('Progetto Senza Nome');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Custom interface togglers
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('tabs-vertical'); // default to custom tabs-vertical for better space ergonomics
  const [activeTab, setActiveTab] = useState<ActiveTab>('html');
  const [enableTailwind, setEnableTailwind] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [manualRefreshTrigger, setManualRefreshTrigger] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [showProjectsBar, setShowProjectsBar] = useState(false);

  // Custom visual components for unblocked sandbox execution
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Accetta',
    cancelText: 'Annulla',
    onConfirm: () => {}
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isOpen: true, message, type });
  };

  // Auto-dismiss custom toast banners
  useEffect(() => {
    if (toast.isOpen) {
      const t = setTimeout(() => {
        setToast(prev => ({ ...prev, isOpen: false }));
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [toast.isOpen]);
  
  // Visual dropdown togglers
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedCombined, setCopiedCombined] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  // Read saved local storage projects on mount
  useEffect(() => {
    // 1. Load project list
    const storedProjects = localStorage.getItem(STORAGE_PROJECTS_KEY);
    let loadedProjects: Project[] = [];
    if (storedProjects) {
      try {
        loadedProjects = JSON.parse(storedProjects);
        setProjects(loadedProjects);
      } catch (err) {
        console.error('Error parsing stored projects:', err);
      }
    }

    // 2. Load latest draft or seed template if first-open empty
    const savedDraft = localStorage.getItem(STORAGE_DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setHtml(draft.html !== undefined ? draft.html : '');
        setCss(draft.css !== undefined ? draft.css : '');
        setJs(draft.js !== undefined ? draft.js : '');
        setActiveProjectId(draft.activeProjectId || null);
        setActiveProjectName(draft.activeProjectName || 'Modello Bozze');
        setEnableTailwind(draft.enableTailwind !== undefined ? draft.enableTailwind : true);
        setLayoutMode(draft.layoutMode || 'grid');
      } catch (e) {
        loadDefaultTemplate();
      }
    } else {
      // Seed first user-experience with neon stopwatch
      loadDefaultTemplate();
    }
    setIsLoaded(true);
  }, []);

  // Save current active code state to local storage draft in real-time (saving loss-protection)
  useEffect(() => {
    if (!isLoaded) return;

    const draftState = {
      html,
      css,
      js,
      activeProjectId,
      activeProjectName,
      enableTailwind,
      layoutMode
    };
    localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draftState));

    // Overwrite active project's file states if it targets a saved model
    if (activeProjectId) {
      setProjects(prev => {
        const updated = prev.map(p => {
          if (p.id === activeProjectId) {
            return {
              ...p,
              html,
              css,
              js,
              updatedAt: new Date().toISOString()
            };
          }
          return p;
        });
        localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [html, css, js, activeProjectId, activeProjectName, enableTailwind, layoutMode, isLoaded]);

  const loadDefaultTemplate = () => {
    const defaultTemp = templates.stopwatch;
    setHtml(defaultTemp.html);
    setCss(defaultTemp.css);
    setJs(defaultTemp.js);
    setActiveProjectId(null);
    setActiveProjectName('Cronometro Neon (Bozza)');
  };

  const handleSelectProject = (id: string) => {
    const selected = projects.find(p => p.id === id);
    if (selected) {
      setHtml(selected.html);
      setCss(selected.css);
      setJs(selected.js);
      setActiveProjectId(selected.id);
      setActiveProjectName(selected.name);
      setConsoleLogs([]); // reset browser visual console
    }
  };

  const handleSaveProject = (name: string) => {
    const newProj: Project = {
      id: Date.now().toString(),
      name: name,
      html: html,
      css: css,
      js: js,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextProjects = [...projects, newProj];
    setProjects(nextProjects);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(nextProjects));
    
    // Set active
    setActiveProjectId(newProj.id);
    setActiveProjectName(newProj.name);
  };

  const handleCreateNewProject = (name: string) => {
    const newProj: Project = {
      id: Date.now().toString(),
      name: name,
      html: '',
      css: '',
      js: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextProjects = [...projects, newProj];
    setProjects(nextProjects);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(nextProjects));
    
    // Set active
    setHtml('');
    setCss('');
    setJs('');
    setActiveProjectId(newProj.id);
    setActiveProjectName(newProj.name);
    setConsoleLogs([]); // reset visual console
    showToast(`Progetto "${newProj.name}" creato vuoto con successo!`, 'success');
  };

  const handleDeleteProject = (id: string) => {
    const p = projects.find(proj => proj.id === id);
    const pName = p ? p.name : 'questo progetto';
    
    setConfirmModal({
      isOpen: true,
      title: 'Elimina Progetto',
      message: `Sei sicuro di voler eliminare definitivamente "${pName}"? I file verranno rimossi permanentemente dalle memorie del browser.`,
      confirmText: 'Sì, Elimina',
      cancelText: 'Annulla',
      onConfirm: () => {
        const nextProjects = projects.filter(proj => proj.id !== id);
        setProjects(nextProjects);
        localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(nextProjects));
        
        // If active is deleted, demote to draft
        if (activeProjectId === id) {
          setActiveProjectId(null);
          setActiveProjectName('Modello Bozze');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast('Progetto eliminato con successo', 'success');
      }
    });
  };

  const handleLoadTemplate = (key: keyof typeof templates) => {
    const selected = templates[key];
    
    // Auto-load instantly without any confirmation modal if current editor is empty or matches default start
    const currentIsDefault = html === templates.stopwatch.html && css === templates.stopwatch.css && js === templates.stopwatch.js;
    const currentIsEmpty = html.trim() === '' && css.trim() === '' && js.trim() === '';
    
    if (currentIsEmpty || currentIsDefault) {
      setHtml(selected.html);
      setCss(selected.css);
      setJs(selected.js);
      setActiveProjectId(null);
      setActiveProjectName(`${selected.name} (Bozza)`);
      setConsoleLogs([]);
      showToast(`Template "${selected.name}" inserito con successo!`, 'success');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Carica: ${selected.name}`,
      message: `Vuoi davvero caricare il template "${selected.name}"? Questo sostituirà completamente tutto il codice sui tuoi editor di lavoro attuali.`,
      confirmText: 'Carica Template',
      cancelText: 'Annulla',
      onConfirm: () => {
        setHtml(selected.html);
        setCss(selected.css);
        setJs(selected.js);
        setActiveProjectId(null);
        setActiveProjectName(`${selected.name} (Bozza)`);
        setConsoleLogs([]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast(`Template "${selected.name}" inserito correttamente nel Playground!`, 'success');
      }
    });
  };

  const handleImportProject = (imported: Project) => {
    // Generate new local ID to avoid collisions
    const importedWithNewId: Project = {
      ...imported,
      id: Date.now().toString(),
      updatedAt: new Date().toISOString()
    };

    const nextProjects = [...projects, importedWithNewId];
    setProjects(nextProjects);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(nextProjects));

    setHtml(importedWithNewId.html);
    setCss(importedWithNewId.css);
    setJs(importedWithNewId.js);
    setActiveProjectId(importedWithNewId.id);
    setActiveProjectName(importedWithNewId.name);
    setConsoleLogs([]);
    showToast(`Progetto "${imported.name}" importato con successo!`, 'success');
  };

  const handleDownloadCombinedHTML = () => {
    const combinedHTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeProjectName}</title>
  ${enableTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      ${js}
    });
  </script>
</body>
</html>`;

    const blob = new Blob([combinedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Clean name for file writing
    const safeName = activeProjectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${safeName}_completo.html`;
    link.click();
    URL.revokeObjectURL(url);
    setShowDownloadDropdown(false);
  };

  const handleDownloadSingleFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setShowDownloadDropdown(false);
  };

  // Export full project metadata JSON backup file for users to transport easily
  const handleExportBackupJSON = () => {
    const currentProj: Project = {
      id: activeProjectId || 'draft',
      name: activeProjectName,
      html,
      css,
      js,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    handleDownloadSingleFile(
      JSON.stringify(currentProj, null, 2), 
      `${activeProjectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_playground_backup.json`,
      'application/json'
    );
  };

  const handleCopyCombinedCode = async () => {
    const combined = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${enableTailwind ? '<script src="https://cdn.tailwindcss.com"></script>\n' : ''}  <style>
    ${css.replace(/\n/g, '\n    ')}
  </style>
</head>
<body>
  ${html.replace(/\n/g, '\n  ')}
  
  <script>
    ${js.replace(/\n/g, '\n    ')}
  </script>
</body>
</html>`;

    try {
      await navigator.clipboard.writeText(combined);
      setCopiedCombined(true);
      setTimeout(() => setCopiedCombined(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Setup sample reset
  const handleResetToBlank = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Nuovo File Vuoto',
      message: 'Vuoi davvero svuotare tutti i compilatori e iniziare da zero con un modello vuoto?',
      confirmText: 'Sì, svuota tutto',
      cancelText: 'Annulla',
      onConfirm: () => {
        setHtml(templates.blank.html);
        setCss(templates.blank.css);
        setJs(templates.blank.js);
        setActiveProjectId(null);
        setActiveProjectName('Modello Vuoto');
        setConsoleLogs([]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast('Playground ripristinato a vuoto', 'success');
      }
    });
  };

  // PostMessage message handler capturing iframe sandbox consoles
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'web-playground-iframe') {
        const { type, message } = event.data;
        const newLog: ConsoleLog = {
          type: type as 'log' | 'error' | 'warn' | 'info',
          message: message,
          timestamp: new Date().toLocaleTimeString('it-IT')
        };
        setConsoleLogs(prev => [...prev, newLog]);
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden antialiased">
      
      {/* Visual Workspace Top Heading Navigation */}
      <header className="border-b border-slate-800 bg-slate-950 px-4 py-1.5 shrink-0 select-none shadow-md">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-1.5 rounded-lg text-white shadow-md shadow-indigo-500/10">
              <Code className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-xs text-white tracking-tight uppercase">Playground Web</h1>
              <span className="text-[8px] bg-slate-850 text-slate-400 font-extrabold px-1 rounded border border-slate-750">PRO</span>
            </div>
            <div className="ml-1.5 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono font-medium max-w-[150px] truncate text-indigo-400" title={activeProjectName}>
              📄 {activeProjectName}
            </div>
          </div>

          {/* Quick Toolbar Workspace config parameters */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            
            {/* Toggle Project Manager bar */}
            <button
              onClick={() => setShowProjectsBar(!showProjectsBar)}
              title={showProjectsBar ? "Nascondi archivio Progetti e Template" : "Apri archivio Progetti e Template"}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                showProjectsBar 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner' 
                  : 'bg-slate-900 text-slate-350 border border-slate-800 hover:text-slate-100'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Modelli & Salva ({projects.length})</span>
            </button>
            
            {/* Tailwind utility toggle */}
            <button
              onClick={() => setEnableTailwind(!enableTailwind)}
              title={enableTailwind ? "Disabilita Tailwind CSS nello Sandbox" : "Abilita Tailwind CSS nello Sandbox"}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                enableTailwind 
                  ? 'bg-sky-500/15 text-sky-450 border border-sky-500/30 font-semibold' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${enableTailwind ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'}`}></div>
              <span>Tailwind CDN v3</span>
            </button>

            {/* Layout Mode selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5" title="Layout dei riquadri">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${layoutMode === 'grid' ? 'bg-indigo-650 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                title="Griglia 3 Colonne"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayoutMode('split-vertical')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${layoutMode === 'split-vertical' ? 'bg-indigo-650 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                title="Riquadri Ricalcolati (Layout Orizzontale)"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayoutMode('tabs-vertical')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${layoutMode === 'tabs-vertical' ? 'bg-indigo-650 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                title="File a Schede (Compatto)"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Downloader Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                title="Esporta Codice"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Salva sul PC</span>
              </button>

              {showDownloadDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1 border-b border-slate-900 text-[10px] uppercase font-bold text-slate-500">
                    Scegli Formato
                  </div>
                  
                  {/* Standalone package */}
                  <button
                    onClick={handleDownloadCombinedHTML}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-indigo-600/25 hover:text-indigo-400 transition-all font-medium flex items-center gap-2"
                  >
                    <div className="p-1 bg-emerald-500/10 text-emerald-400 rounded">
                      <span className="font-extrabold text-[10px]">HTML</span>
                    </div>
                    <div>
                      <span className="block font-semibold">Sito Standalone</span>
                      <span className="block text-[9px] text-slate-500">Unico file con stili e script</span>
                    </div>
                  </button>

                  {/* Individual HTML */}
                  <button
                    onClick={() => handleDownloadSingleFile(html, 'index.html', 'text/html')}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-900 transition-all font-semibold flex items-center gap-2 border-t border-slate-905"
                  >
                    <span className="text-[10px] text-slate-500 font-mono w-8">HTML</span>
                    <span>Scarica solo index.html</span>
                  </button>

                  {/* Individual CSS */}
                  <button
                    onClick={() => handleDownloadSingleFile(css, 'style.css', 'text/css')}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-900 transition-all font-semibold flex items-center gap-2"
                  >
                    <span className="text-[10px] text-slate-500 font-mono w-8">CSS</span>
                    <span>Scarica solo style.css</span>
                  </button>

                  {/* Individual JS */}
                  <button
                    onClick={() => handleDownloadSingleFile(js, 'script.js', 'text/javascript')}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-900 transition-all font-semibold flex items-center gap-2"
                  >
                    <span className="text-[10px] text-slate-500 font-mono w-8">JS</span>
                    <span>Scarica solo script.js</span>
                  </button>

                  <div className="h-[1px] bg-slate-900 my-1"></div>

                  {/* JSON Backup package */}
                  <button
                    onClick={handleExportBackupJSON}
                    className="w-full text-left px-3.5 py-2 text-xs text-indigo-400 hover:bg-indigo-950/20 transition-all font-bold flex items-center gap-2"
                  >
                    <span className="text-[10px] font-mono w-8 text-indigo-500">JSON</span>
                    <span>Salva backup progetto</span>
                  </button>
                </div>
              )}
            </div>

            {/* Absolute Copy Combined */}
            <button
              onClick={handleCopyCombinedCode}
              className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-650/15"
              title="Copia codice HTML monolitico pronto all'uso"
            >
              {copiedCombined ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copia Tutto</span>
                </>
              )}
            </button>

            {/* Quick blank setup */}
            <button
              onClick={handleResetToBlank}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 rounded-lg transition-all cursor-pointer border border-slate-800"
              title="Svuota codici e comincia da zero"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Help guidelines */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-1.5 text-slate-450 hover:text-indigo-400 bg-slate-900 hover:bg-slate-850 rounded-lg transition-all cursor-pointer border border-slate-800"
              title="Aiuto ed Istruzioni"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

          </div>
        </div>
      </header>

      {/* Italian Guidelines dropdown drawer toggle */}
      {showHelp && (
        <section className="bg-indigo-950/20 border-b border-indigo-900/60 p-4 px-6 shrink-0 relative animate-in slide-in-from-top duration-300 max-h-[180px] overflow-y-auto shadow-inner">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manuale Utente Playground Web</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-slate-350 leading-relaxed">
              <div className="space-y-1.5">
                <p>
                  Questo è un client-side <strong className="text-indigo-300 font-bold">Playground per Web Developer</strong>. Scrivi puro codice <strong>HTML5</strong>, imposta stili grafici in <strong>CSS</strong> o sfrutta le utilità integrate di <strong>Tailwind CSS</strong>, e sviluppa la logica in <strong>JavaScript</strong>.
                </p>
                <p>
                  <strong>Aggiornamento istantaneo:</strong> L'anteprima si ricalcola ed esegue automaticamente mentre scrivi (con una pausa di 600ms per salvaguardare prestazioni). Se preferisci disabilitarlo, puoi agire sulla barra strumenti.
                </p>
              </div>
              <div className="space-y-1.5">
                <p>
                  <strong>Console Log interattiva:</strong> In basso nel pannello dell'anteprima, è integrata una console che cattura messaggi di errore e <code>console.log()</code> inseriti nei tuoi script, ideale per fare debugging dei tuoi esercizi!
                </p>
                <p>
                  <strong>Salvataggio e Portabilità:</strong> Salva i codici sulla memoria del tuo browser premendo "Salva Come...". Puoi anche scaricare un unico file <code>index.html</code> standalone completo da lanciare dovunque, oppure scaricare i file singolarmente.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-3 px-2 py-1 bg-indigo-900/40 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-850 rounded text-[9px] font-bold cursor-pointer transition-all"
            >
              Fai Chiudere
            </button>
          </div>
        </section>
      )}

      {/* Main workspace arena */}
      <main className="flex-1 flex flex-col p-2.5 gap-2.5 max-w-[1600px] w-full mx-auto overflow-hidden min-h-0">
        
        {/* UPPER ROW: Collapsible Project manager, local seeds templates */}
        {showProjectsBar && (
          <section className="shrink-0 max-h-[220px] overflow-y-auto bg-slate-900/45 border border-slate-800 rounded-xl p-1 shadow-lg animate-in slide-in-from-top-2 duration-300">
            <ProjectList
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={handleSelectProject}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onLoadTemplate={handleLoadTemplate}
              onImportProject={handleImportProject}
              onCreateNewProject={handleCreateNewProject}
            />
          </section>
        )}

        {/* WORKSPACE MIDDLE BODY LAYOUTS */}
        <section className="flex-1 min-h-0 overflow-hidden">
          
          {/* Layout MODE: GRID MODE (3 side editors + preview side/bottom) */}
          {layoutMode === 'grid' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 h-full min-h-0">
              
              {/* Left col: Editors stacked layout */}
              <div className="xl:col-span-7 flex flex-col md:grid md:grid-cols-2 gap-3.5 h-full min-h-0">
                
                {/* HTML */}
                <div className="flex flex-col min-h-0 h-1/2 md:h-full">
                  <CodeEditor
                    id="html-grid"
                    title="HTML5"
                    language="html"
                    value={html}
                    onChange={setHtml}
                    accentColor="bg-orange-500"
                  />
                </div>

                {/* CSS */}
                <div className="flex flex-col min-h-0 h-1/2 md:h-full">
                  <CodeEditor
                    id="css-grid"
                    title="CSS3"
                    language="css"
                    value={css}
                    onChange={setCss}
                    accentColor="bg-sky-500"
                  />
                </div>

                {/* JS - full width at bottom of grid column */}
                <div className="col-span-2 flex flex-col min-h-0 h-[180px] md:h-[220px] xl:h-[220px]">
                  <CodeEditor
                    id="js-grid"
                    title="JavaScript"
                    language="js"
                    value={js}
                    onChange={setJs}
                    accentColor="bg-amber-400"
                  />
                </div>

              </div>
              
              {/* Right col: Live preview viewport */}
              <div className="xl:col-span-5 h-full min-h-0">
                <PreviewFrame
                  html={html}
                  css={css}
                  js={js}
                  enableTailwind={enableTailwind}
                  autoRefresh={autoRefresh}
                  onRefreshTrigger={manualRefreshTrigger}
                  consoleLogs={consoleLogs}
                  setConsoleLogs={setConsoleLogs}
                />
              </div>

            </div>
          )}

          {/* Layout MODE: SPLIT VERTICAL (Editors stacked on left column, preview in right column) */}
          {layoutMode === 'split-vertical' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 h-full min-h-0">
              
              {/* Editors column (stacked horizontally across the top) */}
              <div className="xl:col-span-8 flex flex-col md:grid md:grid-cols-3 gap-3.5 h-full min-h-0">
                <div className="flex flex-col min-h-0 h-1/3 md:h-full">
                  <CodeEditor
                    id="html-splitvert"
                    title="HTML5"
                    language="html"
                    value={html}
                    onChange={setHtml}
                    accentColor="bg-orange-500"
                  />
                </div>
                <div className="flex flex-col min-h-0 h-1/3 md:h-full">
                  <CodeEditor
                    id="css-splitvert"
                    title="CSS3"
                    language="css"
                    value={css}
                    onChange={setCss}
                    accentColor="bg-sky-500"
                  />
                </div>
                <div className="flex flex-col min-h-0 h-1/3 md:h-full">
                  <CodeEditor
                    id="js-splitvert"
                    title="JavaScript"
                    language="js"
                    value={js}
                    onChange={setJs}
                    accentColor="bg-amber-400"
                  />
                </div>
              </div>

              {/* Preview column */}
              <div className="xl:col-span-4 h-full min-h-0">
                <PreviewFrame
                  html={html}
                  css={css}
                  js={js}
                  enableTailwind={enableTailwind}
                  autoRefresh={autoRefresh}
                  onRefreshTrigger={manualRefreshTrigger}
                  consoleLogs={consoleLogs}
                  setConsoleLogs={setConsoleLogs}
                />
              </div>

            </div>
          )}

          {/* Layout MODE: TABS VERTICAL (Tabbed single editors pane + preview right side) */}
          {layoutMode === 'tabs-vertical' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 h-full min-h-0">
              
              {/* Tabbed editor block */}
              <div className="xl:col-span-6 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl min-h-0">
                
                {/* Tabs selectors bar */}
                <div className="flex bg-slate-850 px-2 pt-1.5 border-b border-slate-800 select-none shrink-0">
                  <button
                    onClick={() => setActiveTab('html')}
                    className={`px-4 py-1.5 text-[11px] font-bold rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
                      activeTab === 'html' 
                        ? 'bg-slate-900 text-orange-400 border-slate-800' 
                        : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded bg-orange-500"></span>
                    <span>HTML5</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('css')}
                    className={`px-4 py-1.5 text-[11px] font-bold rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
                      activeTab === 'css' 
                        ? 'bg-slate-900 text-sky-400 border-slate-800' 
                        : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded bg-sky-500"></span>
                    <span>CSS3</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('js')}
                    className={`px-4 py-1.5 text-[11px] font-bold rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
                      activeTab === 'js' 
                        ? 'bg-slate-900 text-amber-400 border-slate-800' 
                        : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded bg-amber-400"></span>
                    <span>JavaScript</span>
                  </button>
                </div>

                {/* Selected active editor */}
                <div className="flex-1 min-h-0 h-full">
                  {activeTab === 'html' && (
                    <CodeEditor
                      id="html-tab"
                      title="HTML5"
                      language="html"
                      value={html}
                      onChange={setHtml}
                      accentColor="bg-orange-500"
                    />
                  )}
                  {activeTab === 'css' && (
                    <CodeEditor
                      id="css-tab"
                      title="CSS3"
                      language="css"
                      value={css}
                      onChange={setCss}
                      accentColor="bg-sky-500"
                    />
                  )}
                  {activeTab === 'js' && (
                    <CodeEditor
                      id="js-tab"
                      title="JavaScript"
                      language="js"
                      value={js}
                      onChange={setJs}
                      accentColor="bg-amber-400"
                    />
                  )}
                </div>

              </div>

              {/* Preview block */}
              <div className="xl:col-span-6 h-full min-h-0">
                <PreviewFrame
                  html={html}
                  css={css}
                  js={js}
                  enableTailwind={enableTailwind}
                  autoRefresh={autoRefresh}
                  onRefreshTrigger={manualRefreshTrigger}
                  consoleLogs={consoleLogs}
                  setConsoleLogs={setConsoleLogs}
                />
              </div>

            </div>
          )}

        </section>

      </main>

      {/* Aesthetic human and literal footer status */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-1.5 select-none text-center text-[10px] text-slate-500 font-mono tracking-wide shrink-0">
        <div className="max-w-[1600px] mx-auto px-1 flex flex-row items-center justify-between gap-2">
          <div>
            <span>Playground Web offline-ready</span>
            <span className="hidden sm:inline mx-1.5">|</span>
            <span className="hidden sm:inline text-slate-600">I dati risiedono sul browser</span>
          </div>
          <div className="text-[9px] uppercase tracking-wider font-bold text-indigo-500">
            Layout Ottimizzato dello Spazio
          </div>
        </div>
      </footer>

      {/* Visual Toast Alert banner */}
      {toast.isOpen && (
        <div className="fixed bottom-5 right-5 z-55 flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl text-xs text-slate-200 animate-in slide-in-from-bottom duration-300">
          <span className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500 shadow-md shadow-emerald-500/40' : toast.type === 'error' ? 'bg-rose-500 shadow-md shadow-rose-500/40' : 'bg-indigo-500'}`}></span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Global Confirmation Modal Dialog */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-250">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h4 className="text-sm font-bold text-slate-100 mb-2">{confirmModal.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">{confirmModal.message}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                {confirmModal.cancelText || 'Annulla'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-md shadow-indigo-650/15"
              >
                {confirmModal.confirmText || 'Sì, Continua'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
