# Stubs for scrapy.downloadermiddlewares.retry (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from typing import Any

logger: Any

class RetryMiddleware:
    EXCEPTIONS_TO_RETRY: Any = ...
    max_retry_times: Any = ...
    retry_http_codes: Any = ...
    priority_adjust: Any = ...
    def __init__(self, settings: Any) -> None: ...
    @classmethod
    def from_crawler(cls, crawler: Any): ...
    def process_response(self, request: Any, response: Any, spider: Any): ...
    def process_exception(self, request: Any, exception: Any, spider: Any): ...