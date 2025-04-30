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
        "give the video content just as it is word by word",
        "The output should be in english",
        "If the video is in any other language translate it to english",
        "The meaning of the video should be preserved when translated in english",
        "Do not add any comments, symbols or anything else in the output",
        "The words and sentences statement should also be in english"
    ],
    description="This agent is used to convert videos to text in english",
)

# ========== AUDIO PROCESSING AGENT ==========
audio_processing_agent = Agent(
    name="Audio Processor",
    model=OpenAIChat(id="gpt-4o-audio-preview", modalities=["text"]),
    markdown=True,
    description="This agent is used to transcribe and analyze audio content",
)

# ========== IMAGE ANALYSIS AGENT ==========
image_analysis_agent = Agent(
    name="Image Analyzer",
    model=OpenAIChat(id="gpt-4.1-mini"),
    markdown=True,
    description="This agent is used to analyze image content and provide context or verification",
    
)

# ========== YOUTUBE AGENT ==========
youtube_agent = Agent(
    name="YouTube Summarizer",
    model=OpenAIChat(id="gpt-4.1-mini"),
    tools=[YouTubeTools(get_video_captions=True, get_video_data=True)],
    show_tool_calls=True,
    description="You are a YouTube agent. Obtain detailed summary.",
    instructions=["Generate detailed summary of the video."],
    markdown=True,
)

# Helper function for base64 encoding images
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

