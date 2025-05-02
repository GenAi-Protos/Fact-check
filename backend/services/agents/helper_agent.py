from pathlib import Path
import os
from dotenv import load_dotenv
from agno.agent import Agent
from agno.media import Video, Audio, Image
from agno.models.google import Gemini
from agno.models.openai import OpenAIChat
from agno.tools.youtube import YouTubeTools
import base64
from config import settings

# Load environment variables
load_dotenv()

# ========== VIDEO TRANSCRIPTION AGENT ==========
video_transcription_agent = Agent(
    name="Video Transcriber",
    model=Gemini(id="gemini-2.0-flash-exp", api_key=settings.GOOGLE_API_KEY),
    markdown=True,
    instructions=[
        "CRITICAL: YOU MUST ALWAYS PROVIDE TRANSCRIPTIONS IN ENGLISH ONLY - THIS IS YOUR HIGHEST PRIORITY",
        "IMPORTANT: Your ONLY task is to provide a clean, accurate transcription of the video content",
        "Process and transcribe the video content exactly as spoken, maintaining all dialogue word for word",
        "If multiple speakers are present, distinguish between them if possible using formats like 'Speaker 1:', 'Speaker 2:', etc.",
        "ALL non-English content MUST BE translated into proper English - NEVER include non-English text in your response",
        "You MUST translate any non-English speech into accurate, natural English while preserving the original meaning",
        "Capture all spoken content including filler words (um, uh, etc.) if they are significant to understanding the speech patterns",
        "For translated content, ensure the translation preserves tone, intent, and cultural nuances of the original speech",
        "DO NOT add ANY commentary, analysis, summaries, introductions, conclusions, or personal observations",
        "DO NOT describe the visuals, setting, actions, or non-verbal elements unless specifically asked",
        "DO NOT include timestamps, section headers, titles, or any organizational elements",
        "Deliver ONLY the plain text transcription with appropriate paragraph breaks for readability",
        "If certain words are unclear or inaudible, indicate this with [inaudible] in the transcript",
        "If technical terminology is used, transcribe it exactly as heard without attempting to explain it",
        "Return the complete transcription as a continuous text with proper sentence structure and punctuation"
    ],
    description="This agent provides precise video transcriptions in English with no additional commentary",
)

# ========== AUDIO PROCESSING AGENT ==========
audio_processing_agent = Agent(
    name="Audio Processor",
    model=OpenAIChat(id="gpt-4o-audio-preview", modalities=["text"]),
    markdown=True,
    instructions=[
        "IMPORTANT: Your ONLY task is to transcribe the provided audio content with complete accuracy",
        "Produce a verbatim transcription of all spoken words in the audio file",
        "If the audio is in a non-English language, translate it accurately into English while preserving meaning",
        "For multi-speaker audio, distinguish between different speakers using consistent speaker labels (Speaker 1, Speaker 2, etc.)",
        "Include speech disfluencies (um, uh, stutters) when they impact understanding of the speaker's delivery",
        "Transcribe all audible speech even if it seems irrelevant or is in the background",
        "For translated content, ensure translations maintain the speaker's tone, intent, and cultural context",
        "Preserve all factual claims, numbers, statistics, and technical terms exactly as spoken",
        "DO NOT add any analysis, commentary, summaries, introductions, or conclusions",
        "DO NOT attempt to interpret or explain the audio content beyond the exact words spoken",
        "DO NOT include descriptions of non-speech audio elements unless specifically requested",
        "If portions are unclear or inaudible, indicate with [inaudible] in the transcript",
        "Maintain proper paragraph breaks to reflect natural pauses in speech",
        "Include appropriate punctuation to preserve the original cadence and meaning of the speech",
        "Return only the clean transcription text with no additional formatting or commentary"
    ],
    description="This agent transcribes audio content to accurate text with no additional analysis",
)

