# Operação

Tarefas recorrentes depois da [instalação](instalacao.md). Exemplos de
produção (projeto `d10`, raiz de `dspace-bca`, serviços iniciados); no
desenvolvimento use `.env.development`, `-p d10dev` e
`docker-compose-rest.yml` + `docker-compose-dev.yml`.

## Atualizar

Mudanças no tema, componentes, patches ou `frontend/overrides/robots.txt.ejs`
exigem nova imagem: faça push e aguarde o workflow. Depois, no servidor:

```bash
git pull --ff-only
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  pull dspace-angular

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  up -d --no-build --force-recreate dspace dspace-angular
```

| Mudança | Recriar |
| --- | --- |
| Só o YAML da interface | `dspace-angular` |
| Configuração do backend ou arquivo GeoLite2 | `dspace` |
| Patches ou `frontend/overrides/` (local) | `up -d --build` |

## Reindexar

Depois de alterações em lote, restauração ou mudança de URLs públicas:

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec -T dspace /dspace/bin/dspace index-discovery -b

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec -T dspace /dspace/bin/dspace oai import -c

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec -T dspace /dspace/bin/dspace generate-sitemaps
```

Para atualizar o OAI sem limpar o índice, omita `-c`.

Normalizar idiomas de resumos legados, só quando aplicável, com backup e o SQL
revisado; depois, reindexe o Discovery:

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec -T dspacedb psql -U dspace -d dspace \
  < backend/sql/normalize_abstract_languages.sql
```

## Importar um lote (escrita no SAF)

O `dspace-migration` importa dentro do container `dspace`, que normalmente
monta o SAF somente leitura. Para uma importação, recrie o backend com o
overlay de migração; ao terminar, volte ao Compose normal. Os comandos de
importação em si ficam no
[roteiro de migração](../../../dspace-migration/docs/guias/migracao.md#produção).

```bash
# antes: valide e habilite a escrita no SAF
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  -f docker-compose-migration.yml config --quiet

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  -f docker-compose-migration.yml up -d --no-build --force-recreate dspace

# depois: restaure a montagem somente leitura
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  up -d --no-build --force-recreate dspace
```

Aguarde a API e confirme que a pasta do lote aparece em `/dspace/saf_bundle`
no container `dspace`. `DSPACE_SAF_HOST_DIR` precisa apontar para a pasta do
lote e ser gravável pelo DSpace, para os mapfiles.

## Verificação

Troque o domínio ilustrativo pelo real:

```bash
curl --fail https://repo.interno.example.org/dspace/robots.txt
curl --fail https://repo.interno.example.org/dspace/sitemap_index.xml
curl --fail https://repo.interno.example.org/dspace/sitemap_index.html
curl --fail 'https://repo.interno.example.org/dspace-server/oai/request?verb=Identify'
```

- [ ] Título e metadados no HTML de uma página de item (SSR).
- [ ] Busca, idioma dos resumos, login, upload e e-mail.
- [ ] PDF público acessível e PDF embargado protegido, com acesso anônimo.
- [ ] GeoIP em `/dspace/health` e logs dos serviços sem erros.

**Local (CORS e SEO).** Abra a interface por `http://localhost:4000`, sem
misturar URLs de produção, e confira:

```bash
curl --fail -D - -o /dev/null \
  -H 'Origin: http://localhost:4000' http://localhost:8080/server/api
```

A resposta deve conter `Access-Control-Allow-Origin: http://localhost:4000`.
Mantenha `SEO_HEALTH_ENABLED=false` no desenvolvimento; na produção, `true`
depois de confirmar que o backend alcança o domínio público.

## Backup

Banco e assetstore como conjunto consistente, mais `solr_data`, `sitemaps` e
a pasta SAF com seus mapfiles. Os artefatos de cada lote (manifestos,
relatórios) são tratados na
[operação da migração](../../../dspace-migration/docs/guias/operacao.md#backup).
Nunca rode
`docker compose down -v` em produção: apaga volumes.

## Validar mudanças

```bash
docker compose --env-file .env.production.example -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  config --quiet

docker build -t dspace-bca-backend:academic-check -f tests/backend/Dockerfile .
git diff --check
```

Confira que somente o proxy publica a porta 80. Mudanças no Nginx exigem
`nginx -t` na imagem fixada e testes de `/dspace/` e `/dspace-server/`.
`config --quiet` não verifica DNS, TLS, SMTP nem permissões nos volumes.
Responsabilidades de cada componente na
[referência de implantação](../referencia/implantacao.md).

## Conta com senha inicial sem SMTP

Em Administração → Controle de acesso → EPeople → Criar, marque **Definir
senha inicial agora**, preencha **Senha** e **Confirmar senha** (mínimo de
oito caracteres; o servidor pode exigir mais) e mantenha o login habilitado.
A opção não aparece na edição e não redefine senhas existentes.

Se a conta for criada e a senha falhar, a tela mostra e-mail/UUID e permite
tentar de novo para **a mesma conta**; não crie outra. Uma resposta perdida
pode esconder uma senha já gravada: teste o login antes de repetir. Contrato e
limites na [referência de implantação](../referencia/implantacao.md#contas-e-autenticação).

## Diagnóstico

| Situação | Onde conferir |
| --- | --- |
| Propriedade do modelo não encontrada | Backend recriado com os mounts e o novo `rest.cfg`; arquivos legíveis no host. |
| Falha de login na preparação | URL da API, e-mail e senha do administrador no `.env` da migração. |
| Falha em `apply-people`, mapfiles ou handles de um lote | [Retomada da migração](../../../dspace-migration/docs/guias/migracao.md#retomar). |
| Erro de `dc.contributor.coadvisor` ao criar conta | Recrie o backend e rode o `registry-loader` da [instalação](instalacao.md#metadados-e-administrador) antes de criar a conta. |
| Projeto de migração não encontrado | Caminho do `.env`; `--migration-dir` ou `DSPACE_MIGRATION_DIR` apontando para a raiz com `pyproject.toml`. |
| Coleção Pessoas sem tipo | Administração da coleção; selecione `Person` quando adequado e confira o conteúdo. |
| Pessoa não aparece no seletor | Registro Person arquivado, permissões e índice Discovery atualizado. |
| Perfil não mostra orientações | Autoridades aplicadas, reindexação e imagem Angular recompilada. |
| Campos não aparecem em Editar | Backend reiniciado e processo de edição da coleção (o projeto configura o tradicional e o Publication). |
