# Orientações para agentes neste repositório

## Objetivo e contexto

Este repositório configura e personaliza o DSpace **10.1** da Biblioteca da UFAL — Campus Arapiraca. Ele reúne a implantação Docker, configurações do backend, tema Angular e documentação operacional. A extração e a importação do acervo legado são mantidas no projeto irmão `dspace-migration`; não replique aqui a lógica de migração.

Antes de alterar implantação, versões, URLs, metadados ou comportamento visível, leia o `README.md` e a referência ou guia relevante em `docs/`. As RFCs em `rfc/` registram decisões que ajudam a preservar compatibilidade.

## Arquitetura e responsabilidades

| Área | Responsabilidade |
| --- | --- |
| `docker-compose-rest.yml` | Backend DSpace, PostgreSQL, Solr, volumes persistentes e rede base. |
| `docker-compose-dist.yml` | Serviço Angular, sua imagem/build e configuração de runtime. |
| `docker-compose-prod.yml` | Valores e proxy exclusivos de produção; aplicado após `dist` e `rest`. |
| `docker-compose-dev.yml` | Desenvolvimento local, com volumes e rede isolados, portas em loopback e atualização do tema. |
| `docker-compose-local.yml` | Overlay opcional para publicar UI e API em loopback; não é o Compose principal de desenvolvimento nem deve ser usado em produção. |
| `docker-compose-migration.yml` | Overlay temporário que permite ao importador escrever mapfiles no SAF de produção. |
| `cli.yml` | CLI administrativa conectada à rede e ao assetstore do projeto Compose escolhido. |
| `proxy/nginx.conf` | Proxy interno HTTP; não termina TLS. |
| `backend/config/` | Overrides do DSpace: metadados, formulários, autoridade, Discovery e propriedades REST. |
| `frontend/config/` | Configuração Angular carregada em runtime, montada separadamente da imagem. |
| `frontend/themes/custom/` | Componentes, estilos, traduções e assets institucionais. |
| `frontend/overrides/` e `frontend/patches/` | Extensões e patches aplicados ao código oficial Angular durante o build. |
| `Dockerfile.angular` e `.github/workflows/deploy.yml` | Compilação e publicação da imagem Angular no GHCR. |
| `Dockerfile.angular.dev` e `frontend/dev/` | Servidor e sincronização do tema no ambiente local. |
| `scripts/prepare-academic.sh` e `scripts/prepare_people_collection.py` | Preparação idempotente de metadados e da coleção bibliográfica Pessoas; não importam trabalhos. |
| `tests/` | Verificações da configuração acadêmica e do script de preparação. |
| `docs/` e `rfc/` | Guias, referências arquiteturais e decisões. |

Produção combina `docker-compose-dist.yml`, `docker-compose-rest.yml` e `docker-compose-prod.yml`, nessa ordem. Desenvolvimento combina `docker-compose-rest.yml` e `docker-compose-dev.yml`, com o projeto `d10dev` para isolar banco, assetstore e rede locais.

## Fluxos e modelo do domínio

- O proxy geral da instituição termina TLS e encaminha HTTP para a porta 80 do `dspace-proxy`. O proxy do projeto encaminha `/dspace/` para Angular e `/dspace-server/` para o contexto `/server/` do backend.
- O fluxo entre proxies e DSpace depende de `Host` e `X-Forwarded-*`. Preserve esses cabeçalhos ao alterar Nginx, rotas, URLs ou confiança de proxy.
- A imagem Angular contém tema, componentes, patches e `robots.txt`; o YAML em `frontend/config/config.prod.yml` é configuração de runtime montada em separado. Mudanças no primeiro grupo exigem nova imagem pelo workflow; mudanças somente no YAML exigem recriar o serviço.
- Os itens representam trabalhos. Curso e campus usam os campos `local.course.name` e `local.campus.name`. Autor, orientador, coorientador e avaliador referenciam pessoas por UUID de autoridade.
- `Person` é um cadastro bibliográfico, sem conta de acesso; `EPerson` é uma conta de login. Não crie contas para autores ou professores como efeito da preparação acadêmica.
- A coleção Pessoas contém entidades `Person`. Os quatro papéis compartilham a autoridade configurada em `backend/config/people-authority.cfg`; Discovery alimenta seletores, buscas e abas dos perfis.
- A configuração escolhe Authority Framework com `relationship.enable-virtual-metadata=false`. Alterar essa propriedade não converte relações virtuais preexistentes. Não presuma que trocar configuração transforma dados já persistidos.
- E-mail de `Person` é ocultado na API anônima pelo padrão do DSpace. Não torne dados pessoais públicos nem mude exposição, identidade, campos ou política de acesso sem uma decisão explícita documentada.
- Os resumos usam qualifiers de idioma (`pt` e `en`); `dc.language.iso` é independente. Ao alterar formulários ou patches de idioma, preserve traduções existentes e a diferença entre resposta pública localizada e edição administrativa `allLanguages`.

## Contratos de produção e segurança

