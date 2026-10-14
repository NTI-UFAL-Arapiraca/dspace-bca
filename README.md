# DSpace Docker da Biblioteca

Este diretório contém os arquivos usados para executar o DSpace da biblioteca:

Para entender os cadastros, preparar pessoas e executar a migração, siga o
[guia do DSpace acadêmico](docs/guia-dspace-academico.md). Ele explica os
conceitos e traz os comandos para desenvolvimento, produção, piloto e retomada.

| Arquivo | Uso |
| --- | --- |
| `docker-compose-rest.yml` | Backend DSpace, PostgreSQL, Solr, volumes persistentes e montagem do pacote SAF. |
| `docker-compose-dist.yml` | Build e execução da interface DSpace Angular customizada. |
| `docker-compose-prod.yml` | Valores obrigatórios e configuração da implantação de produção. |
| `docker-compose-migration.yml` | Permite gravar mapfiles no SAF durante a importação em produção. |
| `proxy/nginx.conf` | Proxy HTTP interno que roteia `/dspace` e `/dspace-server`. |
| `docker-compose-local.yml` | Publicação opcional de portas apenas para uso local. |
| `docker-compose-dev.yml` | Angular com atualização automática do tema e backend local isolado. |
| `.env.production.example` | Modelo das variáveis exigidas em produção, sem credenciais reais. |
| `.env.development.example` | Modelo das variáveis para o ambiente local isolado. |
| `Dockerfile.angular` | Compila o tema local sobre o código-fonte da versão oficial. |
| `Dockerfile.angular.dev` | Inicia o servidor de desenvolvimento da versão oficial com os patches locais. |
| `.github/workflows/deploy.yml` | Compila e publica a imagem Angular customizada no GHCR. |
| `backend/config/submission-forms.xml` | Formulários oficiais do backend com os overrides locais de metadados. |
| `backend/config/people-authority.cfg` | Pesquisa de pessoas cadastradas para autoria, orientação e banca. |
| `scripts/prepare-academic.sh` | Registro de campos/tipos e preparação da coleção Person. |
| `frontend/themes/custom/` | SCSS, assets e componentes sobrescritos pelo projeto. |
| `frontend/config/config.prod.yml` | Configuração local carregada em tempo de execução. |
| `cli.yml` | Comandos administrativos, como criação do administrador e `filter-media`. |

## Desenvolvimento local do frontend

Use um projeto Compose separado para não compartilhar banco, Solr ou arquivos
com a implantação de produção. O frontend usa o código-fonte oficial
`dspace-10.1`, aplica os mesmos patches do build de produção e observa
`frontend/themes/` a cada dois segundos. Edições em SCSS, templates, componentes,
assets e traduções são copiadas para a árvore oficial e recompiladas pelo
servidor Angular. O primeiro build pode levar alguns minutos e requer memória
suficiente para o processo Node (limite de heap de 4 GiB).

```bash
cp .env.development.example .env.development
# Edite POSTGRES_PASSWORD, GEOLITE2_CITY_DB_PATH e DSPACE_SAF_HOST_DIR.
# Crie o diretório SAF e use um arquivo GeoLite2 City já existente.
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml up --build
```

Abra `http://localhost:4000/`; a API está em
`http://localhost:8080/server/api`. As portas 4000 e 8080 só aceitam conexões
em `127.0.0.1`. O frontend acessa a API pelo navegador nesse endereço, e o
backend permite `http://localhost:4000` no CORS. Esse fluxo local não usa o
proxy institucional nem os caminhos públicos `/dspace/` e `/dspace-server/`.
O Compose de desenvolvimento usa a rede `172.27.0.0/24`, alinhada ao prefixo
confiável `172.27.0`; confira se ela não conflita com o host ou a VPN. Requer
Docker Compose 2.24.4 ou posterior para `!override`.

