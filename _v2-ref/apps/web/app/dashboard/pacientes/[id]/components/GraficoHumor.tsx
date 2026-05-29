type PontoHumor = {
  data: string
  humor: number | null
  ansiedade: number | null
}

export function GraficoHumor({ dados }: { dados: PontoHumor[] }) {
  const max = 10
  const width = 600
  const height = 140
  const pad = 24

  const xStep = dados.length > 1 ? (width - 2 * pad) / (dados.length - 1) : 0

  const points = (key: 'humor' | 'ansiedade') =>
    dados
      .map((d, i) => {
        const v = d[key]
        if (v == null) return null
        const x = pad + i * xStep
        const y = height - pad - (v / max) * (height - 2 * pad)
        return x + ',' + y
      })
      .filter(Boolean)
      .join(' ')

  return (
    <svg
      viewBox={'0 0 ' + width + ' ' + height}
      className="w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Humor e ansiedade nos últimos 30 dias"
    >
      {[0, 5, 10].map((v) => {
        const y = height - pad - (v / max) * (height - 2 * pad)
        return (
          <g key={v}>
            <line
              x1={pad}
              x2={width - pad}
              y1={y}
              y2={y}
              stroke="rgba(0, 217, 192, 0.15)"
              strokeDasharray="2 4"
            />
            <text
              x={pad - 6}
              y={y + 3}
              fontSize="9"
              fill="rgba(154, 168, 168, 0.7)"
              textAnchor="end"
              fontFamily="Inter, sans-serif"
              fontWeight="500"
            >
              {v}
            </text>
          </g>
        )
      })}

      {/* Humor: cyan #00D9C0 */}
      <polyline
        points={points('humor')}
        fill="none"
        stroke="#00D9C0"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Ansiedade: red claro #F87171 */}
      <polyline
        points={points('ansiedade')}
        fill="none"
        stroke="#F87171"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