- Em produção, somente `dspace-proxy` publica a porta 80. Não publique frontend, backend, PostgreSQL ou Solr diretamente. Certificados e porta 443 pertencem ao proxy geral.
- `DSPACE_PUBLIC_ORIGIN`, `DSPACE_UI_URL`, `DSPACE_SERVER_URL` e `DSPACE_REST_HOST` descrevem o endereço público visto pelo navegador, não o hostname interno do servidor DSpace. Use valores ilustrativos na documentação e confira `.env.production.example` e `docs/referencia/implantacao.md`.
- As URLs públicas não devem terminar em `/`. `DSPACE_PUBLIC_ORIGIN` não inclui caminho; a UI usa `/dspace` e a API `/dspace-server`.
- A rede Docker de produção usa `172.23.0.0/24` e o backend confia no prefixo `172.23.0`. Desenvolvimento usa `172.27.0.0/24` e `172.27.0`. Se mudar uma faixa, ajuste a confiança correspondente e verifique conflitos com host, Docker e VPN. Rede existente precisa ser recriada para mudar de faixa; preserve volumes.
- PostgreSQL, assetstore, Solr e sitemaps têm persistência própria. Banco e assetstore devem ser tratados como conjunto consistente em backup/restauração. Nunca recomende `docker compose down -v` em produção.
- Não inclua credenciais reais, arquivos `.env`, certificados, dumps, conteúdo do SAF ou base GeoLite2 no Git. Os exemplos devem usar valores genéricos. Mantenha imagens fixadas em versões explícitas; se uma imagem usa digest, atualize tag e digest em conjunto.
- O bind de GeoLite2 é somente leitura e precisa existir no host. O SAF de produção normalmente é somente leitura; use o overlay de migração apenas durante a importação e retorne ao Compose normal ao terminar.
- Não altere silenciosamente a versão principal, comportamento público, políticas de acesso, exposição de metadados, estrutura de dados persistidos ou estratégia de proxy. Registre decisões arquiteturais duradouras em uma RFC e atualize a documentação aplicável.

## Organização e qualidade de código

- Mantenha código limpo, legível e organizado por domínio e responsabilidade. Cada módulo, componente, função ou script deve ter um propósito claro e limitado; preserve o princípio de responsabilidade única.
- Prefira mudanças pequenas e coesas. Separe apresentação, estado/navegação, regras de domínio, acesso a dados e configuração. Evite duplicação, efeitos colaterais escondidos, abstrações prematuras e condicionais complexas; extraia helpers quando isso esclarecer a intenção ou permitir validar lógica isoladamente.
- Em Angular, siga os pontos de extensão e convenções da versão DSpace fixada. Mantenha componentes focados, reutilize componentes existentes quando apropriado e deixe lógica de navegação/transformação em serviços ou helpers com escopo claro. Atualize os registros eager/listable quando um componente customizado exigir isso.
- Em scripts, valide argumentos e pré-condições antes de alterar estado; torne operações repetíveis quando possível, reporte erros com contexto e não sobrescreva valores curados ou secretos sem necessidade explícita.
- Preserve nomes, idioma e estilo existentes. Documente o motivo e os efeitos de decisões não óbvias; não duplique nos comentários o que o código expressa claramente.
- Ao alterar um contrato, atualize o ponto de implementação, os exemplos e os guias/referências dependentes no mesmo conjunto de mudanças. Não faça alterações colaterais em arquivos do usuário fora do escopo solicitado.

## Onde fazer mudanças

- Para rotas, cabeçalhos, upload ou timeout: leia `proxy/nginx.conf` e a referência de implantação; considere também o proxy geral institucional.
- Para rede, portas, volumes, imagens e variáveis: inspecione todos os Compose que formam o ambiente afetado, pois overlays alteram serviços definidos em outros arquivos.
- Para campos/formulários/autoridades/Discovery: consulte `backend/README.md`, `docs/referencia/modelo-academico.md` e os XMLs relacionados em `backend/config/`. REST e CLI devem receber overrides compatíveis.
- Para páginas e componentes DSpace: localize o componente oficial da versão `dspace-10.1`, então use o caminho equivalente em `frontend/themes/custom/`; confirme registros em `frontend/themes/*.ts` ou no tema.
- Para comportamento Angular fora do ponto de extensão: prefira patch isolado em `frontend/patches/` ou override em `frontend/overrides/`, com aplicação explícita nos Dockerfiles. Evite editar dependências geradas ou depender de arquivos temporários do build.
- Para pessoas e perfis: mantenha frontend, metadados, formulários, authority e Discovery coerentes. Consulte também o projeto irmão `dspace-migration` para contratos de identidade, manifesto e aplicação de vínculos; a preparação deste repositório não substitui a importação.
- Para processos/execução: atualize o guia em `docs/guias/`; para arquitetura e contratos, `docs/referencia/`; para decisões que afetam versões ou modelo, crie/atualize RFC em `rfc/`.

## Validação

Escolha verificações proporcionais aos arquivos alterados e não trate validação sintática como teste de integração.

- Para qualquer mudança, revise o diff e rode `git diff --check`.
- Antes de finalizar mudanças em Compose de produção, rode:

  ```bash
  docker compose --env-file .env.production.example -p d10 \
    -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
    config --quiet
  ```

  Confira também que somente o proxy publica porta em produção. Não use Compose local para validar produção.
- Para mudanças em Nginx, valide `nginx -t` usando a imagem fixada em `docker-compose-prod.yml` e teste `/dspace/` e `/dspace-server/`, incluindo preservação dos cabeçalhos de proxy.
- Para mudanças no script de preparação, backend de configuração, patches ou helpers Angular, execute as verificações específicas existentes em `tests/` e/ou as verificações de build adequadas ao ambiente. Não alegue que um teste foi executado se não foi.
- `docker compose config` verifica interpolação e sintaxe dos modelos; não verifica DNS, TLS, SMTP, permissões nos volumes, estado de banco, SSR ou funcionamento real das rotas.
- Se uma validação depender de credenciais, dados locais ou serviços indisponíveis, indique claramente o que ficou sem validação e por quê.

## Commits

Use sempre Conventional Commits no formato `tipo(escopo): descrição`, em português quando adequado. Tipos comuns: `feat`, `fix`, `docs`, `refactor`, `test` e `chore`. Indique mudanças incompatíveis com `!` e explique o impacto no corpo do commit. Mantenha commits coesos e sem segredos.
