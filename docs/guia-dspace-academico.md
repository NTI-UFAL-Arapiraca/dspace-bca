Este guia explica a preparação do repositório acadêmico e a migração dos
trabalhos e das pessoas. Os comandos pressupõem os projetos `dspace-bca` e
`dspace-migration` lado a lado, como nesta instalação. A configuração foi
preparada para DSpace **10.1** e para o modelo **Authority Framework**.

No DSpace, um trabalho é um **item**: seus arquivos, título, resumo e outros
metadados ficam juntos. Uma coleção agrupa itens; uma comunidade agrupa
coleções e outras comunidades. Nossa organização por campus e curso continua
existindo. Adicionamos uma coleção de pessoas à organização do repositório.

| Termo | O que significa neste projeto |
| --- | --- |
| Item | Um trabalho ou outro registro descrito no repositório. |
| Metadado | Um campo de descrição: título, curso, resumo, orientador etc. |
| `Person` | Cadastro bibliográfico de uma pessoa, com página própria. |
| `EPerson` | Conta usada para fazer login. É independente do cadastro bibliográfico. |
| Autoridade | Referência estável ao UUID de uma pessoa cadastrada. |
| UUID | Identificador interno atribuído pelo DSpace. |
| Handle | Identificador persistente do trabalho, preservado nos lotes já importados. |
| SAF | Pasta de importação com os arquivos e metadados de cada trabalho. |
| Discovery/Solr | Índice usado pelas buscas, seletores e listas de trabalhos relacionados. |

Uma pessoa pode ser autora de um trabalho e orientadora de outro. Guardamos
o cadastro uma vez e registramos seu papel em cada trabalho. Os autores e
professores migrados não recebem contas de acesso: a biblioteca administra
os cadastros. O administrador usa sua própria conta para preparar e revisar
a migração.

```mermaid
flowchart LR
    L[Banco legado] --> E[Extração: trabalhos e pessoas com IDs]
    E --> S[Pacotes SAF e manifesto de pessoas]
    S --> I[Importação dos trabalhos]
    I --> P[Criação e reutilização de Person]
    P --> V[Vínculos de autoria, orientação e banca]
    V --> B[Busca e páginas públicas]
```

Os seguintes arquivos já estão integrados à implantação. Não é necessário
copiar o exemplo `people-authority.cfg.example` manualmente para o container.

| Arquivo | Função |
| --- | --- |
| `backend/config/config-definition.xml` | Carrega os overrides acadêmicos e preserva o mecanismo de `local.cfg` e variáveis de ambiente. |
| `backend/config/people-authority.cfg` | Registra a pesquisa de pessoas locais e associa os quatro papéis à mesma autoridade. Mantém `EPersonAuthority`, fornecida pela imagem. |
| `backend/config/modules/rest.cfg` | Preserva as propriedades REST oficiais e expõe o modelo de relações para a verificação da migração. |
| `backend/config/item-submission.xml` | Acrescenta a seção acadêmica à submissão e à edição de trabalhos. |
| `backend/config/submission-forms.xml` | Define os controles de edição e os seletores fechados de pessoas. |
| `backend/config/registries/academic-metadata.xml` | Cadastra os campos adicionais. |
| `backend/config/spring/api/academic-discovery.xml` | Acrescenta buscas por autoria, orientação, coorientação e banca, sem substituir as buscas oficiais. |
| `frontend/themes/custom/` | Mostra nomes com links, curso e campus nos trabalhos e quatro abas no perfil de uma pessoa. |

Os arquivos do backend são montados como somente leitura nos serviços
`dspace` e `dspace-cli`. As classes dos plugins já pertencem ao DSpace;
`MigrationPersonAuthority` é o nome que usamos para pesquisar registros
`Person`. Não há um JAR adicional para instalar.

Os campos do acervo ficam assim:

| Informação | Campo |
| --- | --- |
| Curso | `local.course.name` |
| Campus | `local.campus.name` |
| Autor | `dc.contributor.author` |
| Orientador | `dc.contributor.advisor` |
| Coorientador | `dc.contributor.coadvisor` |
| Avaliador da banca | `dc.contributor.referee` |

Curso e campus são campos de texto editáveis nesta entrega. Os quatro
campos de pessoas usam seleção de cadastro existente. Se a pessoa ainda não
existir, a biblioteca a cadastra na coleção Pessoas e depois a seleciona no
trabalho. Programa de pós-graduação e grau acadêmico não são deduzidos do
nome do curso.

