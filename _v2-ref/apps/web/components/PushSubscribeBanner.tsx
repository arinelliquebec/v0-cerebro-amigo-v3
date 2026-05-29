'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

/**
 * Banner que aparece no topo da home do paciente pedindo permissão de push.
 *
 * Estados:
 *  - "verificando": carregando
 *  - "inscrito": já tem subscription, não mostra
 *  - "pode_pedir": pede permissão
 *  - "negado": mostra info pra reativar
 *  - "nao_suportado": não mostra
 */
export function PushSubscribeBanner() {
  const [estado, setEstado] = useState<'verificando' | 'inscrito' | 'pode_pedir' | 'negado' | 'nao_suportado'>('verificando')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    verificar()
  }, [])

  async function verificar() {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setEstado('nao_suportado')
      return
    }

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        setEstado('inscrito')
        return
      }
      const perm = Notification.permission
      if (perm === 'denied') setEstado('negado')
      else setEstado('pode_pedir')
    } catch {
      setEstado('nao_suportado')
    }
  }

  async function inscrever() {
    setCarregando(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setEstado(perm === 'denied' ? 'negado' : 'pode_pedir')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key as BufferSource,
      })

      const json = sub.toJSON()
      const res = await fetch('/api/paciente/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dhKey: json.keys?.p256dh,
          authKey: json.keys?.auth,
        }),
      })
      if (!res.ok) throw new Error('subscribe falhou')
      setEstado('inscrito')
    } catch (e) {
      console.error(e)
    } finally {
      setCarregando(false)
    }
  }

  if (estado === 'verificando' || estado === 'inscrito' || estado === 'nao_suportado') return null

  if (estado === 'negado') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3.5">
        <BellOff size={18} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="text-[14px] leading-relaxed text-amber-100">
          <p className="font-semibold text-amber-300">
            Notificações desativadas
          </p>
          <p className="mt-1 text-amber-200/80">
            Para receber lembretes da medicação, ative notificações nas configurações do navegador.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#00D9C0]/25 bg-[#00D9C0]/[0.08] px-4 py-3.5">
      <Bell size={18} className="mt-0.5 shrink-0 text-[#00D9C0]" />
      <div className="flex-1 text-[14px] leading-relaxed">
        <p className="font-semibold text-[#00D9C0]">
          Ativar lembretes
        </p>
        <p className="mt-1 text-[#D0D5D5]/90">
          Receba notificações da medicação no horário certo, mesmo com o app fechado.
        </p>
      </div>
      <button
        onClick={inscrever}
        disabled={carregando}
        className="inline-flex items-center gap-1.5 self-center rounded-lg bg-[#00D9C0] px-3.5 py-2 text-[13px] font-semibold text-[#0A0E0E] transition-all hover:bg-[#00D9C0]/90 disabled:opacity-50 disabled:cursor-wait"
        style={{ boxShadow: carregando ? 'none' : '0 0 16px rgba(0, 217, 192, 0.25)' }}
      >
        {carregando ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Ativando…
          </>
        ) : (
          'Ativar'
        )}
      </button>
    </div>
  )
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i)
  return buf
}
