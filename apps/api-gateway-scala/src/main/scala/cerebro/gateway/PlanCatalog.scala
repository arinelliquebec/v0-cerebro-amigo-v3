package cerebro.gateway

/** Catálogo de planos — porte fiel de `Services/PlanCatalog.cs` (ADR-059).
  * Fonte da verdade server-side; constante, sem tabela, sem migration.
  * O que escala por preço é a CAMADA DE IA doctor-facing, fatiada por tier.
  * Plano nulo/legado/desconhecido = nenhuma feature de IA (fail-safe de custo).
  */
object FeatureKeys:
  val BriefingIa = "briefing_ia"
  val IaInsights = "ia_insights"
  val Rag        = "rag"
  val Escriba    = "escriba"

  /** Toda a camada de IA (= o que o Master inclui). */
  val CamadaIa: Set[String] = Set(BriefingIa, IaInsights, Rag, Escriba)
  /** Essencial: só o gostinho de IA (briefing). */
  val Essencial: Set[String] = Set(BriefingIa)
  /** Pro: briefing + insights + RAG. Sem escriba. */
  val Pro: Set[String] = Set(BriefingIa, IaInsights, Rag)
  /** Master: toda a IA, incluindo escriba. */
  val Master: Set[String] = CamadaIa

final case class PlanoCatalogo(
    codigo: String,
    label: String,
    valorCiclo: BigDecimal,
    valorMensalEquivalente: BigDecimal,
    cycle: String,
    selfCheckout: Boolean,
    features: Set[String],
)

object PlanCatalog:
  // Chaves comparadas case-insensitive (.NET usa StringComparer.OrdinalIgnoreCase).
  val planos: Map[String, PlanoCatalogo] = Map(
    "starter"    -> PlanoCatalogo("starter", "Essencial", 397.00, 397.00, "MONTHLY", true, FeatureKeys.Essencial),
    "pro"        -> PlanoCatalogo("pro", "Pro", 597.00, 597.00, "MONTHLY", true, FeatureKeys.Pro),
    "master"     -> PlanoCatalogo("master", "Master", 997.00, 997.00, "MONTHLY", true, FeatureKeys.Master),
    // Clínica (legado): alias fora do self-checkout, herda toda a IA.
    "enterprise" -> PlanoCatalogo("enterprise", "Clínica (legado)", 0.00, 0.00, "MONTHLY", false, FeatureKeys.CamadaIa),
  )

  def tryGet(codigo: Option[String]): Option[PlanoCatalogo] =
    codigo.map(_.toLowerCase).flatMap(planos.get)

  def cycleDe(codigo: Option[String]): String = tryGet(codigo).map(_.cycle).getOrElse("MONTHLY")

  /** Códigos que o médico pode assinar sozinho (Essencial + Pro + Master). */
  def codigosSelfCheckout: List[String] = planos.values.filter(_.selfCheckout).map(_.codigo).toList

  /** Features de IA liberadas pelo plano. Nulo/legado/desconhecido = nenhuma. */
  def featuresDe(codigo: Option[String]): List[String] = tryGet(codigo).map(_.features.toList).getOrElse(Nil)

  /** O plano tem a feature? (default fail-safe: nulo/desconhecido = sem IA.) */
  def temFeature(codigo: Option[String], featureKey: String): Boolean =
    tryGet(codigo).exists(_.features.contains(featureKey))
