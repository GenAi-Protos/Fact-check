import { useState, useCallback } from 'react';
import './App.css';
import EventCard from './components/EventCard'; // Import the new component

// Define a type for the streamed events (adjust based on actual backend output)
interface StreamEvent {
  event: string;
  content?: any; // Content can be varied
  tools?: any; // For tool calls
  member_responses?: any; // For member responses
  reasoning_content?: string; // For reasoning steps
  error?: string; // For error events
  // Add other potential fields based on backend stream structure
  [key: string]: any; // Allow other properties
}

// Define a type for the final structured result
interface FinalResult {
  claim: string;
  verdict: string;
  explanation: string;
  confidence: number;
  // citations might be part of the final event or collected separately
}

function App() {
  const [query, setQuery] = useState<string>('');
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [sourceUrls, setSourceUrls] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuerySubmit = useCallback(async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setEvents([]);
    setFinalResult(null);
    setSourceUrls(new Set());

    try {
      // Adjust URL if backend runs elsewhere
      const response = await fetch('http://localhost:8000/fact-check/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/x-ndjson', // Expect ndjson
        },
        body: JSON.stringify({ query: query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedFinalContent = ''; // To assemble final JSON string

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue; // Skip empty lines

          try {
            const eventData: StreamEvent = JSON.parse(line);
            setEvents((prevEvents) => [...prevEvents, eventData]);

            // --- Logic to identify and store the final result ---
            // Adjust this based on how the final result is marked in the stream
            // Example: Check for a specific event type or structure
            if (eventData.event === 'RunCompleted' && typeof eventData.content === 'string') {
                 // If RunCompleted content holds the final JSON string
                 accumulatedFinalContent = eventData.content;
            } else if (eventData.event === 'RunResponse' && typeof eventData.content === 'string') {
                 // If final JSON is streamed chunk by chunk via RunResponse
                 accumulatedFinalContent += eventData.content;
            }
            // --- End Final Result Logic ---

            // --- Logic to extract source URLs ---
            const findUrlsInObject = (obj: any, urlSet: Set<string>) => {
                if (!obj) return;
                if (typeof obj === 'string') {
                    // Basic URL regex - might need refinement
                    const urlRegex = /(https?:\/\/[^\s"']+)/g;
                    const matches = obj.match(urlRegex);
                    if (matches) {
                        matches.forEach(url => urlSet.add(url));
                    }
                } else if (Array.isArray(obj)) {
                    obj.forEach(item => findUrlsInObject(item, urlSet));
                } else if (typeof obj === 'object') {
                    // Check for common 'url' or 'source_url' keys
                    if (obj.url && typeof obj.url === 'string') urlSet.add(obj.url);
                    if (obj.source_url && typeof obj.source_url === 'string') urlSet.add(obj.source_url);
                    // Recursively check values
                    Object.values(obj).forEach(value => findUrlsInObject(value, urlSet));
                }
            };

            const tempUrls = new Set<string>();
            // Check tool results (content field within tools array)
            if (eventData.event === 'ToolCallCompleted' && eventData.tools) {
                 let toolList = eventData.tools;
                 if (typeof toolList === 'string') {
                     try {
                         const correctedString = toolList.replace(/None/g, 'null').replace(/True/g, 'true').replace(/False/g, 'false').replace(/'/g, '"');
                         toolList = JSON.parse(correctedString);
                     } catch { toolList = []; }
                 }
                 if (Array.isArray(toolList)) {
                     toolList.forEach((tool: any) => {
                         if (tool.content) {
                             try {
                                 // Try parsing content if it's a JSON string
                                 const contentObj = (typeof tool.content === 'string' && (tool.content.startsWith('{') || tool.content.startsWith('[')))
                                     ? JSON.parse(tool.content)
                                     : tool.content;
                                 findUrlsInObject(contentObj, tempUrls);
                             } catch (e) {
                                 // If parsing fails, just check the raw string content
                                 findUrlsInObject(tool.content, tempUrls);
                             }
                         }
                     });
                 }
            }
            // Check member responses
            if (eventData.member_responses) {
                 let memberResponsesList = eventData.member_responses;
                  if (typeof memberResponsesList === 'string') {
                     try {
                         const correctedString = memberResponsesList.replace(/None/g, 'null').replace(/True/g, 'true').replace(/False/g, 'false').replace(/'/g, '"');
                         memberResponsesList = JSON.parse(correctedString);
                     } catch { memberResponsesList = []; }
                 }
                if (Array.isArray(memberResponsesList)) {
                    memberResponsesList.forEach((resp: any) => {
                        // Look in content and potentially nested structures
                        findUrlsInObject(resp.content, tempUrls);
                        findUrlsInObject(resp.messages, tempUrls); // Check messages too
                    });
                }
            }
            // Check direct content field if it's a string
             if (typeof eventData.content === 'string') {
                 findUrlsInObject(eventData.content, tempUrls);
             }


             if (tempUrls.size > 0) {
                 setSourceUrls(prevUrls => {
                     const newUrls = new Set(prevUrls);
                     tempUrls.forEach(url => newUrls.add(url));
                     return newUrls;
                 });
             }
            // --- End URL Extraction Logic ---


          } catch (parseError) {
            console.error('Error parsing stream data:', parseError, 'Raw line:', line);
            // Add a special event to display the parsing error
            setEvents((prevEvents) => [...prevEvents, { event: 'ParseError', error: `Failed to parse line: ${line}` }]);
          }
        }
      }
       // Process the final accumulated content after stream ends
       if (accumulatedFinalContent) {
           try {
               const parsedFinal = JSON.parse(accumulatedFinalContent.trim());
               // Assuming the final object matches FinalResult structure
               if (parsedFinal.claim && parsedFinal.verdict) {
                   setFinalResult(parsedFinal as FinalResult);
               } else {
                   console.warn("Final accumulated content didn't match expected FinalResult structure:", parsedFinal);
               }
           } catch (finalParseError) {
               console.error("Error parsing final accumulated content:", finalParseError, "Content:", accumulatedFinalContent);
               setError("Failed to parse the final result from the stream.");
           }
       }


    } catch (err) {
      console.error('API call failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading]);

  // TODO: Implement rendering logic for events, finalResult, sourceUrls, error, isLoading
  return (
    <div className="app-container">
      <h1>Fact Check AI</h1>

      <div className="query-form">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your claim or query here..."
          rows={3}
          disabled={isLoading}
        />
        <button onClick={handleQuerySubmit} disabled={isLoading}>
          {isLoading ? 'Checking...' : 'Check Fact'}
        </button>
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      <div className="results-container">
        {events.length === 0 && !isLoading && !error && <div>Enter a query to start fact-checking.</div>}
        {isLoading && events.length === 0 && <div>Waiting for response...</div>}

        {/* Render Final Result */}
        {finalResult && (
          <div className="final-result-card">
            <h4>Final Verdict</h4>
            <pre>{JSON.stringify(finalResult, null, 2)}</pre>
          </div>
        )}

        {/* Render Stream Events using EventCard */}
        {events.map((eventData, index) => (
          <EventCard key={index} eventData={eventData} />
        ))}

         {/* Render Source URLs */}
         {sourceUrls.size > 0 && (
            <div className="source-list">
                <h4>Sources Found</h4>
                <ul>
                    {Array.from(sourceUrls).map((url, index) => (
                        <li key={index}>
                            <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                        </li>
                    ))}
                </ul>
            </div>
         )}
      </div>
    </div>
  );
}

export default App;
