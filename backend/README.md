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
  banca, número de páginas e observações de acervo;
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
com os quatro papéis. `indexAlways` garante que os campos desses filtros
sejam indexados também nos trabalhos migrados sem tipo de entidade.

Os mounts são iguais em REST e CLI. O registro dos campos e a criação da
coleção são feitos por `scripts/prepare-academic.sh`, conforme o
[guia de operação](../docs/guia-dspace-academico.md).

Ao atualizar a versão do DSpace, extraia novamente o arquivo da branch ou da
imagem correspondente, reaplique somente esses overrides e execute os testes
de `test_backend_configuration.py`.

Para verificar o carregamento das propriedades, os DTDs e os beans de
Discovery contra as classes da imagem oficial, sem banco de dados:

```bash
docker build -t dspace-bca-backend:academic-check -f tests/backend/Dockerfile .
```

Execute esse comando na raiz de `dspace-bca`. A compilação Angular usa o
`Dockerfile.angular` habitual; os testes do helper usam o ambiente Python
do projeto de migração.
