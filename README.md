# DSpace Docker da Biblioteca

Este diretório contém os arquivos usados para executar o DSpace da biblioteca:

| Arquivo | Uso |
| --- | --- |
| `docker-compose-rest.yml` | Backend DSpace, PostgreSQL, Solr, volumes persistentes e montagem do pacote SAF. |
| `docker-compose-dist.yml` | Build e execução da interface DSpace Angular customizada. |
| `docker-compose-prod.yml` | Valores obrigatórios e configuração da implantação de produção. |
| `proxy/nginx.conf` | Proxy HTTP/HTTPS interno que roteia `/dspace` e `/dspace-api`. |
| `docker-compose-local.yml` | Publicação opcional de portas apenas para uso local. |
| `.env.production.example` | Modelo das variáveis exigidas em produção, sem credenciais reais. |
| `Dockerfile.angular` | Compila o tema local sobre o código-fonte da versão oficial. |
| `backend/config/submission-forms.xml` | Formulários oficiais do backend com os overrides locais de metadados. |
| `frontend/themes/custom/` | SCSS, assets e componentes sobrescritos pelo projeto. |
| `frontend/config/config.prod.yml` | Configuração local carregada em tempo de execução. |
| `cli.yml` | Comandos administrativos, como criação do administrador e `filter-media`. |

## Preparação para produção

Crie um `.env` privado a partir de `.env.production.example` e substitua todos
os valores de exemplo. Use uma senha aleatória para `POSTGRES_PASSWORD`. O
PostgreSQL aplica `POSTGRES_PASSWORD` apenas quando inicializa um volume vazio;
alterar essa variável depois exige trocar a senha dentro do banco também.
Mantenha o arquivo fora do controle de versão e restrinja sua leitura no host
(`chmod 600 .env`). O mesmo valor é passado ao PostgreSQL, ao backend e à CLI.

O serviço `dspace-proxy` deste projeto compartilha a rede `dspacenet` com
backend e frontend. Ele é o único serviço do projeto que publica portas:
HTTP em `127.0.0.1:8088` e HTTPS em `127.0.0.1:8443` por padrão. Dentro do
container, o Nginx escuta nas portas 80 e 443. As portas públicas 80/443
continuam sob controle do proxy geral do servidor, que encaminha `/dspace`
e `/dspace-api` para um desses listeners locais. Os containers DSpace,
PostgreSQL e Solr não publicam portas.

Defina `DSPACE_PROXY_TLS_CERT_PATH` e `DSPACE_PROXY_TLS_KEY_PATH` com os
caminhos de arquivos PEM existentes no host. O certificado deve cobrir o
hostname público e ser confiável para o proxy geral. Os arquivos são montados
somente para leitura; o Nginx não sobe sem eles. Após renovar o certificado,
recrie `dspace-proxy` para carregar os arquivos novamente.

A imagem do proxy interno está fixada em `nginx:1.30.5-alpine3.24` e no digest
correspondente, para que um `pull` posterior não troque os bytes da imagem sem
uma mudança neste projeto. Atualize versão e digest de forma planejada, valide
`proxy/nginx.conf` com `nginx -t` e teste as duas rotas antes de publicar.

O roteamento já está implementado em `proxy/nginx.conf`:

| Caminho público | Destino interno | Tratamento |
| --- | --- | --- |
| `/dspace/` | `dspace-angular:4000` | Preserva `/dspace/` |
| `/dspace-api/` | `dspace:8080` | Troca `/dspace-api/` por `/server/` |

O proxy geral pode encaminhar esses prefixos via HTTP para
`http://127.0.0.1:8088` ou via TLS para `https://127.0.0.1:8443`, mantendo
o caminho original, o cabeçalho `Host` e os cabeçalhos `X-Forwarded-Proto`,
`X-Forwarded-Host` e `X-Forwarded-For`. Na opção TLS, habilite SNI com o
hostname coberto pelo certificado e valide a cadeia de confiança. O proxy
interno preserva o protocolo público ao falar com Angular e DSpace. Use
esses prefixos antes de qualquer rota genérica do proxy geral.

