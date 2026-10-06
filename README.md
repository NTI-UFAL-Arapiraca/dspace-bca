# DSpace Docker da Biblioteca

Este diretório contém os arquivos usados para executar o DSpace da biblioteca:

| Arquivo | Uso |
| --- | --- |
| `docker-compose-rest.yml` | Backend DSpace, PostgreSQL, Solr, volumes persistentes e montagem do pacote SAF. |
| `docker-compose-dist.yml` | Build e execução da interface DSpace Angular customizada. |
| `docker-compose-prod.yml` | Valores obrigatórios e configuração da implantação de produção. |
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

Configure um proxy reverso com TLS no host: encaminhe `/server/` para
`http://127.0.0.1:8080/server/` e o restante para
`http://127.0.0.1:4000/`, preservando o cabeçalho `Host` e encaminhando
`X-Forwarded-Proto: https`, `X-Forwarded-Host` e `X-Forwarded-For` com o IP
real do cliente. `DSPACE_UI_URL` e
`DSPACE_SERVER_URL` devem usar o mesmo domínio HTTPS; a segunda URL termina
em `/server`, e `DSPACE_REST_HOST` contém apenas esse hostname. O Node do
frontend continua em HTTP dentro do host (`DSPACE_UI_SSL=false`), enquanto as
requisições do navegador à API usam HTTPS (`DSPACE_REST_SSL=true`).

O proxy é o único ponto público. As portas 4000 e 8080 são vinculadas a
`127.0.0.1`; PostgreSQL e Solr não publicam portas no host. Se o proxy estiver
em outro servidor, use um túnel ou uma rede privada e ajuste os bindings de
forma explícita. Verifique também se a sub-rede fixa `172.23.0.0/16` não
conflita com as redes do host. Ao alterá-la, atualize
`proxies__P__trusted__P__ipranges` no Compose.

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
  pull dspace dspacedb dspacesolr
docker compose --env-file .env -p d10 -f docker-compose-dist.yml \
  -f docker-compose-rest.yml -f docker-compose-prod.yml \
  build --pull dspace-angular
docker compose --env-file .env -p d10 -f docker-compose-dist.yml \
  -f docker-compose-rest.yml -f docker-compose-prod.yml up -d
```

`config --quiet` valida a composição e a presença das variáveis exigidas; use
o arquivo de produção em **todos** os comandos de subida e recriação. Após a
subida, confira `docker compose ... ps`, os logs dos serviços e as URLs HTTPS
públicas da interface, API (`/server/api`), OAI-PMH (`/server/oai/request?verb=Identify`),
`/robots.txt` e `/sitemap_index.xml`. Faça um teste de login e envio de e-mail.
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
container e a mesma porta da API REST. Com a configuração local padrão, o
endpoint é:

```text
http://localhost:8080/server/oai/request
```

Valide o protocolo com o verbo `Identify`:

```bash
curl --fail \
  'http://localhost:8080/server/oai/request?verb=Identify'
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

O frontend encaminha `/sitemap*` para esses arquivos e renderiza o template
versionado `frontend/overrides/robots.txt.ejs` em `/robots.txt`. Esse template
anuncia os dois índices e não bloqueia itens, handles, comunidades ou coleções.

SSR não é um processo separado: a imagem customizada reutiliza o entrypoint
`pm2-runtime` de `dspace-10.1-dist`, que executa `dist/server/main.js`. A
configuração local mantém `transferState` e a substituição da URL REST ativas.
Valide o ambiente iniciado com:

```bash
curl --fail http://localhost:4000/robots.txt
curl --fail http://localhost:4000/sitemap_index.xml
curl --fail http://localhost:4000/sitemap_index.html
```

Em produção, substitua `localhost` pelo domínio HTTPS e configure exatamente
esse domínio em `DSPACE_UI_URL`; caso contrário, robots e sitemaps anunciarão
URLs incorretas e validadores externos poderão considerar também o SSR
inacessível.

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
