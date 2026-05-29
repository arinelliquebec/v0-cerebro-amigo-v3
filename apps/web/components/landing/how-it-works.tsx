'use client'

import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { ClipboardList, Smartphone, ShieldAlert, Brain } from 'lucide-react'

const steps = [
  {
    number: '01',
    label: 'Consulta',
    icon: ClipboardList,
    title: 'Plano de acompanhamento',
    description:
      'Médico registra frequência de check-ins, medicações e metas clínicas. Ponto de partida do ciclo.',
  },
  {
    number: '02',
    label: 'Entre consultas',
    icon: Smartphone,
    title: 'Acompanhamento automático',
    description:
      'Sistema envia check-ins no intervalo definido. Paciente responde pelo celular, sem precisar instalar app.',
  },
  {
    number: '03',
    label: 'Monitoramento',
    icon: ShieldAlert,
    title: 'IA monitora e alerta',
    description:
      'IA analisa respostas em tempo real. Em sinal de risco, médico é notificado imediatamente com protocolo fixo e aprovado.',
  },
  {
    number: '04',
    label: 'Pré-retorno',
    icon: Brain,
    title: 'Briefing pré-consulta com IA',
    description:
      'IA consolida humor, aderência e eventos do intervalo num briefing estruturado. Médico chega ao retorno preparado, sem improvisar.',
    highlight: true,
  },
]

export function HowItWorks() {
  return (
    <Timeline
      sx={{
        p: 0,
        m: 0,
        [`& .MuiTimelineItem-root:before`]: { flex: 0, padding: 0 },
      }}
    >
      {steps.map((step, i) => {
        const Icon = step.icon
        const isLast = i === steps.length - 1

        return (
          <TimelineItem key={step.number}>
            <TimelineOppositeContent
              sx={{
                flex: '0 0 96px',
                pt: '18px',
                pr: 3,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              <Chip
                label={step.label}
                size="small"
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  bgcolor: step.highlight ? '#14B8A6' : '#F0F9F8',
                  color: step.highlight ? '#fff' : '#14B8A6',
                  border: '1px solid',
                  borderColor: step.highlight ? '#14B8A6' : '#14B8A6/20',
                  height: 24,
                }}
              />
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot
                sx={{
                  m: 0,
                  p: '10px',
                  bgcolor: step.highlight ? '#14B8A6' : '#F0F9F8',
                  border: '2px solid',
                  borderColor: step.highlight ? '#14B8A6' : '#E2E8F0',
                  boxShadow: step.highlight
                    ? '0 0 0 4px rgba(20,184,166,0.15)'
                    : 'none',
                }}
              >
                <Icon
                  size={18}
                  style={{ color: step.highlight ? '#fff' : '#14B8A6' }}
                />
              </TimelineDot>
              {!isLast && (
                <TimelineConnector
                  sx={{ bgcolor: '#E2E8F0', width: '2px' }}
                />
              )}
            </TimelineSeparator>

            <TimelineContent sx={{ pb: isLast ? 0 : 4, pt: '10px', pl: 3 }}>
              <Typography
                variant="overline"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#14B8A6',
                  lineHeight: 1,
                  display: { xs: 'block', sm: 'none' },
                  mb: 0.5,
                }}
              >
                {step.label}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: '#0F2137',
                  lineHeight: 1.3,
                  mb: 0.75,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                }}
              >
                {step.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748B',
                  lineHeight: 1.65,
                  maxWidth: 480,
                  fontSize: '0.875rem',
                }}
              >
                {step.description}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
