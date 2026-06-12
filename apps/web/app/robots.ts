import type { MetadataRoute } from "next";

const SITE_URL = "https://www.cerebroamigo.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/medico", "/precos", "/sobre", "/privacy", "/terms"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/p/",
          "/api/",
          "/login",
          "/ativar-conta",
          "/paciente",
          "/medicos/cadastro",
          "/sentry-example-page",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
