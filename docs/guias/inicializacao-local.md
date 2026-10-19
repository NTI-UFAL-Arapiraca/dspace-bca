# Inicializar o DSpace local

Execute na raiz de `dspace-bca`. Requer Docker Compose 2.24.4 ou posterior,
um arquivo GeoLite2 City e as portas locais 4000 e 8080 livres.

## 1. Preparar o ambiente

Somente se o arquivo ainda não existir:

```bash
cp .env.development.example .env.development
```

Preencha `POSTGRES_PASSWORD`, `GEOLITE2_CITY_DB_PATH` e
`DSPACE_SAF_HOST_DIR`. Crie previamente a pasta SAF indicada. Confira se a
rede `172.27.0.0/24` não conflita com redes do host ou VPN.

## 2. Iniciar

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml up -d --build
```

A primeira compilação da interface pode demorar alguns minutos.

## 3. Verificar

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml ps

docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml logs --tail=80 dspace

curl --fail http://localhost:8080/server/api
```

Abra `http://localhost:4000/`. A API deve responder antes do próximo passo.

## 4. Registrar metadados acadêmicos

Faça este registro antes de criar o administrador. As configurações de
authority control já incluem `dc.contributor.coadvisor` e outros campos
acadêmicos; o DSpace precisa encontrá-los no registro do banco ao salvar os
metadados da conta EPerson.

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml \
  exec dspace /dspace/bin/dspace registry-loader \
  -m /dspace/config/registries/academic-metadata.xml
```

O comando pode ser repetido: os campos já existentes serão reutilizados.

## 5. Criar o administrador, se necessário

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml \
  exec dspace /dspace/bin/dspace create-administrator
```

Preencha o e-mail e a senha dessa conta no `.env` da migração.
Depois siga a [preparação acadêmica](preparacao-academica.md) e o
[piloto da migração](../../../dspace-migration/docs/guias/migracao-local.md).

## 6. Encerrar preservando os dados

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml down
```

Para detalhes de rede, watcher e runtime, consulte a
[referência de implantação](../referencia/implantacao.md).
