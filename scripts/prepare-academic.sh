#!/usr/bin/env bash
# Prepare metadata/entity registries and the bibliographic Person collection.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
MIGRATION_DIR="${DSPACE_MIGRATION_DIR:-$PROJECT_DIR/../dspace-migration}"
ENV_FILE="$PROJECT_DIR/.env"
MIGRATION_ENV="$MIGRATION_DIR/.env"
PROJECT_NAME=d10
DEVELOPMENT=false

usage() {
    cat <<'EOF'
Uso: bash scripts/prepare-academic.sh [opções]
  --env-file CAMINHO            .env da implantação (padrão: .env deste projeto)
  --migration-env-file CAMINHO  .env da migração (padrão: ../dspace-migration/.env)
  --project-name NOME          projeto Compose (padrão: d10)
  --development               usa rest + dev; requer projeto diferente de d10
  --help                      mostra esta ajuda

Execute depois de iniciar o backend com os novos arquivos de configuração.
O script registra campos, inicializa tipos de entidade e cria/reutiliza a
coleção Person. Salva seu UUID no .env da migração. Não importa publicações.
EOF
}

while (( $# )); do
    case "$1" in
        --env-file|--migration-env-file|--project-name)
            if (( $# < 2 )); then usage >&2; exit 2; fi
            case "$1" in
                --env-file) ENV_FILE="$2" ;;
                --migration-env-file) MIGRATION_ENV="$2" ;;
                --project-name) PROJECT_NAME="$2" ;;
            esac
            shift 2 ;;
        --development) DEVELOPMENT=true; shift ;;
        --help|-h) usage; exit 0 ;;
        *) echo "Opção desconhecida: $1" >&2; usage >&2; exit 2 ;;
    esac
done

[[ -r "$ENV_FILE" && -r "$MIGRATION_ENV" ]] || {
    echo "Informe arquivos .env legíveis para implantação e migração." >&2; exit 1;
}
[[ -f "$MIGRATION_DIR/pyproject.toml" ]] || {
    echo "Projeto de migração não encontrado; configure DSPACE_MIGRATION_DIR." >&2; exit 1;
}
command -v docker >/dev/null
command -v uv >/dev/null

compose=(docker compose --project-directory "$PROJECT_DIR" --env-file "$ENV_FILE" -p "$PROJECT_NAME")
if [[ "$DEVELOPMENT" == true ]]; then
    [[ "$PROJECT_NAME" != d10 ]] || { echo "Use outro projeto para desenvolvimento, por exemplo d10dev." >&2; exit 2; }
    compose+=(-f "$PROJECT_DIR/docker-compose-rest.yml" -f "$PROJECT_DIR/docker-compose-dev.yml")
else
    compose+=(-f "$PROJECT_DIR/docker-compose-dist.yml" -f "$PROJECT_DIR/docker-compose-rest.yml" -f "$PROJECT_DIR/docker-compose-prod.yml")
fi

"${compose[@]}" config --quiet
model="$("${compose[@]}" exec -T dspace /dspace/bin/dspace dsprop -p relationship.enable-virtual-metadata)"
[[ "$(printf '%s\n' "$model" | tail -n 1)" == false ]] || {
    echo "O backend ainda não carregou o modelo por autoridade. Recrie-o e confira os overrides." >&2; exit 1;
}

"${compose[@]}" exec -T dspace /dspace/bin/dspace registry-loader -m /dspace/config/registries/academic-metadata.xml
"${compose[@]}" exec -T dspace /dspace/bin/dspace initialize-entities -f /dspace/config/entities/relationship-types.xml
uv run --project "$MIGRATION_DIR" python "$SCRIPT_DIR/prepare_people_collection.py" --env-file "$MIGRATION_ENV" --write-env
echo "Preparação concluída. Siga docs/guia-dspace-academico.md para importar e conferir os vínculos."
