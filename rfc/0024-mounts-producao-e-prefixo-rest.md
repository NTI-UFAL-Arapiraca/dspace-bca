# RFC 0024 — Mounts de produção e prefixo público da API

- Status: aceita
- Escopo: implantação e proxy

## Contexto

O backend precisa gravar mapfiles no SAF durante a importação. A rota REST
pública também usa o prefixo `/dspace-server`, removido pelo proxy interno ao
encaminhar a requisição ao contexto `/server`.

## Decisão

- manter o bind do SAF de produção com escrita habilitada para a importação;
- montar o arquivo GeoLite2 sem `read_only` no serviço backend;
- enviar `X-Forwarded-Prefix: /dspace-server` somente nas requisições da rota
  REST pública;
- manter a publicação de portas de produção restrita ao proxy interno na porta
  80.

## Implementação

- `docker-compose-prod.yml` define o bind do SAF;
- `docker-compose-rest.yml` define o bind do GeoLite2;
- `proxy/nginx.conf` define as rotas e cabeçalhos encaminhados ao backend;
- `docs/referencia/implantacao.md` e `docs/guias/operacao.md` descrevem o
  comportamento e os cuidados operacionais.

## Consequências e validação

A importação pode persistir mapfiles no SAF montado pelo serviço. O operador
deve preservar as permissões e manter backup do SAF. Validar a composição de
produção, confirmar que somente `dspace-proxy` publica a porta 80 e executar
`nginx -t` na imagem fixada. Verificar que `X-Forwarded-Prefix` aparece na rota
`/dspace-server/` e não nas rotas Angular.
