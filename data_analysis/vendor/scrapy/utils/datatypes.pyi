# Stubs for scrapy.utils.datatypes (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from collections import OrderedDict
from typing import Any, Optional

class MultiValueDictKeyError(KeyError):
    def __init__(self, *args: Any, **kwargs: Any) -> None: ...

class MultiValueDict(dict):
    def __init__(self, key_to_list_mapping: Any = ...) -> None: ...
    def __getitem__(self, key: Any): ...
    def __setitem__(self, key: Any, value: Any) -> None: ...
    def __copy__(self): ...
    def __deepcopy__(self, memo: Optional[Any] = ...): ...
    def get(self, key: Any, default: Optional[Any] = ...): ...
    def getlist(self, key: Any): ...
    def setlist(self, key: Any, list_: Any) -> None: ...
    def setdefault(self, key: Any, default: Optional[Any] = ...): ...
    def setlistdefault(self, key: Any, default_list: Any = ...): ...
    def appendlist(self, key: Any, value: Any) -> None: ...
    def items(self): ...
    def lists(self): ...
    def values(self): ...
    def copy(self): ...
    def update(self, *args: Any, **kwargs: Any) -> None: ...

class SiteNode:
    url: Any = ...
    itemnames: Any = ...
    children: Any = ...
    parent: Any = ...
    def __init__(self, url: Any) -> None: ...
    def add_child(self, node: Any) -> None: ...
    def to_string(self, level: int = ...): ...

class CaselessDict(dict):
    def __init__(self, seq: Optional[Any] = ...) -> None: ...
    def __getitem__(self, key: Any): ...
    def __setitem__(self, key: Any, value: Any) -> None: ...
    def __delitem__(self, key: Any) -> None: ...
    def __contains__(self, key: Any): ...
    has_key: Any = ...
    def __copy__(self): ...
    copy: Any = ...
    def normkey(self, key: Any): ...
    def normvalue(self, value: Any): ...
    def get(self, key: Any, def_val: Optional[Any] = ...): ...
    def setdefault(self, key: Any, def_val: Optional[Any] = ...): ...
    def update(self, seq: Any) -> None: ...
    @classmethod
    def fromkeys(cls, keys: Any, value: Optional[Any] = ...): ...
    def pop(self, key: Any, *args: Any): ...

class MergeDict:
    dicts: Any = ...
    def __init__(self, *dicts: Any) -> None: ...
    def __getitem__(self, key: Any): ...
    def __copy__(self): ...
    def get(self, key: Any, default: Optional[Any] = ...): ...
    def getlist(self, key: Any): ...
    def items(self): ...
    def has_key(self, key: Any): ...
    __contains__: Any = ...
    def copy(self): ...

class LocalCache(OrderedDict):
    limit: Any = ...
    def __init__(self, limit: Optional[Any] = ...) -> None: ...
    def __setitem__(self, key: Any, value: Any) -> None: ...

class SequenceExclude:
    seq: Any = ...
    def __init__(self, seq: Any) -> None: ...
    def __contains__(self, item: Any): ...