Ao editar `frontend/config/config.prod.yml`, reinicie `dspace-angular` para
recarregar a configuração. Alterações nos patches e em `frontend/overrides/`
exigem `up --build` novamente. O backend continua sendo a imagem DSpace 10.1:
alterações em código Java exigem um build próprio e reinício do backend. Para
encerrar o ambiente local sem remover seus dados:

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml down
```

## Preparação para produção

Crie um `.env` privado a partir de `.env.production.example` e substitua todos
os valores de exemplo. Use uma senha aleatória para `POSTGRES_PASSWORD`. O
PostgreSQL aplica `POSTGRES_PASSWORD` apenas quando inicializa um volume vazio;
alterar essa variável depois exige trocar a senha dentro do banco também.
Mantenha o arquivo fora do controle de versão e restrinja sua leitura no host
(`chmod 600 .env`). O mesmo valor é passado ao PostgreSQL, ao backend e à CLI.

O serviço `dspace-proxy` deste projeto compartilha a rede `dspacenet` com
backend e frontend. Ele é o único serviço do projeto que publica uma porta:
HTTP na porta **80 do servidor DSpace**. O proxy reverso geral, externo a este
servidor, recebe HTTP e HTTPS públicos e encerra o TLS. Ele encaminha as
requisições já decifradas para a porta 80 do `dspace-proxy`.
Portanto, certificados e a porta 443 pertencem exclusivamente ao proxy geral.
Os containers DSpace, PostgreSQL e Solr não publicam portas.
A porta 80 do servidor DSpace precisa estar livre e o firewall deve permitir
acesso a ela somente a partir do proxy geral.

A imagem do proxy interno está fixada em `nginx:1.30.5-alpine3.24` e no digest
correspondente, para que um `pull` posterior não troque os bytes da imagem sem
uma mudança neste projeto. Atualize versão e digest de forma planejada, valide
`proxy/nginx.conf` com `nginx -t` e teste as duas rotas antes de publicar.

O roteamento já está implementado em `proxy/nginx.conf`:

| Caminho público | Destino interno | Tratamento |
| --- | --- | --- |
| `/dspace/` | `dspace-angular:4000` | Preserva `/dspace/` |
| `/dspace-server/` | `dspace:8080` | Troca `/dspace-server/` por `/server/` |

O prefixo `/dspace-server/` atende os serviços do backend: a API REST fica em
`/dspace-server/api` e o OAI-PMH em `/dspace-server/oai/request`.

O proxy geral encaminha esses prefixos para o nome interno do servidor DSpace,
por exemplo `http://dspace-host.interno.example.org:80`, mantendo
o caminho original, o cabeçalho `Host` e os cabeçalhos `X-Forwarded-Proto`,
`X-Forwarded-Host` e `X-Forwarded-For`. Para uma requisição HTTPS pública,
ele informa `X-Forwarded-Proto: https`. O proxy interno preserva esse valor
ao falar com Angular e DSpace. Use esses prefixos antes de qualquer rota
genérica do proxy geral.

Ao migrar de `/dspace-api` para `/dspace-server`, atualize também o prefixo
no proxy geral e `DSPACE_SERVER_URL` no `.env` privado. Recrie os serviços
`dspace`, `dspace-angular` e `dspace-proxy` com os três arquivos Compose de
produção. Atualize integrações e coletores OAI-PMH que usam o endereço antigo.

### Qual endereço vai em cada variável

**Endereço público** é o que aparece no navegador, mesmo quando o DNS só
funciona na rede interna. Suponha que, nesta fase, os usuários acessem
`https://repo.interno.example.org`:

| Variável do `.env` | Valor nesta fase | Uso |
| --- | --- | --- |
| `DSPACE_PUBLIC_ORIGIN` | `https://repo.interno.example.org` | Origem autorizada no CORS da API, sem caminho. |
| `DSPACE_UI_URL` | `https://repo.interno.example.org/dspace` | URL da interface exibida ao usuário e usada em links, e-mails e sitemaps. |
| `DSPACE_SERVER_URL` | `https://repo.interno.example.org/dspace-server` | URL pública do backend, incluindo API e OAI-PMH. |
| `DSPACE_REST_HOST` | `repo.interno.example.org` | Hostname da API no navegador, sem `https://` nem caminho. |

