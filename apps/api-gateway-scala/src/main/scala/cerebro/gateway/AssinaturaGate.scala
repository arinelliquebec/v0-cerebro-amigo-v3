package cerebro.gateway

import java.time.Instant

/** Avalia se a assinatura do médico libera o dashboard — porte fiel de
  * `Services/AssinaturaGate.cs` (ADR-055). Função pura.
  *
  * INVARIANTE CLÍNICA (clinical-safety #2 e #3): vale SOMENTE para a UI do
  * dashboard do médico. NUNCA para crise, portal do paciente, chamadas internas
  * nem auth. Em status desconhecido/ausente, falha ABERTO (libera) de propósito:
  * bloquear por engano (cegar o médico para a crise de um paciente em prazo) é
  * pior do que liberar uma tela a mais.
  */
final case class AssinaturaSituacao(
    liberado: Boolean,
    emPrazo: Boolean,
    motivo: String,
    diasRestantes: Option[Int],
    trialReadOnly: Boolean = false,
)

object AssinaturaGate:

  /** Avalia a situação e deriva o estado "trial read-only" (ADR-065): médico recém
    * cadastrado, em prazo, AINDA SEM plano pago. Quem já tem plano pago (código
    * conhecido no catálogo) nunca é read-only.
    */
  def avaliar(
      status: Option[String],
      prazoPagamentoAte: Option[Instant],
      trialAte: Option[Instant],
      nowUtc: Instant,
      plano: Option[String],
  ): AssinaturaSituacao =
    val sit          = avaliarBase(status, prazoPagamentoAte, trialAte, nowUtc)
    val temPlanoPago = PlanCatalog.tryGet(plano).isDefined
    val trialReadOnly =
      sit.liberado &&
        (sit.motivo == "pendente_em_prazo" || sit.motivo == "pendente_sem_prazo") &&
        !temPlanoPago
    sit.copy(trialReadOnly = trialReadOnly)

  private def avaliarBase(
      status: Option[String],
      prazoPagamentoAte: Option[Instant],
      trialAte: Option[Instant],
      nowUtc: Instant,
  ): AssinaturaSituacao =
    status.getOrElse("").trim.toLowerCase match
      case "ativa" =>
        AssinaturaSituacao(true, false, "ativa", None)

      case "pendente" =>
        prazoPagamentoAte match
          // Sem prazo gravado: defensivo, libera com aviso (não bloqueia por dado ausente).
          case None => AssinaturaSituacao(true, true, "pendente_sem_prazo", None)
          case Some(p) =>
            if !p.isBefore(nowUtc) then AssinaturaSituacao(true, true, "pendente_em_prazo", Some(diasAte(p, nowUtc)))
            else AssinaturaSituacao(false, false, "pendente_vencido", Some(0))

      case "trial" => // legado (ADR-055 depreca; mantido p/ assinaturas antigas)
        trialAte match
          case None => AssinaturaSituacao(true, true, "trial_legado", None)
          case Some(t) =>
            if !t.isBefore(nowUtc) then AssinaturaSituacao(true, true, "trial_legado", Some(diasAte(t, nowUtc)))
            else AssinaturaSituacao(false, false, "trial_vencido", Some(0))

      case "suspensa"  => AssinaturaSituacao(false, false, "suspensa", None)
      case "cancelada" => AssinaturaSituacao(false, false, "cancelada", None)

      // Fail-open clínico: status estranho/ausente nunca bloqueia.
      case _ => AssinaturaSituacao(true, false, "desconhecido", None)

  private def diasAte(alvo: Instant, nowUtc: Instant): Int =
    val millisPorDia = 86_400_000.0
    math.max(0, math.ceil((alvo.toEpochMilli - nowUtc.toEpochMilli).toDouble / millisPorDia).toInt)
