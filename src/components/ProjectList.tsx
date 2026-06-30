import React, { useState } from 'react';
import { Project, Templates } from '../types';
import { templates } from '../templates';
import { FileCode, Trash2, FolderOpen, Plus, Save, Download, Upload, HelpCircle, AlertCircle } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onSaveProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onLoadTemplate: (templateKey: keyof typeof templates) => void;
  onImportProject: (imported: Project) => void;
  onCreateNewProject: (name: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onSaveProject,
  onDeleteProject,
  onLoadTemplate,
  onImportProject,
  onCreateNewProject,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showImportError, setShowImportError] = useState(false);
  
  const [createdProjectName, setCreatedProjectName] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onSaveProject(newProjectName.trim());
      setNewProjectName('');
      setShowSaveModal(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createdProjectName.trim()) {
      onCreateNewProject(createdProjectName.trim());
      setCreatedProjectName('');
      setShowNewProjectModal(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = JSON.parse(text) as Project;
        
        // Basic schema check
        if (imported && imported.html !== undefined && imported.css !== undefined && imported.js !== undefined) {
          onImportProject(imported);
          setShowImportError(false);
          alert(`Progetto "${imported.name}" importato con successo!`);
        } else {
          setShowImportError(true);
        }
      } catch (err) {
        console.error(err);
        setShowImportError(true);
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be re-imported
    e.target.value = '';
  };

  return (
    <div id="project-manager" className="bg-transparent select-none space-y-4 p-3">
      
      {/* Templates Quick Load Heading */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
          <SparkleIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Esercitazioni e Template</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(Object.keys(templates) as Array<keyof typeof templates>).map((key) => {
            const temp = templates[key];
            return (
              <button
                key={key}
                onClick={() => onLoadTemplate(key)}
                className="group flex flex-col text-left p-2.5 rounded-lg bg-slate-850 hover:bg-indigo-950/20 hover:border-indigo-500/50 border border-slate-800/80 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">Usa</span>
                </div>
                <span className="font-bold text-[11px] text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1">{temp.name}</span>
                <span className="text-[9px] text-slate-500 leading-normal mt-0.5 line-clamp-2">{temp.description}</span>
              </button>
            );
          })}
        </div>
      </div>
 
      {/* Projects list - header controls */}
      <div className="border-t border-slate-800/50 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>I Miei Codici ({projects.length})</span>
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5">I codici sono memorizzati automaticamente nel browser.</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            
            {/* New Project button */}
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-600/10"
              title="Crea un nuovo progetto vuoto da zero"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuovo Progetto</span>
            </button>

            {/* Save state button */}
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-650/10"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salva Come...</span>
            </button>

            {/* Import JSON button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 border border-slate-750">
              <Upload className="w-3.5 h-3.5" />
              <span>Importa file</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Import error overlay message */}
        {showImportError && (
          <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl mb-3 flex gap-2 items-center text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>File JSON non valido per il Playground. Assicurati che contenga HTML, CSS e JS corretti.</span>
          </div>
        )}

        {/* Saved items list */}
        {projects.length === 0 ? (
          <div className="text-center py-6 bg-slate-950/30 border border-dashed border-slate-800 rounded-xl select-none">
            <p className="text-xs text-slate-500">Nessun progetto salvato in locale.</p>
            <p className="text-[10px] text-slate-600 mt-1">Usa il pulsante "Salva Come..." per catturare l'istanza di codice corrente!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              return (
                <div
                  key={proj.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isActive 
                      ? 'bg-zinc-850/80 border-indigo-500 shadow-md shadow-indigo-500/5' 
                      : 'bg-slate-850 border-slate-800 hover:border-slate-750'
                  }`}
                >
                  <button
                    onClick={() => onSelectProject(proj.id)}
                    className="flex-1 text-left cursor-pointer mr-2 overflow-hidden"
                  >
                    <span className={`block font-bold text-xs truncate ${isActive ? 'text-indigo-400' : 'text-slate-200'}`}>
                      {proj.name}
                    </span>
                    <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                      Aggiornato: {new Date(proj.updatedAt).toLocaleTimeString('it-IT')} del {new Date(proj.updatedAt).toLocaleDateString('it-IT')}
                    </span>
                  </button>

                  <button
                    onClick={() => onDeleteProject(proj.id)}
                    title="Elimina"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800/50 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save project overlay popup modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h4 className="text-sm font-bold text-slate-200 mb-2">Salva Progetto Attuale</h4>
            <p className="text-xs text-slate-400 mb-4">Inserisci un nome descrittivo per memorizzare la sessione attuale.</p>
            
            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="es. Bottone Animato Fluido"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-indigo-500 transition-all"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Salva Progetto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New blank project overlay popup modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Crea Nuovo Progetto Vuoto</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4">Inizia un nuovo progetto da zero con file HTML, CSS e JS completamente vuoti.</p>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="es. Esercizio Calcolatrice"
                required
                value={createdProjectName}
                onChange={(e) => setCreatedProjectName(e.target.value)}
                autoFocus
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-emerald-500 transition-all"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Crea Progetto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Simple visual spark bullet
const SparkleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);
