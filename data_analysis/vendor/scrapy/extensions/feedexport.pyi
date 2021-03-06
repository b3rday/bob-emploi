# Stubs for scrapy.extensions.feedexport (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from typing import Any, Optional
from zope.interface import Interface

logger: Any

class IFeedStorage(Interface):
    def __init__(uri: Any) -> None: ...
    def open(spider: Any) -> None: ...
    def store(file: Any) -> None: ...

class BlockingFeedStorage:
    def open(self, spider: Any): ...
    def store(self, file: Any): ...

class StdoutFeedStorage:
    def __init__(self, uri: Any, _stdout: Optional[Any] = ...) -> None: ...
    def open(self, spider: Any): ...
    def store(self, file: Any) -> None: ...

class FileFeedStorage:
    path: Any = ...
    def __init__(self, uri: Any) -> None: ...
    def open(self, spider: Any): ...
    def store(self, file: Any) -> None: ...

class S3FeedStorage(BlockingFeedStorage):
    bucketname: Any = ...
    access_key: Any = ...
    secret_key: Any = ...
    is_botocore: Any = ...
    keyname: Any = ...
    s3_client: Any = ...
    connect_s3: Any = ...
    def __init__(self, uri: Any, access_key: Optional[Any] = ..., secret_key: Optional[Any] = ...) -> None: ...
    @classmethod
    def from_crawler(cls, crawler: Any, uri: Any): ...

class FTPFeedStorage(BlockingFeedStorage):
    host: Any = ...
    port: Any = ...
    username: Any = ...
    password: Any = ...
    path: Any = ...
    def __init__(self, uri: Any) -> None: ...

class SpiderSlot:
    file: Any = ...
    exporter: Any = ...
    storage: Any = ...
    uri: Any = ...
    itemcount: int = ...
    def __init__(self, file: Any, exporter: Any, storage: Any, uri: Any) -> None: ...

class FeedExporter:
    settings: Any = ...
    urifmt: Any = ...
    format: Any = ...
    export_encoding: Any = ...
    storages: Any = ...
    exporters: Any = ...
    store_empty: Any = ...
    export_fields: Any = ...
    indent: Any = ...
    def __init__(self, settings: Any) -> None: ...
    @classmethod
    def from_crawler(cls, crawler: Any): ...
    slot: Any = ...
    def open_spider(self, spider: Any) -> None: ...
    def close_spider(self, spider: Any): ...
    def item_scraped(self, item: Any, spider: Any): ...
