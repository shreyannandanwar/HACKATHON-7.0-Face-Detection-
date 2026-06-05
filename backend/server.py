import json
import math
import sqlite3
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "db" / "faceid.db"
MATCH_THRESHOLD = 0.6


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS embeddings (
              user_id TEXT NOT NULL,
              embedding TEXT NOT NULL,
              encrypted INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS auth_events (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              confidence REAL NOT NULL,
              liveness_passed INTEGER NOT NULL,
              device_id TEXT NOT NULL,
              timestamp TEXT NOT NULL,
              synced INTEGER NOT NULL DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'FAILED'
            );

            CREATE TABLE IF NOT EXISTS sync_queue (
              id TEXT PRIMARY KEY,
              payload TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'pending',
              created_at TEXT NOT NULL
            );
            """
        )
        auth_columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(auth_events)").fetchall()
        }
        if "status" not in auth_columns:
            connection.execute(
                "ALTER TABLE auth_events ADD COLUMN status TEXT NOT NULL DEFAULT 'FAILED'"
            )


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0

    dot = sum(left * right for left, right in zip(a, b))
    mag_a = math.sqrt(sum(value * value for value in a))
    mag_b = math.sqrt(sum(value * value for value in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def load_json(body: bytes) -> dict[str, Any]:
    if not body:
        return {}
    return json.loads(body.decode("utf-8"))


def best_match(embedding: list[float]) -> tuple[sqlite3.Row | None, float]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT users.id, users.name, users.created_at, embeddings.embedding
            FROM embeddings
            JOIN users ON users.id = embeddings.user_id
            """
        ).fetchall()

    best_user = None
    best_score = 0.0
    for row in rows:
        stored_embedding = json.loads(row["embedding"])
        score = cosine(embedding, stored_embedding)
        if score > best_score:
            best_user = row
            best_score = score

    return best_user, best_score


def save_auth_event(
    user_id: str,
    confidence: float,
    liveness_passed: bool,
    device_id: str,
    timestamp: str,
    status: str,
) -> str:
    event_id = str(uuid.uuid4())
    payload = {
        "userId": user_id,
        "confidence": confidence,
        "livenessPassed": liveness_passed,
        "deviceId": device_id,
        "timestamp": timestamp,
        "status": status,
    }

    with connect() as connection:
        connection.execute(
            """
            INSERT INTO auth_events
              (id, user_id, confidence, liveness_passed, device_id, timestamp, synced, status)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?)
            """,
            (
                event_id,
                user_id,
                confidence,
                1 if liveness_passed else 0,
                device_id,
                timestamp,
                status,
            ),
        )
        connection.execute(
            """
            INSERT INTO sync_queue (id, payload, status, created_at)
            VALUES (?, ?, 'pending', ?)
            """,
            (str(uuid.uuid4()), json.dumps(payload), timestamp),
        )

    return event_id


class FaceAuthHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self._send_json(200, {"ok": True})

    def do_GET(self) -> None:
        if self.path != "/health":
            self._send_json(404, {"error": "Not found"})
            return
        self._send_json(200, {"ok": True, "database": str(DB_PATH)})

    def do_POST(self) -> None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = load_json(self.rfile.read(length))

            if self.path == "/enroll":
                self.handle_enroll(payload)
                return

            if self.path == "/verify":
                self.handle_verify(payload)
                return

            self._send_json(404, {"error": "Not found"})
        except Exception as exc:
            self._send_json(500, {"error": str(exc)})

    def handle_enroll(self, payload: dict[str, Any]) -> None:
        name = str(payload.get("name", "")).strip()
        embedding = payload.get("embedding")
        if not name or not isinstance(embedding, list):
            self._send_json(400, {"error": "name and embedding are required"})
            return

        timestamp = now_iso()
        user_id = str(uuid.uuid4())
        with connect() as connection:
            connection.execute(
                "INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)",
                (user_id, name, timestamp),
            )
            connection.execute(
                "INSERT INTO embeddings (user_id, embedding, encrypted) VALUES (?, ?, 1)",
                (user_id, json.dumps(embedding)),
            )

        self._send_json(
            200,
            {
                "user": {
                    "id": user_id,
                    "name": name,
                    "enrolledAt": timestamp,
                },
                "saved": True,
            },
        )

    def handle_verify(self, payload: dict[str, Any]) -> None:
        embedding = payload.get("embedding")
        liveness_passed = bool(payload.get("livenessPassed"))
        device_id = str(payload.get("deviceId", "mobile-local"))

        if not isinstance(embedding, list):
            self._send_json(400, {"error": "embedding is required"})
            return

        user = None
        confidence = 0.0
        if liveness_passed:
            user, confidence = best_match(embedding)

        is_recognized = user is not None and confidence >= MATCH_THRESHOLD
        status = "SUCCESS" if liveness_passed and is_recognized else "FAILED"
        timestamp = now_iso()
        user_id = user["id"] if user is not None and is_recognized else "UNKNOWN"
        user_name = user["name"] if user is not None and is_recognized else "Unknown User"
        event_id = save_auth_event(
            user_id,
            confidence,
            liveness_passed,
            device_id,
            timestamp,
            status,
        )

        self._send_json(
            200,
            {
                "status": status,
                "confidence": confidence,
                "livenessPassed": liveness_passed,
                "user": {
                    "id": user_id,
                    "name": user_name,
                    "enrolledAt": user["created_at"],
                } if user is not None and is_recognized else None,
                "record": {
                    "id": event_id,
                    "userId": user_id,
                    "userName": user_name,
                    "timestamp": timestamp,
                    "status": status,
                    "confidence": confidence,
                    "livenessPassed": liveness_passed,
                    "deviceId": device_id,
                },
                "message": f"Verified {user_name}"
                if status == "SUCCESS"
                else "No matching enrolled face found"
                if liveness_passed
                else "Liveness verification failed",
            },
        )


def main() -> None:
    init_db()
    server = HTTPServer(("0.0.0.0", 8080), FaceAuthHandler)
    print(f"[backend] Listening on http://0.0.0.0:8080")
    print(f"[backend] SQLite database: {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
