# Implantação e configuração

Este documento descreve a arquitetura. Os procedimentos estão nos
[guias de execução](../README.md).

## Serviços e persistência

O DSpace usa backend REST, PostgreSQL, Solr, Angular com SSR e um proxy Nginx
interno. Os volumes `pgdata` e `assetstore` formam o conjunto persistente do
acervo; `solr_data` contém os índices e as estatísticas; `sitemaps` conserva
os arquivos XML e HTML gerados.

A produção combina `docker-compose-dist.yml`, `docker-compose-rest.yml` e
`docker-compose-prod.yml`. Somente `dspace-proxy` publica a porta 80. O proxy
institucional termina TLS e preserva `Host` e `X-Forwarded-*` até o backend.
Certificados e porta 443 pertencem ao proxy institucional.

| Caminho público | Destino interno |
| --- | --- |
| `/dspace/` | `dspace-angular:4000`, preservando o prefixo |
| `/dspace-server/` | `dspace:8080/server/`, substituindo o prefixo |

A API fica em `/dspace-server/api`; OAI-PMH, em
`/dspace-server/oai/request`. A rede de produção usa `172.23.0.0/24`, e o
backend confia no prefixo `172.23.0`. Uma troca de faixa exige recriar a rede
preservando os volumes e atualizar o prefixo confiável.

A imagem do proxy é fixada em versão e digest no Compose. A atualização de
ambos deve ocorrer em conjunto. O PostgreSQL aplica `POSTGRES_PASSWORD`
somente ao inicializar um volume vazio; mudar o `.env` depois não altera a
senha persistida no banco.

## URLs públicas e proxy institucional

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

Uma mudança do endereço público envolve as quatro variáveis, o DNS e o host
virtual institucional. O destino interno continua sendo a máquina DSpace.
As URLs de OAI-PMH, os links divulgados e os sitemaps dependem dessa mudança.
O procedimento de atualização está no [guia de operação](../guias/operacao.md).

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

Alterar somente o `.env` não atualiza containers existentes. Com HTTPS, as
três URLs usam `https://`, `DSPACE_REST_SSL` é `true` e `DSPACE_REST_PORT`
é `443`. Essas opções descrevem a conexão do navegador com a API; a
comunicação do proxy geral com o `dspace-proxy` continua HTTP na porta 80.

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

Os binds de produção exigem que `DSPACE_SAF_HOST_DIR` e o arquivo de
`GEOLITE2_CITY_DB_PATH` já existam. `DSPACE_MAIL_SERVER` identifica o SMTP,
`DSPACE_MAIL_FROM` define o remetente e `DSPACE_ADMIN_EMAIL` define o contato.
Porta, TLS e autenticação usam as propriedades `mail.*` do DSpace no
ambiente do backend, conforme as exigências do provedor.

## Versões, publicação e runtime

Backend, Solr, CLI e Angular usam `dspace-10.1`. `DSPACE_VER` e
`DSPACE_ANGULAR_TAG` permanecem alinhadas. As tags `dspace-10_x` acompanham
código ainda não lançado; `latest` e `latest-test` podem mudar de versão
principal. Um banco migrado pelo DSpace 11 não pode ser aberto pelo 10; dados
existentes exigem restauração de backup compatível.

O workflow `.github/workflows/deploy.yml` publica a interface em
`ghcr.io/nti-ufal-arapiraca/dspace-bca-angular` a cada push. O
`Dockerfile.angular` aplica o tema e os patches ao fonte oficial e usa
`dspace-10.1-dist` no runtime. O servidor executa `/app/dist/server/main.js`.

`frontend/config/config.prod.yml` é carregado por `DSPACE_APP_CONFIG_PATH`;
as variáveis de ambiente têm prioridade. Mudanças nesse YAML precisam de
recriação do frontend; tema, componentes, patches e `robots.txt` precisam de
uma nova imagem publicada pelo workflow.

