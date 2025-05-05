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
  citations?: string[]; // Add optional citations if they come with the final result
}

// Type for categorized sources
interface CategorizedSources {
  [category: string]: Set<string>;
}


function App() {
  const [query, setQuery] = useState<string>('');
  const [xLink, setXLink] = useState<string>('');
  const [facebookLink, setFacebookLink] = useState<string>('');
  const [instagramLink, setInstagramLink] = useState<string>('');
  const [youtubeLink, setYoutubeLink] = useState<string>('');
  const [genericLink, setGenericLink] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  // Use categorized sources state
  const [sources, setSources] = useState<CategorizedSources>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // File input handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };
  
  // Reset all form inputs
  const resetForm = () => {
    setQuery('');
    setXLink('');
    setFacebookLink('');
    setInstagramLink('');
    setYoutubeLink('');
    setGenericLink('');
    setImageFile(null);
    setVideoFile(null);
  };

  // Helper to add URLs to the categorized state
  const addCategorizedUrl = (category: string, url: string) => {
      setSources(prevSources => {
          const newSources = { ...prevSources };
          if (!newSources[category]) {
              newSources[category] = new Set();
          }
          // Avoid adding duplicates within the category
          if (!newSources[category].has(url)) {
              newSources[category] = new Set(newSources[category]).add(url);
          }
          return newSources;
      });
  };

  // --- Define Helper functions outside useCallback ---
  const socialMediaDomains = ["twitter.com", "x.com", "facebook.com", "instagram.com", "reddit.com", "linkedin.com", "tiktok.com", "pinterest.com"];
  const newsDomains = ["nytimes.com", "bbc.com", "reuters.com", "apnews.com", "thehindu.com", "indiatoday.in", "cnn.com", "wsj.com", "bloomberg.com", "cnbc.com", "aninews.in", "aajtak.in", "theguardian.com", "thetimesofindia.com", "thehindubusinessline.com", "theprint.in", "dinamalar.com"];
  const videoDomains = ["youtube.com", "youtu.be", "vimeo.com"];

  const getUrlCategory = (url: string): string => {
      try {
          const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
          if (socialMediaDomains.some(domain => hostname.includes(domain))) return 'Social Media';
          if (videoDomains.some(domain => hostname.includes(domain))) return 'Video';
          if (newsDomains.some(domain => hostname.includes(domain))) return 'News Source';
      } catch (e) { return 'General'; }
      return 'General';
  };

  const findAndCategorizeUrls = useCallback((obj: any, sourceHint: string = 'Unknown Source') => {
      if (!obj) return;
      if (typeof obj === 'string') {
          const urlRegex = /(https?:\/\/[^\s"'\)<>]+)/g;
          const matches = obj.match(urlRegex);
          if (matches) {
              matches.forEach(url => {
                  const category = getUrlCategory(url);
                  addCategorizedUrl(category, url);
              });
          }
      } else if (Array.isArray(obj)) {
          obj.forEach(item => findAndCategorizeUrls(item, sourceHint));
      } else if (typeof obj === 'object') {
          let category = sourceHint;
          if (obj.url && typeof obj.url === 'string') {
              category = getUrlCategory(obj.url);
              addCategorizedUrl(category, obj.url);
          }
          if (obj.source_url && typeof obj.source_url === 'string') {
               category = getUrlCategory(obj.source_url);
              addCategorizedUrl(category, obj.source_url);
          }
          Object.values(obj).forEach(value => findAndCategorizeUrls(value, category));
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies might need adjustment if addCategorizedUrl changes identity, but likely stable


  const handleQuerySubmit = useCallback(async () => {
    if ((!query.trim() && !xLink && !facebookLink && !instagramLink && !youtubeLink && 
         !imageFile && !videoFile) || isLoading) return;

    setIsLoading(true);
    setError(null);
    setEvents([]);
    setFinalResult(null);
    setSources({}); // Reset categorized sources

    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('query', query);
      
      // Append social media links if provided
      if (xLink) formData.append('x_link', xLink);
      if (facebookLink) formData.append('facebook_link', facebookLink);
      if (instagramLink) formData.append('instagram_link', instagramLink);
      if (youtubeLink) formData.append('youtube_link', youtubeLink);
      if (genericLink) formData.append('generic_link', genericLink);
      
      // Append files if provided
      if (imageFile) formData.append('image_file', imageFile);
      if (videoFile) formData.append('video_file', videoFile);
      
      // Adjust URL if backend runs elsewhere
      const response = await fetch('http://localhost:8000/fact-check/ask', {
        method: 'POST',
        // Don't set Content-Type header, browser will set it with proper boundary
        headers: {
          'Accept': 'application/x-ndjson', // Expect ndjson
        },
        body: formData
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

            // --- Logic to extract and categorize source URLs ---
             // Determine source hint based on event type and data
             let sourceHint = 'General';
            if (eventData.event === 'ToolCallCompleted' && eventData.tools) {
                let toolList = eventData.tools;
                if (typeof toolList === 'string') { try { const correctedString = toolList.replace(/None/g, 'null').replace(/True/g, 'true').replace(/False/g, 'false').replace(/'/g, '"'); toolList = JSON.parse(correctedString); } catch { toolList = []; } }

                if (Array.isArray(toolList)) {
                    toolList.forEach((tool: any) => {
                        sourceHint = tool.tool_name || 'Tool Result'; // Use tool name as hint
                        if (tool.tool_args?.category) sourceHint = `${sourceHint} (${tool.tool_args.category})`; // Add category if present
                        if (tool.content) {
                            try {
                                const contentObj = (typeof tool.content === 'string' && (tool.content.startsWith('{') || tool.content.startsWith('['))) ? JSON.parse(tool.content) : tool.content;
                                findAndCategorizeUrls(contentObj, sourceHint);
                            } catch (e) { findAndCategorizeUrls(tool.content, sourceHint); }
                        }
                    });
                }
            } else if (eventData.member_responses) {
                let memberResponsesList = eventData.member_responses;
                if (typeof memberResponsesList === 'string') { try { const correctedString = memberResponsesList.replace(/None/g, 'null').replace(/True/g, 'true').replace(/False/g, 'false').replace(/'/g, '"'); memberResponsesList = JSON.parse(correctedString); } catch { memberResponsesList = []; } }

                if (Array.isArray(memberResponsesList)) {
                    memberResponsesList.forEach((resp: any) => {
                        sourceHint = resp.agent_id || resp.name || 'Agent Response'; // Use agent name/ID as hint
                        findAndCategorizeUrls(resp.content, sourceHint);
                        findAndCategorizeUrls(resp.messages, sourceHint);
                        findAndCategorizeUrls(resp.tools, sourceHint);
                    });
                }
            } else if (typeof eventData.content === 'string') {
                findAndCategorizeUrls(eventData.content, 'Stream Content');
            }
             // --- End URL Extraction Logic --- (Calls moved outside)


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
               if (parsedFinal.claim && parsedFinal.verdict) {
                   const finalData = parsedFinal as FinalResult;
                   setFinalResult(finalData);
                   // Process citations from the final result object itself, if present
                   if (finalData.citations && Array.isArray(finalData.citations)) {
                       finalData.citations.forEach(url => {
                           if (typeof url === 'string') {
                               const category = getUrlCategory(url); // Use function from outer scope
                               addCategorizedUrl(category, url);
                           }
                       });
                   }
               } else {
                   console.warn("Final accumulated content didn't match expected FinalResult structure:", parsedFinal);
                   findAndCategorizeUrls(parsedFinal, 'Final Content (Malformed)'); // Use function from outer scope
               }
           } catch (finalParseError) {
               console.error("Error parsing final accumulated content:", finalParseError, "Content:", accumulatedFinalContent);
               setError("Failed to parse the final result from the stream.");
               findAndCategorizeUrls(accumulatedFinalContent, 'Final Content (Unparsed)'); // Use function from outer scope
           }
       }


    } catch (err) {
      console.error('API call failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, xLink, facebookLink, instagramLink, youtubeLink, genericLink, imageFile, videoFile, isLoading, findAndCategorizeUrls]);

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
        
        <div className="link-inputs">
          <input
            type="text"
            value={xLink}
            onChange={(e) => setXLink(e.target.value)}
            placeholder="Twitter/X Link (optional)"
            disabled={isLoading}
          />
          <input
            type="text"
            value={facebookLink}
            onChange={(e) => setFacebookLink(e.target.value)}
            placeholder="Facebook Link (optional)"
            disabled={isLoading}
          />
          <input
            type="text"
            value={instagramLink}
            onChange={(e) => setInstagramLink(e.target.value)}
            placeholder="Instagram Link (optional)"
            disabled={isLoading}
          />
          <input
            type="text"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            placeholder="YouTube Link (optional)"
            disabled={isLoading}
          />
          <input
            type="text"
            value={genericLink}
            onChange={(e) => setGenericLink(e.target.value)}
            placeholder="Generic Link (optional)"
            disabled={isLoading}
          />
        </div>
        
        <div className="file-inputs">
          <div className="file-input">
            <label htmlFor="image-upload">Upload Image:</label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isLoading}
            />
            {imageFile && <span className="file-name">{imageFile.name}</span>}
          </div>
          
          <div className="file-input">
            <label htmlFor="video-upload">Upload Video:</label>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              disabled={isLoading}
            />
            {videoFile && <span className="file-name">{videoFile.name}</span>}
          </div>
        </div>
        
        <button className="submit-button" onClick={handleQuerySubmit} disabled={isLoading}>
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

         {/* Render Categorized Source URLs */}
         {Object.keys(sources).length > 0 && (
            <div className="source-list">
              <h4>Sources Found</h4>
              {Object.entries(sources).map(([category, urls]) => (
                urls.size > 0 && (
                  <div key={category} style={{ marginBottom: '15px' }}>
                    <h5>{category}</h5> {/* Display category name */}
                    <ul>
                      {Array.from(urls).map((url, index) => (
                        <li key={index}>
                          <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
         )}
      </div>
    </div>
  );
}

export default App;
