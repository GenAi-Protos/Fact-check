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
  ListItemIcon,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Popover,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachmentIcon from '@mui/icons-material/Attachment';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import { IoFlash } from "react-icons/io5";
import { FaDatabase } from "react-icons/fa";
import { RiZoomInFill } from "react-icons/ri";
import { FaChartLine } from "react-icons/fa6";
import { FaBahai } from "react-icons/fa6";
import { MdOutlineSecurity } from "react-icons/md";
import genAIIcon from './assets/genAI_icon.png';
import genAILogo from './assets/genaiLogo.png';
import './App.css';
import EventCard from './components/EventCard';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SecurityIcon from '@mui/icons-material/Security';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Loader from './components/Loader';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import StorageIcon from '@mui/icons-material/Storage';
import BoltIcon from '@mui/icons-material/Bolt';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import InfoIcon from '@mui/icons-material/Info';

function App() {
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [sources, setSources] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [likedEvents, setLikedEvents] = useState(new Set());
  const [eventStatuses, setEventStatuses] = useState({});
  const [rightEventsState, setRightEventsState] = useState([]);
  const [leftEventsState, setLeftEventsState] = useState([]);
  const bottomRef = useRef(null);
  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const queryDisplayRef = useRef(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openTasksDrawer, setOpenTasksDrawer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [xLink, setXLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [genericLink, setGenericLink] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [openPopup, setOpenPopup] = useState(false);
  const [claims, setClaims] = useState([]);
  const [selectedClaims, setSelectedClaims] = useState([]);
  const [openClaimsDialog, setOpenClaimsDialog] = useState(false);
  const [expandedResults, setExpandedResults] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);

  const addCategorizedUrl = (category, url, title = 'Untitled') => {
    setSources((prevSources) => {
      const newSources = { ...prevSources };
      if (!newSources[category]) {
        newSources[category] = [];
      }
      if (!newSources[category].some((item) => item.url === url)) {
        newSources[category].push({ url, title });
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
    'AlJazeera.com',
    'BBC.com',
    'CNN.com',
    'TheGuardian.com',
    'NYTimes.com',
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
          const title = obj.title || obj.page_title || obj.name || 'Untitled';
          addCategorizedUrl(category, url, title);
        }
        if (obj.source_url && typeof obj.source_url === 'string') {
          category = getUrlCategory(obj.source_url);
          const title = obj.title || obj.page_title || obj.name || 'Untitled';
          addCategorizedUrl(category, obj.source_url, title);
        }
        Object.values(obj).forEach((value) => findAndCategorizeUrls(value, category));
      }
    },
    [],
  );

  const renderContent = (content) => {
    if (!content) return 'No content provided';
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        return (
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              overflowX: 'auto',
              fontSize: '14px',
            }}
          >
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      } catch (e) {
        return content;
      }
    }
    if (typeof content === 'object') {
      return (
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            overflowX: 'auto',
            fontSize: '14px',
          }}
        >
          {JSON.stringify(content, null, 2)}
        </pre>
      );
    }
    return String(content);
  };

  const handleExtractClaims = useCallback(async () => {
    if (
      !query.trim() &&
      !xLink.trim() &&
      !facebookLink.trim() &&
      !instagramLink.trim() &&
      !youtubeLink.trim() &&
      !genericLink.trim() &&
      !imageFile &&
      !videoFile
    ) {
      setError('Please provide at least one input to extract claims.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('query', query);
      if (xLink.trim()) formData.append('x_link', xLink);
      if (facebookLink.trim()) formData.append('facebook_link', facebookLink);
      if (instagramLink.trim()) formData.append('instagram_link', instagramLink);
      if (youtubeLink.trim()) formData.append('youtube_link', youtubeLink);
      if (genericLink.trim()) formData.append('generic_link', genericLink);
      if (imageFile) formData.append('image_file', imageFile);
      if (videoFile) formData.append('video_file', videoFile);

      const response = await fetch('http://localhost:8000/fact-check/extract-claims', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.event === 'ClaimsExtracted' && data.claims) {
        setClaims(data.claims);
        setOpenClaimsDialog(true);
      } else {
        throw new Error('Invalid response format from extract-claims API');
      }
    } catch (err) {
      console.error('Extract claims failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [query, xLink, facebookLink, instagramLink, youtubeLink, genericLink, imageFile, videoFile]);

  const handleClaimsSubmit = useCallback(async () => {
    if (selectedClaims.length === 0) {
      setError('Please select at least one claim to verify.');
      return;
    }
    setOpenClaimsDialog(false);
    setIsLoading(true);
    setError(null);
    setShowResults(true);
    setEvents([]);
    setFinalResult(null);
    setParsedResult(null);
    setSources({});

    try {
      const response = await fetch('http://localhost:8000/fact-check/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/x-ndjson',
        },
        body: JSON.stringify({ claims: selectedClaims }),
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          try {
            const eventData = JSON.parse(line);
            setEvents((prevEvents) => [...prevEvents, eventData]);

            if (
              eventData.event === 'RunCompleted' &&
              typeof eventData.content === 'string'
            ) {
              accumulatedFinalContent = eventData.content;
            } else if (
              eventData.event === 'RunResponse' &&
              typeof eventData.content === 'string'
            ) {
              accumulatedFinalContent += eventData.content;
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
                  if (tool.tool_args?.category) {
                    sourceHint = `${sourceHint} (${tool.tool_args.category})`;
                  }
                  if (tool.content) {
                    try {
                      const contentObj =
                        typeof tool.content === 'string' &&
                        (tool.content.startsWith('{') ||
                          tool.content.startsWith('['))
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
        let dataToProcess = null;
        let parseErrorMessage = 'Failed to parse the final result from the stream.';
        let finalErrorForLogging = null;

        try {
          // Attempt 1: Direct parse
          dataToProcess = JSON.parse(accumulatedFinalContent.trim());
        } catch (e1) {
          finalErrorForLogging = e1; // Store initial error
          // Attempt 2: Extract array if direct parse failed.
          // Regex looks for optional leading non-[ text (non-greedy), then captures a [...] block.
          const arrayMatchRegex = /(?:^[^\[]*?)(\[[\s\S]*\])/;
          const match = accumulatedFinalContent.match(arrayMatchRegex);
          
          if (match && match[1]) {
            const jsonArrayString = match[1];
            try {
              const extractedResult = JSON.parse(jsonArrayString);
              if (Array.isArray(extractedResult)) {
                dataToProcess = extractedResult; // Successfully extracted and parsed an array
                finalErrorForLogging = null; // Clear error as we succeeded this path
              } else {
                // Parsed, but not an array. Keep finalErrorForLogging from e1.
              }
            } catch (e2) {
              // Error during extraction parse. e1 is still the primary failure.
              console.warn('Secondary parse attempt (extraction) also failed:', e2);
              // finalErrorForLogging remains e1.
            }
          }
          // If dataToProcess is still null here, all attempts failed or yielded unsuitable results.
        }

        if (dataToProcess !== null) {
          setFinalResult(dataToProcess); // Use the successfully parsed data

          let normalizedResult;
          if (Array.isArray(dataToProcess)) {
            normalizedResult = dataToProcess;
          } else if (dataToProcess.findings || dataToProcess.source_links) {
            normalizedResult = {
              claim: selectedClaims.join(', '),
              verdict: 'Unknown',
              explanation: JSON.stringify(dataToProcess, null, 2),
              confidence: 0,
            };
          } else if (dataToProcess.claim && dataToProcess.verdict) {
            normalizedResult = dataToProcess; // It's a single claim object
          } else {
            // Fallback for unknown object structure
            normalizedResult = {
              claim: selectedClaims.join(', '),
              verdict: 'Unknown',
              explanation: JSON.stringify(dataToProcess, null, 2),
              confidence: 0,
            };
          }
          setParsedResult(normalizedResult);

          // Handle citations and source_links from dataToProcess
          if (dataToProcess.citations && Array.isArray(dataToProcess.citations)) {
            dataToProcess.citations.forEach((url) => {
              if (typeof url === 'string') {
                const category = getUrlCategory(url);
                addCategorizedUrl(category, url);
              }
            });
          }
          if (dataToProcess.source_links) {
            Object.entries(dataToProcess.source_links).forEach(([platform, links]) => {
              const urls = Array.isArray(links) ? links : [links];
              urls.forEach((url) => {
                if (typeof url === 'string') {
                  const category = getUrlCategory(url);
                  addCategorizedUrl(category, url, `${platform} Link`);
                }
              });
            });
          }
        } else {
          // All parsing attempts failed
          console.error(
            'Error parsing final accumulated content:',
            finalErrorForLogging, 
            'Content:',
            accumulatedFinalContent
          );
          setError(parseErrorMessage);
          setParsedResult({
            claim: selectedClaims.join(', '),
            verdict: 'Unknown',
            explanation: accumulatedFinalContent, // Show raw content as explanation
            confidence: 0,
          });
          findAndCategorizeUrls(
            accumulatedFinalContent,
            'Final Content (Unparsed)'
          );
        }
      } else {
        console.warn('No accumulated final content received from the stream.');
        setParsedResult({
          claim: selectedClaims.join(', '),
          verdict: 'Unknown',
          explanation: 'No results received from the server.',
          confidence: 0,
        });
      }
    } catch (err) {
      console.error('API call failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setParsedResult({
        claim: selectedClaims.join(', '),
        verdict: 'Unknown',
        explanation: 'An error occurred while fetching results.',
        confidence: 0,
      });
    } finally {
      setIsLoading(false);
      setSearchedQuery(selectedClaims.join(', '));
      setQuery('');
      setXLink('');
      setFacebookLink('');
      setInstagramLink('');
      setYoutubeLink('');
      setGenericLink('');
      setImageFile(null);
      setVideoFile(null);
      setOpenClaimsDialog(false);
      setClaims([]);
      setSelectedClaims([]);
    }
  }, [selectedClaims, findAndCategorizeUrls, getUrlCategory, addCategorizedUrl]);

  const handleQuerySubmit = useCallback(() => {
    handleExtractClaims();
  }, [handleExtractClaims]);

  const handleClaimSelection = (claim) => {
    setSelectedClaims((prev) =>
      prev.includes(claim)
        ? prev.filter((c) => c !== claim)
        : [...prev, claim]
    );
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

  useEffect(() => {
    const latestEvents =
      events.length > 0
        ? [events[events.length - 1]].filter(
            (eventData) =>
              eventData.reasoning_content ||
              (eventData.tools && eventData.tools.length > 0)
          )
        : [];
    setRightEventsState(latestEvents);

    const filteredLeftEvents = events
      .map((eventData, index) => ({ eventData, index }))
      .filter(({ eventData }) => {
        const displayName = getDisplayEventName(eventData);
        return displayName !== null;
      });
    setLeftEventsState(filteredLeftEvents);
  }, [events]);

  useEffect(() => {
    if (leftColumnRef.current) {
      leftColumnRef.current.scrollTop = leftColumnRef.current.scrollHeight;
    }
  }, [events]);

  useEffect(() => {
    if (parsedResult && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [parsedResult]);

  useEffect(() => {
    if (showResults && (query || searchedQuery) && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showResults, query, searchedQuery]);

  const handleBrowseWeb = () => {
    if (isBrowsing || !finalResult) return;

    setIsBrowsing(true);
    setTimeout(() => {
      setFinalResult((prev) => ({
        ...prev,
        explanation: `${prev.explanation || ''}\n- I'm doing another web search with "${query}" to ensure I haven't missed anything.`,
      }));
      setParsedResult((prev) => ({
        ...prev,
        explanation: `${prev.explanation || ''}\n- I'm doing another web search with "${query}" to ensure I haven't missed anything.`,
      }));
      setIsBrowsing(false);
    }, 2000);
  };

  const totalLinks = Object.values(sources).reduce(
    (sum, items) => sum + items.length,
    0
  );
  const allUrls = Object.values(sources).flatMap((items) => items);
  const faviconUrls = allUrls.slice(0, 3).map((item) => item.url);
  const displayedUrls = selectedCategory
    ? sources[selectedCategory] || []
    : allUrls;

  const anyInputActive =
    xLink.trim() ||
    facebookLink.trim() ||
    instagramLink.trim() ||
    youtubeLink.trim() ||
    genericLink.trim() ||
    imageFile ||
    videoFile;

  const toggleDetails = (id) => {
    setExpandedResults(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getConfidenceColor = (confidence) => {
    const score = confidence ? Math.round(confidence * 100) : 0;
    if (score >= 90) return '#4CAF50';
    return '#F44336';
  };

  const getVerdictButtonColor = (verdict) => {
    if (verdict === 'True') return '#673AB7';
    if (verdict === 'False') return '#DB7093';
    return '#FF9800';
  };

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const openPopover = Boolean(anchorEl);

  return (
    <div className="app-container">
      <Box className="header-section deep-research-container">
        <Typography variant="h3" className="header-title">
          Fact Check
        </Typography>
        <Typography variant="subtitle1" className="header-subtitle">
          Advanced fact-checking system powered by AI. Verify claims, analyze sources, and
          get detailed insights with confidence scores.
        </Typography>
        <Box className="header-features">
          <Box className="feature-chip" style={{ paddingLeft: '0' }}>
            <FaBahai className="feature-chip-icon" />
            <Typography className='feature-chip-text'>AI-Powered</Typography>
          </Box>
          <Box className="feature-chip">
            <MdOutlineSecurity className="feature-chip-icon" />
            <Typography className='feature-chip-text'>Reliable Sources</Typography>
          </Box>
          <Box className="feature-chip">
            <FaChartLine className="feature-chip-icon" />
            <Typography className='feature-chip-text'>Real-time Analysis</Typography>
          </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
            <Typography className='feature-chip-text' sx={{ mr: 1 }}>
            powered by
            </Typography>
            <img src={genAIIcon} alt="GenAI Icon" style={{ height: '16px', marginRight: '8px' }} />
            <img src={genAILogo} alt="GenAI Logo" style={{ height: '12px' }} />
          </Box>
      </Box>

      {!showResults && (
        <div className="facts-checker-container">
          <div className="facts-checker-content">
            {isLoading ? (
              <Loader />
            ) : (
              <div className="landing-page">
                <Box className="feature-cards">
                  <Card className="feature-card">
                    <CardContent>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div className='feature-card-icon-container'>
                          <RiZoomInFill className='feature-card-icon' />
                        </div>
                        <Typography variant="h6">Deeper Search</Typography>
                      </div>
                      <Typography variant="body2" style={{ color: '#000' }}>
                        Advanced algorithms analyze multiple layers of information to uncover hidden insights.
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card className="feature-card">
                    <CardContent>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div className='feature-card-icon-container' style={{ background: '#F1E7FB' }}>
                          <FaDatabase className='feature-card-icon' style={{ color: '#8539E0' }} />
                        </div>
                        <Typography variant="h6">Comprehensive Data</Typography>
                      </div>
                      <Typography variant="body2" style={{ color: '#000' }}>
                        Access extensive databases and verified sources for thorough research analysis.
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card className="feature-card">
                    <CardContent>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div className='feature-card-icon-container'>
                          <IoFlash className='feature-card-icon' />
                        </div>
                        <Typography variant="h6">Real-time Processing</Typography>
                      </div>
                      <Typography variant="body2" style={{ color: '#000' }}>
                        Get instant results with our high-performance processing system.
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </div>
            )}
            <div className="landing-page">
              <Box className="search-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <Typography variant="h6" className="search-label">
                    RESEARCH QUERY
                  </Typography>
                  <Box sx={{ display: 'flex', gap: '8px' }}>
                    {totalLinks > 0 && (
                      <Button
                        onClick={() => setOpenDrawer(true)}
                        sx={{
                          color: '#495057',
                          textTransform: 'none',
                          fontSize: '14px',
                          '&:hover': {
                            backgroundColor: '#F8F9FA',
                          },
                        }}
                        startIcon={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
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
                        {totalLinks} web sources
                      </Button>
                    )}
                    {leftEventsState.length > 0 && (
                      <Button
                        onClick={() => setOpenTasksDrawer(true)}
                        sx={{
                          color: '#495057',
                          textTransform: 'none',
                          fontSize: '14px',
                          '&:hover': {
                            backgroundColor: '#F8F9FA',
                          },
                        }}
                        startIcon={<AssignmentIcon />}
                      >
                        Tasks
                      </Button>
                    )}
                  </Box>
                </div>
                <TextField
                  variant="outlined"
                  placeholder="Enter your research query or paste content to analyze..."
                  multiline
                  minRows={1}
                  maxRows={6}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="search-input"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Button
                            variant="contained"
                            className="submit-button"
                            onClick={handleQuerySubmit}
                            disabled={isLoading || query === ''}
                          >
                            <ArrowUpwardIcon />
                          </Button>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: '100%',
                    marginBottom: '20px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '5px',
                    },
                    '& textarea': {
                      color: '#212529 !important',
                      padding: '5px 0',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      resize: 'none',
                      lineHeight: '1.5',
                      fontSize: '1.1rem',
                      '&::placeholder': {
                        color: '#6c757d !important',
                        opacity: 1,
                      },
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f8f9fa',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#ced4da',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: '#adb5bd',
                      },
                    },
                  }}
                />
                <Box className="social-buttons">
                  <Button
                    variant="outlined"
                    startIcon={<TwitterIcon />}
                    className={`social-button ${xLink.trim() ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    X (Twitter)
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<InstagramIcon />}
                    className={`social-button ${instagramLink.trim() ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    Instagram
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FacebookIcon />}
                    className={`social-button ${facebookLink.trim() ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    Facebook
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<YouTubeIcon />}
                    className={`social-button ${youtubeLink.trim() ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    YouTube
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    className={`social-button ${genericLink.trim() ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    URL
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ImageIcon />}
                    className={`social-button ${imageFile ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    Image
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<VideocamIcon />}
                    className={`social-button ${videoFile ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    Video
                  </Button>
                </Box>
              </Box>
            </div>
          </div>
        </div>
      )}
      <Dialog
        open={openPopup}
        onClose={() => setOpenPopup(false)}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { backgroundColor: '#FFFFFF', color: '#212529', p: 2 } }}
      >
        <DialogTitle>
          Additional Verification Inputs
          <IconButton
            onClick={() => setOpenPopup(false)}
            sx={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              color: '#6C757D',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              variant="outlined"
              placeholder="Enter X link..."
              value={xLink}
              onChange={(e) => setXLink(e.target.value)}
              fullWidth
            />
            <TextField
              variant="outlined"
              placeholder="Enter Facebook link..."
              value={facebookLink}
              onChange={(e) => setFacebookLink(e.target.value)}
              fullWidth
            />
            <TextField
              variant="outlined"
              placeholder="Enter Instagram link..."
              value={instagramLink}
              onChange={(e) => setInstagramLink(e.target.value)}
              fullWidth
            />
            <TextField
              variant="outlined"
              placeholder="Enter YouTube link..."
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              fullWidth
            />
            <TextField
              variant="outlined"
              placeholder="Enter any other link..."
              value={genericLink}
              onChange={(e) => setGenericLink(e.target.value)}
              fullWidth
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Upload Image
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ display: 'block' }}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Upload Video
              </Typography>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0])}
                style={{ display: 'block' }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenPopup(false)}
            sx={{ color: '#6C757D', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setOpenPopup(false)}
            variant="contained"
            sx={{ backgroundColor: '#0D6EFD', color: '#FFFFFF', textTransform: 'none' }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openClaimsDialog}
        onClose={() => setOpenClaimsDialog(false)}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { backgroundColor: '#FFFFFF', color: '#212529', p: 2 } }}
      >
        <DialogTitle>
          Select Claims to Verify
          <IconButton
            onClick={() => setOpenClaimsDialog(false)}
            sx={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              color: '#6C757D',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            {claims.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#6C757D' }}>
                No claims extracted.
              </Typography>
            ) : (
              claims.map((claim, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={selectedClaims.includes(claim)}
                      onChange={() => handleClaimSelection(claim)}
                      sx={{ color: '#0D6EFD', '&.Mui-checked': { color: '#0D6EFD' } }}
                    />
                  }
                  label={claim}
                  sx={{ alignItems: 'flex-start', '& .MuiFormControlLabel-label': { mt: 1 } }}
                />
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenClaimsDialog(false)}
            sx={{ color: '#6C757D', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClaimsSubmit}
            variant="contained"
            disabled={selectedClaims.length === 0 || isLoading}
            sx={{ backgroundColor: '#0D6EFD', color: '#FFFFFF', textTransform: 'none' }}
          >
            Verify Selected Claims
          </Button>
        </DialogActions>
      </Dialog>
      {showResults && (
        <div className="facts-checker-container">
          <div className="facts-checker-content">
            <div className="results-wrapper">
              {error && (
                <Alert
                  severity="error"
                  sx={{ mt: 2, mb: 2 }}
                  variant="outlined"
                  style={{ position: 'absolute', top: 0 }}
                >
                  <AlertTitle>Error</AlertTitle>
                  {error}
                </Alert>
              )}
              <div className="resultContainer">
                <Card
                  ref={queryDisplayRef}
                  sx={{
                    mb: 2,
                    p: 1,
                    width: 'fit-content',
                    ml: 'auto',
                    mr: 0,
                    maxWidth: '90%',
                    mt: 2,
                    background: 'linear-gradient(to right, #EEF2FF, #F3E8FF)',
                    border: 'none',
                    boxShadow: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={handlePopoverOpen}
                  onMouseLeave={handlePopoverClose}
                  aria-owns={openPopover ? 'mouse-over-popover' : undefined}
                  aria-haspopup="true"
                >
                  <Typography
                    variant="h6"
                    className="searched-query"
                    sx={{
                      fontSize: '1.1rem',
                      color: '#212529',
                      textAlign: 'right',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      fontWeight: '500'
                    }}
                  >
                    {(query || searchedQuery).length > 200
                      ? `${(query || searchedQuery).substring(0, 200)}...`
                      : (query || searchedQuery)}
                  </Typography>
                </Card>
                <Popover
                  id="mouse-over-popover"
                  sx={{
                    pointerEvents: 'none',
                    '& .MuiPopover-paper': {
                      background: 'linear-gradient(to right, #EEF2FF, #F3E8FF)',
                      border: 'none',
                      boxShadow: 'none',
                      maxWidth: '60%'
                    }
                  }}
                  open={openPopover}
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  onClose={handlePopoverClose}
                  disableRestoreFocus
                  aria-owns={openPopover ? 'mouse-over-popover' : undefined}
                  aria-haspopup="true"
                >
                  <Typography sx={{ p: 2 }}>{query || searchedQuery}</Typography>
                </Popover>
                <div className="results-container">
                  {isLoading &&
                  leftEventsState.length === 0 &&
                  rightEventsState.length === 0 ? (
                    <Loader />
                  ) : (
                    <>
                      <div className="left-column" ref={leftColumnRef}>
                        <h3 className="section-title">Fact Check</h3>
                        <List
                          sx={{
                            color: '#212529',
                            borderRadius: '8px',
                            padding: '8px',
                          }}
                        >
                          {leftEventsState.length === 0 && !isLoading ? (
                            <ListItem>
                              <ListItemText primary="No events available" />
                            </ListItem>
                          ) : (
                            leftEventsState.map(({ eventData, index }) => (
                              <ListItem
                                key={index}
                                sx={{
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  padding: '20px',
                                  paddingLeft: '0',
                                }}
                              >
                                <CheckCircleIcon
                                  sx={{ color: '#67AE6E', mr: 2 }}
                                  fontSize="medium"
                                />
                                <Typography variant="body1">
                                  {getDisplayEventName(eventData)}
                                </Typography>
                              </ListItem>
                            ))
                          )}
                          {isLoading && (
                            <ListItem
                              sx={{
                                justifyContent: 'flex-start',
                                padding: '8px',
                                paddingLeft: '0',
                              }}
                            >
                              <CircularProgress
                                size={24}
                                sx={{ color: '#222831' }}
                              />
                            </ListItem>
                          )}
                        </List>
                      </div>
                      <div className="right-column" ref={rightColumnRef}>
                        {rightEventsState.length === 0 && isLoading && (
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: '100%',
                            }}
                          >
                            <CircularProgress
                              size={40}
                              sx={{ color: '#222831' }}
                            />
                          </Box>
                        )}
                        {rightEventsState.map((eventData, index) => (
                          <div key={index} className="event-card-wrapper">
                            <EventCard eventData={eventData} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="response-card sources-card">
                  <Drawer
                    anchor="right"
                    open={openDrawer}
                    onClose={() => {
                      setOpenDrawer(false);
                      setSelectedCategory(null);
                    }}
                    sx={{
                      '& .MuiDrawer-paper': {
                        width: 600,
                        backgroundColor: '#FFFFFF',
                        color: '#212529',
                        padding: 2,
                        borderLeft: '1px solid #DEE2E6',
                      },
                    }}
                  >
                    <Box sx={{ padding: 2, position: 'relative' }}>
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
                      <Typography variant="h6" sx={{ marginBottom: 2, color: '#212529' }}>
                        Source Links
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 2 }}>
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
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {displayedUrls.length === 0 ? (
                          <Typography variant="body2" sx={{ color: '#6C757D' }}>
                            No links in this category.
                          </Typography>
                        ) : (
                          displayedUrls.map(({ url }, index) => (
                            <Card
                              key={index}
                              sx={{
                                width: '100%',
                                maxWidth: 260,
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E9ECEF',
                                borderRadius: '8px',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: '#F8F9FA',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                                  transform: 'translateY(-1px)',
                                  borderColor: '#DEE2E6',
                                },
                              }}
                              component="a"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ textDecoration: 'none' }}
                            >
                              <CardContent sx={{ padding: '8px' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                                    sx={{ color: '#1976d2', fontWeight: 'medium' }}
                                  >
                                    {new URL(url).hostname}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </Box>
                    </Box>
                  </Drawer>
                  <Drawer
                    anchor="right"
                    open={openTasksDrawer}
                    onClose={() => setOpenTasksDrawer(false)}
                    sx={{
                      '& .MuiDrawer-paper': {
                        width: 900,
                        backgroundColor: '#FFFFFF',
                        color: '#212529',
                        padding: 2,
                        borderLeft: '1px solid #DEE2E6',
                      },
                    }}
                  >
                    <Box sx={{ padding: 2, position: 'relative' }}>
                      <IconButton
                        onClick={() => setOpenTasksDrawer(false)}
                        sx={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          color: '#6C757D',
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                      <Typography variant="h6" sx={{ marginBottom: 2, color: '#212529' }}>
                        All Tasks
                      </Typography>
                      <Box sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        {events.length === 0 ? (
                          <Typography variant="body2" sx={{ color: '#6C757D' }}>
                            No tasks available.
                          </Typography>
                        ) : (
                          events
                            .filter(
                              (eventData) =>
                                eventData.reasoning_content ||
                                (eventData.tools && eventData.tools.length > 0)
                            )
                            .map((eventData, index) => (
                              <EventCard key={index} eventData={eventData} />
                            ))
                        )}
                      </Box>
                    </Box>
                  </Drawer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showResults && (
        <div className="facts-checker-container">
          <div className="facts-checker-content">
            <div className="input-section bottom-input" ref={bottomRef}>
              <Box className="search-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <Typography variant="h6" className="search-label">
                    RESEARCH QUERY
                  </Typography>
                  <Box sx={{ display: 'flex', gap: '8px' }}>
                    {totalLinks > 0 && (
                      <Button
                        onClick={() => setOpenDrawer(true)}
                        sx={{
                          color: '#495057',
                          textTransform: 'none',
                          fontSize: '14px',
                          '&:hover': {
                            backgroundColor: '#F8F9FA',
                          },
                        }}
                        startIcon={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1px',
                            }}
                          >
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
                        {totalLinks} web sources
                      </Button>
                    )}
                    {leftEventsState.length > 0 && (
                      <Button
                        onClick={() => setOpenTasksDrawer(true)}
                        sx={{
                          color: '#495057',
                          textTransform: 'none',
                          fontSize: '14px',
                          '&:hover': {
                            backgroundColor: '#F8F9FA',
                          },
                        }}
                        startIcon={<AssignmentIcon />}
                      >
                        Tasks
                      </Button>
                    )}
                  </Box>
                </div>
                <TextField
                  variant="outlined"
                  placeholder="Enter your research query or paste content to analyze..."
                  multiline
                  minRows={1}
                  maxRows={6}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="search-input"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5' }}>
                          <Button
                            variant="contained"
                            className="submit-button"
                            onClick={handleQuerySubmit}
                            disabled={isLoading || query === ''}
                          >
                            <ArrowUpwardIcon />
                          </Button>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: '100%',
                    marginBottom: '20px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '5px',
                    },
                    '& textarea': {
                      color: '#212529 !important',
                      padding: '5px 0',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      resize: 'none',
                      lineHeight: '1.5',
                      fontSize: '1.1rem',
                      '&::placeholder': {
                        color: '#6c757d !important',
                        opacity: 1,
                      },
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f8f9fa',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#ced4da',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: '#adb5bd',
                      },
                    },
                  }}
                />
                <Box className="social-buttons">
                  <Button
                    variant="outlined"
                    startIcon={<TwitterIcon />}
                    className={`social-button ${xLink.trim() ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    X (Twitter)
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<InstagramIcon />}
                    className={`social-button ${instagramLink.trim() ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    Instagram
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FacebookIcon />}
                    className={`social-button ${facebookLink.trim() ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    Facebook
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<YouTubeIcon />}
                    className={`social-button ${youtubeLink.trim() ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    YouTube
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    className={`social-button ${genericLink.trim() ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    URL
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ImageIcon />}
                    className={`social-button ${imageFile ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    Image
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<VideocamIcon />}
                    className={`social-button ${videoFile ? 'social-button-active' : ''}`}
                    onClick={() => setOpenPopup(true)}
                  >
                    Video
                  </Button>
                </Box>
              </Box>
            </div>
          </div>
        </div>
      )}
      {parsedResult && (
        <Box className="result-cards" sx={{ padding: '16px 0' }}>
          {Array.isArray(parsedResult) ? (
            // Slice the array into chunks of 2 cards per row
            [...Array(Math.ceil(parsedResult.length / 2))].map((_, rowIndex) => {
              const startIndex = rowIndex * 2;
              const rowItems = parsedResult.slice(startIndex, startIndex + 2);
              return (
                <Box key={`row-${rowIndex}`} className="result-row">
                  {rowItems.map((item, index) => {
                    const resultId = `item-${startIndex + index}`;
                    const confidenceColor = getConfidenceColor(item.confidence);
                    const verdictButtonColor = getVerdictButtonColor(item.verdict);
                    const isSingleCard = rowItems.length === 1;
                    return (
                      <Card
                        key={resultId}
                        className="feature-card"
                        sx={{
                          position: 'relative',
                          padding: '16px',
                          width: isSingleCard ? '100%' : 'calc(50% - 8px)',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          backgroundColor: '#fff',
                          '@media (max-width: 600px)': {
                            width: '100%',
                          },
                        }}
                      >
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            backgroundColor: verdictButtonColor,
                            color: 'white',
                            textTransform: 'none',
                            borderRadius: '16px',
                            padding: '2px 10px',
                            fontSize: '0.8rem',
                            minWidth: 'auto',
                            boxShadow: 'none',
                            '&:hover': {
                              backgroundColor: verdictButtonColor,
                              opacity: 0.9,
                            },
                          }}
                        >
                          {renderContent(item.verdict)}
                        </Button>
                        <CardContent sx={{ paddingTop: '40px' }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 'bold',
                              marginBottom: '16px',
                              color: '#000',
                              lineHeight: '1.6',
                            }}
                          >
                            {renderContent(item.claim)}
                          </Typography>
                          <Box className="confidence-details-row">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ position: 'relative', display: 'inline-flex', marginRight: '10px' }}>
                                <CircularProgress
                                  variant="determinate"
                                  value={item.confidence ? Math.round(item.confidence * 100) : 0}
                                  size={40}
                                  thickness={4}
                                  sx={{ color: confidenceColor }}
                                />
                                <Box
                                  sx={{
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 0,
                                    position: 'absolute',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    component="div"
                                    sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: confidenceColor }}
                                  >
                                    {item.confidence ? `${Math.round(item.confidence * 100)}%` : 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#000', fontSize: '0.9rem' }}>
                                Confidence Score
                              </Typography>
                            </Box>
                            <Button
                              endIcon={expandedResults[resultId] ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                              sx={{ textTransform: 'none', color: '#673AB7', fontSize: '0.9rem' }}
                              onClick={() => toggleDetails(resultId)}
                            >
                              {expandedResults[resultId] ? 'Hide Details' : 'View Details'}
                            </Button>
                          </Box>
                          {expandedResults[resultId] && (
                            <Box sx={{ marginTop: '20px' }}>
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 'bold', color: '#000', marginBottom: '4px' }}
                              >
                                Explanation:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: '#000', marginBottom: '16px', lineHeight: '1.6' }}
                              >
                                {renderContent(item.explanation)}
                              </Typography>
                              <Box
                                sx={{
                                  backgroundColor: '#F3F0FF',
                                  padding: '12px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <InfoIcon sx={{ color: '#673AB7', marginRight: '10px', marginTop: '3px' }} />
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 'bold', color: '#673AB7', marginBottom: '4px' }}
                                  >
                                    Our verification process
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#555', lineHeight: '1.5' }}>
                                    This fact check was performed using our AI system trained on verified data
                                    sources, cross-referenced with expert knowledge and trusted publications.
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              );
            })
          ) : (
            // Single card case
            (() => {
              const resultId = 'single-main';
              const confidenceColor = getConfidenceColor(parsedResult.confidence);
              const verdictButtonColor = getVerdictButtonColor(parsedResult.verdict);
              return (
                <Box className="result-row">
                  <Card
                    className="feature-card"
                    sx={{
                      position: 'relative',
                      padding: '16px',
                      width: '100%',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        backgroundColor: verdictButtonColor,
                        color: 'white',
                        textTransform: 'none',
                        borderRadius: '16px',
                        padding: '2px 10px',
                        fontSize: '0.8rem',
                        minWidth: 'auto',
                        boxShadow: 'none',
                        '&:hover': { backgroundColor: verdictButtonColor, opacity: 0.9 },
                      }}
                    >
                      {renderContent(parsedResult.verdict)}
                    </Button>
                    <CardContent sx={{ paddingTop: '40px' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 'bold',
                          marginBottom: '16px',
                          color: '#000',
                          lineHeight: '1.6',
                        }}
                      >
                        {renderContent(parsedResult.claim)}
                      </Typography>
                      <Box className="confidence-details-row">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ position: 'relative', display: 'inline-flex', marginRight: '10px' }}>
                            <CircularProgress
                              variant="determinate"
                              value={parsedResult.confidence ? Math.round(parsedResult.confidence * 100) : 0}
                              size={40}
                              thickness={4}
                              sx={{ color: confidenceColor }}
                            />
                            <Box
                              sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography
                                variant="caption"
                                component="div"
                                sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: confidenceColor }}
                              >
                                {parsedResult.confidence ? `${Math.round(parsedResult.confidence * 100)}%` : 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#000', fontSize: '0.9rem' }}>
                            Confidence Score
                          </Typography>
                        </Box>
                        <Button
                          endIcon={expandedResults[resultId] ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                          sx={{ textTransform: 'none', color: '#673AB7', fontSize: '0.9rem' }}
                          onClick={() => toggleDetails(resultId)}
                        >
                          {expandedResults[resultId] ? 'Hide Details' : 'View Details'}
                        </Button>
                      </Box>
                      {expandedResults[resultId] && (
                        <Box sx={{ marginTop: '20px' }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 'bold', color: '#000', marginBottom: '4px' }}
                          >
                            Explanation:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: '#000', marginBottom: '16px', lineHeight: '1.6' }}
                          >
                            {renderContent(parsedResult.explanation)}
                          </Typography>
                          <Box
                            sx={{
                              backgroundColor: '#F3F0FF',
                              padding: '12px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'flex-start',
                            }}
                          >
                            <InfoIcon sx={{ color: '#673AB7', marginRight: '10px', marginTop: '3px' }} />
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 'bold', color: '#673AB7', marginBottom: '4px' }}
                              >
                                Our verification process
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#555', lineHeight: '1.5' }}>
                                This fact check was performed using our AI system trained on verified data
                                sources, cross-referenced with expert knowledge and trusted publications.
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              );
            })()
          )}
        </Box>
      )}
    </div>
  );
}

export default App;