`DSPACE_PUBLIC_ORIGIN` é o esquema e hostname HTTPS, sem caminho. Defina
`DSPACE_UI_URL` como essa origem seguida de `/dspace` e
`DSPACE_SERVER_URL` como a mesma origem seguida de `/dspace-api`, ambas sem
barra final. `DSPACE_REST_HOST` contém apenas o hostname. O backend usa
`DSPACE_PUBLIC_ORIGIN` para CORS porque o cabeçalho `Origin` do navegador não
inclui `/dspace`. O intervalo `172.23.0` já configurado no backend apenas
permite confiar no IP real do visitante repassado pelos containers da própria
rede DSpace; não precisa ser alterado para apontar o domínio público. Verifique
somente se a sub-rede fixa `172.23.0.0/16` não conflita com as redes do host.

Exemplo de integração via TLS no proxy geral Nginx do servidor:

```nginx
location ~ ^/(dspace|dspace-api)(/|$) {
    proxy_pass https://127.0.0.1:8443;
    proxy_ssl_server_name on;
    proxy_ssl_name repositorio.example.edu.br;
    proxy_ssl_verify on;
    proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
    client_max_body_size 2g;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Esse bloco deve ficar no host virtual da instituição. Sem barra final em
`proxy_pass`, o Nginx geral preserva o caminho para o proxy deste projeto.
Substitua o hostname ilustrativo e configure o arquivo CA adequado ao
certificado institucional. Para usar HTTP entre os dois proxies, troque
apenas `proxy_pass` por `http://127.0.0.1:8088` e remova as diretivas
`proxy_ssl_*`.
Se o proxy geral roda em outro container, seu destino deve ser uma conexão
privada com o host que aceite essa porta; o binding padrão em loopback atende
quando ele roda no host. Ajuste o limite de upload e os tempos limite tanto
no proxy geral quanto em `proxy/nginx.conf` ao perfil do acervo.

Crie previamente o diretório `DSPACE_SAF_HOST_DIR` e forneça o arquivo
GeoLite2 City em `GEOLITE2_CITY_DB_PATH`; os binds de produção não criam
esses caminhos automaticamente. Configure o servidor SMTP acessível em
`DSPACE_MAIL_SERVER`, o remetente em `DSPACE_MAIL_FROM` e o contato em
`DSPACE_ADMIN_EMAIL`. Caso seu SMTP exija porta, TLS ou autenticação, defina
as propriedades `mail.*` correspondentes do DSpace no ambiente do serviço
`dspace`, conforme a configuração do provedor.

## Inicialização de produção

```bash
docker compose --env-file .env -p d10 -f docker-compose-dist.yml \
  -f docker-compose-rest.yml -f docker-compose-prod.yml config --quiet
docker compose --env-file .env -p d10 -f docker-compose-dist.yml \
  -f docker-compose-rest.yml -f docker-compose-prod.yml \
  pull dspace dspacedb dspacesolr dspace-proxy
docker compose --env-file .env -p d10 -f docker-compose-dist.yml \
  -f docker-compose-rest.yml -f docker-compose-prod.yml \
  build --pull dspace-angular
docker compose --env-file .env -p d10 -f docker-compose-dist.yml \
  -f docker-compose-rest.yml -f docker-compose-prod.yml up -d
```

Teste o listener TLS do proxy interno antes de liberar a rota no proxy geral
(substitua o hostname e a porta, se alterada):

```bash
curl --fail --resolve repositorio.example.edu.br:8443:127.0.0.1 \
  https://repositorio.example.edu.br:8443/dspace-api/api
```

Esse teste verifica o handshake, o nome do certificado e a rota da API. Se a
instituição usa uma CA privada, adicione `--cacert /caminho/ca.pem`.

