from typing import Optional
from pydantic import BaseModel, field_validator, model_validator


class BroadcastRequest(BaseModel):
    text: str
    link_url: Optional[str] = None
    cta_text: Optional[str] = None
    image_url: Optional[str] = None

    @field_validator("text")
    @classmethod
    def text_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Broadcast text can't be empty")
        return v.strip()

    @model_validator(mode="after")
    def cta_required_with_link(self) -> "BroadcastRequest":
        # A plain @field_validator on cta_text wouldn't fire here, since
        # Pydantic v2 skips field validators when a field falls back to
        # its default (None) rather than being explicitly passed.
        if self.link_url and not (self.cta_text and self.cta_text.strip()):
            raise ValueError("cta_text is required when link_url is provided")
        if self.cta_text:
            self.cta_text = self.cta_text.strip()
        return self


class BroadcastStarted(BaseModel):
    status: str
    total_recipients: int
