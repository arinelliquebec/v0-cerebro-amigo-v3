import { redirect } from "next/navigation"

// Fluxo B (cobrança médico→paciente) estacionado — ADR-034: a relação financeira
// médico↔paciente fica com o médico. UI desativada; redireciona pro dashboard.
export default function FinanceiroDesativado() {
  redirect("/dashboard")
}
