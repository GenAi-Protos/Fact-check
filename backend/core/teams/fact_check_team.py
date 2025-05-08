from agno.team.team import Team
from agno.models.aws import AwsBedrock
from agno.models.openrouter import OpenRouter
from agno.tools.reasoning import ReasoningTools
from services.agents.agent_factory import AgentFactory
from config import settings

def create_fact_check_team(additional_context:str=""):
    """Create and configure the fact-checking team of AI agents"""
    
    fact_check_team = Team(
        name='Fact Checker Journalist',
        mode="coordinate",
        model=OpenRouter(id="anthropic/claude-3.7-sonnet",api_key=settings.OPENROUTER_API_KEY),
        tools=[
            ReasoningTools(add_instructions=True)
        ],
        description="An AI Fact checker who will Orchestrate, monitor and decide which AI Agent to use for a given task",
        instructions=[
            "Analyze the user query and break into subtasks",
            "Decide which AI Agent to use for each subtask",
            "Check if there are multiple claims in the input",
            "Execute the AI Agent for each subtask",
            "verify the results of each subtask",
            "combine the results of each subtask to get the final result",
            "Always use the reasoning tool to analyze the user query and break it into subtasks",
            "Always use reasoning tool to make a decision",
            "Always use reasoning tool to combine the results of each subtask",
            "Always use reasoning tool to verify the results of each subtask",
            "Try diffrent agents and tools to find the best solution",
            "Always Use the social media agents atlest once",
            "Do not generate response until you have substantial information to identify the claim as fact or false",
            """EXTREMELY IMPORTANT - MULTIPLE CLAIMS:
            You MUST generate a separate JSON object for EACH claim in the input.
            If there are multiple claims, you must provide verification for ALL claims, not just one.
            Return your results as a list, with each claim having its own complete JSON object.
            
            Example with multiple claims:
            [
                {
                    "claim": "First claim text",
                    "verdict": "True",
                    "explanation": "Explanation for first claim",
                    "confidence": 0.95
                },
                {
                    "claim": "Second claim text",
                    "verdict": "False",
                    "explanation": "Explanation for second claim",
                    "confidence": 0.85
                }
            ]
            """,
            """EXTREMELY IMPORTANT - JSON FORMAT: 
            Your final output MUST be valid JSON with exactly these fields:
            {
                "claim": "The exact claim being verified",
                "verdict": "True or False",
                "explanation": "2-3 sentence explanation with evidence",
                "confidence": 0.95  // Number between 0 and 1
            }
            """,
            "DO NOT include any text, comments, or explanations outside the JSON",
            "DO NOT add any introduction or conclusion text",
            "ONLY output the JSON itself and nothing else",
            "The system will look for JSON patterns, so ensure your output is properly formatted",
        ],
        members=[
            AgentFactory.deep_research_agent,
            AgentFactory.web_search_agent,
            AgentFactory.news_search_agent,
            AgentFactory.social_media_agent,
        ],
        add_datetime_to_instructions=True,
        add_member_tools_to_system_message=True,
        enable_agentic_context=True,
        enable_agentic_memory=True,
        share_member_interactions=True,
        show_members_responses=True,
        markdown=True,
        show_tool_calls=True,
        additional_context=additional_context,
        debug_mode=True,
        
        # debug_mode=True,

        expected_output="""
        For a single claim:
        {
            "claim": "The factual claim that was extracted and verified",
            "verdict": "Fact or False",
            "explanation": "Brief rationale for the verdict based on evidence",
            "confidence": 0.95
        }
        
        For multiple claims:
        [
            {
                "claim": "First claim to be verified",
                "verdict": "True",
                "explanation": "Brief rationale for this verdict",
                "confidence": 0.95
            },
            {
                "claim": "Second claim to be verified",
                "verdict": "False",
                "explanation": "Brief rationale for this verdict",
                "confidence": 0.9
            }
        ]
        """,
    )
    
    return fact_check_team

# Create a singleton instance
# fact_check_team = create_fact_check_team()
