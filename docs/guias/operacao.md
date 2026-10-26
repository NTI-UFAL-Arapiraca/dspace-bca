# Operação do DSpace

Os comandos de produção partem da raiz de `dspace-bca`, com serviços já
iniciados. Use as URLs reais nos testes.

## Atualizar a interface ou as configurações

1. Faça push e aguarde o workflow quando houver mudanças no tema, componentes,
   patches ou `frontend/overrides/robots.txt.ejs`.
2. Atualize o checkout do servidor.
3. Baixe a imagem publicada e recrie os serviços afetados:

```bash
git pull --ff-only
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  pull dspace-angular

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  up -d --no-build --force-recreate dspace dspace-angular
```

Para mudanças apenas no YAML da interface, basta recriar `dspace-angular`.
Para configurações do backend ou troca do arquivo GeoLite2, recrie `dspace`.
No desenvolvimento, use `.env.development`, `-p d10dev` e os arquivos
`docker-compose-rest.yml` + `docker-compose-dev.yml`; alterações nos patches
ou em `frontend/overrides/` precisam de `up -d --build`.

## Reconstruir índices e arquivos públicos

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

Para atualizar OAI sem limpar o índice, omita `-c`. Antes de normalizar
resumos legados, faça backup e revise o SQL. Somente quando aplicável:

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec -T dspacedb psql -U dspace -d dspace \
  < backend/sql/normalize_abstract_languages.sql
```

Depois, reconstrua Discovery com o comando acima.

## Verificar a instalação

```bash
curl --fail https://repo.interno.example.org/dspace/robots.txt
curl --fail https://repo.interno.example.org/dspace/sitemap_index.xml
curl --fail https://repo.interno.example.org/dspace/sitemap_index.html
curl --fail 'https://repo.interno.example.org/dspace-server/oai/request?verb=Identify'
```

- Confira uma página real de item: título e metadados devem estar no HTML SSR.
- Verifique busca, idioma dos resumos, login, upload e e-mail.
- Teste um PDF público e outro embargado com acesso anônimo.
- Confira GeoIP em `/dspace/health` e os logs dos serviços.
- Preserve banco e assetstore como um conjunto consistente nos backups.
- Não execute `docker compose down -v` em produção; essa opção remove volumes.

## Validar mudanças na configuração

```bash
docker compose --env-file .env.production.example -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  config --quiet

docker build -t dspace-bca-backend:academic-check -f tests/backend/Dockerfile .
git diff --check
```

A validação do Compose deve confirmar que somente o proxy publica a porta 80.
Mudanças no Nginx exigem também `nginx -t` na imagem fixada e testes das duas
rotas. Um `config --quiet` válido não verifica DNS, TLS, SMTP ou permissões
nos volumes. Consulte a [referência](../referencia/implantacao.md) para as
responsabilidades de cada componente.

O backend monta a pasta SAF de produção com escrita habilitada para que a
importação persista os mapfiles ao lado dos pacotes. A base GeoLite2 também é
montada no backend sem a opção de somente leitura. Preserve as permissões e
faça backup dos arquivos do SAF antes de executar uma nova importação.

## Diagnosticar campos e vínculos

| Situação | Onde conferir |
| --- | --- |
| A propriedade do modelo não foi encontrada | Backend recriado com os mounts e o novo `rest.cfg`; arquivos legíveis no host. |
| Falha de login na preparação | URL da API, e-mail e senha do administrador no `.env` da migração. |
| Erro de metadado `dc.contributor.coadvisor` ao criar conta | Atualize/recrie o backend e rode `registry-loader -m /dspace/config/registries/academic-metadata.xml` antes de criar a conta. |
| Projeto de migração não encontrado | Confirme o caminho do `.env`; informe `--migration-dir` ou defina `DSPACE_MIGRATION_DIR` para a raiz que contém `pyproject.toml`. |
| A coleção Pessoas existe sem tipo | Administração da coleção; selecione `Person` quando adequado e confira seu conteúdo. |
| Publicações sem handle | Correspondência entre `people.json`, mapfiles e o lote importado. |
| Pessoa não aparece no seletor | Registro Person arquivado, permissões e atualização do índice Discovery. |
| Perfil não mostra orientações | Autoridades aplicadas, reindexação e imagem Angular recompilada. |
| Os campos não aparecem em Editar | Backend reiniciado e processo de edição usado pela coleção; o projeto configura os processos tradicional e Publication. |

## Conferir CORS e o diagnóstico SEO local

No ambiente local, abra a interface por `http://localhost:4000` e mantenha
as URLs e a origem permitida locais. Depois de corrigir o ambiente, recrie
os serviços usando o Compose de desenvolvimento. Confira:

```bash
curl --fail -D - -o /dev/null \
  -H 'Origin: http://localhost:4000' http://localhost:8080/server/api
```

A resposta deve conter `Access-Control-Allow-Origin: http://localhost:4000`.
Não misture a interface local com as URLs de produção. No diagnóstico SEO,
mantenha `SEO_HEALTH_ENABLED=false` em desenvolvimento; na produção, use
`true` depois de verificar o acesso do backend ao domínio público.
