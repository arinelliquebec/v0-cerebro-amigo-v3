// docker-bake.hcl — define os 7 targets de build do Cérebro Amigo V3.
// Usado pelo deploy.yml com docker/bake-action para builds paralelos + cache GHA.
// IMAGE_TAG é injetado via env pelo CI (${{ github.sha }}).

variable "ECR" {
  default = "004177894935.dkr.ecr.sa-east-1.amazonaws.com"
}

variable "TAG" {
  default = "latest"
}

// Grupos por destino de deploy (ADR-045): o clínico vai pro box EC2 via SSM;
// o checkup vai pro ASG próprio. deploy.yml builda só o grupo que mudou.
//   "clinical" → box clínico (compose/SSM)
//   "checkup"  → ASG cerebro-checkup-asg (instance refresh)
//   "default"  → os 6 (build completo manual)
group "default" {
  targets = ["web", "api-gateway", "api-gateway-scala", "orchestrator-py", "agents-py", "notifier-py", "checkup"]
}

group "clinical" {
  targets = ["web", "api-gateway", "api-gateway-scala", "orchestrator-py", "agents-py", "notifier-py"]
}

group "checkup" {
  targets = ["checkup"]
}

target "web" {
  context    = "."
  dockerfile = "apps/web/Dockerfile"
  tags       = ["${ECR}/cerebro-amigo/web:${TAG}"]
  platforms  = ["linux/amd64"]
}

target "api-gateway" {
  context    = "apps/api-gateway"
  dockerfile = "Dockerfile"
  tags       = ["${ECR}/cerebro-amigo/api-gateway:${TAG}"]
  platforms  = ["linux/amd64"]
}

// Fatia strangler do gateway (ADR-067). Build via `sbt stage` (multi-stage no
// Dockerfile do módulo). Coexiste com o target api-gateway (.NET).
target "api-gateway-scala" {
  context    = "apps/api-gateway-scala"
  dockerfile = "Dockerfile"
  tags       = ["${ECR}/cerebro-amigo/api-gateway-scala:${TAG}"]
  platforms  = ["linux/amd64"]
}

target "orchestrator-py" {
  context    = "apps/orchestrator-py"
  dockerfile = "Dockerfile"
  tags       = ["${ECR}/cerebro-amigo/orchestrator-py:${TAG}"]
  platforms  = ["linux/amd64"]
}

target "agents-py" {
  context    = "apps/agents-py"
  dockerfile = "Dockerfile"
  tags       = ["${ECR}/cerebro-amigo/agents-py:${TAG}"]
  platforms  = ["linux/amd64"]
}

target "notifier-py" {
  context    = "apps/notifier-py"
  dockerfile = "Dockerfile"
  tags       = ["${ECR}/cerebro-amigo/notifier-py:${TAG}"]
  platforms  = ["linux/amd64"]
}

target "checkup" {
  context    = "."
  dockerfile = "apps/checkup/Dockerfile"
  tags       = ["${ECR}/cerebro-amigo/checkup:${TAG}"]
  platforms  = ["linux/amd64"]
}