No desenvolvimento, `d10dev` tem banco, Solr e assetstore próprios. A rede é
`172.27.0.0/24`, com prefixo confiável `172.27.0`. A interface usa a porta
4000 e a API usa a 8080, ambas em `127.0.0.1`. O watcher copia mudanças do
tema a cada dois segundos. O Node usa heap de até 4 GiB. O Compose precisa
ser 2.24.4 ou posterior para aceitar `!override`.

## Metadados, idioma e nome público

O backend negocia os metadados públicos por `Accept-Language`. Na página simples
do trabalho (UntypedItem e Publication), o componente de resumos faz uma consulta
adicional com `projection=allLanguages` e exibe cada `dc.description.abstract`
disponível. Os demais campos e as buscas continuam localizados. Cada resumo
mostra até 10 linhas e oferece expansão individual quando necessário. A API
mantém as regras de autorização e de ocultação de metadados nessa projeção.

Os qualifiers usuais são `pt` e `en`, mas a exibição aceita outros idiomas e
variantes regionais; `dc.language.iso` continua independente e usa `pt_BR` no
legado. O editor administrativo solicita `allLanguages` para preservar todas
as traduções, inclusive nas respostas de PATCH. A normalização legada afeta
somente qualifiers de resumos. A decisão de exibição está na
[RFC 0018](../../rfc/0018-resumos-publicos-em-todos-os-idiomas.md).

`DSPACE_NAME` define o nome público; seu padrão é
`Repositório Institucional da UFAL — Campus Arapiraca`. O backend expõe
`dspace.name` à interface, inclusive nos títulos das estatísticas. Os títulos
das páginas e abas do navegador usam `repository.title` e
`repository.title.prefix` nos catálogos localizados do tema; alterá-los exige
reconstruir a imagem Angular de produção.

## OAI, sitemaps e GeoIP

O OAI-PMH usa o mesmo backend e um core próprio no Solr. `OAI_ENABLED` e
`OAI_PATH` controlam sua ativação e caminho. `DSPACE_ADMIN_EMAIL` fornece o
contato e o hostname de `DSPACE_UI_URL` compõe o prefixo padrão dos
identificadores OAI. Reconstruir OAI altera o índice, sem reimportar itens.
Campos locais não ganham mapeamentos em todos os formatos OAI automaticamente.

O backend gera sitemaps XML e HTML diariamente às 01:15, conforme
`SITEMAP_CRON`. O frontend encaminha `/dspace/sitemap*` para esses arquivos.
O template `frontend/overrides/robots.txt.ejs` usa a URL pública e aponta
para os dois sitemaps. SSR retorna o título e metadados do item no HTML.

No ambiente local, o diagnóstico SEO do backend não alcança a interface por
`localhost:4000`, pois esse endereço aponta para o próprio container.
`SEO_HEALTH_ENABLED=false` desativa apenas esse diagnóstico. Em produção,
o diagnóstico depende de a URL pública ser acessível pelo backend.

`GEOLITE2_CITY_DB_PATH` fornece o GeoLite2 City `.mmdb`, montado como somente
leitura. A propriedade efetiva é `usage-statistics.dbfile`. O formato antigo
`GeoLiteCity.dat` não se aplica. IPs privados e loopback não têm localização
geográfica. A base e suas credenciais não pertencem ao Git.

## SAF e administração

`DSPACE_SAF_HOST_DIR` identifica a pasta do host montada em
`/dspace/saf_bundle`. Sem essa variável, a configuração base usa
`SAF_BUNDLE_DIR` e depois `../saf_bundle`. A produção exige o caminho
explícito e o monta como somente leitura. O overlay de migração permite
que o importador grave os mapfiles e não publica portas extras.

`cli.yml` utiliza a rede e o assetstore do projeto indicado por `-p`.
Os overrides acadêmicos são montados tanto na CLI quanto no backend REST.
