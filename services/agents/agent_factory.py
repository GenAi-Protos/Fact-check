from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.exa import ExaTools
from agno.tools.tavily import TavilyTools
from models.schemas import ClaimsToBeVerified, IntermediateResponse
from config import settings

# Setup environment variables for agents
settings.setup_env_variables()

class AgentFactory:
    """Factory class for creating AI agents used in fact checking"""
    
    structured_output_agent = Agent(
        name='Claim Checker',
        model=OpenAIChat(id="gpt-4.1", temperature=0.2),
        description="An AI agent that extracts fact-check-worthy claims from user input.",
        instructions="""Identify and extract only the fact-check-worthy claims present in the user's input text. 
            A fact-check-worthy claim is a statement that can be independently verified or refuted. 
            Avoid including well-known facts, subjective opinions, general statements, or trivial content. 
            Do not infer or generate claims—extract only what is directly and explicitly stated by the user.
            
            MAKE SURE TO RETURN THE ONLY THE STATEMENTS USER HAS MADE AND NOT ANYTHING ELSE DONT HALLUCINATE OR ADD ANYTHING ELSE
            """,
        response_model=ClaimsToBeVerified,
        add_datetime_to_instructions=True,
    )

    web_search_agent = Agent(
        name="Web Searcher",
        model=OpenAIChat(id="gpt-4o-mini"),
        tools=[TavilyTools(api_key=settings.TAVILY_API_KEY)],
        description="An AI Agent which is used when we have to do a web search to find relevant information from web",
        instructions="Always Return JSON SCHEMA",
        show_tool_calls=False,
        markdown=True,
        add_datetime_to_instructions=True,
        # response_model=IntermediateResponse,
        use_json_mode=True,
    )

    news_search_agent = Agent(
        name="News Searcher",
        model=OpenAIChat(id="gpt-4o-mini"),
        tools=[ExaTools(
            include_domains=["cnbc.com", "reuters.com", "bloomberg.com", "aninews.in", "indiatoday.in", "aajtak.in", "linkedin.com"],
            text=False,
            highlights=False,
        )],
        description="An AI Agent which is used when we have to do a find news articles from credible news websites",
        instructions="""
        A user has asked a question.
        Search only trusted news websites to find relevant and recent information.
        Summarize key developments, expert commentary, and real-world events related to the query.
        Do not use blogs, academic sources, forums, or social media.
        Keep your response factual, concise, and based solely on reporting from news organizations.
        Include dates and headlines when possible.
        Always Return JSON SCHEMA
        """,
        show_tool_calls=False,
        markdown=True,
        add_datetime_to_instructions=True,
        # response_model=IntermediateResponse,
        use_json_mode=True,
    )

    deep_research_agent = Agent(
        name="Deep Research Agent",
        model=OpenAIChat(id="gpt-4.1-mini"),
        markdown=True,
        instructions="""
        You are a research assistant with access to web search tools.
        Your task is to conduct broad, high-level research.
        Instead of going deep into one specific aspect, gather diverse perspectives, summaries, key trends,
        recent developments, and major viewpoints across multiple sources. 
        Your goal is to create a comprehensive overview of the topic that helps someone understand its scope,
        relevance, and key components. Prioritize breadth over depth. Avoid technical jargon unless necessary.
        Include sources where applicable.
        Always Return JSON SCHEMA
        """,
        description="An AI fact-checking agent that verifies claims by searching the web and extracting evidence-backed information from credible sources such as news outlets, academic articles, and official reports.",
        show_tool_calls=False,
        add_datetime_to_instructions=True,
        # response_model=IntermediateResponse,
        use_json_mode=True,
    )

    # Additional agents can be added here as needed
