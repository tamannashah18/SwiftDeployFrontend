import React, { useMemo } from 'react';
import '../css/ConfigViewer.css';

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight syntax tokenizer — pure JS, zero external deps.
// Returns an array of { type, text } tokens for a single line.
// Types: keyword | string | number | comment | key | operator | plain
// ─────────────────────────────────────────────────────────────────────────────
function tokenizeLine(line, lang) {
  if (line === undefined || line === null) return [{ type: 'plain', text: '' }];
  const trimmed = line.trimStart();

  // ── Shared: comments ───────────────────────────────────────────────────────
  if ((lang === 'yaml' || lang === 'toml') && trimmed.startsWith('#')) {
    return [{ type: 'comment', text: line }];
  }

  // ── Dockerfile ─────────────────────────────────────────────────────────────
  if (lang === 'dockerfile') {
    if (trimmed.startsWith('#')) return [{ type: 'comment', text: line }];
    const kwMatch = trimmed.match(/^(FROM|RUN|CMD|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/i);
    if (kwMatch) {
      const kw = kwMatch[1];
      const kwStart = line.toUpperCase().indexOf(kw.toUpperCase());
      return [
        { type: 'plain',   text: line.substring(0, kwStart) },
        { type: 'keyword', text: kw },
        { type: 'plain',   text: line.substring(kwStart + kw.length) },
      ].filter(t => t.text !== '');
    }
    return [{ type: 'plain', text: line }];
  }

  // ── JSON ───────────────────────────────────────────────────────────────────
  if (lang === 'json') {
    const tokens = [];
    let rest = line;

    const leadWs = rest.match(/^(\s*)/)[1];
    if (leadWs) { tokens.push({ type: 'plain', text: leadWs }); rest = rest.slice(leadWs.length); }

    // Key: "something":
    const keyMatch = rest.match(/^("(?:[^"\\]|\\.)*")(\s*:)/);
    if (keyMatch) {
      tokens.push({ type: 'key',      text: keyMatch[1] });
      tokens.push({ type: 'operator', text: keyMatch[2] });
      rest = rest.slice(keyMatch[0].length);
    }

    const strM = rest.match(/^(\s*)("(?:[^"\\]|\\.)*")(.*)/s);
    const numM = rest.match(/^(\s*)(-?\d+\.?\d*(?:[eE][+-]?\d+)?)(.*)/);
    const kwM  = rest.match(/^(\s*)(true|false|null)(.*)/);
    const brM  = rest.match(/^(\s*)([\[\]{},])(.*)/);

    if      (strM) { tokens.push({ type: 'plain',   text: strM[1] }); tokens.push({ type: 'string',  text: strM[2] }); tokens.push({ type: 'plain', text: strM[3] }); }
    else if (numM) { tokens.push({ type: 'plain',   text: numM[1] }); tokens.push({ type: 'number',  text: numM[2] }); tokens.push({ type: 'plain', text: numM[3] }); }
    else if (kwM)  { tokens.push({ type: 'plain',   text: kwM[1]  }); tokens.push({ type: 'keyword', text: kwM[2]  }); tokens.push({ type: 'plain', text: kwM[3]  }); }
    else if (brM)  { tokens.push({ type: 'plain',   text: brM[1]  }); tokens.push({ type: 'operator',text: brM[2]  }); tokens.push({ type: 'plain', text: brM[3]  }); }
    else if (rest) { tokens.push({ type: 'plain',   text: rest    }); }

    return tokens.filter(t => t.text !== '');
  }

  // ── YAML ───────────────────────────────────────────────────────────────────
  if (lang === 'yaml') {
    if (trimmed === '---' || trimmed === '...') return [{ type: 'operator', text: line }];

    if (trimmed.startsWith('- ') || trimmed === '-') {
      const dashIdx = line.indexOf('-');
      return [
        { type: 'operator', text: line.substring(0, dashIdx + 1) },
        { type: 'plain',    text: line.substring(dashIdx + 1) },
      ];
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx + 1);
      const afterColon = line.substring(colonIdx + 1);
      const val = afterColon.trim();
      const tokens = [{ type: 'key', text: key }];

      if      (val.startsWith('"') || val.startsWith("'")) { tokens.push({ type: 'plain',   text: ' ' }); tokens.push({ type: 'string',  text: val }); }
      else if (/^-?\d/.test(val))                          { tokens.push({ type: 'plain',   text: ' ' }); tokens.push({ type: 'number',  text: val }); }
      else if (['true','false','null','~','yes','no'].includes(val)) { tokens.push({ type: 'plain', text: ' ' }); tokens.push({ type: 'keyword', text: val }); }
      else { tokens.push({ type: 'plain', text: afterColon }); }

      return tokens;
    }
    return [{ type: 'plain', text: line }];
  }

  // ── TOML ───────────────────────────────────────────────────────────────────
  if (lang === 'toml') {
    if (trimmed.startsWith('[')) return [{ type: 'keyword', text: line }];
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.substring(0, eqIdx + 1);
      const val = line.substring(eqIdx + 1).trim();
      const tokens = [{ type: 'key', text: key }];
      if      (val.startsWith('"') || val.startsWith("'")) tokens.push({ type: 'string',  text: ' ' + val });
      else if (/^-?\d/.test(val))                         tokens.push({ type: 'number',  text: ' ' + val });
      else if (val === 'true' || val === 'false')         tokens.push({ type: 'keyword', text: ' ' + val });
      else                                                tokens.push({ type: 'plain',   text: ' ' + val });
      return tokens;
    }
    return [{ type: 'plain', text: line }];
  }

  return [{ type: 'plain', text: line }];
}

function detectLang(fileName) {
  if (!fileName) return 'plain';
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.json'))                               return 'json';
  if (lower.endsWith('.yml') || lower.endsWith('.yaml'))     return 'yaml';
  if (lower.endsWith('.toml'))                               return 'toml';
  if (lower === 'dockerfile' || lower.endsWith('/dockerfile')) return 'dockerfile';
  return 'plain';
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfigViewer
// Props:
//   content  (string)  — raw file text
//   fileName (string)  — used for language detection
//   height   (string)  — optional CSS height override, default '100%'
// ─────────────────────────────────────────────────────────────────────────────
const ConfigViewer = ({ content, fileName, height = '100%' }) => {
  const lang  = useMemo(() => detectLang(fileName), [fileName]);
  const lines = useMemo(() => (content || '').split('\n'), [content]);
  const lineWidth = String(lines.length).length;

  return (
    <div className="cv-root" style={{ height }} aria-label={`Code viewer — ${fileName}`}>
      <table className="cv-table" cellSpacing={0} cellPadding={0}>
        <tbody>
          {lines.map((line, i) => {
            const tokens = lang !== 'plain'
              ? tokenizeLine(line, lang)
              : [{ type: 'plain', text: line }];

            return (
              <tr key={i} className="cv-row">
                <td
                  className="cv-line-number"
                  style={{ minWidth: `${lineWidth + 2}ch` }}
                  aria-hidden="true"
                  data-line={i + 1}
                >
                  {i + 1}
                </td>
                <td className="cv-line-content">
                  {tokens.map((tok, j) => (
                    <span key={j} className={`cv-tok cv-tok-${tok.type}`}>{tok.text}</span>
                  ))}
                  {/* Non-breaking space keeps empty lines at proper height */}
                  {tokens.every(t => !t.text) && <span>&nbsp;</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ConfigViewer;
