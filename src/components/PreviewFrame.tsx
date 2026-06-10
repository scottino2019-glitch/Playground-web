import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, AlertTriangle, Terminal, Trash2, Monitor, Tablet, Smartphone, Fullscreen, Plus, Percent } from 'lucide-react';
import { ConsoleLog } from '../types';

interface PreviewFrameProps {
  html: string;
  css: string;
  js: string;
  enableTailwind: boolean;
  autoRefresh: boolean;
  onRefreshTrigger: number; // Increment to force reload
  consoleLogs: ConsoleLog[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<ConsoleLog[]>>;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  html,
  css,
  js,
  enableTailwind,
  autoRefresh,
  onRefreshTrigger,
  consoleLogs,
  setConsoleLogs,
}) => {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [iframeSrc, setIframeSrc] = useState<string>('');
  const [showConsole, setShowConsole] = useState(true);
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'log' | 'error' | 'warn'>('all');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of visual console when new logs arrive
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, showConsole]);

  // Builds and compiles iframe code
  const buildPreviewContent = () => {
    const tailwindScript = enableTailwind 
      ? '<script src="https://cdn.tailwindcss.com"></script><script>tailwind.config = { theme: { extend: {} } }</script>' 
      : '';

    // Create complete sandboxed HTML doc with intercepted logs
    const source = `
      <!DOCTYPE html>
      <html lang="it" class="h-full">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- Inclusione Tailwind se abilitato -->
        ${tailwindScript}
        <!-- Inclusione CSS personalizzato -->
        <style>
          /* Safe styling standard */
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
          }
          ${css}
        </style>
        
        <!-- Intercettazione dei log in console per visualizzarli nel Playground parent -->
        <script>
          (function() {
            function safeStringify(val) {
              if (val === null) return "null";
              if (val === undefined) return "undefined";
              if (typeof val === 'function') return val.toString();
              if (typeof val === 'object') {
                try {
                  return JSON.stringify(val);
                } catch (e) {
                  return String(val);
                }
              }
              return String(val);
            }

            function sendLog(type, args) {
              const msg = args.map(arg => safeStringify(arg)).join(' ');
              window.parent.postMessage({
                source: 'web-playground-iframe',
                type: type,
                message: msg
              }, '*');
            }

            // Copia i logger esistenti
            const origLog = console.log;
            const origWarn = console.warn;
            const origError = console.error;
            const origInfo = console.info;

            console.log = function(...args) {
              origLog.apply(console, args);
              sendLog('log', args);
            };
            console.warn = function(...args) {
              origWarn.apply(console, args);
              sendLog('warn', args);
            };
            console.error = function(...args) {
              origError.apply(console, args);
              sendLog('error', args);
            };
            console.info = function(...args) {
              origInfo.apply(console, args);
              sendLog('info', args);
            };

            // Cattura errori di runtime non gestiti
            window.addEventListener('error', function(e) {
              sendLog('error', [e.message + " (linea " + e.lineno + ", col " + e.colno + ")"]);
            });
          })();
        </script>
      </head>
      <body class="bg-white h-full antialiased text-slate-800">
        ${html}
        
        <!-- Script JS personalizzato -->
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            try {
              ${js}
            } catch (err) {
              console.error("Errore nello Script: " + err.message);
            }
          });
        </script>
      </body>
      </html>
    `;

    // Package into a safe object URL blob to bypass iframe constraints
    const blob = new Blob([source], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Revoke previous URL to prevent memory accumulation leaks
    if (iframeSrc) {
      URL.revokeObjectURL(iframeSrc);
    }
    
    setIframeSrc(url);
  };

  // Re-build either automatically after change or manually via trigger
  useEffect(() => {
    if (autoRefresh) {
      const delayDebounce = setTimeout(() => {
        buildPreviewContent();
      }, 600); // 600ms debounce typing
      return () => clearTimeout(delayDebounce);
    }
  }, [html, css, js, enableTailwind, autoRefresh]);

  // Forces manual refresh updates
  useEffect(() => {
    buildPreviewContent();
  }, [onRefreshTrigger]);

  const handleManualReload = () => {
    setConsoleLogs([]); // reset logs upon reload
    buildPreviewContent();
  };

  const handleOpenNewTab = () => {
    // Generate complete source HTML code for exporting
    const combinedHTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anteprima Standalone</title>
  ${enableTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
  <style>
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    ${js}
  </script>
</body>
</html>`;

    const blob = new Blob([combinedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const filteredLogs = consoleLogs.filter(log => {
    if (consoleFilter === 'all') return true;
    return log.type === consoleFilter;
  });

  // Viewport width styling
  const getViewportWidth = () => {
    switch (viewportMode) {
      case 'desktop': return 'w-full';
      case 'tablet': return 'w-[768px] border-x border-slate-700/50 shadow-2xl';
      case 'mobile': return 'w-[375px] border-x border-slate-700/50 shadow-2xl';
    }
  };

  return (
    <div id="preview-panel-container" className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      
      {/* Panel bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-850 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
          <span className="font-mono text-xs font-semibold text-slate-200 tracking-wider">ANTEPRIMA LIVE</span>
        </div>

        {/* Viewport controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`p-1 rounded-md transition-all cursor-pointer ${viewportMode === 'desktop' ? 'bg-slate-800 text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Desktop (100% Width)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              className={`p-1 rounded-md transition-all cursor-pointer ${viewportMode === 'tablet' ? 'bg-slate-800 text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Tablet (768px Width)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`p-1 rounded-md transition-all cursor-pointer ${viewportMode === 'mobile' ? 'bg-slate-800 text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Smartphone (375px Width)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-800"></div>

          {/* Manual Run button */}
          <button
            onClick={handleManualReload}
            title="Rigenera l'Anteprima"
            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 rounded-lg transition-all flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Aggiorna</span>
          </button>

          {/* Open stand-alone */}
          <button
            onClick={handleOpenNewTab}
            title="Apri in nuova scheda standalone"
            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 rounded-lg transition-all flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
          >
            <Fullscreen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Espandi</span>
          </button>
        </div>
      </div>

      {/* Actual IFrame content viewport container */}
      <div className="flex-1 bg-slate-950 preview-canvas flex justify-center items-stretch relative overflow-hidden p-3 transition-colors duration-300">
        <div className={`transition-all duration-300 flex flex-col h-full bg-white rounded-lg overflow-hidden relative ${getViewportWidth()}`}>
          {iframeSrc ? (
            <iframe
              ref={iframeRef}
              title="Web Application Preview"
              sandbox="allow-scripts"
              src={iframeSrc}
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-xs">
              Caricamento anteprima...
            </div>
          )}
        </div>
      </div>

      {/* Visual Workspace JS console logger */}
      <div className={`border-t border-slate-850 bg-slate-950 font-mono transition-all flex flex-col ${showConsole ? 'h-48' : 'h-10'}`}>
        
        {/* Console stats bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/90 border-b border-slate-850/80 text-xs select-none">
          <button
            onClick={() => setShowConsole(!showConsole)}
            className="flex items-center gap-2 hover:text-indigo-400 transition-all font-semibold text-slate-300 cursor-pointer text-left"
          >
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Console Javascript ({consoleLogs.length})</span>
          </button>

          {showConsole && (
            <div className="flex items-center gap-3">
              {/* Filter tabs */}
              <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-850/60 text-[10px]">
                <button
                  onClick={() => setConsoleFilter('all')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${consoleFilter === 'all' ? 'bg-slate-800 text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  Tutti
                </button>
                <button
                  onClick={() => setConsoleFilter('log')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${consoleFilter === 'log' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  Logs
                </button>
                <button
                  onClick={() => setConsoleFilter('warn')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${consoleFilter === 'warn' ? 'bg-slate-800 text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  Warns
                </button>
                <button
                  onClick={() => setConsoleFilter('error')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${consoleFilter === 'error' ? 'bg-slate-800 text-rose-400 font-semibold' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  Errors
                </button>
              </div>

              {/* Clear console log btn */}
              <button
                onClick={() => setConsoleLogs([])}
                title="Pulisci la Console"
                className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-all hover:bg-slate-900 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Console scroll list */}
        {showConsole && (
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800 text-[11px] leading-relaxed select-text">
            {filteredLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs text-center select-none">
                La console è vuota. Prova a scrivere console.log() nel JS.
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 border-b border-slate-900/40 pb-1 ${
                    log.type === 'error' ? 'text-rose-400 bg-rose-500/5 px-1.5 rounded' : 
                    log.type === 'warn' ? 'text-amber-400 bg-amber-500/5 px-1.5 rounded' : 
                    'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 select-none text-[10px] whitespace-nowrap pt-0.5">[{log.timestamp}]</span>
                  <span className="flex-1 whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        )}
      </div>

    </div>
  );
};
