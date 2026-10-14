import copy
import importlib.util
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("prepare_people", ROOT / "scripts/prepare_people_collection.py")
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)
COMMUNITY = "00000000-0000-4000-8000-000000000001"
COLLECTION = "00000000-0000-4000-8000-000000000002"


class Client:
    def __init__(self):
        self.mode = "false"
        self.communities = []
        self.collections = []
        self.writes = 0

    def response(self, value, status=200):
        return SimpleNamespace(status_code=status, json=lambda: copy.deepcopy(value))

    def api_get(self, url, params=None):
        if "/config/properties/" in url:
            return self.response({"values": [self.mode]})
        name = "communities" if url.endswith("/search/top") else "collections"
        values = self.communities if name == "communities" else self.collections
        return self.response({"_embedded": {name: values}, "page": {"totalPages": 1}})

    def api_post(self, url, params, json):
        self.writes += 1
        if url.endswith("/communities"):
            result = {"uuid": COMMUNITY, **json}
            self.communities.append(result)
        else:
            assert params == {"parent": COMMUNITY}
            result = {"uuid": COLLECTION, **json}
            self.collections.append(result)
        return self.response(result, 201)


class AcademicSetupTests(unittest.TestCase):
    def test_creates_person_collection_and_reuses_it_on_retry(self):
        client = Client()
        self.assertEqual(COLLECTION, prepare.prepare_collection(client, "http://example.test/api"))
        self.assertEqual(COLLECTION, prepare.prepare_collection(client, "http://example.test/api"))
        self.assertEqual(2, client.writes)

    def test_does_not_retype_existing_collection_or_use_other_model(self):
        client = Client()
        client.mode = "true"
        with self.assertRaises(ValueError):
            prepare.prepare_collection(client, "http://example.test/api")
        self.assertEqual(0, client.writes)
        client.mode = "false"
        client.communities = [{"name": "Cadastros bibliográficos", "uuid": COMMUNITY}]
        client.collections = [{"name": "Pessoas", "uuid": COLLECTION, "metadata": {}}]
        with self.assertRaises(ValueError):
            prepare.prepare_collection(client, "http://example.test/api")
        self.assertEqual(0, client.writes)

    def test_saves_only_collection_uuid_and_preserves_private_values(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env"
            path.write_text('DSPACE_API_PASSWORD="literal-$value"\nDSPACE_PERSON_COLLECTION_UUID=\nOTHER=value\n')
            prepare.save_collection_uuid(path, COLLECTION)
            text = path.read_text()
            self.assertIn('DSPACE_API_PASSWORD="literal-$value"', text)
            self.assertIn("OTHER=value", text)
            self.assertIn(f"DSPACE_PERSON_COLLECTION_UUID={COLLECTION}", text)
            self.assertEqual(0o600, path.stat().st_mode & 0o777)

    def test_bootstrap_uses_same_registry_as_migration(self):
        registered = ET.parse(ROOT / "backend/config/registries/academic-metadata.xml").getroot()
        migrated = ET.parse(ROOT.parent / "dspace-migration/config/registries/migration-metadata.xml").getroot()
        self.assertEqual(ET.tostring(migrated), ET.tostring(registered))

    def test_both_edit_processes_use_academic_fields_and_closed_people_selectors(self):
        process_root = ET.parse(ROOT / "backend/config/item-submission.xml").getroot()
        for name in ("traditional", "traditional-edit", "Publication", "publication-edit"):
            process = process_root.find(f".//submission-process[@name='{name}']")
            self.assertIn("academicDetails", [step.attrib["id"] for step in process.findall("step")])
        forms = ET.parse(ROOT / "backend/config/submission-forms.xml").getroot()
        for name in ("traditionalpageone", "publicationStep", "academicDetails"):
            fields = forms.find(f".//form[@name='{name}']").findall(".//field")
            for field in fields:
                if field.findtext("dc-element") == "contributor":
                    self.assertEqual("true", field.find("vocabulary").attrib["closed"])
                    self.assertEqual("MigrationPersonAuthority", field.findtext("vocabulary"))


if __name__ == "__main__":
    unittest.main()
