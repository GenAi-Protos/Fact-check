import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactJson from 'react-json-view'; // Import react-json-view

// Re-using the StreamEvent type, assuming it's defined elsewhere or passed as prop
// If not, define it here:
interface StreamEvent {
  event: string;
  content?: any;
  tools?: any;
  member_responses?: any;
  reasoning_content?: string;
  error?: string;
  [key: string]: any;
}

interface EventCardProps {
  eventData: StreamEvent;
}

// Helper to render tool calls/results more nicely
const renderTools = (tools: any, eventType: string) => {
  let toolList = tools;
  // Attempt to parse if it's a string representation of a list
  if (typeof tools === 'string') {
    try {
      // More robust parsing attempt for Python-like string list/dict
      const correctedString = tools
        .replace(/None/g, 'null')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/'/g, '"'); // Replace single quotes
      toolList = JSON.parse(correctedString);
    } catch (e) {
       console.warn("Could not parse tools string:", tools, e);
      return <pre>Tools data (unparseable): {tools}</pre>; // Show raw string if parsing fails
    }
  }

  if (!Array.isArray(toolList)) {
    return <pre>Tools data (not an array): {JSON.stringify(toolList, null, 2)}</pre>;
  }

  return (
    <ul style={{ margin: 0, paddingLeft: '20px' }}>
      {toolList.map((tool: any, index: number) => (
        <li key={index} style={{ marginBottom: '10px' }}>
          <div><strong>Tool:</strong> {tool.tool_name || tool.name || 'N/A'}</div>
          {tool.tool_args && (
            <div>
              <strong>Args:</strong>
              {/* Use ReactJson for tool args */}
              <ReactJson
                  src={tool.tool_args}
                  name={null} // Hide the root name
                  collapsed={1} // Collapse deeper levels by default
                  enableClipboard={false}
                  displayDataTypes={false}
                  style={{ marginTop: '5px', backgroundColor: '#f8f8f8', padding: '5px', borderRadius: '3px' }}
              />
            </div>
          )}
          {/* Render tool content/result only on ToolCallCompleted */}
          {eventType === 'ToolCallCompleted' && tool.content && (
            <div>
              <strong>Result:</strong>
              {/* Try to parse content if it looks like JSON, use ReactJson, otherwise display as string */}
              {(typeof tool.content === 'string' && (tool.content.startsWith('{') || tool.content.startsWith('['))) ? (
                 <ReactJson
                    src={JSON.parse(tool.content)} // Parse the string first
                    name={null}
                    collapsed={1}
                    enableClipboard={false}
                    displayDataTypes={false}
                    style={{ marginTop: '5px', backgroundColor: '#f8f8f8', padding: '5px', borderRadius: '3px' }}
                 />
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '5px' }}>{String(tool.content)}</pre>
              )}
            </div>
          )}
          {tool.tool_call_error && <div style={{ color: 'red' }}><strong>Error:</strong> Tool call failed</div>}
        </li>
      ))}
    </ul>
  );
};


const EventCard: React.FC<EventCardProps> = ({ eventData }) => {
  const { event, content, tools, member_responses, reasoning_content, error } = eventData;

  const renderContent = () => {
    switch (event) {
      case 'RunStarted':
      case 'ReasoningStarted':
      case 'ReasoningCompleted':
      case 'RunCompleted': // Often has final content string
        return <p>{typeof content === 'string' ? content : JSON.stringify(content)}</p>;

      case 'ToolCallStarted':
        return <div>Calling Tool(s)... {renderTools(tools, event)}</div>;
      case 'ToolCallCompleted':
         return <div>Tool Call(s) Completed: {renderTools(tools, event)}</div>;

       case 'ReasoningStep':
         // Prefer reasoning_content (formatted markdown), fallback to content object
         if (reasoning_content) {
            // Use ReactMarkdown to render
            return <ReactMarkdown remarkPlugins={[remarkGfm]}>{reasoning_content}</ReactMarkdown>;
         } else if (content && typeof content === 'object') {
             // Display title/reasoning/action from the content object if reasoning_content is missing
             const step = content; // Assuming content is the ReasoningStep object
             return (
                 <div>
                     {step.title && <strong>{step.title}</strong>}
                     {step.reasoning && <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{step.reasoning}</p>}
                     {/* Display other parts of the step object if needed */}
                     {step.action && <p><em>Action: {step.action}</em></p>}
                     {step.result && <div><strong>Result:</strong> <pre>{JSON.stringify(step.result, null, 2)}</pre></div>}
                 </div>
             );
         } else if (content) {
             // Fallback for non-object content in ReasoningStep
             return <pre>{JSON.stringify(content, null, 2)}</pre>;
         }
         return <p>Processing reasoning step...</p>;


      case 'RunResponse': // Often streams final JSON content chunk by chunk
        // App.tsx handles accumulation, so we don't render individual chunks here
        return null; // Render nothing for these intermediate chunks

      case 'MemberResponse': // Assuming member_responses is in the eventData for this
         // Attempt to parse and display member responses using ReactJson
         let responses = member_responses;
         if (typeof responses === 'string') {
             try {
                 const correctedString = responses.replace(/None/g, 'null').replace(/True/g, 'true').replace(/False/g, 'false').replace(/'/g, '"');
                 responses = JSON.parse(correctedString);
             } catch (e) { /* Keep as string if parse fails */ }
         }
         return (
            <div>
                <strong>Member Response(s):</strong>
                {typeof responses === 'object' ? (
                     <ReactJson
                        src={responses}
                        name={null}
                        collapsed={1}
                        enableClipboard={false}
                        displayDataTypes={false}
                        style={{ marginTop: '5px', backgroundColor: '#f8f8f8', padding: '5px', borderRadius: '3px' }}
                     />
                ) : (
                     <pre>{String(responses)}</pre> // Fallback to string
                )}
            </div>
         );

      case 'ParseError':
      case 'StreamError':
      case 'SerializationError':
      case 'RecursiveSerializationError':
        return <div className="error-message">Error: {error || content || 'Unknown stream error'}</div>;

      default:
        // Fallback for any other event type
        return <pre>{JSON.stringify(eventData, null, 2)}</pre>;
    }
  };

  // Don't render anything for RunResponse chunks as App handles accumulation
  if (event === 'RunResponse') {
      return null;
  }

  return (
    <div className="event-card">
      <h4>{event || 'Unknown Event'}</h4>
      {renderContent()}
    </div>
  );
};

export default EventCard;
