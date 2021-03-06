# Stubs for scrapy.http.response (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from scrapy.http.request import Request
from scrapy.utils.trackref import object_ref
from scrapy.selector import SelectorList
from typing import Any, Optional

class Response(object_ref):
    headers: Any = ...
    status: Any = ...
    request: Request = ...
    flags: Any = ...
    def __init__(self, url: Any, status: int = ..., headers: Optional[Any] = ..., body: bytes = ..., flags: Optional[Any] = ..., request: Optional[Any] = ...) -> None: ...
    @property
    def meta(self): ...
    url: Any = ...
    body: Any = ...
    def copy(self): ...
    def replace(self, *args: Any, **kwargs: Any) -> http.Response: ...
    def urljoin(self, url: str) -> str: ...
    @property
    def text(self) -> str: ...
    def css(self, *a: Any, **kw: Any) -> SelectorList: ...
    def xpath(self, *a: Any, **kw: Any) -> SelectorList: ...
    def follow(self, url: Any, callback: Any=..., method: Any=..., headers: Any=..., body: Any=..., cookies: Any=..., meta: Any=..., encoding: Any=..., priority: Any=..., dont_filter: Any=..., errback: Any=...) -> Request: ...