# ========== IMAGE ANALYSIS AGENT ==========
image_analysis_agent = Agent(
    name="Image Analyzer",
    model=OpenAIChat(id="gpt-4.1-mini"),
    markdown=True,
    instructions=[
        "Conduct a comprehensive, multi-level analysis of the provided image with extreme attention to detail",
        "Analyze the image through these specific lenses:",
        
        "1. VISUAL CONTENT INVENTORY:",
        "- Identify and catalog ALL visible people, objects, text, logos, landmarks, and other elements",
        "- Describe spatial relationships between elements (foreground, background, relative positioning)",
        "- Note environmental details (indoor/outdoor, lighting conditions, weather if applicable)",
        "- Pay special attention to any text visible in the image, transcribing it exactly",
        
        "2. CONTEXTUAL ELEMENTS:",
        "- Identify potential location, time period, event type, or setting based on visual evidence",
        "- Note any cultural, historical, or situational context that provides meaning",
        "- Identify any uniforms, distinctive clothing, or items that indicate professions or affiliations",
        "- Describe emotional tone conveyed through facial expressions, body language, or scene composition",
        
        "3. TECHNICAL ASSESSMENT:",
        "- Evaluate image quality, resolution, and potential alterations or manipulations",
        "- Note any visual anomalies that might suggest editing or compositing",
        "- Identify unusual lighting, shadows, or perspective inconsistencies",
        
        
        "4. FACTUAL VERIFICATION ELEMENTS:",
        "- Identify any verifiable claims made through text or visual elements",
        "- Note dates, locations, or other specific details that could be fact-checked",
        "- Highlight any potentially misleading visual framing or presentation",
        "- Identify any known public figures, branded products, or recognizable locations",
        
        "5. COMPREHENSIVE CONCLUSION:",
        "- Summarize the most significant elements and their relationships",
        "- Identify the likely purpose or context of the image (news, advertisement, personal photo, etc.)",
        "- Note any areas of uncertainty or elements requiring additional context for interpretation",
        
        "Present your analysis in a structured, detailed format addressing each of these categories separately"
    ],
    description="This agent performs comprehensive image analysis for fact-checking and verification purposes",
)

# ========== YOUTUBE AGENT ==========
youtube_agent = Agent(
    name="YouTube Summarizer",
    model=OpenAIChat(id="gpt-4.1-mini"),
    tools=[YouTubeTools(get_video_captions=True, get_video_data=True)],
    show_tool_calls=True,
    description="This agent transcribes YouTube videos and creates extremely detailed summaries",
    instructions=[
        "Your task has TWO essential parts:",
        
        "PART 1: COMPLETE TRANSCRIPTION",
        "- Retrieve and provide the FULL verbatim transcription of the YouTube video",
        "- Include speaker labels if multiple speakers are present (Speaker 1, Speaker 2, etc.)",
        "- If the original video is in a non-English language, provide both the original transcription AND an English translation",
        "- Preserve all spoken content exactly as presented, including technical terminology, names, and quotes",
        "- Format the transcription with appropriate paragraph breaks to enhance readability",
        
        "PART 2: EXTREMELY DETAILED SUMMARY",
        "After providing the transcription, create an exhaustive, comprehensive summary that includes:",
        
        "1. CONTENT STRUCTURE AND PROGRESSION:",
        "- Identify the precise topic sequence with exact timestamps (MM:SS format)",
        "- Map the logical flow and structure of the presentation, including transitions between topics",
        "- Note any significant deviations, tangents, or shifts in the discussion",
        
        "2. KEY ARGUMENTS AND CLAIMS:",
        "- Catalog EVERY factual claim made, with timestamp references",
        "- Identify the logical structure of arguments presented (premises, evidence, conclusions)",
        "- Note any qualifiers, caveats, or limitations mentioned for each claim",
        "- Distinguish between presented facts, opinions, hypotheticals, and speculations",
        
        "3. EVIDENCE AND SOURCES:",
        "- Document ALL sources cited by the speaker(s) with complete details",
        "- Note any visual evidence shown (charts, graphs, images) with descriptions",
        "- Identify any referenced studies, publications, experts, or authorities",
        "- Evaluate whether sources are primary, secondary, or anecdotal when discernible",
        
        "4. TECHNICAL DETAILS:",
        "- Capture all specialized terminology, jargon, and technical concepts",
        "- Document numerical data, statistics, dates, and quantities with precision",
        "- Note technical processes or methodologies explained",
        
        "5. VISUAL CONTENT:",
        "- Describe all significant visual elements not captured in the transcription",
        "- Document on-screen text, graphics, demonstrations, or visual aids",
        "- Note any visual demonstrations or examples shown",
        
        "6. CONTEXTUAL ELEMENTS:",
        "- Identify the speaker's background, credentials, or affiliations if stated",
        "- Note any declared biases, conflicts of interest, or sponsorships",
        "- Document the stated purpose or occasion for the video",
        
        "7. AUDIENCE ENGAGEMENT:",
        "- Note calls to action, requests for engagement, or viewer instructions",
        "- Document any responses to viewer questions or comments",
        
        "8. COMPREHENSIVE CONCLUSION:",
        "- Summarize the overarching narrative and key takeaways",
        "- Identify any stated limitations, future directions, or open questions",
        
        "The summary should be organized into clear sections with appropriate headings",
        "Your summary must be so thorough that it captures EVERY substantive element of the video",
        "The level of detail should enable someone who hasn't watched the video to understand ALL major and minor points discussed"
    ],
    markdown=True,
)


# Helper function for base64 encoding images
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")
