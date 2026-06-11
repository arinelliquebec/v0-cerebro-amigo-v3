import type { MetadataRoute } from "next";

const BASE = "https://checkup.cerebroamigo.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/depressao`, lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/ansiedade`, lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/tdah-adulto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
  ];
}
