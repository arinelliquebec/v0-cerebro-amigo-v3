// docker-bake.hcl — define os 6 targets de build do Cérebro Amigo V3.
// Usado pelo deploy.yml com docker/bake-action para builds paralelos + cache GHA.
// IMAGE_TAG é injetado via env pelo CI (${{ github.sha }}).

variable "ECR" {
  default = "004177894935.dkr.ecr.sa-east-1.amazonaws.com"
}

variable "TAG" {
  default = "latest"
}

// Grupo "default" constrói e pusha os 6 serviços em paralelo.
// bake-action sem target explícito resolve este grupo.
group "default" {
  targets = ["web", "api-gateway", "orchestrator-py", "agents-py", "notifier-py", "checkup"]
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
