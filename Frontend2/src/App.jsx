/* eslint-disable no-undef */
/* eslint-disable no-useless-escape */
/* eslint-disable no-unused-vars */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Drawer,
  Box,
  ListItemIcon
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import genAIIcon from './assets/genAI_icon.png';
import './App.css';
import EventCard from './components/EventCard';

function App() {
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [sources, setSources] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [accumulatedResponse, setAccumulatedResponse] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [likedEvents, setLikedEvents] = useState(new Set());
  const [eventStatuses, setEventStatuses] = useState({});
  const bottomRef = useRef(null);
  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // null means "All"

  // Helper to add URLs to the categorized state
  const addCategorizedUrl = (category, url) => {
    setSources((prevSources) => {
      const newSources = { ...prevSources };
      if (!newSources[category]) {
        newSources[category] = new Set();
      }
      if (!newSources[category].has(url)) {
        newSources[category] = new Set(newSources[category]).add(url);
      }
      return newSources;
    });
  };

  const socialMediaDomains = [
    'twitter.com',
    'facebook.com',
    'instagram.com',
    'youtube.com',
    'reddit.com',
    'linkedin.com',
    'tiktok.com',
    'pinterest.com',
  ];
  const newsDomains = [
    'cnbc.com',
    'reuters.com',
    'bloomberg.com',
    'aninews.in',
    'indiatoday.in',
    'aajtak.in',
    'thehindu.com',
    'theguardian.com',
    'timesofindia.indiatimes.com',
    'thehindubusinessline.com',
    'theprint.in',
    'dinamalar.com',
  ];

  const getUrlCategory = (url) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      if (socialMediaDomains.some((domain) => hostname.includes(domain))) return 'Social Media';
      if (newsDomains.some((domain) => hostname.includes(domain))) return 'News Source';
    } catch (e) {
      return 'General';
    }
    return 'General';
  };

  const findAndCategorizeUrls = useCallback(
    (obj, sourceHint = 'Unknown Source') => {
      if (!obj) return;
      if (typeof obj === 'string') {
        const urlRegex = /(https?:\/\/[^\s"'\)<>]+)/g;
        const matches = obj.match(urlRegex);
        if (matches) {
          matches.forEach((url) => {
            const category = getUrlCategory(url);
            addCategorizedUrl(category, url);
          });
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item) => findAndCategorizeUrls(item, sourceHint));
      } else if (typeof obj === 'object') {
        let category = sourceHint;
        if (obj.url && typeof obj.url === 'string') {
          category = getUrlCategory(obj.url);
          addCategorizedUrl(category, url);
        }
        if (obj.source_url && typeof obj.source_url === 'string') {
          category = getUrlCategory(obj.source_url);
          addCategorizedUrl(category, obj.source_url);
        }
        Object.values(obj).forEach((value) => findAndCategorizeUrls(value, category));
      }
    },
    [],
  );

  const handleQuerySubmit = useCallback(
    async () => {
      if (!query.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);
      setEvents([]);
      setFinalResult(null);
      setSources({});
      setShowResults(true);
      setAccumulatedResponse('');
      setParsedResult(null);
      setEventStatuses({});

      try {
        const response = await fetch('http://localhost:8000/fact-check/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/x-ndjson',
          },
          body: JSON.stringify({ query: query }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let accumulatedFinalContent = '';

        let currentIndex = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          console.log('value', value);

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;

            try {
              const eventData = JSON.parse(line);

              if (eventData.event.includes('Started') || eventData.event.includes('ToolCall')) {
                setEventStatuses((prev) => ({
                  ...prev,
                  [currentIndex]: 'in-progress',
                }));
              }

              setEvents((prevEvents) => {
                const newEvents = [...prevEvents, eventData];
                currentIndex = newEvents.length - 1;
                return newEvents;
              });

              if (eventData.event.includes('Started') || eventData.event.includes('ToolCall')) {
                setTimeout(() => {
                  setEventStatuses((prev) => ({
                    ...prev,
                    [currentIndex]: 'completed',
                  }));
                }, 1000);
              }

              if (eventData.event === 'RunCompleted' && typeof eventData.content === 'string') {
                setAccumulatedResponse(eventData.content);
                try {
                  const result = JSON.parse(eventData.content);
                  if (result.claim && result.verdict && result.explanation && result.confidence !== undefined) {
                    setParsedResult({
                      claim: result.claim,
                      verdict: result.verdict,
                      explanation: result.explanation,
                      confidence: result.confidence,
                    });
                  }
                } catch (parseError) {
                  console.warn('Failed to parse RunCompleted content:', parseError);
                  setParsedResult(null);
                }
              } else if (eventData.event === 'RunResponse' && typeof eventData.content === 'string') {
                accumulatedFinalContent += eventData.content;
                setAccumulatedResponse((prev) => prev + eventData.content);
              }

              let sourceHint = 'General';
              if (eventData.event === 'ToolCallCompleted' && eventData.tools) {
                let toolList = eventData.tools;
                if (typeof toolList === 'string') {
                  try {
                    const correctedString = toolList
                      .replace(/None/g, 'null')
                      .replace(/True/g, 'true')
                      .replace(/False/g, 'false')
                      .replace(/'/g, '"');
                    toolList = JSON.parse(correctedString);
                  } catch {
                    toolList = [];
                  }
                }

                if (Array.isArray(toolList)) {
                  toolList.forEach((tool) => {
                    sourceHint = tool.tool_name || 'Tool Result';
                    if (tool.tool_args?.category) sourceHint = `${sourceHint} (${tool.tool_args.category})`;
                    if (tool.content) {
                      try {
                        const contentObj =
                          typeof tool.content === 'string' &&
                          (tool.content.startsWith('{') || tool.content.startsWith('['))
                            ? JSON.parse(tool.content)
                            : tool.content;
                        findAndCategorizeUrls(contentObj, sourceHint);
                      } catch (e) {
                        findAndCategorizeUrls(tool.content, sourceHint);
                      }
                    }
                  });
                }
              } else if (eventData.member_responses) {
                let memberResponsesList = eventData.member_responses;
                if (typeof memberResponsesList === 'string') {
                  try {
                    const correctedString = memberResponsesList
                      .replace(/None/g, 'null')
                      .replace(/True/g, 'true')
                      .replace(/False/g, 'false')
                      .replace(/'/g, '"');
                    memberResponsesList = JSON.parse(correctedString);
                  } catch {
                    memberResponsesList = [];
                  }
                }

                if (Array.isArray(memberResponsesList)) {
                  memberResponsesList.forEach((resp) => {
                    sourceHint = resp.agent_id || resp.name || 'Agent Response';
                    findAndCategorizeUrls(resp.content, sourceHint);
                    findAndCategorizeUrls(resp.messages, sourceHint);
                    findAndCategorizeUrls(resp.tools, sourceHint);
                  });
                }
              } else if (typeof eventData.content === 'string') {
                findAndCategorizeUrls(eventData.content, 'Stream Content');
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError, 'Raw line:', line);
              setEvents((prevEvents) => [
                ...prevEvents,
                { event: 'ParseError', error: `Failed to parse line: ${line}` },
              ]);
            }
          }
        }

        if (accumulatedFinalContent) {
          try {
            const parsedFinal = JSON.parse(accumulatedFinalContent.trim());
            if (parsedFinal.claim && parsedFinal.verdict) {
              setFinalResult(parsedFinal);
              if (parsedFinal.citations && Array.isArray(parsedFinal.citations)) {
                parsedFinal.citations.forEach((url) => {
                  if (typeof url === 'string') {
                    const category = getUrlCategory(url);
                    addCategorizedUrl(category, url);
                  }
                });
              }
            } else {
              console.warn("Final accumulated content didn't match expected FinalResult structure:", parsedFinal);
              findAndCategorizeUrls(parsedFinal, 'Final Content (Malformed)');
            }
          } catch (finalParseError) {
            console.error("Error parsing final accumulated content:", finalParseError, "Content:", accumulatedFinalContent);
            setError("Failed to parse the final result from the stream.");
            findAndCategorizeUrls(accumulatedFinalContent, 'Final Content (Unparsed)');
          }
        }
      } catch (err) {
        console.error('API call failed:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    [query, isLoading, findAndCategorizeUrls],
  );

  // Scroll left column to bottom when events update
  useEffect(() => {
    if (leftColumnRef.current) {
      leftColumnRef.current.scrollTop = leftColumnRef.current.scrollHeight;
    }
  }, [events]);

  // Scroll right column to bottom when events update
  useEffect(() => {
    if (rightColumnRef.current) {
      setTimeout(() => {
        if (rightColumnRef.current) {
           rightColumnRef.current.scrollTo({
             top: rightColumnRef.current.scrollHeight,
             behavior: 'smooth'
           });
        }
      }, 100);
    }
  }, [events]);

  // Scroll to bottom when parsedResult updates
  useEffect(() => {
    if (parsedResult && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [parsedResult]);

  const handleBrowseWeb = () => {
    if (isBrowsing || !finalResult) return;

    setIsBrowsing(true);
    setTimeout(() => {
      setFinalResult((prev) => ({
        ...prev,
        explanation: `${prev.explanation || ''}\n- I'm doing another web search with "${query}" to ensure I haven't missed anything.`,
      }));
      setIsBrowsing(false);
    }, 2000);
  };

  const getDisplayEventName = (eventData) => {
    if (eventData.reasoning_content) {
      return eventData.event;
    }

    if (eventData.tools && eventData.tools.length > 0) {
      let toolList = eventData.tools;
      if (Array.isArray(toolList) && toolList.length > 0) {
        const tool = toolList[0];
        const toolName = tool.tool_name || 'Unknown Tool';
        return `${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`;
      }
    }

    return null;
  };

  const leftEvents = events
    .map((eventData, index) => ({ eventData, index }))
    .filter(({ eventData }) => {
      const displayName = getDisplayEventName(eventData);
      return displayName !== null;
    });

  const rightEvents = events.filter(
    (eventData) => eventData.reasoning_content || (eventData.tools && eventData.tools.length > 0)
  );

  // Calculate total number of links
  const totalLinks = Object.values(sources).reduce((sum, urlSet) => sum + urlSet.size, 0);

  // Flatten URLs for "All" view
  const allUrls = Object.values(sources).flatMap(urlSet => [...urlSet]);

  // Select up to 3 URLs for favicons
  const faviconUrls = allUrls.slice(0, 3);

  // Determine which URLs to display based on selectedCategory
  const displayedUrls = selectedCategory ? [...(sources[selectedCategory] || [])] : allUrls;

  return (
    <div className="app-container">
      <div className="facts-checker-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={genAIIcon} 
            alt="GenAI Icon" 
            style={{ width: '32px', height: '32px' }}
          />
          <h1 className="facts-checker-question" style={{ margin: 0 }}>
            Facts Checker
          </h1>
        </Box>
      </div>
      {!showResults && (
        <div className="facts-checker-container">
          <div className="facts-checker-content">
            <h2 className="facts-checker-question">What would you like to verify?</h2>
            <div className="input-section">
              <TextField
                variant="outlined"
                placeholder="Enter something you want to verify..."
                multiline
                minRows={1}
                maxRows={6}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        variant="contained"
                        className="facts-checker-button"
                        onClick={handleQuerySubmit}
                        disabled={isLoading}
                      >
                        <ArrowUpwardIcon />
                      </Button>
                    </InputAdornment>
                  ),
                  className: 'facts-checker-input',
                }}
              />
            </div>
          </div>
        </div>
      )}
      {showResults && (
        <div className="results-wrapper">
          {error && (
            <p className="error-message">
              Error: {error}
            </p>
          )}
          <div className='resultContainer'>
            <h2 className="searched-query">{query}</h2>
            <div className="results-container">
              <div className="left-column" ref={leftColumnRef}>
                <h3 className="section-title">DeepSearch</h3>
                <List sx={{ backgroundColor: '#F8F9FA', color: '#212529', borderRadius: '8px', padding: '8px', border: '1px solid #DEE2E6' }}>
                  {leftEvents.length === 0 && !isLoading ? (
                    <ListItem>
                      <ListItemText primary="No events available" />
                    </ListItem>
                  ) : (
                    leftEvents.map(({ eventData, index }) => (
                      <ListItem
                        key={index}
                        sx={{
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          padding: '20px',
                          paddingLeft: '0'
                        }}
                      >
                        <CheckCircleIcon sx={{ color: '#67AE6E', mr: 2 }} fontSize="medium" />
                        <Typography variant="body1">
                          {getDisplayEventName(eventData)}
                        </Typography>
                      </ListItem>
                    ))
                  )}
                  {isLoading && (
                    <ListItem sx={{ justifyContent: 'flex-start', padding: '8px', paddingLeft: '0' }}>
                      <CircularProgress size={24} sx={{ color: '#222831' }} />
                    </ListItem>
                  )}
                </List>
              </div>
              <div className="right-column" ref={rightColumnRef}>
                {rightEvents.map((eventData, index) => (
                  <EventCard key={index} eventData={eventData} />
                ))}
                {!parsedResult && accumulatedResponse && (
                  <div className="response-card">
                    <div className="response-content">
                      <h3>Verifying with web search</h3>
                      <p className="response-text">
                        <pre>{accumulatedResponse}</pre>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {totalLinks > 0 && (
              <div className="response-card sources-card">
                <div className="response-content">
                  <Button
                    onClick={() => setOpenDrawer(true)}
                    sx={{
                      backgroundColor: '#FFFFFF',
                      color: '#495057',
                      border: '1px solid #DEE2E6',
                      borderRadius: '16px',
                      padding: '6px 12px',
                      textTransform: 'none',
                      fontSize: '14px',
                      '&:hover': {
                        backgroundColor: '#F8F9FA',
                      },
                    }}
                    startIcon={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {faviconUrls.map((url, index) => (
                          <img
                            key={index}
                            src={`https://www.google.com/s2/favicons?domain=${url}`}
                            alt={`${url} favicon`}
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                            }}
                          />
                        ))}
                      </Box>
                    }
                  >
                    {totalLinks} web pages
                  </Button>
                </div>
                <Drawer
                  anchor="right"
                  open={openDrawer}
                  onClose={() => {
                    setOpenDrawer(false);
                    setSelectedCategory(null);
                  }}
                  sx={{ '& .MuiDrawer-paper': { width: 600, backgroundColor: '#FFFFFF', color: '#212529', p: 2, borderLeft: '1px solid #DEE2E6' } }}
                >
                  <Box sx={{ p: 2, position: 'relative' }}>
                    <IconButton
                      onClick={() => {
                        setOpenDrawer(false);
                        setSelectedCategory(null);
                      }}
                      sx={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        color: '#6C757D',
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ mb: 2, color: '#212529' }}>
                      Source Links
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Button
                        onClick={() => setSelectedCategory(null)}
                        sx={{
                          backgroundColor: selectedCategory === null ? '#0D6EFD' : '#E9ECEF',
                          color: selectedCategory === null ? '#FFFFFF' : '#212529',
                          border: selectedCategory !== null ? '1px solid #DEE2E6' : 'none',
                          borderRadius: '16px',
                          padding: '4px 12px',
                          textTransform: 'none',
                          fontSize: '12px',
                          '&:hover': {
                            backgroundColor: selectedCategory === null ? '#0B5ED7' : '#DEE2E6',
                          },
                        }}
                      >
                        All
                      </Button>
                      {Object.keys(sources).map((category) => (
                        <Button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          sx={{
                            backgroundColor: selectedCategory === category ? '#0D6EFD' : '#E9ECEF',
                            color: selectedCategory === category ? '#FFFFFF' : '#212529',
                            border: selectedCategory !== category ? '1px solid #DEE2E6' : 'none',
                            borderRadius: '16px',
                            padding: '4px 12px',
                            textTransform: 'none',
                            fontSize: '12px',
                            '&:hover': {
                              backgroundColor: selectedCategory === category ? '#0B5ED7' : '#DEE2E6',
                            },
                          }}
                        >
                          {category}
                        </Button>
                      ))}
                    </Box>
                    <List sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {displayedUrls.length === 0 ? (
                        <Typography variant="body2" sx={{ color: '#6C757D' }}>
                          No links in this category.
                        </Typography>
                      ) : (
                        displayedUrls.map((url, index) => (
                          <ListItem
                            key={index}
                            sx={{ width: 'auto', padding: 0 }}
                            button
                            component="a"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E9ECEF',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: '#F8F9FA',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                                  transform: 'translateY(-1px)',
                                  borderColor: '#DEE2E6',
                                },
                              }}
                            >
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${url}`}
                                alt={`${url} favicon`}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  marginRight: '8px',
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ color: '#1976d2', textDecoration: 'none' }}
                              >
                                {new URL(url).hostname}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))
                      )}
                    </List>
                  </Box>
                </Drawer>
              </div>
            )}
            {parsedResult && (
              <div ref={bottomRef} className="response-card-finalResult">
                <div className="response-content" style={{ margin: '0', padding: '1px' }}>
                  <h3>Fact-Checking Results</h3>
                  <p><strong>Claim:</strong> {parsedResult.claim}</p>
                  <p><strong>Verdict:</strong> {parsedResult.verdict}</p>
                  <p><strong>Explanation:</strong> {parsedResult.explanation}</p>
                  <p><strong>Confidence Level:</strong> {Math.round(parsedResult.confidence * 10)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showResults && (
        <div className="input-section bottom-input">
          <TextField
            variant="outlined"
            placeholder="Enter something you want to verify..."
            multiline
            minRows={1}
            maxRows={6}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    className="facts-checker-button"
                    onClick={handleQuerySubmit}
                    disabled={isLoading || !query.trim()}
                  >
                    {isLoading ? <CircularProgress size={24} sx={{ color: '#222831' }} /> : <ArrowUpwardIcon sx={{ color: '#ffffff' }} />}
                  </Button>
                </InputAdornment>
              ),
              className: 'facts-checker-input',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;