**1. Escolha o ambiente e confira os dados existentes.** Comece pelo ambiente
isolado de desenvolvimento e por um lote pequeno. O projeto `d10dev` usa
seus próprios volumes; `d10` identifica a instalação de produção. Preserve
os volumes ao encerrar qualquer um deles.

Esta configuração usa `relationship.enable-virtual-metadata=false`. Se a
instalação já tiver relacionamentos tradicionais entre entidades, planeje
sua conversão antes de carregar esse modelo. A troca da propriedade não
converte relacionamentos existentes. Trabalhos migrados apenas com nomes
em texto serão enriquecidos por `apply-people`.

Para lotes já importados, preserve o banco DSpace, o assetstore, o SAF e seus
`mapfile.txt`. Eles permitem localizar os trabalhos existentes sem
reimportá-los. Use o procedimento de backup e restauração do README antes
de alterar o acervo definitivo.

**2. Prepare os dois arquivos de ambiente.** O `.env` da implantação descreve
o servidor DSpace; o `.env` da migração descreve o banco legado e o acesso à
API. São arquivos privados e devem permanecer fora do Git. Se já existirem,
edite-os; não substitua suas senhas pelos valores dos exemplos.

Para um ambiente novo de desenvolvimento, na pasta `dspace-bca`:

```bash
cp .env.development.example .env.development
```

Preencha `POSTGRES_PASSWORD`, `GEOLITE2_CITY_DB_PATH` e
`DSPACE_SAF_HOST_DIR`. O último aponta para uma pasta SAF existente. Para
um piloto, use uma pasta nova, exclusiva do piloto, e configure o mesmo
caminho em `SAF_BUNDLE_DIR` na migração. Isso evita importar pastas de um
lote anterior ao testar `--limit`.

Em `dspace-migration`, prepare `.env` a partir de `.env.example`, se ainda
não houver um arquivo. Confira:

| Variável | Desenvolvimento | Produção |
| --- | --- | --- |
| `DB_*` | Banco legado restaurado para o teste. | Banco legado selecionado para extração. |
| `SAF_BUNDLE_DIR` | Pasta nova do piloto. | Pasta do lote definitivo. |
| `DSPACE_API_URL` | `http://localhost:8080/server/api` | `https://repo.interno.example.org/dspace-server/api` |
| `DSPACE_API_USER` | E-mail do administrador DSpace. | E-mail do administrador DSpace. |
| `DSPACE_API_PASSWORD` | Senha desse administrador. | Senha desse administrador. |
| `DSPACE_PERSON_COLLECTION_UUID` | Pode ficar vazio inicialmente. | Pode ficar vazio inicialmente. |

As credenciais `DB_*` são do banco de origem; as `DSPACE_API_*` são da conta
administrativa do destino. Os comandos não criam contas para os autores.

**3. Inicie a instalação com as configurações e a interface novas.** Para
desenvolvimento, execute em `dspace-bca`:

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml up -d --build
```

A compilação inicial da interface demora alguns minutos. Acesse
`http://localhost:4000/` e confira os logs caso a API ainda não esteja pronta:

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml logs --tail=80 dspace
```

Para produção, prepare `.env` conforme `.env.production.example` e o
README. Somente o proxy publica a porta 80; TLS e certificados continuam
no proxy institucional. As URLs públicas mantêm `/dspace/` e
`/dspace-server/`.

A publicação continua pelo fluxo existente: faça commit e push das alterações
do projeto `dspace-bca`. O workflow `.github/workflows/deploy.yml` compila a
interface e publica a imagem no GHCR automaticamente. Aguarde sua conclusão
com sucesso antes de atualizar o servidor. Não é necessário compilar a imagem
no servidor.

No `.env` do servidor, mantenha os valores usados pelo workflow:

```dotenv
DSPACE_ANGULAR_IMAGE=ghcr.io/nti-ufal-arapiraca/dspace-bca-angular
DSPACE_ANGULAR_TAG=dspace-10.1
```

Atualize também o checkout de `dspace-bca` no servidor com `git pull --ff-only`.
A imagem contém o tema compilado; os arquivos de `backend/config/`, o
`frontend/config/config.prod.yml`, os scripts e os arquivos Compose são
carregados do checkout no servidor. Atualize o checkout de `dspace-migration`
antes de executar os comandos de migração e instale suas dependências com
`uv sync`.

Na pasta `dspace-bca` do servidor, baixe a imagem publicada e recrie os
serviços com os arquivos atualizados:

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  -f docker-compose-migration.yml \
  config --quiet

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  -f docker-compose-migration.yml \
  pull dspace-angular

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  -f docker-compose-migration.yml \
  up -d --no-build --force-recreate dspace dspace-angular dspace-proxy
```

