# Configuração do backend DSpace

`config/submission-forms.xml` é uma cópia da configuração oficial da branch
`dspace-10.1` do repositório `DSpace/DSpace`. O arquivo é montado diretamente
em `/dspace/config/submission-forms.xml` pelos serviços REST e CLI.

Overrides mantidos pelo projeto:

- todas as definições de `dc.description.abstract` usam `repeatable=true`;
- o seletor de idioma é habilitado com `language` e
  `common_iso_languages`;
- `pt` e `en` são oferecidos para corresponder aos qualifiers dos abstracts;
- `dc.language.iso` permanece independente e recebe `pt_BR` na migração.
- a seção `academicDetails` adiciona curso, campus, orientação, coorientação,
  banca, data de defesa, número de páginas e observações de acervo;
- `dc.date.issued` é rotulado como ano de publicação; a data de defesa usa
  `local.date.defense`;
- os formulários tradicional e Publication usam seleção fechada de pessoas;
- o formulário Person inclui nome de exibição;
- três campos herdados tiveram apenas a ordem de seus elementos ajustada
  para corresponder ao DTD oficial, sem mudar seu significado.

`config/config-definition.xml` carrega `people-authority.cfg` sem substituir
`local.cfg`. O arquivo registra `MigrationPersonAuthority` e mantém a
`EPersonAuthority` oficial. `config/modules/rest.cfg` preserva a lista 10.1
de propriedades expostas e inclui `relationship.enable-virtual-metadata`.

`config/item-submission.xml` liga a seção acadêmica à submissão e à edição.
`config/spring/api/academic-discovery.xml` estende o mapa oficial de buscas
com os quatro papéis e a busca pública `academic_works_search`, usada pelos
links de curso e campus nas páginas de trabalho. `indexAlways` garante que os
campos desses filtros sejam indexados também nos trabalhos migrados sem tipo
de entidade.

O Compose REST define `user.registration=false` para bloquear o cadastro
público de contas por senha/e-mail. Contas existentes continuam podendo fazer
login; novas contas devem ser criadas por um administrador. O primeiro
administrador é criado pela CLI.

Os mounts são iguais em REST e CLI. O registro dos campos e a criação da
coleção são feitos por `scripts/prepare-academic.sh`, conforme o
[guia de operação](../docs/guias/preparacao-academica.md).

A validação dos overrides e os comandos de atualização ficam no
[guia de operação](../docs/guias/operacao.md). Mudanças de versão exigem
reaplicar somente os overrides sobre a configuração oficial correspondente.
