# Stubs for scrapy.utils.python (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from typing import Any, Optional

def flatten(x: Any): ...
def iflatten(x: Any) -> None: ...
def is_listlike(x: Any): ...
def unique(list_: Any, key: Any = ...): ...
def str_to_unicode(text: Any, encoding: Optional[Any] = ..., errors: str = ...): ...
def unicode_to_str(text: Any, encoding: Optional[Any] = ..., errors: str = ...): ...
def to_unicode(text: Any, encoding: Optional[Any] = ..., errors: str = ...): ...
def to_bytes(text: Any, encoding: Optional[Any] = ..., errors: str = ...): ...
def to_native_str(text: Any, encoding: Optional[Any] = ..., errors: str = ...): ...
def re_rsearch(pattern: Any, text: Any, chunk_size: int = ...): ...
def memoizemethod_noargs(method: Any): ...
def isbinarytext(text: Any): ...
def binary_is_text(data: Any): ...
def get_func_args(func: Any, stripself: bool = ...): ...
def get_spec(func: Any): ...
def equal_attributes(obj1: Any, obj2: Any, attributes: Any): ...

class WeakKeyCache:
    default_factory: Any = ...
    def __init__(self, default_factory: Any) -> None: ...
    def __getitem__(self, key: Any): ...

def stringify_dict(dct_or_tuples: Any, encoding: str = ..., keys_only: bool = ...): ...
def is_writable(path: Any): ...
def setattr_default(obj: Any, name: Any, value: Any) -> None: ...
def retry_on_eintr(function: Any, *args: Any, **kw: Any): ...
def without_none_values(iterable: Any): ...
def global_object_name(obj: Any): ...
def garbage_collect() -> None: ...
