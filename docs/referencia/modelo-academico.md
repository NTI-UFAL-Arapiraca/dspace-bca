# Modelo acadêmico e pessoas

Configuração do DSpace **10.1**, baseada no **Authority Framework**.
Para executar a preparação, use a [instalação](../guias/instalacao.md#coleção-pessoas).
Este documento descreve o destino (configuração, formulários e perfis); a
extração, a importação e o enriquecimento do acervo legado são do projeto
[`dspace-migration`](../../../dspace-migration/docs/README.md).

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
a migração. O fluxo de extração, importação e vínculos está descrito na
[migração](../../../dspace-migration/docs/guias/migracao.md).

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
| `backend/config/spring/api/academic-discovery.xml` | Acrescenta buscas por autoria, orientação, coorientação e banca, sem substituir as buscas oficiais, e a configuração de agregados com contagem por ano de publicação ([RFC 0025](../../rfc/0025-faceta-de-ano-de-publicacao.md)). |
| `frontend/themes/custom/` | Mostra nomes com links, curso e campus nos trabalhos e perfil com titulação, contato, Lattes, resumo calculado e cinco abas de trabalhos. |

Os arquivos do backend são montados como somente leitura nos serviços
`dspace` e `dspace-cli`. As classes dos plugins já pertencem ao DSpace;
`MigrationPersonAuthority` é o nome que usamos para pesquisar registros
`Person`. Não há um JAR adicional para instalar.

Os campos do acervo ficam assim:

| Informação | Campo |
| --- | --- |
| Curso | `local.course.name` |
| Campus | `local.campus.name` |
| Grande área CNPq | `local.cnpq.area` |
| Ano de publicação | `dc.date.issued` |
| Data de defesa | `local.date.defense` |
| Autor | `dc.contributor.author` |
| Orientador | `dc.contributor.advisor` |
| Coorientador | `dc.contributor.coadvisor` |
| Avaliador da banca | `dc.contributor.referee` |

Curso e campus são campos de texto editáveis nesta entrega. Na página do
trabalho, seus valores são links para a busca pública de trabalhos filtrada
pelo valor selecionado. `local.cnpq.area` guarda a classificação legada como
código e nome, por exemplo `1.00.00.00-3 Ciências exatas e da terra`, com um
valor por categoria vinculada. O campo é editável e, na página do trabalho,
cada valor é um link para a busca de trabalhos filtrada pela faceta `cnpq`;
não substitui as palavras-chave de `dc.subject`. Os quatro campos
de pessoas usam seleção de cadastro existente. Se a pessoa ainda não existir,
a biblioteca a cadastra na coleção Pessoas e depois a seleciona no trabalho.
Programa de pós-graduação e grau acadêmico não são deduzidos do nome do curso.

Nos formulários de submissão e edição, o campo repetível `dc.subject`
sugere até dez termos do índice de assuntos. A consulta REST por prefixo
começa a partir de três caracteres, após 300 ms de pausa. O campo aceita
selecionar um termo do acervo ou gravar uma palavra-chave nova, inclusive
quando a consulta de sugestões falha. Os termos são gravados no metadado
do trabalho e aparecem nas sugestões conforme entram no índice do DSpace.
O recurso faz parte da imagem Angular de desenvolvimento e produção.

O item distingue `dc.date.issued`, apresentado como ano de publicação, de
`local.date.defense`, apresentado como data de defesa. A data de defesa não é
usada como data de publicação nem como data de entrada do registro no DSpace.

## Relações e acervo existente

`relationship.enable-virtual-metadata=false` seleciona o modelo por
autoridade. Alterar a propriedade não converte relacionamentos virtuais
existentes. O enriquecimento da migração associa UUIDs aos nomes persistidos
e preserva handles, arquivos e políticas dos trabalhos.

Os processos tradicional e Publication, inclusive os de edição, contêm a
seção Dados acadêmicos. A coleção Pessoas contém entidades Person; os
seletores usam esses cadastros e os perfis consultam Discovery por papel.
Uma aba vazia significa ausência de trabalhos naquele papel.

O legado possui tabelas separadas para autores e orientadores. A identidade
é `odoo:TABELA:ID`; nomes iguais não provocam fusão automática. O modelo de
conciliação está descrito na [referência de pessoas da migração](../../../dspace-migration/docs/referencia/pessoas-e-vinculos.md).

## Referências oficiais

- [Authority Framework](https://wiki.lyrasis.org/spaces/DSDOC10x/pages/425331229/Authority%2Bframework%2Bfunctionalities).
- [Formulários 10.1](https://github.com/DSpace/DSpace/blob/dspace-10.1/dspace/config/item-submission.xml).
- [Entidades configuráveis](https://wiki.lyrasis.org/spaces/DSDOC10x/pages/408944761/Configurable%2BEntities).

## Conteúdo dos perfis

A preparação registra `person.identifier.lattes` e `local.person.degree`;
e-mail usa `person.email`. Como a migração preenche esses campos nas Person
está em [pessoas e vínculos](../../../dspace-migration/docs/referencia/pessoas-e-vinculos.md#conteúdo-dos-perfis-e-atualização-de-lotes).
A titulação mantém o rótulo da origem (Dr., Dr.ª, Me., Ma., Esp.) e a interface
mostra a descrição por extenso. Cargo e afiliação continuam separados.

O perfil calcula as participações pelo Discovery, com as mesmas permissões
das listas. `RELATION.Person.works` consulta os quatro campos de autoridade
com OR: o total conta cada trabalho uma vez. As contagens por papel podem
se sobrepor. Temas, cursos e campus vêm das facetas dos trabalhos, não de
novos metadados de pessoa. Os links levam à aba Todos os trabalhos com o
filtro selecionado; as listas mantêm paginação e filtros por assunto, curso,
campus e data. A ausência de resultado não é usada para inferir afiliação,
especialidade pessoal ou situação profissional atual.

Para atualizar perfis de lotes já importados, registre os campos aqui e siga
a [atualização de perfis na migração](../../../dspace-migration/docs/referencia/pessoas-e-vinculos.md#conteúdo-dos-perfis-e-atualização-de-lotes).

`person.email` é um metadado de `Person`; nenhuma conta `EPerson` é criada.
O `dspace.cfg` padrão do DSpace 10.1 oculta esse campo da API e da interface
para usuários não administradores ([configuração oficial](https://github.com/DSpace/DSpace/blob/dspace-10.1/dspace/config/dspace.cfg#L1199-L1215)).
O perfil não aplica uma ocultação apenas visual: só mostra o campo quando a
API o disponibiliza. A regra global `metadata.hide` tem precedência sobre a
visibilidade por valor (`securityLevel`, aplicado pela migração); consulte a
[configuração oficial de segurança de metadados](https://wiki.lyrasis.org/spaces/DSDOC10x/pages/438698074/Metadata%2Bsecurity%2Bconfiguration).

Tornar `person.email` público exige uma decisão explícita: desativar a
ocultação da API e alterar os níveis dos valores afeta todas as Person com
e-mail, incluindo cadastros futuros.

A troca de abas e filtros dentro do mesmo perfil Person preserva o perfil e
atualiza a busca de trabalhos. Os cartões e os links de temas, cursos e campus
rolam até a seção de resultados, respeitando a preferência por movimento
reduzido. A URL continua compartilhável; Voltar restaura o filtro e a posição
anterior. O patch `apply-person-search-navigation.mjs`, aplicado nas imagens de
desenvolvimento e produção, coordena os resolvers, o indicador de carregamento
e a rolagem. As demais páginas conservam o comportamento de navegação do DSpace.
