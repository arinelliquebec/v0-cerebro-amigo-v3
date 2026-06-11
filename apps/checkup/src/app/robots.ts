import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/depressao", "/ansiedade", "/tdah-adulto"],
        disallow: ["/teste/", "/resultado", "/crise", "/api/"],
      },
    ],
    sitemap: "https://checkup.cerebroamigo.com.br/sitemap.xml",
  };
}
