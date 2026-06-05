import { ComunidadeFeed } from "@/components/rede/comunidade-feed"

export default async function ComunidadePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ComunidadeFeed slug={slug} />
}
