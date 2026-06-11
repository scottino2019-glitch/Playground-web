import React, { useState, useRef, useEffect } from 'react';
import { Copy, Trash2, Code, Search, Sparkles, Check, WrapText } from 'lucide-react';
import { highlightCode } from '../utils/highlighter';

interface CodeEditorProps {
  id: string;
  title: string;
  language: 'html' | 'css' | 'js';
  value: string;
  onChange: (value: string) => void;
  accentColor: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  id,
  title,
  language,
  value,
  onChange,
  accentColor,
}) => {
  const [lineCount, setLineCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [wrapText, setWrapText] = useState(true);
  const [selectionCount, setSelectionCount] = useState({ lines: 0, chars: 0 });
  
  // Custom states replacing native browser popups and hover menu instabilities
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineGutterRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const snippetsRef = useRef<HTMLDivElement>(null);

  // Close snippets dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (snippetsRef.current && !snippetsRef.current.contains(e.target as Node)) {
        setShowSnippets(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Synchronize gutter scrolling and highlighted pre block with textarea scrolling
  const handleScroll = () => {
    if (textareaRef.current) {
      if (lineGutterRef.current) {
        lineGutterRef.current.scrollTop = textareaRef.current.scrollTop;
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  };

  // Sync scroll on mount/updates as well
  useEffect(() => {
    handleScroll();
  }, [value]);

  // Read lines
  useEffect(() => {
    const lines = value.split('\n').length;
    setLineCount(lines > 0 ? lines : 1);
  }, [value]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Errore durante la copia:', err);
    }
  };

  const handleClear = () => {
    setShowClearConfirm(true);
  };

  // Quick UI code snippets to inject
  const snippets = {
    html: [
      { label: 'Bottone', code: '<button class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-medium transition-all active:scale-95 shadow-md">Clicca</button>' },
      { label: 'Contenitore Flex', code: '<div class="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-slate-100 rounded-2xl">\n  <p>Elemento sinistra</p>\n  <p>Elemento destra</p>\n</div>' },
      { label: 'Griglia Immagini', code: '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">\n  <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80" alt="Spiaggia" class="rounded-xl w-full h-48 object-cover hover:scale-102 transition-all" referrerPolicy="no-referrer" />\n  <img src="https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=80" alt="Montagna" class="rounded-xl w-full h-48 object-cover hover:scale-102 transition-all" referrerPolicy="no-referrer" />\n  <img src="https://images.unsplash.com/photo-1472214222541-d510753a4707?auto=format&fit=crop&w=400&q=80" alt="Natura" class="rounded-xl w-full h-48 object-cover hover:scale-102 transition-all" referrerPolicy="no-referrer" />\n</div>' },
      { label: 'Input Form', code: '<div class="space-y-2">\n  <label class="block text-sm font-semibold text-slate-700">Contatto Email</label>\n  <input type="email" placeholder="esempio@email.com" class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />\n</div>' },
    ],
    css: [
      { label: 'Centra Elemento', code: '/* Centra perfettamente elementi figli */\n.centra-tutto {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 200px;\n}' },
      { label: 'Sfondo Sfumato', code: '.sfondo-gradient {\n  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%);\n}' },
      { label: 'Effetto Vetro (Glass)', code: '.glass-card {\n  background: rgba(255, 255, 255, 0.45);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.2);\n}' },
      { label: 'Testo Neon Glow', code: '.testo-neon {\n  color: #34d399;\n  text-shadow: 0 0 5px rgba(52, 211, 153, 0.8), 0 0 15px rgba(52, 211, 153, 0.4);\n}' },
    ],
    js: [
      { label: 'Selettori e Click', code: '// Gestore click bottone\nconst bottone = document.querySelector("#idBottone");\nbottone.addEventListener("click", () => {\n  console.log("Bottone cliccato!");\n});' },
      { label: 'Fetch Dati API', code: 'async function caricaDati() {\n  try {\n    const response = await fetch("https://jsonplaceholder.typicode.com/posts/1");\n    const data = await response.json();\n    console.log("Dati caricati:", data);\n  } catch (error) {\n    console.error("Errore caricamento:", error);\n  }\n}' },
      { label: 'Counter Dinamico', code: 'let counter = 0;\nfunction incrementa() {\n  counter++;\n  const el = document.getElementById("numero");\n  if (el) el.textContent = counter;\n}' },
    ],
  };

  const handleSnippetInsert = (code: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textBefore = value.substring(0, startPos);
    const textAfter = value.substring(endPos, value.length);

    const newValue = textBefore + code + textAfter;
    onChange(newValue);
    setShowSnippets(false); // Close dropdown immediately

    // Let React re-render, then set cursor past inserted code
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = startPos + code.length;
      textarea.selectionEnd = startPos + code.length;
    }, 50);
  };

  const handleSearch = () => {
    if (!searchTerm) return;
    const txt = value;
    const idx = txt.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx !== -1) {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(idx, idx + searchTerm.length);
        // Scroll to make sure it's visible estimation
        const line = txt.substring(0, idx).split('\n').length;
        textarea.scrollTop = (line - 3) * 20; // roughly 20px per line
      }
    }
  };

  const handleReplace = () => {
    if (!searchTerm) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText.toLowerCase() === searchTerm.toLowerCase()) {
      const newVal = value.substring(0, start) + replaceTerm + value.substring(end);
      onChange(newVal);
      // set cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + replaceTerm.length);
      }, 50);
    } else {
      // Find and replace first occurrence
      const idx = value.toLowerCase().indexOf(searchTerm.toLowerCase());
      if (idx !== -1) {
        const newVal = value.substring(0, idx) + replaceTerm + value.substring(idx + searchTerm.length);
        onChange(newVal);
      }
    }
  };

  const handleReplaceAll = () => {
    if (!searchTerm) return;
    // Replace all with global regex
    try {
      const srcEscaped = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(srcEscaped, 'gi');
      const newVal = value.replace(regex, replaceTerm);
      onChange(newVal);
      console.log(`Sostituite tutte le occorrenze di "${searchTerm}" con "${replaceTerm}"`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTextareaSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    if (!selectedText) {
      setSelectionCount({ lines: 0, chars: 0 });
      return;
    }
    const lines = selectedText.split('\n').length;
    setSelectionCount({ lines, chars: selectedText.length });
  };

  // Keyboard shorcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Support Tab key indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const space = '  '; // 2 spaces for tab
      const newVal = value.substring(0, start) + space + value.substring(end);
      onChange(newVal);

      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + space.length;
        textarea.selectionEnd = start + space.length;
      }, 50);
    }

    // Toggle search on Control + F
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowSearch(prev => !prev);
    }
  };

  return (
    <div id={`editor-container-${id}`} className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all focus-within:ring-1 focus-within:ring-indigo-500/50">
      
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-850 border-b border-slate-800 select-none">
        
        <div className="flex items-center gap-2">
          {/* Accent square denoting file type */}
          <span className={`w-2.5 h-2.5 rounded ${accentColor}`}></span>
          <span className="font-mono text-xs font-semibold text-slate-200 uppercase tracking-wider">{title}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          
          {/* Quick Snippets Dropdown */}
          <div className="relative" ref={snippetsRef}>
            <button 
              onClick={() => setShowSnippets(prev => !prev)}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-all text-[11px] flex items-center gap-1 font-medium cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Snippets</span>
            </button>
            
            {showSnippets && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 z-30 transition-all animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 border-b border-slate-900 uppercase">
                  Inserisci Snippet
                </div>
                {snippets[language].map((snippet, i) => (
                  <button
                    key={i}
                    onClick={() => handleSnippetInsert(snippet.code)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-400 transition-all font-medium border-b border-slate-900/30 last:border-0 cursor-pointer"
                  >
                    {snippet.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Line Wrap Toggle */}
          <button
            onClick={() => setWrapText(!wrapText)}
            title={wrapText ? "Disattiva a capo automatico" : "Attiva a capo automatico"}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${wrapText ? 'text-indigo-500 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'}`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            title="Cerca e Sostituisci (Ctrl+F)"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${showSearch ? 'text-indigo-500 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'}`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title={`Copia codice ${title}`}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            title={`Ripulisci ${title}`}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>

      {/* Search and Replace bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-850 flex flex-col md:flex-row gap-2 items-stretch md:items-center">
          <div className="flex-1 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Trova..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-200 outline-none focus:border-indigo-500 transition-all"
            />
            <button
              onClick={handleSearch}
              className="px-2 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
            >
              Trova
            </button>
          </div>
          <div className="flex-1 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Sostituisci con..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-200 outline-none focus:border-indigo-500 transition-all"
            />
            <div className="flex gap-1">
              <button
                onClick={handleReplace}
                className="px-2 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded cursor-pointer"
              >
                Sostituisci
              </button>
              <button
                onClick={handleReplaceAll}
                className="px-2 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
              >
                Tutti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative font-mono text-[13px] leading-[20px]">
        {/* Line Numbers Column */}
        <div
          ref={lineGutterRef}
          className="w-12 bg-slate-950/40 text-slate-600 text-right pr-3 pl-1 py-4 border-r border-slate-850/60 select-none overflow-hidden scrollbar-none"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="h-[20px] pr-0.5">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Input Wrapper containing identical overlapping pre (backdrop) + textarea (input layer) */}
        <div className="flex-1 relative overflow-hidden h-full bg-slate-900/30">
          {/* Highlight Viewer Backdrop */}
          <pre
            ref={highlightRef}
            className={`absolute inset-0 px-4 py-4 pointer-events-none select-none text-slate-100 font-mono text-[13px] leading-[20px] overflow-hidden ${
              wrapText ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-hidden'
            }`}
            dangerouslySetInnerHTML={{ __html: highlightCode(value, language) }}
          />

          {/* Code Input Layer (transparent text, visible caret) */}
          <textarea
            ref={textareaRef}
            className={`absolute inset-0 w-full h-full px-4 py-4 bg-transparent text-transparent caret-indigo-400 outline-none resize-none overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700 font-mono text-[13px] leading-[20px] ${
              wrapText ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
            }`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onSelect={handleTextareaSelection}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            placeholder={`${title} - Scrivi qui...`}
          />
        </div>
      </div>

      {/* Editor Status Bar */}
      <div className="px-4 py-1.5 bg-slate-950 text-[10px] text-slate-500 border-t border-slate-850 font-mono flex justify-between items-center select-none">
        <div>
          <span>{value.length} caratteri</span>
          <span className="mx-2">•</span>
          <span>{lineCount} righe</span>
        </div>
        {selectionCount.chars > 0 && (
          <div className="text-indigo-400">
            Selezionati: {selectionCount.chars} car ({selectionCount.lines} righe)
          </div>
        )}
        <div className="capitalize font-semibold text-slate-400">{language}</div>
      </div>

      {/* Clear Code Custom dialog replacement for blocked window.confirm */}
      {showClearConfirm && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-45 flex flex-col items-center justify-center p-4 text-center select-none animate-in fade-in duration-200">
          <div className="p-3 bg-rose-500/10 rounded-full text-rose-500 mb-2">
            <Trash2 className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="text-xs font-bold text-slate-100 mb-1">Vuoi svuotare {title}?</h4>
          <p className="text-[10px] text-slate-400 max-w-[210px] leading-relaxed mb-4">Questa dicitura cancellerà istantaneamente il codice di questo compilatore.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
            >
              Annulla
            </button>
            <button
              onClick={() => {
                onChange('');
                setShowClearConfirm(false);
              }}
              className="px-3.5 py-1.5 bg-rose-650 hover:bg-rose-600 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-all shadow-md shadow-rose-650/10"
            >
              Ripulisci
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};