As classes de autoridade usadas pelo backend já estão na imagem oficial do
DSpace 10.1. Recriar o backend carrega os novos arquivos montados; não é
necessário publicar uma imagem Java própria para estas alterações.

`docker-compose-migration.yml` permite ao importador gravar os `mapfile.txt`
na pasta SAF. A composição normal de produção monta essa pasta como somente
leitura. A sobreposição não publica portas adicionais. Depois de concluir a
migração, recrie apenas o backend sem esse quarto arquivo para restaurar a
montagem normal:

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  up -d --force-recreate dspace
```

Use essa restauração ao terminar a etapa 9, depois da importação e revisão.

**4. Garanta que exista uma conta administrativa.** Se ainda não existir,
execute a criação interativa no ambiente escolhido. Em desenvolvimento:

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml \
  exec dspace /dspace/bin/dspace create-administrator
```

Em produção:

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec dspace /dspace/bin/dspace create-administrator
```

Responda às perguntas no terminal. Guarde o e-mail e a senha nas variáveis
`DSPACE_API_USER` e `DSPACE_API_PASSWORD` do `.env` da migração. Se já há
administrador, use sua conta existente.

**5. Prepare os campos e a coleção de pessoas.** Instale as dependências da
migração conforme seu README (`uv sync`). Depois, em `dspace-bca`, escolha
um dos comandos:

```bash
# Desenvolvimento
bash scripts/prepare-academic.sh --development --project-name d10dev \
  --env-file .env.development --migration-env-file ../dspace-migration/.env
```

```bash
# Produção
bash scripts/prepare-academic.sh --project-name d10 \
  --env-file .env --migration-env-file ../dspace-migration/.env
```

O comando verifica a configuração carregada, registra os campos adicionais,
inicializa os tipos de entidade e cria ou reutiliza a comunidade
“Cadastros bibliográficos” e a coleção “Pessoas” com tipo `Person`. Salva
automaticamente `DSPACE_PERSON_COLLECTION_UUID` no `.env` da migração.
Se esse UUID já estiver preenchido, respeita a coleção escolhida e verifica
se ela é `Person`. Repetir a preparação não importa trabalhos nem deve
duplicar esses cadastros.

Reinicie o backend depois da criação da coleção para renovar o cache dos
formulários. Em desenvolvimento:

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml restart dspace
```

Em produção:

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  restart dspace
```

**6. Importe um lote de teste ou retome o lote existente.** O banco legado
precisa estar acessível. Em `dspace-migration`, para um piloto em destino
vazio e SAF exclusivo:

```bash
uv run migrate --limit 5 --docker-container d10dev-dspace --skip-people --skip-stats
uv run apply-people --dry-run
uv run apply-people
```

O primeiro comando extrai os trabalhos e as identidades, gera SAF, importa
os trabalhos e aplica embargos. A opção `--skip-people` adia apenas os
vínculos para permitir a inspeção. A simulação consulta o destino e informa
o que seria criado; o comando seguinte cria pessoas e aplica os vínculos.
Estatísticas ficam fora desse piloto para simplificar a primeira revisão.

O pipeline cria os arquivos `dublin_core.xml` e `metadata_local.xml` por
trabalho. Também produz `people.json`, com pessoas e participações, e usa os
`mapfile.txt` da importação para localizar os trabalhos. `people-map.json`
registra os UUIDs das pessoas e o destino para retomada.

Se os trabalhos **já foram importados**, não execute novamente a importação
SAF. Regenere apenas os metadados e o manifesto a partir da mesma origem e
do lote correspondente; mantenha seus mapfiles:

```bash
uv run extract-metadata
uv run apply-people --dry-run
uv run apply-people
```

Se o lote anterior era limitado, use o mesmo limite na extração. Os IDs do
manifesto devem corresponder aos mapfiles. A aplicação para quando há
trabalhos sem handle, nomes divergentes ou identidades ambíguas, para que
a biblioteca revise o lote.

Nos itens antigos, a aplicação também copia `dc.description.degree` para
`local.course.name` e `dc.publisher.department` para `local.campus.name`.
Confirma a gravação antes de remover os valores dos campos antigos. Se os
dois campos tiverem conteúdos diferentes, interrompe a operação. Não altera
UUIDs, handles, arquivos nem políticas de acesso dos trabalhos.

**7. Atualize as buscas e as saídas públicas.** Depois da aplicação dos
vínculos, reindexe Discovery. Em desenvolvimento:

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml \
  exec -T dspace /dspace/bin/dspace index-discovery -b
```

