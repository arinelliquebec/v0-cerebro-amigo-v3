"use client";

import { useState } from "react";
import { triggerServerError } from "./actions";

export default function SentryExamplePage() {
  const [status, setStatus] = useState<string>("");

  const throwClientError = () => {
    setStatus("Lançando erro no client...");
    setTimeout(() => {
      throw new Error("Sentry Example Client Error");
    }, 100);
  };

  const callServerError = async () => {
    setStatus("Chamando Server Action com erro...");
    try {
      await triggerServerError();
    } catch (e: unknown) {
      setStatus(
        `Server Action falhou (expected): ${e instanceof Error ? e.message : String(e)}`
      );
    }
  };

  const callUndefinedFunction = () => {
    setStatus("Chamando função inexistente...");
    // @ts-expect-error — propósito do teste
    myUndefinedFunction();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">🎯 Sentry Verification</h1>
      <p className="text-muted-foreground max-w-md text-center">
        Clique nos botões abaixo para disparar erros de teste. Se o DSN do
        Sentry estiver configurado, os erros aparecerão no dashboard em ~30s.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={throwClientError}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Throw Client Error
        </button>

        <button
          onClick={callServerError}
          className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
        >
          Trigger Server Action Error
        </button>

        <button
          onClick={callUndefinedFunction}
          className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
        >
          Call Undefined Function
        </button>
      </div>

      {status && (
        <div className="mt-4 rounded border p-4 text-sm">
          <strong>Status:</strong> {status}
        </div>
      )}
    </div>
  );
}
