# Stubs for parsel.csstranslator (Python 3)
#
# NOTE: This dynamically typed stub was automatically generated by stubgen.

from cssselect import GenericTranslator as OriginalGenericTranslator, HTMLTranslator as OriginalHTMLTranslator
from cssselect.xpath import XPathExpr as OriginalXPathExpr
from typing import Any, Optional

class XPathExpr(OriginalXPathExpr):
    textnode: bool = ...
    attribute: Any = ...
    @classmethod
    def from_xpath(cls, xpath: Any, textnode: bool = ..., attribute: Optional[Any] = ...): ...
    def join(self, combiner: Any, other: Any): ...

class TranslatorMixin:
    def xpath_element(self, selector: Any): ...
    def xpath_pseudo_element(self, xpath: Any, pseudo_element: Any): ...
    def xpath_attr_functional_pseudo_element(self, xpath: Any, function: Any): ...
    def xpath_text_simple_pseudo_element(self, xpath: Any): ...

class GenericTranslator(TranslatorMixin, OriginalGenericTranslator):
    def css_to_xpath(self, css: Any, prefix: str = ...): ...

class HTMLTranslator(TranslatorMixin, OriginalHTMLTranslator):
    def css_to_xpath(self, css: Any, prefix: str = ...): ...

def css2xpath(query: Any): ...