# Orientações para agentes neste repositório

## Contexto e arquivos

- Este projeto configura o DSpace 10 da biblioteca com backend, PostgreSQL, Solr, interface Angular customizada e um proxy Nginx interno. Leia o `README.md` antes de alterar implantação ou URLs.
- `docker-compose-rest.yml` define backend, banco, Solr, volumes e a rede `dspacenet`; `docker-compose-dist.yml` define o frontend; `docker-compose-prod.yml` acrescenta valores e proxy de produção. Nessa ordem, os três arquivos formam a implantação de produção.
- `docker-compose-local.yml` publica portas só para desenvolvimento local. `proxy/nginx.conf` mantém o roteamento de produção. `frontend/themes/custom/` e `frontend/config/` contêm personalizações da interface; `backend/config/` contém as do backend. As RFCs em `rfc/` registram decisões anteriores.

## Contrato de produção

- O proxy geral da instituição termina o TLS fora deste servidor e encaminha HTTP para a porta 80 do `dspace-proxy`. O Nginx deste projeto encaminha `/dspace/` para Angular e `/dspace-server/` para o contexto `/server/` do backend. Preserve `Host` e `X-Forwarded-*` ao alterar esse fluxo.
- Em produção, somente `dspace-proxy` publica a porta 80. Não publique diretamente as portas do frontend, backend, PostgreSQL ou Solr. Certificados e porta 443 pertencem ao proxy geral.
- As variáveis `DSPACE_PUBLIC_ORIGIN`, `DSPACE_UI_URL`, `DSPACE_SERVER_URL` e `DSPACE_REST_HOST` descrevem a URL vista no navegador; não recebem o nome interno do servidor DSpace. Use exemplos genéricos em documentação e consulte `.env.production.example`.
- A rede `dspacenet` usa `172.23.0.0/24`; o DSpace confia no prefixo `172.23.0` para os proxies internos. Se mudar a sub-rede, ajuste a faixa confiável junto e verifique conflitos com redes do host e VPN. Uma rede Docker já criada precisa ser recriada para mudar de faixa; preserve os volumes.
- Nunca inclua credenciais reais, `.env`, certificados ou a base GeoLite2 no Git. Mantenha as imagens de produção fixadas em versões explícitas e, quando já houver digest, atualize versão e digest juntos.

## Validação e commits

- Antes de finalizar mudanças no Compose, rode `docker compose --env-file .env.production.example -p d10 -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml config --quiet` e confira se somente o proxy publica porta em produção. Para mudanças no Nginx, valide `nginx -t` com a imagem fixada e teste as rotas `/dspace/` e `/dspace-server/`.
- Rode `git diff --check` e revise o diff. Não use o Compose local ao validar produção.
- **Use sempre Conventional Commits**: `tipo(escopo): descrição` em todos os commits. Exemplos: `feat(proxy): rotear interface e API`, `fix(compose): alinhar sub-rede confiável`, `docs(readme): explicar URLs públicas`. Use tipos como `feat`, `fix`, `docs`, `refactor`, `test` e `chore`; indique mudança incompatível com `!` e explique-a no corpo do commit. Faça commits coesos e sem segredos.
