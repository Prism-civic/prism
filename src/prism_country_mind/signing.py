from __future__ import annotations

import hmac
from hashlib import sha256


class Signer:
    def __init__(self, secret: str, key_id: str = "dev-hmac-sha256") -> None:
        self._secret = secret.encode("utf-8")
        self.key_id = key_id

    def sign_json(self, canonical_json: str) -> str:
        return hmac.new(self._secret, canonical_json.encode("utf-8"), sha256).hexdigest()

