# Stubs for scrapy.spidermiddlewares.depth (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from typing import Any

logger: Any

class DepthMiddleware:
    maxdepth: Any = ...
    stats: Any = ...
    verbose_stats: Any = ...
    prio: Any = ...
    def __init__(self, maxdepth: Any, stats: Any, verbose_stats: bool = ..., prio: int = ...) -> None: ...
    @classmethod
    def from_crawler(cls, crawler: Any): ...
    def process_spider_output(self, response: Any, result: Any, spider: Any): ...
