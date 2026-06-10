import { Templates } from './types';

export const templates: Templates = {
  stopwatch: {
    name: "Cronometro Neon",
    description: "Un cronometro dal design moderno neon, realizzato con Tailwind CSS e Javascript interattivo.",
    html: `<!-- Cronometro Digitale Neon -->
<div class="min-h-full bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
  <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
    
    <!-- Glow effect behind -->
    <div class="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>
    
    <div class="text-center relative z-10">
      <h2 class="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-2">Esercitazione JS</h2>
      <h1 class="text-3xl font-extrabold text-white mb-6">Stopwatch</h1>
      
      <!-- Display -->
      <div class="bg-slate-950/80 border border-slate-800 rounded-2xl py-8 px-6 mb-8 shadow-inner">
        <span id="display" class="font-mono text-5xl font-semibold text-emerald-400 tracking-wider">00:00:00.<span class="text-2xl text-emerald-500/60">00</span></span>
      </div>
      
      <!-- Controls -->
      <div class="flex items-center justify-center gap-4 mb-6">
        <button id="resetBtn" class="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-sm font-semibold text-slate-300">
          Reset
        </button>
        <button id="startStopBtn" class="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95 transition-all font-bold shadow-lg shadow-emerald-500/20">
          Avvia
        </button>
        <button id="lapBtn" class="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-sm font-semibold text-slate-300">
          Giro
        </button>
      </div>
      
      <!-- Lap List -->
      <div id="lapsContainer" class="hidden text-left border-t border-slate-800/80 pt-4 max-h-40 overflow-y-auto">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Giri Registrati</h3>
        <ul id="lapsList" class="space-y-1.5 font-mono text-sm text-slate-400">
          <!-- Dynamically filled -->
        </ul>
      </div>
    </div>
  </div>
</div>`,
    css: `/* Effetto barra scorrimento per i giri */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

#display {
  text-shadow: 0 0 15px rgba(52, 211, 153, 0.3);
}

.lap-item {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
`,
    js: `// Logica del Cronometro
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let laps = [];

const display = document.getElementById("display");
const startStopBtn = document.getElementById("startStopBtn");
const resetBtn = document.getElementById("resetBtn");
const lapBtn = document.getElementById("lapBtn");
const lapsContainer = document.getElementById("lapsContainer");
const lapsList = document.getElementById("lapsList");

function timeToString(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);

  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);

  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);

  let diffInMs = (diffInSec - ss) * 100;
  let ms = Math.floor(diffInMs);

  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");
  let formattedMS = ms.toString().padStart(2, "0");

  return \`\${formattedMM}:\${formattedSS}.<span class="text-2xl text-emerald-500/60">\${formattedMS}</span>\`;
}

function print(txt) {
  display.innerHTML = txt;
}

function start() {
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(function printTime() {
    elapsedTime = Date.now() - startTime;
    print(timeToString(elapsedTime));
  }, 10);
  
  startStopBtn.textContent = "Pausa";
  startStopBtn.classList.remove("bg-emerald-500", "hover:bg-emerald-400");
  startStopBtn.classList.add("bg-amber-500", "hover:bg-amber-400");
  
  isRunning = true;
}

function pause() {
  clearInterval(timerInterval);
  startStopBtn.textContent = "Avvia";
  startStopBtn.classList.remove("bg-amber-500", "hover:bg-amber-400");
  startStopBtn.classList.add("bg-emerald-500", "hover:bg-emerald-400");
  isRunning = false;
}

function reset() {
  clearInterval(timerInterval);
  print("00:00.<span class=\"text-2xl text-emerald-500/60\">00</span>");
  elapsedTime = 0;
  laps = [];
  lapsList.innerHTML = "";
  lapsContainer.classList.add("hidden");
  
  startStopBtn.textContent = "Avvia";
  startStopBtn.classList.remove("bg-amber-500", "hover:bg-amber-400");
  startStopBtn.classList.add("bg-emerald-500", "hover:bg-emerald-400");
  isRunning = false;
  console.log("Cronometro resettato");
}

function recordLap() {
  if (!isRunning) return;
  laps.push(elapsedTime);
  lapsContainer.classList.remove("hidden");
  
  const lapElement = document.createElement("li");
  lapElement.className = "flex justify-between items-center py-1 border-b border-slate-800/40 lap-item";
  
  // Format cumulative lap time to copyable text
  let rawTime = timeToString(elapsedTime).replace(/<[^>]*>/g, "");
  
  lapElement.innerHTML = \`
    <span class="text-slate-500">Giro \${laps.length}</span>
    <span class="font-semibold text-slate-200">\${rawTime}</span>
  \`;
  
  lapsList.prepend(lapElement);
  console.log(\`Giro registrato: Giro \${laps.length} -> \${rawTime}\`);
}

// Event Listeners
startStopBtn.addEventListener("click", () => {
  if (isRunning) {
    pause();
    console.log("Cronometro in pausa");
  } else {
    start();
    console.log("Cronometro avviato");
  }
});

resetBtn.addEventListener("click", reset);
lapBtn.addEventListener("click", recordLap);
`
  },
  todo: {
    name: "Interactive To-Do List",
    description: "Un'applicazione To-Do elegante, dotata di salvataggio in sessione ed effetti dinamici moderni.",
    html: `<!-- Applicazione Todo List -->
<div class="min-h-full bg-slate-50 text-slate-800 p-6 flex items-center justify-center font-sans">
  <div class="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-100">
    
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Le mie Attività</h1>
        <p class="text-xs text-slate-400 mt-1" id="dateDisplay">Oggi</p>
      </div>
      <div class="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">
        <span id="countBadge">0</span>
      </div>
    </div>
    
    <!-- Input Form -->
    <form id="todoForm" class="flex gap-2 mb-6">
      <input 
        type="text" 
        id="todoInput" 
        placeholder="Aggiungi una nuova attività..." 
        required
        class="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all focus:bg-white"
      />
      <button 
        type="submit"
        class="h-11 w-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-indigo-600/10 hover:scale-105 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </form>
    
    <!-- Tasks List -->
    <ul id="todoList" class="space-y-2 max-h-80 overflow-y-auto pr-1">
      <!-- Built dynamically -->
    </ul>
    
    <!-- Empty State -->
    <div id="emptyState" class="py-8 text-center text-slate-400">
      <p class="text-sm font-medium">Nessuna attività in lista 🎉</p>
      <p class="text-xs text-slate-400 mt-0.5">Scrivine una sopra e premi '+' per aggiungerla!</p>
    </div>
  </div>
</div>`,
    css: `/* Todo custom styling and transition styles */
.todo-item {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.done {
  background-color: #f8fafc !important;
  border-color: #f1f5f9 !important;
  opacity: 0.6;
}

.done span {
  text-decoration: line-through;
  color: #94a3b8;
}
`,
    js: `// Todo list controller
const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const emptyState = document.getElementById("emptyState");
const countBadge = document.getElementById("countBadge");
const dateDisplay = document.getElementById("dateDisplay");

// Set formatted today date
const today = new Date();
dateDisplay.textContent = today.toLocaleDateString("it-IT", { 
  weekday: 'long', 
  day: 'numeric', 
  month: 'long' 
});

let todos = [];

function updateUI() {
  todoList.innerHTML = "";
  
  if (todos.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }
  
  // Count incomplete
  const pending = todos.filter(t => !t.completed).length;
  countBadge.textContent = pending;
  
  todos.forEach((todo, idx) => {
    const li = document.createElement("li");
    li.className = \`todo-item flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl hover:shadow-sm \${todo.completed ? "done" : ""}\`;
    
    li.innerHTML = \`
      <div class="flex items-center gap-3">
        <input 
          type="checkbox" 
          \${todo.completed ? "checked" : ""} 
          class="h-4.5 w-4.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all cursor-pointer"
          data-index="\${idx}"
        />
        <span class="text-sm font-medium text-slate-700 transition-all">\${escapeHtml(todo.text)}</span>
      </div>
      <button 
        class="delete-btn text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-100 active:scale-90 transition-all"
        data-index="\${idx}"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>
    \`;
    
    // Checkbox toggling
    const checkbox = li.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", (e) => {
      const index = parseInt(e.target.dataset.index);
      toggleTodo(index);
    });
    
    // Delete event
    const deleteBtn = li.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      // Find exact button target
      const btn = e.currentTarget;
      const index = parseInt(btn.dataset.index);
      deleteTodo(index);
    });
    
    todoList.appendChild(li);
  });
}

function addTodo(text) {
  todos.push({ text, completed: false });
  console.log("Attività aggiunta: '" + text + "'");
  updateUI();
}

function toggleTodo(index) {
  todos[index].completed = !todos[index].completed;
  console.log("Attività '" + todos[index].text + "' segnata come " + (todos[index].completed ? "completata" : "incompleta"));
  updateUI();
}

function deleteTodo(index) {
  const deleted = todos.splice(index, 1);
  console.log("Attività rimossa: '" + deleted[0].text + "'");
  updateUI();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

// Form Handlers
todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = todoInput.value.trim();
  if (val) {
    addTodo(val);
    todoInput.value = "";
  }
});

// Seed Initial Items
addTodo("Esplorare il Playground Web 🎨");
addTodo("Modificare l'HTML per vedere la preview in tempo reale ⚡");
addTodo("Aggiungere classi CSS personalizzate o Tailwind!");
`
  },
  card: {
    name: "Card Tailwind Animata",
    description: "Una splendida card profilo interattiva con effetti hover, ideale per esercitarsi con Tailwind e micro-transizioni.",
    html: `<!-- Card Profilo Tailwind -->
<div class="min-h-full bg-slate-900 flex items-center justify-center p-6 text-slate-100 font-sans">
  <div class="relative group w-full max-w-sm">
    
    <!-- Pulsing glow behind card on hover -->
    <div class="absolute -inset-1.5 bg-gradient-to-r from-pink-600 to-violet-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
    
    <!-- Main Card Body -->
    <div class="relative px-7 py-8 bg-slate-950 border border-slate-800 rounded-2xl leading-none flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            Sviluppatore Web
          </span>
          <span class="text-xs text-slate-500 font-mono">Disponibile</span>
        </div>
        
        <div class="flex items-center space-x-4 mt-6">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80" 
            referrerPolicy="no-referrer"
            alt="Profilo avatar" 
            class="w-16 h-16 rounded-full border-2 border-violet-500 object-cover shadow-md"
          />
          <div>
            <h3 class="text-lg font-bold text-slate-100 tracking-tight" id="profileName">Sofia Rossi</h3>
            <p class="text-sm text-slate-400 mt-0.5">Frontend Engineer &amp; Designer</p>
          </div>
        </div>
        
        <p class="text-slate-400 text-sm leading-relaxed mt-6">
          Creo esperienze web interattive e ad alte prestazioni utilizzando tecnologie moderne come React, Tailwind CSS e animazioni personalizzate.
        </p>
        
        <div class="grid grid-cols-3 gap-3 my-6 text-center border-y border-slate-800/80 py-4">
          <div>
            <span class="block text-lg font-bold text-slate-100">42+</span>
            <span class="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Progetti</span>
          </div>
          <div>
            <span class="block text-lg font-bold text-slate-100">8.9k</span>
            <span class="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Followers</span>
          </div>
          <div>
            <span class="block text-lg font-bold text-slate-100" id="likeCounter">254</span>
            <span class="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Likes</span>
          </div>
        </div>
      </div>
      
      <div class="flex space-x-3">
        <button 
          id="btnSegui"
          class="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all duration-200 active:scale-95 shadow-md shadow-violet-600/10 cursor-pointer"
        >
          Segui
        </button>
        <button 
          id="btnLike"
          class="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-pink-500 transition-all active:scale-95 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 inline-block text-pink-500" id="heartIcon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>`,
    css: `/* Custom profile styling and animation helper */
@keyframes tilt {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(1deg); }
}

.animate-tilt {
  animation: tilt 6s infinite linear;
}
`,
    js: `// Interactive Like and Follow logic
let likes = 254;
let isLiked = false;
let isFollowing = false;

const likeCounter = document.getElementById("likeCounter");
const btnLike = document.getElementById("btnLike");
const heartIcon = document.getElementById("heartIcon");
const btnSegui = document.getElementById("btnSegui");
const profileName = document.getElementById("profileName");

btnLike.addEventListener("click", () => {
  isLiked = !isLiked;
  if (isLiked) {
    likes++;
    heartIcon.setAttribute("fill", "currentColor");
    console.log("Sofia Rossi ha ricevuto il tuo Like!");
  } else {
    likes--;
    heartIcon.setAttribute("fill", "none");
    console.log("Hai rimosso il Like.");
  }
  likeCounter.textContent = likes;
});

btnSegui.addEventListener("click", () => {
  isFollowing = !isFollowing;
  if (isFollowing) {
    btnSegui.textContent = "Seguito";
    btnSegui.classList.remove("bg-violet-600", "hover:bg-violet-500");
    btnSegui.classList.add("bg-slate-800", "text-slate-300", "border", "border-slate-700");
    console.log("Ora segui Sofia Rossi!");
  } else {
    btnSegui.textContent = "Segui";
    btnSegui.classList.remove("bg-slate-800", "text-slate-300", "border", "border-slate-700");
    btnSegui.classList.add("bg-violet-600", "hover:bg-violet-500");
    console.log("Hai smesso di seguire Sofia Rossi.");
  }
});

// Aggiungiamo un log iniziale dimostrativo
console.log("Card Profilo caricata con successo.");
`
  },
  blank: {
    name: "Modello Vuoto",
    description: "Inizia da zero con un modello vuoto preconfigurato per HTML5, CSS e JS.",
    html: `<!-- Scrivi il tuo HTML qui! -->
<div class="p-8 text-center bg-slate-50 min-h-full flex flex-col justify-center items-center">
  <h1 class="text-3xl font-extrabold text-indigo-600">Benvenuto nel Playground!</h1>
  <p class="text-slate-500 mt-2">Inizia a scrivere codice HTML, CSS e JavaScript nei riquadri.</p>
  
  <button id="myBtn" class="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 active:scale-95 transition-all shadow-md">
    Cliccami!
  </button>
</div>`,
    css: `/* Scrivi il tuo CSS personalizzato qui! (Ispirati ai migliori design) */
body {
  font-family: system-ui, sans-serif;
  transition: background-color 0.3s;
}
`,
    js: `// Scrivi il tuo Javascript qui!
const btn = document.getElementById("myBtn");

btn.addEventListener("click", () => {
  console.log("Pulsante cliccato! Fantastico!");
  alert("Evviva! Il codice funziona! Guarda anche i log in basso nella console.");
});
`
  }
};