Essas URLs não devem terminar em `/`. O proxy geral encaminha os caminhos
`/dspace` e `/dspace-server` para **outro nome**, que identifica a máquina DSpace
na rede entre servidores: `http://dspace-host.interno.example.org:80` no
exemplo. Esse destino é configurado somente no proxy geral; não pertence ao
`.env` do DSpace. Não use como destino o próprio nome que resolve para o
proxy geral, para evitar um ciclo de encaminhamento.

Quando `https://repo.example.org` passar a ser o endereço visto pelos usuários,
troque o hostname nas quatro variáveis acima, ajuste o DNS e o host virtual do
proxy geral, recrie os containers `dspace` e `dspace-angular` e gere novamente
os sitemaps. O destino interno do proxy geral continua apontando para a mesma
máquina DSpace. Planeje a mudança de URLs de OAI-PMH e links já divulgados.

O exemplo pressupõe HTTPS entre o navegador e o proxy geral, com
`DSPACE_REST_SSL=true` e `DSPACE_REST_PORT=443` no `.env`. Se o endereço
acessível aos usuários oferecer somente HTTP nesta fase, configure:

```dotenv
DSPACE_PUBLIC_ORIGIN=http://repo.interno.example.org
DSPACE_UI_URL=http://repo.interno.example.org/dspace
DSPACE_SERVER_URL=http://repo.interno.example.org/dspace-server
DSPACE_REST_HOST=repo.interno.example.org
DSPACE_REST_SSL=false
DSPACE_REST_PORT=80
```

Depois de alterar esses valores, recrie `dspace` e `dspace-angular` usando os
três arquivos Compose de produção. Alterar somente o `.env` não atualiza
containers existentes. Quando o proxy geral passar a oferecer HTTPS, mude as
três URLs para `https://`, `DSPACE_REST_SSL` para `true` e `DSPACE_REST_PORT`
para `443`, e recrie os mesmos serviços. Essas opções descrevem a conexão do
navegador com a API; a comunicação do proxy geral com o `dspace-proxy`
continua HTTP na porta 80, inclusive depois da ativação do TLS.

`DSPACE_PUBLIC_ORIGIN` é usado no CORS porque o cabeçalho `Origin` do
navegador não inclui `/dspace`. A sub-rede Docker `172.23.0.0/24` fornece IPs
internos aos containers da aplicação; o prefixo `172.23.0` no backend permite
confiar no IP real do visitante repassado pelo proxy e pelo frontend nessa rede.
Esse prefixo não é um domínio público. Confira se a sub-rede não conflita com
outras redes Docker, do host ou da VPN. Se precisar trocá-la, ajuste também
`proxies__P__trusted__P__ipranges` para os três primeiros números da nova faixa.
Se já existir uma rede `d10_dspacenet` criada com a faixa antiga `/16`, planeje
uma parada para recriá-la com `/24`; o Docker não altera a faixa de uma rede
existente. Preserve os volumes de dados ao fazer essa operação.

Exemplo de integração no Nginx do proxy geral externo:

```nginx
location ~ ^/(dspace|dspace-server)(/|$) {
    proxy_pass http://dspace-host.interno.example.org:80;
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
Substitua o nome interno ilustrativo pelo DNS que o proxy geral usa para
alcançar o servidor DSpace. O domínio público já está configurado em
`DSPACE_PUBLIC_ORIGIN`, `DSPACE_UI_URL`, `DSPACE_SERVER_URL` e
`DSPACE_REST_HOST`; ele não precisa ser usado como endereço de bind do
container. Ajuste o limite de upload e os tempos limite tanto no proxy geral
quanto em `proxy/nginx.conf` ao perfil do acervo.

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
  pull dspace dspace-angular dspacedb dspacesolr dspace-proxy
docker compose --env-file .env -p d10 -f docker-compose-dist.yml \
  -f docker-compose-rest.yml -f docker-compose-prod.yml up -d
```

