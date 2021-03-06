# Stubs for scrapy.selector.unified (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from parsel import Selector as _ParselSelector
from scrapy.http.response import Response
from scrapy.utils.trackref import object_ref
from typing import Any, Optional

class SelectorList(_ParselSelector.selectorlist_cls, object_ref):
    def extract_unquoted(self): ...
    def x(self, xpath: Any): ...
    def select(self, xpath: Any): ...

class Selector(_ParselSelector, object_ref):
    selectorlist_cls: Any = ...
    response: Optional[Response] = ...
    def __init__(self, response: Optional[Response] = ..., text: Optional[str] = ..., type: Optional[Any] = ..., root: Optional[Any] = ..., _root: Optional[Any] = ..., **kwargs: Any) -> None: ...
    def select(self, xpath: Any): ...
    def extract_unquoted(self): ...
