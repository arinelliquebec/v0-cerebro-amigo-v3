export const metadata = {
  title: 'Política de Privacidade',
}

export default function PrivacidadePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Política de Privacidade</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <div className="prose prose-zinc max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">1. Quem somos</h2>
          <p>
            Cérebro Amigo (CNPJ 65.703.101/0001-74) é uma plataforma de cuidado
            contínuo entre consultas psiquiátricas. Esta política descreve como
            coletamos, usamos e protegemos seus dados pessoais conforme a Lei Geral
            de Proteção de Dados (LGPD — Lei 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">2. Dados que coletamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Número de WhatsApp (necessário para comunicação)</li>
            <li>Nome, e-mail e CPF (quando fornecidos)</li>
            <li>Conteúdo de mensagens trocadas com a plataforma</li>
            <li>Registros de humor, sintomas e diário</li>
            <li>Medicações prescritas pelo seu/sua médico(a)</li>
            <li>Histórico de tomadas de medicação</li>
            <li>Respostas a questionários clínicos (PHQ-9, GAD-7)</li>
            <li>Logs de acesso (IP, navegador, horário) para segurança</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">3. Como usamos seus dados</h2>
          <p>
            Seus dados são usados <strong>exclusivamente</strong> para:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Atendê-lo e oferecer continuidade entre consultas</li>
            <li>Permitir ao seu/sua médico(a) ver sua evolução clínica</li>
            <li>Cumprir obrigações fiscais e de prontuário</li>
            <li>Garantir segurança da plataforma</li>
          </ul>
          <p>
            <strong>Nunca</strong> vendemos, alugamos ou compartilhamos seus dados
            para fins de marketing, seguradoras, empregadores ou terceiros não
            autorizados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">4. Tratamento por inteligência artificial</h2>
          <p>
            Usamos serviços de IA (Anthropic Claude e Microsoft Azure OpenAI) para
            processar suas mensagens. Esses provedores podem manter dados em
            servidores fora do Brasil. Nossos contratos garantem que <strong>seus
            dados não são usados para treinar modelos de IA</strong>.
          </p>
          <p>
            A IA nunca diagnostica nem prescreve — apenas auxilia na coleta e
            organização de informação. Toda decisão clínica é exclusiva do seu/sua
            médico(a).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">5. Onde os dados ficam</h2>
          <p>
            Banco de dados na Microsoft Azure, região Brazil South (São Paulo),
            criptografados em repouso e em trânsito (TLS). Backups por 7 dias,
            também criptografados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">6. Tempo de retenção</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Conversas e registros clínicos: até 20 anos (CFM 1.638/2002)</li>
            <li>Notas fiscais: prazo legal fiscal aplicável</li>
            <li>Logs de acesso: 6 meses</li>
            <li>Conta inativa: pode ser anonimizada após 2 anos sem uso, mediante aviso prévio</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">7. Seus direitos (LGPD)</h2>
          <p>Você tem direito a, a qualquer momento:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Acessar</strong> todos os seus dados</li>
            <li><strong>Corrigir</strong> informações desatualizadas ou incorretas</li>
            <li><strong>Solicitar exclusão</strong> (respeitando prazos legais de prontuário)</li>
            <li><strong>Revogar consentimento</strong> e cessar uso da plataforma</li>
            <li><strong>Portabilidade</strong> dos seus dados</li>
            <li><strong>Saber com quem compartilhamos</strong> seus dados</li>
            <li><strong>Reclamar</strong> à Autoridade Nacional de Proteção de Dados (ANPD)</li>
          </ul>
          <p>
            Para exercer qualquer direito, escreva para{' '}
            <a href="mailto:privacidade@cerebroamigo.com.br" className="text-brand-700 underline">
              privacidade@cerebroamigo.com.br
            </a>. Respondemos em até 15 dias.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">8. Encarregado de Dados (DPO)</h2>
          <p>
            Encarregado pelo Tratamento de Dados: [Nome do DPO] —{' '}
            <a href="mailto:privacidade@cerebroamigo.com.br" className="text-brand-700 underline">
              privacidade@cerebroamigo.com.br
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">9. Crianças e adolescentes</h2>
          <p>
            Cérebro Amigo é validado para uso em adultos. Para uso pediátrico ou
            adolescente, é necessário consentimento dos responsáveis legais.
            Consulte seu/sua médico(a).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">10. Mudanças nesta política</h2>
          <p>
            Esta política pode ser atualizada periodicamente. Mudanças relevantes
            serão comunicadas com pelo menos 30 dias de antecedência via e-mail
            ou notificação no app.
          </p>
        </section>
      </div>
    </main>
  )
}
