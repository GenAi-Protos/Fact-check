import re
import requests
import uuid
import shutil
import tempfile
import os
from urllib.parse import urlparse
from pathlib import Path
from services.agents.helper_agent import image_analysis_agent, video_transcription_agent
from agno.media import Image, Video


class ContentExtractor:
    """A class for extracting content from various URLs and web sources"""

    @staticmethod
    def extract_links_and_text(query: str):
        """
        Extract URLs and remaining text from the input query

        Args:
            query: The input query text

        Returns:
            A tuple containing the plain text and list of URLs
        """
        urls = re.findall(r"(https?://\S+)", query)
        text_only = re.sub(r"(https?://\S+)", "", query).strip()
        return text_only, urls

    @classmethod
    def extract_tweet(cls, tweet_url: str):
        """
        Extract content from a tweet URL, including media if present

        Args:
            tweet_url: URL of the tweet to extract content from

        Returns:
            Dictionary containing the extracted text and media information
        """
        tweet_id = tweet_url.strip("/").split("/")[-1].split("?")[0]

        url = (
            f"https://api.twitter.com/2/tweets/{tweet_id}"
            "?expansions=attachments.media_keys,author_id"
            "&tweet.fields=attachments,text"
            "&media.fields=media_key,type,url,preview_image_url,variants"
        )

        headers = {"Authorization": f"Bearer {os.getenv('BEARER_TOKEN')}"}
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            return {"error": f"{response.status_code} - {response.text}"}

        data = response.json()
        tweet_text = data.get("data", {}).get("text", "")
        media_list = data.get("includes", {}).get("media", [])

        image_url = None
        video_url = None

        for media in media_list:
            if media["type"] == "video" or media["type"] == "animated_gif":
                variants = [
                    v
                    for v in media.get("variants", [])
                    if v.get("content_type") == "video/mp4"
                ]
                if variants:
                    best_variant = max(variants, key=lambda v: v.get("bit_rate", 0))
                    video_url = best_variant["url"]
                    break  # Prefer video, stop after first one
            elif media["type"] == "photo" and not video_url:
                image_url = media["url"]  # Only keep if no video

        # Process video and image content if available
        if video_url:
            print(f"Processing Twitter video URL: {video_url}")
            video_text = cls._process_video_url(video_url)
            tweet_text += f"\nVIDEO TRANSCRIPTION: {video_text}"

        if image_url:
            print(f"Processing Twitter image URL: {image_url}")
            image_text = cls._process_image_url(image_url)
            tweet_text += f"\nIMAGE DESCRIPTION: {image_text}"
        print(tweet_text)
        return {
            "text": tweet_text,
            # "media_url": video_url if video_url else image_url,
            # "media_type": "video" if video_url else "image" if image_url else None,
        }
        print(text)

    @classmethod
    def extract_news_and_generic_links(cls, url):
        """
        Extract content from news websites and other generic links

        Args:
            url: URL of the web page to extract content from

        Returns:
            Dictionary containing the extracted text
        """
        # Using a proxy service to avoid CORS and other issues
        proxy_url = f"https://r.jina.ai/{url}"

        try:
            response = requests.get(proxy_url)
            return {"text": response.text}
        except Exception as e:
            return {"text": f"Error extracting content: {str(e)}"}

    @classmethod
    def get_link_content(cls, url: str) -> dict:
        """
        Extract content from a URL based on its domain

        Args:
            url: URL to extract content from

        Returns:
            Dictionary containing extracted text and other relevant data
        """
        if not url.startswith("http://") and not url.startswith("https://"):
            return {"text": url}

        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()

        if "twitter.com" in domain or "x.com" in domain:
            return cls.extract_tweet(url)

        elif "facebook.com" in domain or "instagram.com" in domain:
            # For simplicity just returning domain name, but could implement specific extractors
            return cls.extract_news_and_generic_links(url)

        # elif "youtube.com" in domain or "youtu.be" in domain:
        #     # For YouTube, just return the URL as processing video content is complex
        #     return {'text': url}

        else:
            return cls.extract_news_and_generic_links(url)

    @classmethod
    def _save_upload_file(cls, upload_file, prefix="file"):
        """
        Save an uploaded file to a temporary directory

        Args:
            upload_file: The uploaded file from FastAPI
            prefix: Prefix to add to the filename

        Returns:
            Path to the saved temporary file
        """
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(tempfile.gettempdir(), "fact_check_uploads")
        os.makedirs(upload_dir, exist_ok=True)

        # Generate a unique filename
        file_extension = Path(upload_file.filename).suffix
        temp_filename = os.path.join(
            upload_dir, f"{prefix}_{uuid.uuid4()}{file_extension}"
        )

        # Save the file
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        return temp_filename

    @classmethod
    def _cleanup_temp_files(cls, *file_paths):
        """
        Remove temporary files after processing

        Args:
            file_paths: List of file paths to remove
        """
        for file_path in file_paths:
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"Removed temporary file: {file_path}")
                except Exception as e:
                    print(f"Error removing temporary file {file_path}: {str(e)}")

    @classmethod
    def _download_media(cls, url, media_type):
        """
        Download media from URL to a temporary file

        Args:
            url: The URL to download from
            media_type: The type of media ('image' or 'video')

        Returns:
            Path to the downloaded temporary file or None if download failed
        """
        try:
            # Create uploads directory if it doesn't exist
            upload_dir = os.path.join(tempfile.gettempdir(), "fact_check_uploads")
            os.makedirs(upload_dir, exist_ok=True)

            # Determine file extension from URL or default based on media_type
            file_extension = Path(urlparse(url).path).suffix
            if not file_extension:
                file_extension = ".mp4" if media_type == "video" else ".jpg"

            # Generate a unique filename
            temp_filename = os.path.join(
                upload_dir, f"{media_type}_{uuid.uuid4()}{file_extension}"
            )

            # Download the file with a timeout
            response = requests.get(url, stream=True, timeout=60)
            response.raise_for_status()  # Raise exception for HTTP errors

            # Check content type if needed
            content_type = response.headers.get("content-type", "")
            if (
                media_type == "video"
                and "video" not in content_type
                and "application" not in content_type
            ) or (media_type == "image" and "image" not in content_type):
                print(
                    f"Warning: Content-type {content_type} doesn't match expected {media_type} type"
                )

            # Get file size if available
            file_size = int(response.headers.get("content-length", 0))
            if file_size > 100 * 1024 * 1024:  # 100 MB limit
                print(
                    f"Warning: File size exceeds 100 MB ({file_size/(1024*1024):.2f} MB)"
                )

            # Save the file
            with open(temp_filename, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            print(
                f"Downloaded {media_type} to: {temp_filename} ({os.path.getsize(temp_filename)/(1024*1024):.2f} MB)"
            )
            return temp_filename

        except Exception as e:
            print(f"Error downloading {media_type} from {url}: {str(e)}")
            return None

    @classmethod
    def _process_image_file(cls, image_path):
        """
        Process image file using image analysis agent

        Args:
            image_path: Path to the image file

        Returns:
            String containing the image description
        """
        try:
            print(f"Using image analysis agent on file: {Path(image_path).name}")
            response = image_analysis_agent.run(
                "Describe this image in detail and extract any text or information present in it.",
                images=[Image(filepath=image_path)],
            )
            content = response.content if hasattr(response, "content") else ""
            content_snippet = content[:100] + "..." if len(content) > 100 else content
            print(f"Image analysis complete. Content extract: {content_snippet}")
            return content
        except Exception as e:
            print(f"Error processing image: {str(e)}")
            return f"Error processing image: {str(e)}"

    @classmethod
    def _process_video_file(cls, video_path):
        """
        Process video file using video transcription agent

        Args:
            video_path: Path to the video file

        Returns:
            String containing the video transcription
        """
        try:
            # Get the file format from the extension
            video_format = Path(video_path).suffix.strip(".")
            print(
                f"Using video transcription agent on file: {Path(video_path).name} (format: {video_format})"
            )

            file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
            print(f"Video file size: {file_size_mb:.2f} MB")

            print("Reading video data and sending to transcription agent...")
            with open(video_path, "rb") as video_file:
                video_data = video_file.read()
                print(f"Starting video transcription (this may take some time)...")
                response = video_transcription_agent.run(
                    "Transcribe this video content word by word in English",
                    videos=[Video(content=video_data, format=video_format)],
                )

            content = response.content if hasattr(response, "content") else ""
            content_snippet = content[:100] + "..." if len(content) > 100 else content
            print(f"Video transcription complete. Content extract: {content_snippet}")

            return content
        except Exception as e:
            print(f"Error processing video: {str(e)}")
            return f"Error processing video: {str(e)}"

    @classmethod
    def _process_image_url(cls, image_url):
        """
        Process an image from URL

        Args:
            image_url: URL of the image to process

        Returns:
            String containing the image description
        """
        temp_path = None
        try:
            # Download image to temp file
            temp_path = cls._download_media(image_url, "image")
            if not temp_path:
                return "Error downloading image from URL"

            # Process the image
            result = cls._process_image_file(temp_path)
            return result

        except Exception as e:
            return f"Error processing image URL: {str(e)}"

        finally:
            # Clean up temp file
            if temp_path:
                cls._cleanup_temp_files(temp_path)

    @classmethod
    def _process_video_url(cls, video_url):
        """
        Process a video from URL

        Args:
            video_url: URL of the video to process

        Returns:
            String containing the video transcription
        """
        temp_path = None
        try:
            # Download video to temp file
            temp_path = cls._download_media(video_url, "video")
            if not temp_path:
                return "Error downloading video from URL"

            # Process the video
            result = cls._process_video_file(temp_path)
            return result

        except Exception as e:
            return f"Error processing video URL: {str(e)}"

        finally:
            # Clean up temp file
            if temp_path:
                cls._cleanup_temp_files(temp_path)
