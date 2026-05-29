type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }

function parseMarkdown(source: string, tituloHeader?: string): Block[] {
  let lines = source.split('\n').map((l) => l.replace(/\r$/, ''))

  if (tituloHeader && lines[0]?.startsWith('## ')) {
    const h2Text = lines[0].slice(3).trim()
    if (h2Text === tituloHeader.trim()) {
      lines = lines.slice(1)
    }
  }

  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
      i++
    } else if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() })
      i++
    } else if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2).trim())
        i++
      }
      blocks.push({ type: 'ul', items })
    } else if (
      line.startsWith('|') &&
      i + 1 < lines.length &&
      /^\|[\s\-:|]+\|$/.test(lines[i + 1].trim())
    ) {
      const headers = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim())
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i].replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim())
        if (cells.some((c) => c.length > 0)) rows.push(cells)
        i++
      }
      blocks.push({ type: 'table', headers, rows })
    } else {
      const paraLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].startsWith('##') &&
        !lines[i].startsWith('- ') &&
        !lines[i].startsWith('|')
      ) {
        paraLines.push(lines[i].trim())
        i++
      }
      if (paraLines.length) {
        blocks.push({ type: 'p', text: paraLines.join(' ') })
      }
    }
  }
  return blocks
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[#F5F7F7]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function Markdown({ source, tituloHeader }: { source: string; tituloHeader?: string }) {
  const blocks = parseMarkdown(source, tituloHeader)
  return (
    <div className="space-y-3.5">
      {blocks.map((block, i) => {
        if (block.type === 'h2') {
          return (
            <h3 key={i} className="mt-6 text-[22px] font-bold tracking-tight leading-tight text-[#F5F7F7]">
              {renderInline(block.text)}
            </h3>
          )
        }
        if (block.type === 'h3') {
          return (
            <h4 key={i} className="mt-6 mb-1 flex items-center gap-2.5 text-[16px] font-semibold tracking-tight text-[#00D9C0]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00D9C0]" />
              {block.text}
            </h4>
          )
        }
        if (block.type === 'p') {
          return (
            <p key={i} className="text-[15px] leading-relaxed text-[#D0D5D5]">
              {renderInline(block.text)}
            </p>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={i} className="space-y-2 pl-5">
              {block.items.map((item, j) => (
                <li key={j} className="relative text-[15px] leading-relaxed text-[#D0D5D5] before:absolute before:-left-4 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#00D9C0]/60">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'table') {
          return (
            <div key={i} className="overflow-x-auto rounded-xl border border-[#00D9C0]/[0.12]">
              <table className="w-full text-[15px]">
                <thead className="bg-[#0A0E0E]">
                  <tr>
                    {block.headers.map((h, j) => (
                      <th key={j} className="border-b border-[#00D9C0]/[0.12] px-4 py-3 text-left text-[12px] font-medium tracking-wide text-[#9AA8A8]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-[#00D9C0]/[0.08] last:border-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-3 text-[15px] text-[#D0D5D5]">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
