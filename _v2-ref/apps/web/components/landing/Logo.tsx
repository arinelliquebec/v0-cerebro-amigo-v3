import Link from 'next/link'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 group ${className}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:scale-110"
        style={{ filter: 'drop-shadow(0 0 8px rgba(0, 217, 192, 0.4))' }}
      >
        <path
          d="M14 2L3 9V19L14 26L25 19V9L14 2Z"
          stroke="#00D9C0"
          strokeWidth="1.5"
          fill="rgba(0, 217, 192, 0.08)"
        />
        <text
          x="14"
          y="18"
          textAnchor="middle"
          fill="#00D9C0"
          fontSize="13"
          fontFamily="Inter, sans-serif"
          fontWeight="700"
        >
          C
        </text>
      </svg>
      <span className="text-xl font-semibold tracking-tight">
        <span className="text-[#F5F7F7]">Cérebro</span>
        <span className="text-[#00D9C0]"> Amigo</span>
      </span>
    </Link>
  )
}
