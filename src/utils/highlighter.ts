/**
 * Custom ultra-lightweight and robust Syntax Highlighter for HTML, CSS, and JavaScript.
 * Built to work with a double-layered Textarea syntax highlighting overlay.
 * Uses placeholder-based token isolation to prevent double-matching and ensure fast performance.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function highlightCode(code: string, language: 'html' | 'css' | 'js'): string {
  if (!code) return '<span class="text-slate-500">Vuoto ...</span>';
  
  // First escape HTML entities to render code safely and prevent script injection in current context
  let escaped = escapeHtml(code);
  const placeholders: { [key: string]: string } = {};
  let placeholderCounter = 0;

  const saveToken = (content: string) => {
    const id = `___TOKEN_HL_${placeholderCounter++}___`;
    placeholders[id] = content;
    return id;
  };

  if (language === 'html') {
    // 1. Isolate HTML Comments: <!-- ... -->
    escaped = escaped.replace(/&lt;!--([\s\S]*?)--&gt;/g, (match) => {
      return saveToken(`<span class="text-slate-500">${match}</span>`);
    });

    // 2. Isolate attributes values (strings in double or single quotes inside tags)
    // We look for patterns like `class="xyz"` as `class=&quot;xyz&quot;` or `class=&#039;xyz&#039;`
    // We match and preserve the equal sign and any surrounding spaces exactly
    escaped = escaped.replace(/(=)(\s*)(&quot;[\s\S]*?&quot;)/g, (match, eq, spaces, quoted) => {
      return eq + spaces + saveToken(`<span class="text-emerald-400">${quoted}</span>`);
    });
    escaped = escaped.replace(/(=)(\s*)(&#039;[\s\S]*?&#039;)/g, (match, eq, spaces, quoted) => {
      return eq + spaces + saveToken(`<span class="text-emerald-400">${quoted}</span>`);
    });

    // 3. Highlight HTML Tags & Attribute Names
    // Tag open/close: &lt;tag or &lt;/tag
    escaped = escaped.replace(/&lt;(\/?[a-zA-Z0-9:-]+)/g, (_, tagName) => {
      return `&lt;<span class="text-rose-400">${tagName}</span>`;
    });

    // Tag end boundaries: &gt; or /&gt;
    escaped = escaped.replace(/(\/?&gt;)/g, '<span class="text-slate-400">$1</span>');

    // Attribute names: match alphabetical characters preceding placeholder tokens with `=` sign
    // After step 2, we have: `class___TOKEN_HL_x___`
    escaped = escaped.replace(/([a-zA-Z0-9:-]+)(?=___TOKEN_HL_)/g, (match) => {
      return `<span class="text-amber-400">${match}</span>`;
    });

  } else if (language === 'css') {
    // 1. Isolate CSS Comments: /* ... */
    escaped = escaped.replace(/\/\*([\s\S]*?)\*\//g, (match) => {
      return saveToken(`<span class="text-slate-500">${match}</span>`);
    });

    // 2. Isolate CSS strings: "..." or '...'
    escaped = escaped.replace(/&quot;([\s\S]*?)&quot;/g, (_, val) => {
      return saveToken(`<span class="text-emerald-400">&quot;${val}&quot;</span>`);
    });
    escaped = escaped.replace(/&#039;([\s\S]*?)&#039;/g, (_, val) => {
      return saveToken(`<span class="text-emerald-400">&#039;${val}&#039;</span>`);
    });

    // 3. Highlight Properties and Values inside brackets { ... }
    // We capture the brackets and all their contents, then highlight properties and values
    // by preserving every space, newline, tab, and hyphen 100% exactly.
    escaped = escaped.replace(/\{([\s\S]*?)\}/g, (match, inner) => {
      let formattedInner = inner;

      // Match a valid CSS property name followed by optional whitespace, standard colon, optional whitespace, and then the property value
      formattedInner = formattedInner.replace(/([a-zA-Z0-9_\-]+)(\s*:\s*)([^;]+)/g, (m, prop, colonAndSpace, val) => {
        // Highlight numbers and units inside val, keeping characters and spacing intact
        let formattedVal = val.replace(/(\b\d+(px|em|rem|%|s|ms|deg)?\b|#[0-9a-fA-F]{3,8})/g, '<span class="text-pink-400">$1</span>');
        // Highlight standard CSS keywords
        formattedVal = formattedVal.replace(/\b(absolute|relative|fixed|block|flex|grid|none|inline|important)\b/g, '<span class="text-amber-300">$1</span>');
        
        return `<span class="text-indigo-300">${prop}</span>${colonAndSpace}<span class="text-orange-300">${formattedVal}</span>`;
      });

      return `{${formattedInner}}`;
    });

    // 4. Highlight Selectors: class, ID, pseudo selectors
    // Class names: .text-slate
    escaped = escaped.replace(/(\.[a-zA-Z-0-9_():\-\\\/]+)/g, '<span class="text-sky-400">$1</span>');
    // ID names: #my-id
    escaped = escaped.replace(/(#[a-zA-Z-0-9_]+)/g, '<span class="text-amber-400">$1</span>');
    // Pseudo classes/selectors:hover, :active, ::after, ::before
    escaped = escaped.replace(/(::?[a-zA-Z-]+)/g, '<span class="text-violet-400">$1</span>');

  } else if (language === 'js') {
    // 1. Isolate Single and Multiline Comments
    escaped = escaped.replace(/\/\*([\s\S]*?)\*\//g, (match) => {
      return saveToken(`<span class="text-slate-500">${match}</span>`);
    });
    // Single line comments (must be done carefully to avoid breaking URLs like https://)
    // We match // unless preceded by an alphanumeric/special URL characters, let's match standard comments:
    escaped = escaped.replace(/(^|[^\s:])\/\/([^\n]*)/g, (match, prefix, commentBody) => {
      return prefix + saveToken(`<span class="text-slate-500">//${commentBody}</span>`);
    });

    // 2. Isolate Strings: "...", '...', `...`
    escaped = escaped.replace(/&quot;([\s\S]*?)&quot;/g, (_, val) => {
      return saveToken(`<span class="text-emerald-400">&quot;${val}&quot;</span>`);
    });
    escaped = escaped.replace(/&#039;([\s\S]*?)&#039;/g, (_, val) => {
      return saveToken(`<span class="text-emerald-400">&#039;${val}&#039;</span>`);
    });
    escaped = escaped.replace(/`([\s\S]*?)`/g, (_, val) => {
      return saveToken(`<span class="text-emerald-400">\`${val}\`</span>`);
    });

    // 3. Keywords highlight - wrapped in saveToken to protect them from downstream passes
    const keywords = [
      'const', 'let', 'var', 'function', 'return', 'class', 'extends', 'new', 'this',
      'if', 'else', 'switch', 'case', 'break', 'continue', 'default',
      'try', 'catch', 'finally', 'throw', 'error',
      'async', 'await', 'import', 'export', 'from'
    ];
    const keywordsRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    escaped = escaped.replace(keywordsRegex, (_, match) => {
      return saveToken(`<span class="text-indigo-400">${match}</span>`);
    });

    // 4. Built-ins and Globals highlight - wrapped in saveToken
    const builtins = [
      'console', 'log', 'error', 'warn', 'info', 'document', 'window', 'fetch', 'response',
      'addEventListener', 'querySelector', 'querySelectorAll', 'getElementById', 'setTimeout', 'setInterval',
      'JSON', 'stringify', 'parse', 'localStorage', 'getItem', 'setItem', 'removeItem', 'Object', 'Array', 'String', 'Number', 'Promise'
    ];
    const builtinsRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
    escaped = escaped.replace(builtinsRegex, (_, match) => {
      return saveToken(`<span class="text-sky-400">${match}</span>`);
    });

    // 5. Constants & Numbers: true, false, null, undefined, and values - wrapped in saveToken
    escaped = escaped.replace(/\b(true|false|null|undefined)\b/g, (_, match) => {
      return saveToken(`<span class="text-amber-400">${match}</span>`);
    });
    
    // Now highlight numbers (since all text inside HTML class names of existing elements is safe within placeholder tokens, this is completely protected!)
    escaped = escaped.replace(/\b(\d+)\b/g, (_, match) => {
      return saveToken(`<span class="text-pink-400">${match}</span>`);
    });
  }

  // Restore saved placeholders in reverse order (to handle nested or sequential ones)
  const placeholderIds = Object.keys(placeholders).reverse();
  for (const id of placeholderIds) {
    escaped = escaped.replace(new RegExp(id, 'g'), placeholders[id]);
  }

  return escaped;
}
