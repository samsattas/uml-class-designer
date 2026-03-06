export function highlightCode(code: string, classNames: string[]): string {
  if (!code) return '';
  
  let h = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const keywords = ['public', 'private', 'class', 'def', 'self', 'return', 'constructor', 'std::vector', 'std', 'vector', 'List', 'void', 'int', 'String', 'bool', 'boolean', 'float', 'double', 'long', 'pass', 'None', 'get', 'set'];
  const types = classNames.filter(t => t.length > 0);
  const escapedTypes = types.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  const kwPattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const typePattern = escapedTypes.join('|');

  const combinedRegex = new RegExp(
    `("(?:[^"\\\\]|\\\\.)*")|` + 
    `(\\/\\/.*|#.*)|` + 
    (kwPattern ? `\\b(${kwPattern})\\b|` : '') +
    (typePattern ? `\\b(${typePattern})\\b` : '(?!)'),
    'g'
  );

  return h.replace(combinedRegex, (match, str, com, kw, type) => {
    if (str) return `<span class="hl-string">${match}</span>`;
    if (com) return `<span class="hl-comment">${match}</span>`;
    if (kw) return `<span class="hl-keyword">${match}</span>`;
    if (type) return `<span class="hl-type">${match}</span>`;
    return match;
  });
}