`config --quiet` valida a composição e a presença das variáveis exigidas; use
o arquivo de produção em **todos** os comandos de subida e recriação. Após a
subida, confira `docker compose ... ps`, os logs dos serviços e as URLs HTTPS
públicas da interface (`/dspace/`), API (`/dspace-api/api`), OAI-PMH
(`/dspace-api/oai/request?verb=Identify`) e `/dspace/sitemap_index.xml`.
Verifique também `/dspace/robots.txt` e faça um teste de login, upload de
arquivo e envio de e-mail.
Um `config --quiet` bem-sucedido não verifica DNS, certificado, proxy, SMTP ou
permissões de escrita dos volumes no servidor.

Antes de importar dados, estabeleça um backup consistente do PostgreSQL
(`pg_dump` ou snapshot coordenado) e do volume `assetstore`, e teste a
restauração. Inclua `solr_data` e `sitemaps` no plano de recuperação ou
documente como reconstruí-los. Monitore espaço em disco,
disponibilidade dos containers e validade do certificado TLS.

O frontend não usa mais diretamente a imagem `*-dist` publicada. O
`Dockerfile.angular` parte da imagem oficial `dspace-10.1`, sobrepõe os arquivos
locais no tema oficial `custom`, compila a distribuição e reutiliza a imagem
oficial `dspace-10.1-dist` como runtime.

O backend negocia o idioma público por `Accept-Language` e devolve somente a
variante correspondente dos metadados. O qualifier do resumo em português é
`pt` (idioma-base da locale `pt_BR` no DSpace 10), enquanto
`dc.language.iso` continua recebendo `pt_BR`. Antes da compilação, o frontend
aplica um patch restrito à área administrativa: apenas o editor de metadados e
suas respostas de salvamento solicitam a projeção REST `allLanguages`, para que
nenhuma tradução fique oculta durante a edição.

O nome público do repositório vem de `DSPACE_NAME` e usa
`Repositório Institucional da UFAL` por padrão. O backend publica esse valor
como `dspace.name`; o frontend o reutiliza em títulos como “Estatísticas para
Repositório Institucional da UFAL”. Depois de alterar a variável, recrie o
container `dspace`.

## OAI-PMH

O módulo OAI-PMH está explicitamente habilitado no backend e usa o mesmo
container da API REST. Em produção, o endpoint público é:

```text
https://repositorio.example.edu.br/dspace-api/oai/request
```

Valide o protocolo com o verbo `Identify`:

```bash
curl --fail \
  'https://repositorio.example.edu.br/dspace-api/oai/request?verb=Identify'
```

Depois de uma importação inicial ou reconstrução completa do acervo, popule o
core `oai` do Solr:

```bash
docker compose --env-file .env -p d10 -f cli.yml run --rm \
  dspace-cli oai import -c
```

O `-c` limpa somente o índice OAI antes de reconstruí-lo; não remove itens do
DSpace. Para uma atualização sem limpeza, omita essa opção. Em produção,
configure `DSPACE_SERVER_URL`, `DSPACE_UI_URL` e `DSPACE_ADMIN_EMAIL` no
`.env`. O hostname de `DSPACE_UI_URL` também é usado como prefixo padrão dos
identificadores OAI. `OAI_ENABLED` permite desligar o módulo e `OAI_PATH`
permite alterar apenas o segmento de URL.

## SEO: sitemap, robots.txt e SSR

O backend gera sitemaps XML e HTML diariamente às 01:15, conforme
`SITEMAP_CRON`, e mantém os arquivos no volume nomeado `sitemaps`. A geração
inicial pode ser executada no próprio backend, que tem esse volume montado:

```bash
docker compose --env-file .env -p d10 -f docker-compose-dist.yml \
  -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec dspace /dspace/bin/dspace generate-sitemaps
```

