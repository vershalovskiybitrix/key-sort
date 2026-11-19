from __future__ import annotations

import json
import re
from functools import lru_cache
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pymorphy3


HOST = "127.0.0.1"
PORT = 8815
MAX_BODY_BYTES = 256 * 1024
MAX_WORDS = 1000
WORD_RE = re.compile(r"^[\wёЁ-]+$", re.UNICODE)
MORPH = pymorphy3.MorphAnalyzer()
POS_FAMILIES = {
    "INFN": "VERB",
    "VERB": "VERB",
    "ADJF": "ADJ",
    "ADJS": "ADJ",
}


@lru_cache(maxsize=100_000)
def analyze_word(source: str) -> dict[str, str]:
    word = source.casefold().strip()
    if not word or len(word) > 80 or not WORD_RE.fullmatch(word):
        return {"lemma": word, "pos": "UNKNOWN", "key": f"word:{word}"}
    parsed = MORPH.parse(word)[0]
    lemma = parsed.normal_form
    pos = parsed.tag.POS or "UNKNOWN"
    pos = POS_FAMILIES.get(pos, pos)
    return {"lemma": lemma, "pos": pos, "key": f"lemma:{lemma}:{pos}"}


class Handler(BaseHTTPRequestHandler):
    server_version = "KeySortMorphology/1"

    def do_GET(self) -> None:
        if self.path != "/health":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.send_json({"status": "ok"})

    def do_POST(self) -> None:
        if self.path != "/lemmatize":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_error(HTTPStatus.BAD_REQUEST)
            return
        if length <= 0 or length > MAX_BODY_BYTES:
            self.send_error(HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            words = payload.get("words")
            if not isinstance(words, list) or len(words) > MAX_WORDS:
                raise ValueError
            unique = {str(word).casefold().strip() for word in words}
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError, AttributeError):
            self.send_error(HTTPStatus.BAD_REQUEST)
            return
        self.send_json({"analyses": {word: analyze_word(word) for word in unique if word}})

    def send_json(self, payload: dict[str, object]) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        return


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
