// Healthcheck consumido pelo docker-compose (deploy/compose.snippet.yaml).

export async function GET() {
  return Response.json({ status: "ok", service: "checkup" });
}
