import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Image,
} from "@react-pdf/renderer";

const SCALE_NAMES: Record<string, string> = {
  phq9: "PHQ-9 — Triagem de Depressão",
  gad7: "GAD-7 — Triagem de Ansiedade Generalizada",
  asrs18: "ASRS-18 — Triagem de TDAH (adulto)",
};

const CRISIS_RESOURCES = [
  "CVV — 188 (24h, gratuito) | chat: cvv.org.br",
  "SAMU — 192 (emergência)",
  "CAPS ou pronto-socorro mais próximo",
];

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", padding: 48, fontSize: 10, color: "#0F2137" },
  header: { marginBottom: 24 },
  brand: { fontSize: 8, color: "#5E4B8B", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  date: { fontSize: 8, color: "#64748B" },
  disclaimer: {
    backgroundColor: "#EFEAF6",
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    fontSize: 9,
    color: "#4A3A70",
  },
  crisisBox: {
    backgroundColor: "#FEF2F2",
    border: "1 solid #FECACA",
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  crisisTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#7F1D1D", marginBottom: 6 },
  crisisItem: { fontSize: 9, color: "#991B1B", marginBottom: 3 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#5E4B8B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  table: { border: "1 solid #E2E8F0", borderRadius: 4, marginBottom: 20 },
  row: { flexDirection: "row", borderBottom: "1 solid #F1F5F9", padding: "8 12" },
  rowLast: { flexDirection: "row", padding: "8 12" },
  cellLabel: { flex: 1, fontSize: 9, color: "#64748B" },
  cellValue: { flex: 2, fontSize: 9, fontFamily: "Helvetica-Bold" },
  qrSection: { marginTop: 20, alignItems: "center" },
  qrLabel: { fontSize: 8, color: "#64748B", marginTop: 6, textAlign: "center" },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, borderTop: "1 solid #E2E8F0", paddingTop: 8, fontSize: 7, color: "#94A3B8" },
});

interface CheckupPDFProps {
  scale: string;
  score: number;
  band: string;
  label: string;
  crisis: boolean;
  rid: string;
}

export function CheckupPDF({ scale, score, band, label, crisis, rid }: CheckupPDFProps) {
  // Landing do médico = /medico (singular). www direto evita o hop apex->www no QR escaneado.
  // src=checkup + rid permitem atribuição (qr_scanned / médicos por 1000 testes) sem identificar o paciente.
  const qrUrl = `https://www.cerebroamigo.com.br/medico?src=checkup&rid=${rid}`;
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Document title="Relatório de Triagem — Check-up Mental">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>Cérebro Amigo · Check-up Mental</Text>
          <Text style={styles.title}>{SCALE_NAMES[scale] ?? "Triagem de Saúde Mental"}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>

        {/* Crisis resources — sempre visíveis se crisisFlag */}
        {crisis && (
          <View style={styles.crisisBox}>
            <Text style={styles.crisisTitle}>Canais de apoio disponíveis 24h</Text>
            {CRISIS_RESOURCES.map((r, i) => (
              <Text key={i} style={styles.crisisItem}>• {r}</Text>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>
            Este relatório é baseado em instrumento de triagem — não é diagnóstico e não substitui avaliação por profissional de saúde mental qualificado. Leve este documento ao seu médico ou psicólogo para uma avaliação completa.
          </Text>
        </View>

        {/* Resultado */}
        <Text style={styles.sectionTitle}>Resultado da triagem</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Instrumento</Text>
            <Text style={styles.cellValue}>{SCALE_NAMES[scale] ?? scale}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Escore total</Text>
            <Text style={styles.cellValue}>{score}</Text>
          </View>
          <View style={styles.rowLast}>
            <Text style={styles.cellLabel}>Faixa</Text>
            <Text style={styles.cellValue}>{label || band}</Text>
          </View>
        </View>

        {/* QR para médicos — omitido em versão crise */}
        {!crisis && rid && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Para seu médico</Text>
            <Text style={styles.qrLabel}>
              Escaneie o QR abaixo para ver mais sobre o Check-up Mental e como ele pode complementar a consulta.
            </Text>
            <Text style={[styles.qrLabel, { color: "#5E4B8B", marginTop: 4 }]}>{qrUrl}</Text>
          </View>
        )}

        {/* Crisis resources at bottom for non-crisis mode too (subtle) */}
        {!crisis && (
          <View style={{ marginTop: 24, padding: 10, backgroundColor: "#F8FAFC", borderRadius: 4 }}>
            <Text style={{ fontSize: 8, color: "#64748B" }}>
              Em qualquer momento, se você precisar de apoio: CVV 188 (24h) · cvv.org.br · SAMU 192
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Cérebro Amigo by Arinelli · © 2026 — Check-up Mental (checkup.cerebroamigo.com.br). Documento gerado automaticamente. Uso pessoal e confidencial.</Text>
        </View>
      </Page>
    </Document>
  );
}
