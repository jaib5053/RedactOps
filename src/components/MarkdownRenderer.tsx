import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Parse inline tokens: **bold**, `code`, links [text](url)
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex matches inline code `...`, bold **...**, links [text](url)
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-slate-950 text-sky-300 font-mono text-xs border border-slate-800 font-medium"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="text-white font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 hover:text-sky-300 underline underline-offset-2 font-medium transition"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  // Parse lines into high-level blocks
  const lines = content.trim().split('\n');
  const blocks: React.ReactNode[] = [];
  let index = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Code blocks: ```
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <div key={index++} className="my-5 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Terminal / Code View</span>
            <span className="text-emerald-400">Verified Payload</span>
          </div>
          <pre className="p-4 text-xs sm:text-sm font-mono text-sky-300 overflow-x-auto leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 2. Horizontal divider: ---
    if (line.trim() === '---') {
      blocks.push(<hr key={index++} className="border-slate-800 my-8" />);
      continue;
    }

    // 3. Headings: #, ##, ###, ####
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={index++} className="text-lg sm:text-xl font-bold text-white tracking-tight mt-8 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>
          <span>{renderInline(line.replace('### ', ''))}</span>
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={index++} className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-10 mb-4 pb-2 border-b border-slate-800">
          {renderInline(line.replace('## ', ''))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      blocks.push(
        <h4 key={index++} className="text-base sm:text-lg font-semibold text-sky-400 mt-6 mb-2">
          {renderInline(line.replace('#### ', ''))}
        </h4>
      );
      continue;
    }

    // 4. Blockquotes: >
    if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={index++} className="border-l-4 border-sky-500 pl-4 py-2 bg-sky-950/20 rounded-r-lg my-4 text-slate-300 italic text-sm">
          {renderInline(line.replace(/^> /, ''))}
        </blockquote>
      );
      continue;
    }

    // 5. Unordered List: * or -
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const listItems: string[] = [line.trim().replace(/^[*\-]\s+/, '')];
      while (i + 1 < lines.length && (lines[i + 1].trim().startsWith('* ') || lines[i + 1].trim().startsWith('- '))) {
        i++;
        listItems.push(lines[i].trim().replace(/^[*\-]\s+/, ''));
      }
      blocks.push(
        <ul key={index++} className="space-y-2 my-4 pl-2 text-slate-300 text-sm sm:text-base leading-relaxed">
          {listItems.map((item, liIdx) => (
            <li key={liIdx} className="flex items-start space-x-2.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0"></span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Ordered List: 1. , 2. 
    if (/^\d+\.\s+/.test(line.trim())) {
      const listItems: string[] = [line.trim().replace(/^\d+\.\s+/, '')];
      while (i + 1 < lines.length && /^\d+\.\s+/.test(lines[i + 1].trim())) {
        i++;
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
      }
      blocks.push(
        <ol key={index++} className="space-y-3 my-5 pl-2 text-slate-300 text-sm sm:text-base leading-relaxed">
          {listItems.map((item, liIdx) => (
            <li key={liIdx} className="flex items-start space-x-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-sky-400 font-mono text-xs font-bold mt-0.5 flex-shrink-0">
                {liIdx + 1}
              </span>
              <span className="flex-1 pt-0.5">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Regular Paragraph (skip empty lines)
    if (line.trim().length > 0) {
      // Gather lines that belong to the same paragraph
      const paragraphLines: string[] = [line];
      while (
        i + 1 < lines.length &&
        lines[i + 1].trim().length > 0 &&
        !lines[i + 1].trim().startsWith('#') &&
        !lines[i + 1].trim().startsWith('```') &&
        !lines[i + 1].trim().startsWith('* ') &&
        !lines[i + 1].trim().startsWith('- ') &&
        !/^\d+\.\s+/.test(lines[i + 1].trim()) &&
        lines[i + 1].trim() !== '---'
      ) {
        i++;
        paragraphLines.push(lines[i]);
      }
      blocks.push(
        <p key={index++} className="text-slate-300 text-sm sm:text-base leading-relaxed my-3 font-normal">
          {renderInline(paragraphLines.join(' '))}
        </p>
      );
    }
  }

  return <div className="markdown-body space-y-2">{blocks}</div>;
};