Em produção:

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec -T dspace /dspace/bin/dspace index-discovery -b
```

Depois, em `dspace-migration`, atualize OAI e sitemaps. No piloto:

```bash
uv run rebuild-oai --docker-container d10dev-dspace
uv run generate-sitemaps --docker-container d10dev-dspace
```

Na produção, use o container `dspace`. Os comandos de reconstrução de
índices não reimportam nem duplicam os trabalhos. OAI e os perfis públicos
são recursos diferentes: a presença do curso em `local` não cria um
mapeamento novo em todos os formatos OAI; confira os formatos exigidos pelos
coletores institucionais.

**8. Confira pela interface.** Faça login como administrador e abra um
trabalho. Use sua opção Editar, que abre `edit-items/`. A seção “Dados
acadêmicos” deve mostrar curso, campus, orientador, coorientador, banca,
número de páginas e observação de acervo. Selecione uma pessoa existente;
o seletor não deve aceitar apenas um nome novo solto.

Salve e confira a página pública do trabalho. Clique no nome do orientador.
Seu perfil deve separar “Trabalhos de autoria”, “Trabalhos orientados”,
“Coorientações” e “Participações em banca”. Uma lista pode estar vazia: cada
aba corresponde a um papel específico.

Confira também os resumos em português e inglês, a ordem da banca e o
acesso aos PDFs embargados. Para cadastrar uma pessoa manualmente, crie um
novo item na coleção Pessoas e preencha nome de exibição, nome e sobrenome;
isso não cria uma conta de login. Após salvar, aguarde a indexação e
selecione-a no trabalho.

Se uma pessoa aparecer duas vezes, não una os cadastros apenas porque os
nomes coincidem. O legado separa autores e orientadores em tabelas
diferentes. A conciliação usa identificadores ou revisão da biblioteca; o
guia de pessoas no projeto de migração explica como manter dois
identificadores legados na mesma `Person` confirmada.

**9. Execute o lote definitivo depois da revisão do piloto.** Em destino
apropriado, com SAF próprio e configuração conferida:

```bash
uv run migrate --docker-container dspace --skip-stats
```

Esse comando adiciona trabalhos: não o repita sobre um lote já importado.
As estatísticas históricas ficam para uma operação separada: sua rotina
precisa alcançar o banco DSpace e o Solr na rede privada. Este guia adia
essa etapa com `--skip-stats`, mantendo as portas internas fechadas em
produção. Consulte a seção de estatísticas do projeto de migração para
planejar essa operação no ambiente correto.
Para retomar somente pessoas e vínculos, use `apply-people`, que reutiliza
os cadastros e as referências já aplicadas. Refaça a etapa 7 depois de uma
retomada. Execute apenas um escritor por destino.

| Situação | Onde conferir |
| --- | --- |
| A propriedade do modelo não foi encontrada | Backend recriado com os mounts e o novo `rest.cfg`; arquivos legíveis no host. |
| Falha de login na preparação | URL da API, e-mail e senha do administrador no `.env` da migração. |
| A coleção Pessoas existe sem tipo | Administração da coleção; selecione `Person` quando adequado e confira seu conteúdo. |
| Publicações sem handle | Correspondência entre `people.json`, mapfiles e o lote importado. |
| Pessoa não aparece no seletor | Registro Person arquivado, permissões e atualização do índice Discovery. |
| Perfil não mostra orientações | Autoridades aplicadas, reindexação e imagem Angular recompilada. |
| Os campos não aparecem em Editar | Backend reiniciado e processo de edição usado pela coleção; o projeto configura os processos tradicional e Publication. |

As configurações seguem a
[documentação de autoridades](https://wiki.lyrasis.org/spaces/DSDOC10x/pages/425331229/Authority%2Bframework%2Bfunctionalities),
os [formulários oficiais 10.1](https://github.com/DSpace/DSpace/blob/dspace-10.1/dspace/config/item-submission.xml)
e as [entidades configuráveis](https://wiki.lyrasis.org/spaces/DSDOC10x/pages/408944761/Configurable%2BEntities).
