# RFC 0014 — Pessoas e metadados acadêmicos

- Status: aceita
- Escopo: backend, frontend e integração com a migração

## Contexto

Os trabalhos importados contêm nomes de pessoas sem referências a cadastros
bibliográficos. Os campos acadêmicos não apareciam no formulário EditItem.
A migração foi adaptada para preservar tabela e ID das pessoas e aplicar
autoridades depois da importação SAF.

## Decisão

Usar Authority Framework no DSpace 10.1. Carregar uma autoridade local Person
para autoria, orientação, coorientação e banca, preservando EPersonAuthority.
Adicionar os controles à submissão e à edição e usar nomes explícitos para
curso e campus. Perfis Person mostram quatro listas por papel.

A biblioteca administra pessoas sem lhes criar contas. Os seletores são
fechados na interface, enquanto a importação SAF pode passar pela fase
intermediária de texto antes de `apply-people` gravar as autoridades.
Configurações existentes com relações virtuais exigem plano de conversão.

## Implementação

- `backend/config/config-definition.xml` e `people-authority.cfg`;
- `backend/config/modules/rest.cfg`, preservando os valores oficiais 10.1;
- `backend/config/item-submission.xml` e `submission-forms.xml`;
- `backend/config/registries/academic-metadata.xml`;
- `backend/config/spring/api/academic-discovery.xml`, acrescentando entradas
  ao mapa oficial por inicialização Spring, sem substituir as demais buscas;
- mounts em `docker-compose-rest.yml` e `cli.yml`;
- `docker-compose-migration.yml`, permitindo gravar mapfiles durante a
  importação sem alterar a montagem somente leitura da produção normal;
- tema de trabalhos/Publication e Person, traduções e YAML do frontend;
- `scripts/prepare-academic.sh` e `prepare_people_collection.py`;
- `docs/guia-dspace-academico.md`.

## Consequências e validação

Recriar o backend para carregar os mounts e recompilar a imagem Angular.
Preparar registro/tipos/coleção antes de importar; reiniciar o backend após
criar uma coleção e reconstruir Discovery depois dos vínculos.

O helper verifica o modelo e o tipo da coleção, reutiliza cadastros e grava
o UUID no arquivo privado da migração. Os testes verificam repetição,
preservação das demais variáveis e o contrato dos formulários. A imagem CLI
oficial valida o carregamento das propriedades, os DTDs e os beans reais
de Discovery sem acessar banco. O build Angular valida as páginas na versão
10.1. A validação Compose deve manter somente o proxy publicado em produção.