O frontend encaminha `/dspace/sitemap*` para esses arquivos. O template
`frontend/overrides/robots.txt.ejs` é servido internamente em `/robots.txt`;
o exemplo de proxy o disponibiliza também em `/dspace/robots.txt`. Motores de
busca consultam o `/robots.txt` da raiz do domínio: como o servidor hospeda
outras aplicações, o proxy geral deve manter esse arquivo compartilhado e
incluir as URLs dos índices `/dspace/sitemap_index.xml` e
`/dspace/sitemap_index.html` nele.

SSR não é um processo separado: a imagem customizada reutiliza o entrypoint
`pm2-runtime` de `dspace-10.1-dist`, que executa `dist/server/main.js`. A
configuração local mantém `transferState` e a substituição da URL REST ativas.
Valide o ambiente público iniciado com:

```bash
curl --fail https://repositorio.example.edu.br/dspace/robots.txt
curl --fail https://repositorio.example.edu.br/dspace/sitemap_index.xml
curl --fail https://repositorio.example.edu.br/dspace/sitemap_index.html
```

Substitua o domínio ilustrativo pelo real e confira se os links gerados contêm
`/dspace`; URLs públicas incorretas prejudicam os sitemaps e a renderização SSR.

Acervos importados antes dessa normalização devem executar uma vez
`backend/sql/normalize_abstract_languages.sql` e depois `index-discovery -b`,
após um backup e uma revisão dos dados afetados.

O tema `custom` é ativado em `frontend/config/config.prod.yml`. Mudanças em
SCSS, assets ou componentes exigem `build --no-cache dspace-angular` quando for
necessário invalidar todo o cache. Mudanças apenas nesse YAML exigem somente:

```bash
docker compose --env-file .env -p d10 -f docker-compose-dist.yml \
  -f docker-compose-rest.yml -f docker-compose-prod.yml \
  up -d --force-recreate dspace-angular
```

`DSPACE_VER` e `DSPACE_ANGULAR_TAG` usam `dspace-10.1`, lançamento estável da
linha 10, e devem permanecer alinhadas. As tags `dspace-10_x` acompanham código
ainda não lançado. `DSPACE_ANGULAR_IMAGE` pode ser usada para nomear a imagem
customizada. O tag Angular precisa existir tanto na forma normal quanto com o
sufixo `-dist` no repositório oficial de imagens.

> [!IMPORTANT]
> Um banco que já tenha executado migrações do DSpace 11 não deve ser aberto
> pelo backend 10. Em um ambiente descartável e ainda vazio, remova os volumes
> criados pela versão 11 antes de iniciar novamente. Em um ambiente com dados,
> restaure um backup feito ainda no DSpace 10.

O mesmo nome de projeto (`-p d10`) deve ser usado nos comandos de `cli.yml`,
pois esse arquivo conecta seus containers à rede e ao volume criados acima.

O serviço REST monta `../saf_bundle` por padrão e reutiliza `SAF_BUNDLE_DIR` se
ela estiver definida. `DSPACE_SAF_HOST_DIR` permite sobrescrever somente o
mount; nesse caso, seu caminho deve identificar o mesmo diretório usado pela
migração.

## Configuração do backend

O `submission-forms.xml` da imagem oficial está versionado em
`backend/config/` e é montado como somente leitura nos serviços `dspace` e
`dspace-cli`. As duas definições de `dc.description.abstract` são repetíveis e
expõem a seleção de idioma do DSpace; a lista inclui explicitamente `pt`, usado
como qualifier do resumo em português, além de `en`. O metadado
`dc.language.iso` continua usando `pt_BR`.

Depois de alterar essa configuração, recrie o backend:

```bash
docker compose --env-file .env -p d10 -f docker-compose-dist.yml \
  -f docker-compose-rest.yml -f docker-compose-prod.yml \
  up -d --force-recreate dspace
```

As rotinas de importação e normalização devem ser executadas apenas depois de
validar os dados e de testar uma restauração do banco e do `assetstore`.
