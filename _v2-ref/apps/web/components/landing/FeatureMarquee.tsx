'use client'

const features = [
  "lembretes",
  "diário",
  "humor",
  "prescrição",
  "timeline",
  "protocolo de crise",
  "pré-consulta",
  "adesão",
];

export function FeatureMarquee() {
  const items = [...features, ...features, ...features, ...features];

  return (
    <div className="w-full h-16 bg-[#00D9C0]/[0.04] border-y border-[#00D9C0]/10 flex items-center overflow-hidden marquee-container">
      <div className="flex items-center animate-marquee whitespace-nowrap">
        {items.map((feature, i) => (
          <span key={i} className="flex items-center gap-4 mx-4">
            <span className="text-lg font-medium text-[#F5F7F7]">{feature}</span>
            <span className="text-[#00D9C0]/50 text-sm">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
