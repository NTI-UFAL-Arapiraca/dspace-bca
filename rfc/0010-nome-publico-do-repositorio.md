# RFC 0010 — Nome público do repositório

- Status: aceita
- Escopo: backend e identificação pública

## Contexto

O Compose oficial usava `DSpace Started with Docker Compose` como valor de
`dspace.name`. A API REST publica esse valor e o frontend o insere em textos
como “Estatísticas para DSpace Started with Docker Compose”, expondo um
placeholder técnico aos usuários.

## Decisão

Configurar `dspace.name` como `Repositório Institucional da UFAL — Campus
Arapiraca` por padrão e permitir sua substituição pela variável `DSPACE_NAME`.
Esse nome permanece como a fonte do backend para informações institucionais e
estatísticas. Os títulos das páginas e abas são definidos separadamente nos
catálogos Angular pelas chaves `repository.title` e
`repository.title.prefix`, com a identificação da UFAL nos dois idiomas ativos.

## Implementação

- `docker-compose-rest.yml` e os exemplos `.env.development.example` e
  `.env.production.example`;
- `frontend/themes/custom/assets/i18n/`;
- `docs/referencia/implantacao.md` e `frontend/themes/custom/README.md`.

## Consequências e validação

A alteração exige recriar o container `dspace`; não requer rebuild do
frontend nem reindexação do Solr. A raiz da API REST deve retornar
`"dspaceName": "Repositório Institucional da UFAL — Campus Arapiraca"`.
Alterações aos títulos das páginas exigem recompilar a imagem Angular de
produção; a página inicial passa a usar o nome institucional antes do título
localizado da rota.
