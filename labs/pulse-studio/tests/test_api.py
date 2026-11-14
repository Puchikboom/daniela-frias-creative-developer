#!/usr/bin/env python3
"""End-to-end API smoke tests using only the Python standard library.

Starts the real local PHP dev server, exercises synthetic CRUD records, and
deletes its temporary storage after the tests. No employer data involved.
"""
import json
import os
from pathlib import Path
import socket
import subprocess
import time
import unittest
from urllib import error, request

API_DIR = Path(__file__).resolve().parents[1] / "api"
DB_FILE = API_DIR / "projects.json"


class PulseApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if DB_FILE.exists():
            raise RuntimeError(
                f"Refusing to overwrite existing data: {DB_FILE}. "
                "Use a clean checkout for the smoke test."
            )
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]
        cls.base = f"http://127.0.0.1:{port}"
        cls.proc = subprocess.Popen(
            ["php", "-S", f"127.0.0.1:{port}", "router.php"],
            cwd=API_DIR,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        for _ in range(50):
            try:
                cls.call("GET", "/api/health")
                break
            except (error.URLError, ConnectionError):
                if cls.proc.poll() is not None:
                    raise RuntimeError("PHP server exited before it could start")
                time.sleep(0.1)
        else:
            cls.proc.terminate()
            raise RuntimeError("PHP server did not start")

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "proc"):
            cls.proc.terminate()
            try:
                cls.proc.communicate(timeout=3)
            except subprocess.TimeoutExpired:
                cls.proc.kill()
                cls.proc.communicate()
        DB_FILE.unlink(missing_ok=True)

    @classmethod
    def call(cls, method, path, data=None):
        payload = json.dumps(data).encode() if data is not None else None
        req = request.Request(
            cls.base + path,
            data=payload,
            method=method,
            headers={"Content-Type": "application/json"},
        )
        try:
            with request.urlopen(req, timeout=4) as response:
                return response.status, json.load(response)
        except error.HTTPError as exc:
            return exc.code, json.load(exc)

    def test_full_crud_and_validation(self):
        code, health = self.call("GET", "/api/health")
        self.assertEqual(code, 200)
        self.assertTrue(health["ok"])

        code, data = self.call("GET", "/api/projects")
        self.assertEqual(code, 200)
        self.assertGreaterEqual(len(data["data"]), 4)

        payload = {
            "name": "Independent Demo Project",
            "client": "Fictional Studio",
            "category": "Frontend",
            "status": "In progress",
            "budget": 2400,
            "progress": 25,
            "due": "2026-12-12",
        }
        code, created = self.call("POST", "/api/projects", payload)
        self.assertEqual(code, 201, created)
        identifier = created["data"]["id"]
        self.assertTrue(identifier)

        code, listed = self.call("GET", "/api/projects")
        self.assertEqual(code, 200)
        self.assertTrue(any(p["id"] == identifier for p in listed["data"]))

        changed = {**payload, "id": identifier, "status": "Completed", "progress": 100}
        code, updated = self.call("PUT", "/api/projects", changed)
        self.assertEqual(code, 200, updated)
        self.assertEqual(updated["data"]["progress"], 100)

        code, invalid = self.call("POST", "/api/projects", {**payload, "progress": 101})
        self.assertEqual(code, 422, invalid)

        code, invalid_date = self.call("POST", "/api/projects", {**payload, "due": "2026-02-30"})
        self.assertEqual(code, 422, invalid_date)

        code, missing = self.call("DELETE", "/api/projects", {"id": "nonexistent"})
        self.assertEqual(code, 404, missing)

        code, deleted = self.call("DELETE", "/api/projects", {"id": identifier})
        self.assertEqual(code, 200, deleted)

        code, listed = self.call("GET", "/api/projects")
        self.assertEqual(code, 200)
        self.assertFalse(any(p["id"] == identifier for p in listed["data"]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
