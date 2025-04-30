from pathlib import Path
import os
from dotenv import load_dotenv
from agno.agent import Agent
from agno.media import Video, Audio, Image
from agno.models.google import Gemini
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools
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
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    markdown=True,
    description="This agent is used to analyze image content and provide context or verification",
)

# ========== YOUTUBE AGENT ==========
youtube_agent = Agent(
    name="YouTube Summarizer",
    model=OpenAIChat(id="gpt-4o"),
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

# Example usage of the video transcription agent
"""
video_path = Path(__file__).parent.joinpath("hindi_news.mp4")
with open(video_path, "rb") as video_file:
    video_data = video_file.read()

# For single response
response = video_transcription_agent.run(
    "give the video content just as it is word by word in English", 
    videos=[Video(content=video_data, format="mp4")]
)

# For streaming response
response_stream = video_transcription_agent.run(
    "give the video content just as it is word by word in English", 
    videos=[Video(content=video_data, format="mp4")],
    stream=True
)

for res in response_stream:
    print(res.content, end="", flush=True)
"""

# Example usage of the audio processing agent
"""
current_dir = Path(__file__).parent
audio_path = str(current_dir / "test.wav")

# Read the audio file content directly
with open(audio_path, "rb") as audio_file:
    wav_data = audio_file.read()

# Using direct audio content
response = audio_processing_agent.run(
    "What is in this audio?", 
    audio=[Audio(content=wav_data, format="wav")]
)

# Using file path
response = audio_processing_agent.run(
    "What question is asked in this audio?", 
    audio=[Audio(filepath=audio_path, format="wav")]
)
"""

# Example usage of the image analysis agent
"""
# Using URL
response = image_analysis_agent.run(
    "Tell me about this image and give me the latest news about it.",
    images=[Image(url="https://example.com/image.jpg")]
)

# Using local file with base64 encoding
current_dir = Path(__file__).parent
image_path = str(current_dir / "image.jpg")
image_data = encode_image(image_path)

response = image_analysis_agent.run(
    "explain this image", 
    images=[Image(url="data:image/jpeg;base64," + image_data)]
)

# Using file path directly
response_stream = image_analysis_agent.run(
    "explain this image", 
    images=[Image(filepath=image_path)],
    stream=True
)

for res in response_stream:
    print(res.content, flush=True, end="")
"""

# Example usage of the YouTube agent
"""
# Using direct YouTube URL
response = youtube_agent.run("https://youtu.be/mRxnXiZDmVM?si=zbUoJScE2Yldqlf9")

# With specific question about the video
response = youtube_agent.run("Summarize the main points discussed in this video: https://www.youtube.com/watch?v=mRxnXiZDmVM")

# With streaming response
response_stream = youtube_agent.run(
    "https://youtu.be/mRxnXiZDmVM?si=zbUoJScE2Yldqlf9",
    stream=True
)

for res in response_stream:
    print(res.content, end="", flush=True)
"""