Teste o roteamento interno antes de liberar o acesso público:

```bash
curl --fail -H 'Host: repo.interno.example.org' \
  -H 'X-Forwarded-Proto: https' \
  http://localhost:80/dspace-server/api
```

Depois, teste a URL HTTPS pública. O handshake TLS é responsabilidade do
proxy geral; o teste local acima verifica apenas o roteamento deste projeto.

`config --quiet` valida a composição e a presença das variáveis exigidas; use
o arquivo de produção em **todos** os comandos de subida e recriação. Após a
subida, confira `docker compose ... ps`, os logs dos serviços e as URLs HTTPS
públicas da interface (`/dspace/`), API (`/dspace-server/api`), OAI-PMH
(`/dspace-server/oai/request?verb=Identify`) e `/dspace/sitemap_index.xml`.
Verifique também `/dspace/robots.txt` e faça um teste de login, upload de
arquivo e envio de e-mail.
Um `config --quiet` bem-sucedido não verifica DNS, certificado, proxy, SMTP ou
permissões de escrita dos volumes no servidor.

Antes de importar dados, estabeleça um backup consistente do PostgreSQL
(`pg_dump` ou snapshot coordenado) e do volume `assetstore`, e teste a
restauração. Inclua `solr_data` e `sitemaps` no plano de recuperação ou
documente como reconstruí-los. Monitore espaço em disco,
disponibilidade dos containers e validade do certificado TLS.

O workflow `.github/workflows/deploy.yml` compila a imagem customizada e a
publica em `ghcr.io/nti-ufal-arapiraca/dspace-bca-angular` a cada push. O
Compose de produção usa essa imagem, sem executar build local; mantenha
`DSPACE_ANGULAR_IMAGE` e `DSPACE_ANGULAR_TAG` alinhados ao workflow. O frontend
não usa mais diretamente a imagem `*-dist` publicada. O
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
https://repo.interno.example.org/dspace-server/oai/request
```

Valide o protocolo com o verbo `Identify`:

```bash
curl --fail \
  'https://repo.interno.example.org/dspace-server/oai/request?verb=Identify'
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
curl --fail https://repo.interno.example.org/dspace/robots.txt
curl --fail https://repo.interno.example.org/dspace/sitemap_index.xml
curl --fail https://repo.interno.example.org/dspace/sitemap_index.html
```

Substitua o domínio ilustrativo pelo real e confira se os links gerados contêm
`/dspace`; URLs públicas incorretas prejudicam os sitemaps e a renderização SSR.

Acervos importados antes dessa normalização devem executar uma vez
`backend/sql/normalize_abstract_languages.sql` e depois `index-discovery -b`,
após um backup e uma revisão dos dados afetados.

O tema `custom` é ativado em `frontend/config/config.prod.yml`. Mudanças em
SCSS, assets ou componentes são compiladas pelo workflow após o push. Mudanças
apenas nesse YAML exigem somente:

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

Os serviços REST e CLI carregam os mesmos overrides acadêmicos por mounts.
`config-definition.xml` acrescenta `people-authority.cfg` à cadeia oficial,
preservando `local.cfg` e as variáveis de ambiente. `modules/rest.cfg` mantém
as propriedades expostas pela versão 10.1 e acrescenta a propriedade do
modelo de relações. Não é necessário copiar plugins Java para o container.

Os processos tradicional e Publication, inclusive suas variantes de edição,
incluem a seção “Dados acadêmicos”. Os campos de pessoas usam seleção
fechada; curso e campus são editáveis em `local.course.name` e
`local.campus.name`. As páginas de trabalho têm links para pessoas; seus
perfis separam autoria, orientação, coorientação e participação em banca.

Depois de iniciar o backend com esses arquivos, execute a preparação indicada
no [guia](docs/guia-dspace-academico.md). O script registra os campos,
inicializa as entidades e salva a coleção Person no `.env` da migração.
O modelo escolhido é Authority Framework; instalações que já têm relações
com metadados virtuais precisam planejar a conversão antes de adotá-lo.

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
