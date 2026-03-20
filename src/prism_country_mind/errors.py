from __future__ import annotations


class CountryMindError(Exception):
    """Base error for operational country-mind failures."""


class RegistryValidationError(CountryMindError):
    def __init__(self, errors: list[str]) -> None:
        self.errors = errors
        super().__init__("Registry validation failed")


class RefreshValidationError(CountryMindError):
    pass


class SourceFetchError(CountryMindError):
    def __init__(self, source_id: str, url: str, reason: str) -> None:
        self.source_id = source_id
        self.url = url
        self.reason = reason
        super().__init__(f"Failed to fetch {source_id} from {url}: {reason}")


class RefreshFailedError(CountryMindError):
    def __init__(self, failures: list[SourceFetchError]) -> None:
        self.failures = failures
        super().__init__("Refresh aborted because one or more source fetches failed")
