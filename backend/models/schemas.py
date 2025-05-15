from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class ClaimsToBeVerified(BaseModel):
    """First Agent Structured Output"""

    claims: List[str] = Field(
        ...,
        description="""Extract sentences from the input text that contain potentially questionable or non-obvious factual statements.
            Exclude widely accepted facts or general knowledge. Only include claims that are specific, potentially controversial,
            or would require external evidence or expert verification to confirm.""",
    )


class ExtractedClaimsResponse(BaseModel):
    """Response for the extract-claims endpoint"""

    claims: List[str] = Field(
        ..., description="List of extracted claims from the input"
    )
    additional_info: str = Field(
        ..., description="Additional information about given by the user"
    )


class ClaimsInput(BaseModel):
    """Input for the ask endpoint"""

    claims: List[str] = Field(..., description="List of claims to be fact-checked")


class FinalSteps(BaseModel):
    """Final Team Agent Structured Output"""

    claim: str = Field(
        ..., description="The factual claim that was extracted and verified."
    )
    verdict: str = Field(
        ...,
        description="Verdict on the claim: should be one of ['True', 'False', 'Uncertain'].",
    )
    explanation: str = Field(
        ...,
        description="Brief rationale (2–3 sentences) for the verdict based on evidence.",
    )
    citations: List[str] = Field(
        ...,
        description="List of URLs or citation references used to verify the claim. More citations are better",
    )
    confidence: float = Field(
        ...,
        description="Confidence score (0 to 1) indicating the reliability of the verdict.",
    )


class FinalResponse(BaseModel):
    """Final Team Agent Structured Output"""

    claims: Optional[List[FinalSteps]] = Field(
        ..., description="List of all verified claims with verdicts and evidence."
    )


class IntermediateSteps(BaseModel):
    source_url: str = Field(
        description="The URL of the page or content that was crawled."
    )
    explanation: str = Field(
        description="A short explanation or summary of how this source supports or contradicts the claim."
    )
    claims: str = Field(description="The claim this source is being used to evaluate.")


class IntermediateResponse(BaseModel):
    evidence: Optional[List[IntermediateSteps]] = Field(
        default=None,
        description="List of sources and their explanations related to the claims.",
    )


