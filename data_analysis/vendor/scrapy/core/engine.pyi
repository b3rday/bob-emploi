# Stubs for scrapy.core.engine (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from typing import Any

logger: Any

class Slot:
    closing: bool = ...
    inprogress: Any = ...
    start_requests: Any = ...
    close_if_idle: Any = ...
    nextcall: Any = ...
    scheduler: Any = ...
    heartbeat: Any = ...
    def __init__(self, start_requests: Any, close_if_idle: Any, nextcall: Any, scheduler: Any) -> None: ...
    def add_request(self, request: Any) -> None: ...
    def remove_request(self, request: Any) -> None: ...
    def close(self): ...

class ExecutionEngine:
    crawler: Any = ...
    settings: Any = ...
    signals: Any = ...
    logformatter: Any = ...
    slot: Any = ...
    spider: Any = ...
    running: bool = ...
    paused: bool = ...
    scheduler_cls: Any = ...
    downloader: Any = ...
    scraper: Any = ...
    def __init__(self, crawler: Any, spider_closed_callback: Any) -> None: ...
    start_time: Any = ...
    def start(self) -> None: ...
    def stop(self): ...
    def close(self): ...
    def pause(self) -> None: ...
    def unpause(self) -> None: ...
    def spider_is_idle(self, spider: Any): ...
    @property
    def open_spiders(self): ...
    def has_capacity(self): ...
    def crawl(self, request: Any, spider: Any) -> None: ...
    def schedule(self, request: Any, spider: Any) -> None: ...
    def download(self, request: Any, spider: Any): ...
    def open_spider(self, spider: Any, start_requests: Any = ..., close_if_idle: bool = ...) -> None: ...
    def close_spider(self, spider: Any, reason: str = ...): ...