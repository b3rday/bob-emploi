# Stubs for scrapy.commands.shell (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from scrapy.commands import ScrapyCommand
from typing import Any

class Command(ScrapyCommand):
    requires_project: bool = ...
    default_settings: Any = ...
    def syntax(self): ...
    def short_desc(self): ...
    def long_desc(self): ...
    def add_options(self, parser: Any) -> None: ...
    def update_vars(self, vars: Any) -> None: ...
    def run(self, args: Any, opts: Any) -> None: ...
