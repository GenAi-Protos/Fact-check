from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.exa import ExaTools
from agno.tools.tavily import TavilyTools
from models.schemas import ClaimsToBeVerified
from config import settings

# Setup environment variables for agents
settings.setup_env_variables()


class AgentFactory:
    """Factory class for creating AI agents used in fact checking"""

    structured_output_agent = Agent(
        name="Claim Checker",
        model=OpenAIChat(id="gpt-4.1", temperature=0.2),
        description="An AI agent that extracts fact-check-worthy claims from user input.",
        instructions="""Identify and extract only the fact-check-worthy claims present in the user's input text. 
            A fact-check-worthy claim is a statement that can be independently verified or refuted. 
            Avoid including well-known facts, subjective opinions, general statements, or trivial content. 
            Do not infer or generate claims—extract only what is directly and explicitly stated by the user.
            If context is given add it to the claim so that we can verify the claim better GIVE AS MUCH CONTEXT AS POSSIBLE
            THE MORE CONTEXT YOU CAN ADD THE BETTER FACT CHECK WE CAN DO 
            
            MAKE SURE TO RETURN THE ONLY THE STATEMENTS USER HAS MADE AND NOT ANYTHING ELSE DONT HALLUCINATE OR ADD ANYTHING ELSE
            """,
        response_model=ClaimsToBeVerified,
        add_datetime_to_instructions=True,
    )
    

    web_search_agent = Agent(
        name="Web Searcher",
        model=OpenAIChat(id="gpt-4.1-mini"),
        tools=[TavilyTools(api_key=settings.TAVILY_API_KEY, 
                           format="json", 
                           search_depth="advanced"
                           )
               ],
        description="An AI Agent which is used when we have to do a web search to find relevant information from web",
        instructions="Always Return JSON SCHEMA",
        show_tool_calls=False,
        markdown=True,
        add_datetime_to_instructions=True,
        retries=20,
        exponential_backoff=True
    )

    news_search_agent = Agent(
        name="News Sx   earcher",
        model=OpenAIChat(id="gpt-4.1-mini"),
        tools=[
            ExaTools(
                include_domains=[
                    "cnbc.com",
                    "reuters.com",
                    "bloomberg.com",
                    "aninews.in",
                    "indiatoday.in",
                    "aajtak.in",
                    "thehindu.com",      
                    "theguardian.com",
                    "thetimesofindia.com",
                    "thehindubusinessline.com",
                    "theprint.in",
                    "dinamalar.com"
                    ],
                category="news",
                text=False,
                highlights=False,
                model="exa-pro",
                api_key=settings.EXA_API_KEY
            )
        ],
        description="An AI Agent which is used when we have to do a find news articles from credible news websites",
        instructions="""
        A user has asked a question.
        Search news websites to find relevant and recent information.
        Summarize key developments, expert commentary, and real-world events related to the query.
        Keep your response factual, concise, and based solely on reporting from news organizations.
        Include dates and headlines when possible.
        Always Return JSON object , Only json object no extra symbols , comments, or anything else apart from json object.
        """,
        show_tool_calls=False,
        markdown=True,
        add_datetime_to_instructions=True,
        use_json_mode=True,
        retries=20,
        exponential_backoff=True
    )

    social_media_agent = Agent(
        name="Social Media Research Agent",
        model=OpenAIChat(id="gpt-4.1-mini"),
        markdown=True,
        tools=[
            ExaTools(
                api_key=settings.EXA_API_KEY,
                text=False,
                highlights=False,
                model="exa",
                include_domains=[
                    "twitter.com",
                    "facebook.com",
                    "instagram.com",
                    "youtube.com",
                    "reddit.com",
                    "linkedin.com",
                    "tiktok.com",
                    "pinterest.com",
                ]
            )
        ],
        instructions=[
            "Carefully analyze the user's query to understand the specific information, topic, or sentiment they are asking about.",
            "Go to different social media platforms to gather relevant information.",
            "Have a broad search scope to cover a wide range of topics and perspectives.",
            "Do not limit your search to a single platform or topic.",
            "Use the provided search tool to find relevant content across various social media platforms based on the user's query.",
            "Ensure your search covers multiple platforms from the available list (Twitter, Facebook, Instagram, YouTube, Reddit, LinkedIn, TikTok, Pinterest) to gather diverse perspectives and content types. Do not rely on just one or two platforms.",
            "Focus on identifying social media posts, discussions, videos, user profiles, or pages that directly relate to the query. Prioritize recent and relevant results.",
            "Since the tool primarily returns links and metadata, evaluate the relevance of these sources based on the query.",
            "Synthesize the findings from the different platforms searched. Summarize the key themes, viewpoints, public sentiment, or pieces of information discovered.",
            "Explicitly try to represent a variety of viewpoints or types of content found across the different social media sites in your summary.",
            "Structure your final response as a JSON object. This object should clearly present the synthesized findings, potentially categorizing them by platform or theme, and including relevant source links or identifiers returned by the tool.",
            "Always Return JSON object , Only json object no extra symbols , comments, or anything else apart from json object."

        ],
        description="An AI fact-checking agent that  searches social media platforms for relevant information.",
        show_tool_calls=False,
        add_datetime_to_instructions=True,
        use_json_mode=True,
        retries=20,
        exponential_backoff=True
    )

    deep_research_agent = Agent(
        name="Deep Research Agent",
        model=OpenAIChat(id="gpt-4.1-mini"),
        markdown=True,
        tools=[
            ExaTools(
                api_key=settings.EXA_API_KEY,
                text=False,
                highlights=False,
                model="exa-pro",
                summary  = False,
                # get_contents=False , 
                num_results=15,
                answer=False
            )
        ],
        description="This is a deep search agent that performs diverse, comprehensive searches across multiple topics, domains, and perspectives",
        instructions=[
        # Core Query Diversification
        "When receiving a query, decompose it into multiple related search angles",
        "For each query, identify at least 3 distinct topic categories the query might belong to",
        "Generate separate searches for each identified category to ensure topical diversity",
        "Ensure results span different information types: facts, opinions, analyses, tutorials, examples",
        
        # Domain and Source Diversity
        "Distribute searches across varied domains: academic (.edu), commercial (.com), organizational (.org)",
        "Include diverse publication types: blogs, research papers, news sites, forums, documentation",
        "Balance mainstream and niche sources to capture both popular and specialized perspectives",
        "Incorporate international sources when relevant to gain global perspectives",
        
        # Temporal Diversity
        "Include time-stratified results: recent (past week), moderately recent (past year), established (past 5 years)",
        "Highlight trending discussions alongside established information",
        "For evolving topics, prioritize showing how information/opinions have changed over time",
        
        # Content Format Diversity
        "Retrieve diverse content formats: articles, datasets, code repositories, multimedia discussions",
        "When relevant, include visual content sources alongside text-based information",
        "Seek out interactive resources (tools, calculators, simulations) related to the query",
        
        # Perspective Diversity
        "For subjective topics, ensure representation of multiple viewpoints",
        "Include both mainstream consensus and alternative perspectives when they exist",
        "Present opposing viewpoints for controversial topics",
        
        # Search Process Implementation
        "For each query, generate at least 2 alternative phrasings to capture different semantic angles",
        "Always include specialized domain-specific sources when the query relates to technical fields",
        "Present results in categorized sections that highlight the diversity dimensions explored",
        "Always do breadth search across multiple topics rather than depth search on a single topic",
        "Always Return JSON object , Only json object no extra symbols , comments, or anything else apart from json object."
    ],
        show_tool_calls=False,
        add_datetime_to_instructions=True,
        use_json_mode=True,
        retries=20,
        exponential_backoff=True
    )
    # Additional agents can be added here as needed
