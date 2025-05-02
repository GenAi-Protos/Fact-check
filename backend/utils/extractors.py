import re
import requests
from urllib.parse import urlparse
import os

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
        urls = re.findall(r'(https?://\S+)', query)
        text_only = re.sub(r'(https?://\S+)', '', query).strip()
        return text_only, urls
    
    @staticmethod
    def extract_tweet(tweet_url: str):
        """
        Extract content from a Twitter/X URL
        
        Args:
            tweet_url: URL of the tweet to extract
            
        Returns:
            Dictionary containing the tweet text and media URLs
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
            return {"text": f"Error extracting tweet: {response.status_code}", "media_urls": []}

        data = response.json()
        tweet_text = data.get("data", {}).get("text", "")
        media_list = data.get("includes", {}).get("media", [])

        media_urls = []
        for media in media_list:
            if media["type"] == "photo":
                media_urls.append(media["url"])  # Direct URL for images
            elif media["type"] in ("video", "animated_gif"):
                # Get highest quality video thumbnail
                best_variant = max(
                    media.get("variants", []),
                    key=lambda x: x.get("bit_rate", 0),
                    default={"url": media.get("preview_image_url")},
                )
                media_urls.append(best_variant["url"])

        return {
            "text": tweet_text,
            "media_urls": media_urls
        }

    @staticmethod
    def extract_news_and_generic_links(url):
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
            return {'text': response.text}
        except Exception as e:
            return {'text': f"Error extracting content: {str(e)}"}
    
    @staticmethod
    def get_link_content(url: str) -> dict:
        """
        Extract content from a URL based on its domain
        
        Args:
            url: URL to extract content from
            
        Returns:
            Dictionary containing extracted text and other relevant data
        """
        if not url.startswith("http://") and not url.startswith("https://"):
            return {'text': url}
            
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()
        
        if "twitter.com" in domain or "x.com" in domain:
            return ContentExtractor.extract_tweet(url)
        
        elif "facebook.com" in domain or "instagram.com" in domain:
            # For simplicity just returning domain name, but could implement specific extractors
            return ContentExtractor.extract_news_and_generic_links(url)
            # return {'text': f"Content from {domain}"}
        
        # elif "youtube.com" in domain or "youtu.be" in domain:
        #     # For YouTube, just return the URL as processing video content is complex
        #     return {'text': url}
        
        else:
            return ContentExtractor.extract_news_and_generic_links(url)
