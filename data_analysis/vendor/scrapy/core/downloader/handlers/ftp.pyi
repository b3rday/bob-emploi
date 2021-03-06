# Stubs for scrapy.core.downloader.handlers.ftp (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from twisted.internet.protocol import Protocol
from typing import Any, Optional

class ReceivedDataProtocol(Protocol):
    body: Any = ...
    size: int = ...
    def __init__(self, filename: Optional[Any] = ...) -> None: ...
    def dataReceived(self, data: Any) -> None: ...
    @property
    def filename(self): ...
    def close(self) -> None: ...

class FTPDownloadHandler:
    lazy: bool = ...
    CODE_MAPPING: Any = ...
    default_user: Any = ...
    default_password: Any = ...
    passive_mode: Any = ...
    def __init__(self, settings: Any) -> None: ...
    def download_request(self, request: Any, spider: Any): ...
    client: Any = ...
    def gotClient(self, client: Any, request: Any, filepath: Any): ...
