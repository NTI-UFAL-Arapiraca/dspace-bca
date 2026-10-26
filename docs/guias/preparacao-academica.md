# Preparar metadados e a coleção Pessoas

Execute depois de inicializar o DSpace e criar o administrador. Requer `uv` e
o projeto `dspace-migration` disponível. Por padrão, o script espera os dois
projetos lado a lado. Se estiverem em diretórios diferentes, informe
`DSPACE_MIGRATION_DIR` ou `--migration-dir`; um `--migration-env-file` dentro
da raiz da migração também permite ao script localizar o projeto. Esta
preparação não importa trabalhos.

Em produção, carregue `academic-metadata.xml` antes de criar o administrador,
pois os formulários de conta podem incluir campos acadêmicos como
`dc.contributor.coadvisor`. O procedimento está no guia de
[inicialização da produção](inicializacao-producao.md#6-registrar-metadados-antes-de-criar-o-administrador).
Se o administrador já existe e um campo não estiver registrado, execute o
mesmo `registry-loader` antes de continuar.

## 1. Preparar a migração

Em `dspace-migration`, conclua os passos 1 a 3 de sua
[inicialização](../../../dspace-migration/docs/guias/inicializacao.md).
No `.env`, confira `DSPACE_API_URL`, `DSPACE_API_USER` e
`DSPACE_API_PASSWORD`. Use a conta administrativa do destino escolhido.
Deixe `DSPACE_PERSON_COLLECTION_UUID` vazio na primeira preparação ou
informe uma coleção Person existente nesse mesmo destino.

## 2. Executar a preparação

Na raiz de **`dspace-bca`**, escolha um ambiente.

**Desenvolvimento:**

```bash
bash scripts/prepare-academic.sh --development --project-name d10dev \
  --env-file .env.development --migration-env-file ../dspace-migration/.env
```

**Produção:**

```bash
bash scripts/prepare-academic.sh --project-name d10 \
  --env-file .env --migration-env-file ../dspace-migration/.env
```

Quando a migração estiver em outro caminho, use, por exemplo:

```bash
bash scripts/prepare-academic.sh --project-name d10 \
  --env-file .env --migration-dir /srv/dspace-migration \
  --migration-env-file /srv/dspace-migration/.env
```

Aguarde o término sem erros. Confira o preenchimento de
`DSPACE_PERSON_COLLECTION_UUID` no `.env` da migração e a coleção Pessoas
na administração. Repetir a preparação reutiliza a coleção já selecionada.

## 3. Reiniciar para renovar o cache dos formulários

No mesmo ambiente escolhido:

**Desenvolvimento:**

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml restart dspace
```

**Produção:**

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  restart dspace
```

Aguarde a API responder novamente.

## 4. Prosseguir para os dados

Siga o [piloto local](../../../dspace-migration/docs/guias/migracao-local.md)
ou a [migração em produção](../../../dspace-migration/docs/guias/migracao-producao.md).
Para entender campos, plugins e entidades, consulte o
[modelo acadêmico](../referencia/modelo-academico.md).
