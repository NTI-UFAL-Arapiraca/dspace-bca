"""Create/reuse the Person collection and configure the migration's target UUID."""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import re
import tempfile
from uuid import UUID

from dotenv import load_dotenv
from dspace_rest_client.client import DSpaceClient


def resources(client, url, embedded):
    page = 0
    while True:
        response = client.api_get(url, params={"page": page, "size": 100, "projection": "allLanguages"})
        data = checked(response)
        yield from data.get("_embedded", {}).get(embedded, [])
        if page + 1 >= data.get("page", {}).get("totalPages", 1):
            return
        page += 1


def checked(response, statuses=(200,)):
    if response is None or response.status_code not in statuses:
        raise RuntimeError(f"DSpace respondeu {getattr(response, 'status_code', 'sem resposta')}; confira API, login e permissões")
    return response.json()


def unique_named(values, name):
    found = [value for value in values if value.get("name") == name]
    if len(found) > 1:
        raise ValueError(f"Mais de um cadastro chamado {name}; revise antes de preparar")
    return found[0] if found else None


def prepare_collection(client, api_url):
    mode = checked(client.api_get(f"{api_url}/config/properties/relationship.enable-virtual-metadata"))
    if mode.get("values") != ["false"]:
        raise ValueError("O backend precisa estar configurado para Authority Framework")
    community_name = "Cadastros bibliográficos"
    community = unique_named(resources(client, f"{api_url}/core/communities/search/top", "communities"), community_name)
    if community is None:
        community = checked(client.api_post(f"{api_url}/core/communities", params=None, json={
            "name": community_name, "metadata": {"dc.title": [{"value": community_name}]},
        }), (201,))
    community_uuid = str(UUID(community["uuid"]))
    collection = unique_named(resources(client, f"{api_url}/core/communities/{community_uuid}/collections", "collections"), "Pessoas")
    if collection is None:
        collection = checked(client.api_post(f"{api_url}/core/collections", params={"parent": community_uuid}, json={
            "name": "Pessoas",
            "metadata": {
                "dc.title": [{"value": "Pessoas"}],
                "dspace.entity.type": [{"value": "Person"}],
            },
        }), (201,))
    if [value["value"] for value in collection.get("metadata", {}).get("dspace.entity.type", [])] != ["Person"]:
        raise ValueError("A coleção Pessoas já existe sem tipo Person; revise seu tipo na administração")
    return str(UUID(collection["uuid"]))


def save_collection_uuid(env_file: Path, collection_uuid: str):
    text = env_file.read_text(encoding="utf-8")
    expression = re.compile(r"^\s*(?:export\s+)?DSPACE_PERSON_COLLECTION_UUID\s*=.*$", re.MULTILINE)
    if len(expression.findall(text)) > 1:
        raise ValueError("O .env repete DSPACE_PERSON_COLLECTION_UUID; mantenha apenas uma definição")
    line = f"DSPACE_PERSON_COLLECTION_UUID={collection_uuid}"
    text = expression.sub(lambda _: line, text) if expression.search(text) else text.rstrip() + "\n\n" + line + "\n"
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=env_file.parent, delete=False) as output:
            temporary = Path(output.name)
            output.write(text)
        temporary.replace(env_file)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description="Prepara a coleção bibliográfica Person, sem criar contas.")
    parser.add_argument("--env-file", required=True, type=Path)
    parser.add_argument("--write-env", action="store_true")
    args = parser.parse_args()
    env_file = args.env_file.resolve(strict=True)
    load_dotenv(env_file, override=True)
    api_url = os.environ["DSPACE_API_URL"].rstrip("/")
    client = DSpaceClient(api_endpoint=api_url, username=os.environ["DSPACE_API_USER"], password=os.environ["DSPACE_API_PASSWORD"])
    if not client.authenticate():
        raise RuntimeError("Falha de autenticação; confira as credenciais do administrador")
    # If the operator already selected a collection, preserve that choice.
    existing_uuid = os.getenv("DSPACE_PERSON_COLLECTION_UUID", "").strip()
    if existing_uuid:
        mode = checked(client.api_get(f"{api_url}/config/properties/relationship.enable-virtual-metadata"))
        if mode.get("values") != ["false"]:
            raise ValueError("O backend precisa estar configurado para Authority Framework")
        collection_uuid = str(UUID(existing_uuid))
        collection = checked(client.api_get(f"{api_url}/core/collections/{collection_uuid}"))
        if [v["value"] for v in collection.get("metadata", {}).get("dspace.entity.type", [])] != ["Person"]:
            raise ValueError("DSPACE_PERSON_COLLECTION_UUID deve identificar uma coleção Person")
    else:
        collection_uuid = prepare_collection(client, api_url)
    if args.write_env:
        save_collection_uuid(env_file, collection_uuid)
    print(f"DSPACE_PERSON_COLLECTION_UUID={collection_uuid}")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, ValueError, KeyError, OSError) as error:
        raise SystemExit(f"Erro na preparação de pessoas: {error}") from error
