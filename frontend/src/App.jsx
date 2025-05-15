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
  useMediaQuery,
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
import Sidebar from './components/Sidebar';
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
import MenuIcon from '@mui/icons-material/Menu'; // Added

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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [sidebarContent, setSidebarContent] = useState('tasks'); // New state for sidebar content
  const [searchHistory, setSearchHistory] = useState(); // Added search history state
  const [mobileOpen, setMobileOpen] = useState(false); // Added for mobile sidebar

  const isMobile = useMediaQuery('(max-width:768px)'); // Added for responsive sidebar

  const handleDrawerToggle = () => { // Added for mobile sidebar
    setMobileOpen(!mobileOpen);
  };

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

  // Helper function to extract potential title for a URL from surrounding text
  const extractTitleForUrl = useCallback((url, fullText) => {
    // Try to find markdown-style links: [Title](url)
    const markdownRegex = new RegExp(`\\[(.*?)\\]\\(${escapeRegExp(url)}\\)`, 'i');
    const markdownMatch = fullText.match(markdownRegex);
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1].trim();
    }
    
    // Try to find HTML-style links: <a href="url">Title</a>
    const htmlRegex = new RegExp(`<a[^>]*href=["']${escapeRegExp(url)}["'][^>]*>(.*?)<\\/a>`, 'i');
    const htmlMatch = fullText.match(htmlRegex);
    if (htmlMatch && htmlMatch[1]) {
      return htmlMatch[1].trim();
    }
    
    // Try to find "title: url" patterns
    const titlePrefixRegex = new RegExp(`([^\\n:]+):\\s*${escapeRegExp(url)}`, 'i');
    const titlePrefixMatch = fullText.match(titlePrefixRegex);
    if (titlePrefixMatch && titlePrefixMatch[1]) {
      return titlePrefixMatch[1].trim();
    }
    
    // Try to extract title from quotes surrounding the URL
    const surroundingTextRegex = new RegExp(`["'"](.*?)["'"][^"'"]*${escapeRegExp(url)}`, 'i');
    const surroundingMatch = fullText.match(surroundingTextRegex);
    if (surroundingMatch && surroundingMatch[1]) {
      return surroundingMatch[1].trim();
    }
    
    return null;
  }, []);
  
  // Helper to escape special characters in strings for using in RegExp
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
            
            // Try to extract a title from the surrounding context
            const title = extractTitleForUrl(url, obj) || 
                         // Extract title from URL if it's a reference to an article or source
                         (url.includes('article') || url.includes('story') || url.includes('publication')) ? 
                            url.split('/').pop()?.replace(/-|_/g, ' ')?.replace(/\.\w+$/, '') : null;
            
            // If we found a title, use it; otherwise default to the URL domain
            if (title) {
              addCategorizedUrl(category, url, title);
            } else {
              try {
                const urlObj = new URL(url);
                const domainParts = urlObj.hostname.split('.');
                let siteName = domainParts[domainParts.length - 2] || urlObj.hostname;
                siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
                
                // Extract path for additional context if available
                const pathParts = urlObj.pathname.split('/').filter(p => p);
                let contextFromPath = '';
                if (pathParts.length > 0) {
                  const lastPath = pathParts[pathParts.length - 1]
                    .replace(/-|_/g, ' ')
                    .replace(/\.\w+$/, '');
                  
                  if (lastPath.length > 3) {
                    contextFromPath = `: ${lastPath.charAt(0).toUpperCase() + lastPath.slice(1)}`;
                  }
                }
                
                addCategorizedUrl(category, url, `${siteName}${contextFromPath}`);
              } catch {
                // Fallback to just adding the URL without title
                addCategorizedUrl(category, url);
              }
            }
          });
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item) => findAndCategorizeUrls(item, sourceHint));
      } else if (typeof obj === 'object') {
        let category = sourceHint;
        if (obj.url && typeof obj.url === 'string') {
          category = getUrlCategory(obj.url);
          const title = obj.title || obj.page_title || obj.name || 'Untitled';
          addCategorizedUrl(category, obj.url, title);
        }
        if (obj.source_url && typeof obj.source_url === 'string') {
          category = getUrlCategory(obj.source_url);
          const title = obj.title || obj.page_title || obj.name || 'Untitled';
          addCategorizedUrl(category, obj.source_url, title);
        }
        Object.values(obj).forEach((value) => findAndCategorizeUrls(value, category));
      }
    },
    [extractTitleForUrl],
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
      setSearchHistory(query);
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
          dataToProcess = JSON.parse(accumulatedFinalContent.trim());
        } catch (e1) {
          finalErrorForLogging = e1;
          const arrayMatchRegex = /(?:^[^\[]*?)(\[[\s\S]*\])/;
          const match = accumulatedFinalContent.match(arrayMatchRegex);
          
          if (match && match[1]) {
            const jsonArrayString = match[1];
            try {
              const extractedResult = JSON.parse(jsonArrayString);
              if (Array.isArray(extractedResult)) {
                dataToProcess = extractedResult;
                finalErrorForLogging = null;
              }
            } catch (e2) {
              console.warn('Secondary parse attempt (extraction) also failed:', e2);
            }
          }
        }

        if (dataToProcess !== null) {
          setFinalResult(dataToProcess);

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
            normalizedResult = dataToProcess;
          } else {
            normalizedResult = {
              claim: selectedClaims.join(', '),
              verdict: 'Unknown',
              explanation: JSON.stringify(dataToProcess, null, 2),
              confidence: 0,
            };
          }
          setParsedResult(normalizedResult);

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
            explanation: accumulatedFinalContent,
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
    return null;
  };

  const handleEventClick = (eventData) => {
    setSelectedEvent(eventData);
    setOpenEventDialog(true);
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

  const handleNewClaimReset = useCallback(() => {
    // Reset query and input related states
    setQuery('');
    setXLink('');
    setFacebookLink('');
    setInstagramLink('');
    setYoutubeLink('');
    setGenericLink('');
    setImageFile(null);
    setVideoFile(null);
    setSearchHistory('');

    // Reset results and display states
    setSearchedQuery('');
    setEvents([]);
    setFinalResult(null);
    setParsedResult(null);
    setSources({});
    setClaims([]);
    setSelectedClaims([]);
    setExpandedResults({});
    setSelectedEvent(null);

    // Reset UI control states
    setShowResults(false); // This will hide the results section and show the landing page
    setIsLoading(false);   // Ensure loading is off
    setError(null);
    setIsBrowsing(false);
    setOpenPopup(false);      // Close the additional inputs dialog
    setOpenClaimsDialog(false); // Close claims dialog
    setOpenEventDialog(false);  // Close event details dialog

    // Reset column/sidebar states
    setRightEventsState([]);
    setLeftEventsState([]);
    setSidebarContent('tasks'); // Reset to default sidebar view
    setSelectedCategory(null);  // Reset source category filter

    // Reset other potentially lingering states
    setLikedEvents(new Set());
    setEventStatuses({});

    // Optional: Scroll to top if needed, though changing view should handle this
    // window.scrollTo(0, 0);
  }, [ // Dependency array includes all setters for stability, though often optional for useState setters
    setQuery, setXLink, setFacebookLink, setInstagramLink, setYoutubeLink, setGenericLink,
    setImageFile, setVideoFile, setSearchedQuery, setEvents, setFinalResult, setParsedResult,
    setSources, setClaims, setSelectedClaims, setExpandedResults, setSelectedEvent,
    setShowResults, setIsLoading, setError, setIsBrowsing, setOpenPopup, setOpenClaimsDialog,
    setOpenEventDialog, setRightEventsState, setLeftEventsState, setSidebarContent,
    setSelectedCategory, setLikedEvents, setEventStatuses
  ]);

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
    if (verdict === 'True') return '#4C46DA';
    if (verdict === 'False') return '#E95A7C';
    return '#FF9800';
  };

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const openPopover = Boolean(anchorEl);

  const drawerWidth = 250; // Define drawer width for consistency

  return (
    <div className="app-container" style={{ display: 'flex' }}>
      {isMobile ? (
        <>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: 'none' },
              position: 'absolute', // Reverted from 'fixed'
              top: 15,
              left: 15,
              zIndex: 1301, 
            }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            <Sidebar searchHistory={searchHistory} />
          </Drawer>
        </>
      ) : (
        <Sidebar searchHistory={searchHistory} />
      )}
      {showResults && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            className="newClaim-button"
            onClick={handleNewClaimReset}
            disabled={isLoading}
          >
            New Claim
          </Button>
        </div>
      )}
      <Box className="main-content">
        {!showResults && (
          <div className="facts-checker-container">
            <div className="facts-checker-content">
              {isLoading ? (
                <div className='landing-page'>
                  <Loader />
                </div>
              ) : (
                <div className="landing-page" style={{ width: "100%" }}>
                  <div className='header-container'>
                    <h1 className='app-header-text'>Welcome to FactPulse</h1>
                    <p className='app-desciption-text'>Advanced fact-checking system powered by AI. Verify claims, analyze sources, and get detailed insights with confidence scores.</p>
                    <div className="feature-cards-wrapper">
                      <Box className="feature-cards">
                        <Card className="feature-card">
                          <CardContent>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                              <div className='feature-card-icon-container'>
                                <RiZoomInFill className='feature-card-icon' />
                              </div>
                              <Typography variant="h6">Deeper Search</Typography>
                            </div>
                            <Typography variant="body2" style={{ color: '#393E46' }}>
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
                            <Typography variant="body2" style={{ color: '#393E46' }}>
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
                            <Typography variant="body2" style={{ color: '#393E46' }}>
                              Get instant results with our high-performance processing system.
                            </Typography>
                          </CardContent>
                        </Card>
                      </Box>
                    </div>
                  </div>
                  <div className="search-wrapper">
                    <Box className="search-section">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}></div>
                      <TextField
                        variant="outlined"
                        placeholder="Enter your research query or paste content to analyze..."
                        multiline
                        minRows={1}
                        maxRows={3}
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
                          '& .MuiOutlinedInput-root': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: 'none',
                            },
                          },
                          '& textarea': {
                            color: '#212529 !important',
                            padding: '0',
                            maxHeight: '250px',
                            overflowY: 'auto',
                            resize: 'none',
                            lineHeight: '1.5',
                            fontSize: '1rem',
                            '&::placeholder': {
                              color: '#6c757d !important',
                              opacity: 1,
                            },
                            '&::-webkit-scrollbar': {
                              width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                              background: '#f8f9fa',
                              borderRadius:'3px'
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
                    <p className='searchbox-below-line'>Our fact-checking system uses advanced AI algorithms to analyze claims against verified data sources. Each claim is evaluated for accuracy, context, and supporting evidence.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <Dialog
      open={openPopup}
      onClose={() => setOpenPopup(false)}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#FDFEFE',
          color: '#343A40',
          p: 3,
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: '600', color: '#212529', paddingBottom: 1 }}>
        Additional Verification Inputs
        <IconButton
          onClick={() => setOpenPopup(false)}
          sx={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: '#6C757D',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ paddingTop: '16px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField
            variant="outlined"
            placeholder="Enter X link..."
            value={xLink}
            onChange={(e) => setXLink(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                '& fieldset': { borderColor: '#CED4DA' },
                '&:hover fieldset': { borderColor: '#ADB5BD' },
                '&.Mui-focused fieldset': { borderColor: '#0D6EFD' },
              },
              '& input::placeholder': { color: '#6C757D', opacity: 1 },
            }}
          />
          <TextField
            variant="outlined"
            placeholder="Enter Facebook link..."
            value={facebookLink}
            onChange={(e) => setFacebookLink(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                '& fieldset': { borderColor: '#CED4DA' },
                '&:hover fieldset': { borderColor: '#ADB5BD' },
                '&.Mui-focused fieldset': { borderColor: '#0D6EFD' },
              },
              '& input::placeholder': { color: '#6C757D', opacity: 1 },
            }}
          />
          <TextField
            variant="outlined"
            placeholder="Enter Instagram link..."
            value={instagramLink}
            onChange={(e) => setInstagramLink(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                '& fieldset': { borderColor: '#CED4DA' },
                '&:hover fieldset': { borderColor: '#ADB5BD' },
                '&.Mui-focused fieldset': { borderColor: '#0D6EFD' },
              },
              '& input::placeholder': { color: '#6C757D', opacity: 1 },
            }}
          />
          <TextField
            variant="outlined"
            placeholder="Enter YouTube link..."
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                '& fieldset': { borderColor: '#CED4DA' },
                '&:hover fieldset': { borderColor: '#ADB5BD' },
                '&.Mui-focused fieldset': { borderColor: '#0D6EFD' },
              },
              '& input::placeholder': { color: '#6C757D', opacity: 1 },
            }}
          />
          <TextField
            variant="outlined"
            placeholder="Enter any other link..."
            value={genericLink}
            onChange={(e) => setGenericLink(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                '& fieldset': { borderColor: '#CED4DA' },
                '&:hover fieldset': { borderColor: '#ADB5BD' },
                '&.Mui-focused fieldset': { borderColor: '#0D6EFD' },
              },
              '& input::placeholder': { color: '#6C757D', opacity: 1 },
            }}
          />
          <Box sx={{ border: '1px dashed #CED4DA', padding: 2, borderRadius: '8px', backgroundColor: '#F8F9FA' }}>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontWeight: 500 }}>
              Upload Image
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{ display: 'block', color: '#495057' }}
            />
          </Box>
          <Box sx={{ border: '1px dashed #CED4DA', padding: 2, borderRadius: '8px', backgroundColor: '#F8F9FA' }}>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontWeight: 500 }}>
              Upload Video
            </Typography>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              style={{ display: 'block', color: '#495057' }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #E9ECEF' }}>
        <Button
          onClick={() => setOpenPopup(false)}
          sx={{
            color: '#495057',
            textTransform: 'none',
            borderRadius: '8px',
            padding: '6px 16px',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)'}
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => setOpenPopup(false)}
          variant="contained"
          disabled={
            !xLink.trim() &&
            !facebookLink.trim() &&
            !instagramLink.trim() &&
            !youtubeLink.trim() &&
            !genericLink.trim() &&
            !imageFile &&
            !videoFile
          }
          sx={{
            color: '#FFFFFF',
            minWidth: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #4C46DA, #6E66FF)',
            boxShadow: '0 6px 16px rgba(76, 70, 218, 0.25)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              background: 'linear-gradient(135deg, #5C56EA, #7E76FF)',
              transform: 'scale(1.1) rotate(1deg)',
              boxShadow: '0 8px 20px rgba(76, 70, 218, 0.35)',
            },
            textTransform: 'none',
            '&:disabled': {
              background: 'none',
              backgroundColor: '#E0E0E0',
              color: '#A0A0A0',
              boxShadow: 'none',
              cursor: 'not-allowed',
            },
          }}
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
              sx={{
                color: '#FFFFFF',
                minWidth: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #4C46DA, #6E66FF)',
                boxShadow: '0 6px 16px rgba(76, 70, 218, 0.25)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5C56EA, #7E76FF)',
                  transform: 'scale(1.1) rotate(1deg)',
                  boxShadow: '0 8px 20px rgba(76, 70, 218, 0.35)',
                },
                textTransform: 'none',
                '&:disabled': {
                  background: 'none',
                  backgroundColor: '#E0E0E0',
                  color: '#A0A0A0',
                  boxShadow: 'none',
                  cursor: 'not-allowed',
                },
              }}
            >
              Verify Selected Claims
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openEventDialog}
          onClose={() => setOpenEventDialog(false)}
          maxWidth="md"
          fullWidth
          sx={{ '& .MuiDialog-paper': { backgroundColor: '#FFFFFF', color: '#212529', p: 2 } }}
        >
          <DialogTitle>
            Event Details
            <IconButton
              onClick={() => setOpenEventDialog(false)}
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
            {selectedEvent ? (
              <EventCard eventData={selectedEvent} />
            ) : (
              <Typography variant="body2" sx={{ color: '#6C757D' }}>
                No event selected.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenEventDialog(false)}
              sx={{ color: '#fff', textTransform: 'none', background: 'linear-gradient(135deg, #4C46DA, #6E66FF)' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
        {showResults && !parsedResult && (
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
                      width: 'fit-content',
                      ml: 'auto',
                      mr: 0,
                      maxWidth: '90%',
                      mt: 2,
                      borderRadius: '10px',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      background: 'linear-gradient(to right, #EEF2FF, #F3E8FF)',
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
                        fontSize: '1rem',
                        color: '#212529',
                        textAlign: 'right',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        fontWeight: '500',
                        padding: '10px'
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
                        maxWidth: '60%',
                        padding: '10px'
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
                          <h3 className="section-title">Tasks</h3>
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
                                  button
                                  onClick={() => handleEventClick(eventData)}
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
                            displayedUrls.map(({ url, title }, index) => (
                              <Card
                                key={index}
                                sx={{
                                  width: '100%',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #E9ECEF',
                                  borderRadius: '8px',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                  transition: 'all 0.25s ease-in-out',
                                  '&:hover': {
                                    backgroundColor: '#F8F9FA',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
                                    transform: 'translateY(-2px)',
                                  },
                                }}
                                component="a"
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none' }}
                              >
                                <CardContent sx={{ padding: '12px 16px' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${url}`}
                                      alt={`${url} favicon`}
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '4px',
                                        marginRight: '10px',
                                      }}
                                    />
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        color: '#212529',
                                        fontWeight: '500',
                                        lineHeight: 1.4,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {title && title !== 'Untitled' ? title : new URL(url).hostname}
                                    </Typography>
                                  </Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: '#6C757D',
                                      display: 'block',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      marginLeft: '26px',
                                    }}
                                  >
                                    {title && title !== 'Untitled' ? new URL(url).hostname : url}
                                  </Typography>
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
                                <Card
                                  key={index}
                                  className="task-card"
                                  onClick={() => handleEventClick(eventData)}
                                  sx={{
                                    mb: 2,
                                    cursor: 'pointer',
                                    backgroundColor: '#FFFFFF', // Base background color
                                    backgroundImage: 'radial-gradient(circle at 100% 100%, rgba(76, 70, 218, 0.05) 0%, transparent 40%)', // Added radial gradient
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                      transform: 'translateY(-8px)',
                                      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
                                      '&::after': {
                                        transform: 'scaleX(1)',
                                      },
                                    },
                                    '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '4px',
                                      background: 'linear-gradient(to right, #4C46DA, #6E66FF)',
                                      transform: 'scaleX(0)',
                                      transformOrigin: 'left',
                                      transition: 'transform 0.4s ease-out',
                                    },
                                  }}
                                >
                                  <CardContent sx={{ padding: '12px' }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#212529' }}>
                                      {getDisplayEventName(eventData) || eventData.event}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: '#6C757D',
                                        mt: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                      }}
                                    >
                                      {eventData.reasoning_content
                                        ? renderContent(eventData.reasoning_content).toString().replace(/^##\s*/, '').substring(0, 100) + '...'
                                        : eventData.tools && eventData.tools[0]?.content
                                        ? renderContent(eventData.tools[0].content).toString().replace(/^##\s*/, '').substring(0, 100) + '...'
                                        : ''}
                                    </Typography>
                                  </CardContent>
                                </Card>
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
        {parsedResult && (
          <Box className="result-cards" sx={{ padding: '16px 0' }}>
            {Array.isArray(parsedResult) ? (
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
                            borderRadius: '16px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.07)',
                            background: 'linear-gradient(135deg, #f3f6ff, #f5f0ff)',
                            border: '1px solid rgba(226, 232, 255, 0.7)',
                            transform: 'translateY(0)',
                            transition: 'all 0.4s ease-in-out',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.12)',
                              borderColor: 'rgba(226, 232, 255, 0.9)',
                            },
                            '&::after': {
                              content: '\'\'',
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '100%',
                              height: '4px',
                              background: 'linear-gradient(to right, #4C46DA, #6E66FF)',
                              transform: 'scaleX(0)',
                              transformOrigin: 'left',
                              transition: 'transform 0.4s ease-out',
                            },
                            '&:hover::after': {
                              transform: 'scaleX(1)',
                            },
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
                                sx={{ textTransform: 'none', color: '#4C46DA', fontSize: '0.9rem' }}
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
                                  <InfoIcon sx={{ color: '#4C46DA', marginRight: '10px', marginTop: '3px' }} />
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 'bold', color: '#4C46DA', marginBottom: '4px' }}
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
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.07)',
                        background: 'linear-gradient(135deg, #f3f6ff, #f5f0ff)',
                        border: '1px solid rgba(226, 232, 255, 0.7)',
                        transform: 'translateY(0)',
                        transition: 'all 0.4s ease-in-out',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.12)',
                          borderColor: 'rgba(226, 232, 255, 0.9)',
                        },
                        '&::after': {
                          content: '\'\'',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          height: '4px',
                          background: 'linear-gradient(to right, #4C46DA, #6E66FF)',
                          transform: 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: 'transform 0.4s ease-out',
                        },
                        '&:hover::after': {
                          transform: 'scaleX(1)',
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
                            sx={{ textTransform: 'none', color: '#4C46DA', fontSize: '0.9rem' }}
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
                              <InfoIcon sx={{ color: '#4C46DA', marginRight: '10px', marginTop: '3px' }} />
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 'bold', color: '#4C46DA', marginBottom: '4px' }}
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

        {showResults && (events.length !== 0 || displayedUrls.length !== 0) && (
          <Box className="response-sidebar">
            <Box sx={{ padding: 2, borderBottom: '2px solid rgba(230, 235, 255, 0.7)', display: 'flex', justifyContent: 'space-between' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: sidebarContent === 'tasks' ? '#6E66FF' : '#393E46',
                  cursor: 'pointer',
                  '&:hover': { color: '#6E66FF' },
                }}
                onClick={() => setSidebarContent('tasks')}
              >
                Tasks{' '}
                <span style={{ color: sidebarContent === 'tasks' ? '#6E66FF' : '#686D76' }}>
                  (
                  {events.filter(
                    (eventData) =>
                      eventData.reasoning_content ||
                      (eventData.tools && eventData.tools.length > 0)
                  ).length}
                  )
                </span>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: sidebarContent === 'sources' ? '#6E66FF' : '#393E46',
                  cursor: 'pointer',
                  '&:hover': { color: '#6E66FF' },
                }}
                onClick={() => setSidebarContent('sources')}
              >
                Web sources{' '}
                <span style={{ color: sidebarContent === 'sources' ? '#6E66FF' : '#686D76' }}>
                  ({totalLinks})
                </span>
              </Typography>
            </Box>
            {sidebarContent === 'sources' && (
              <Box sx={{ padding: '8px 16px', borderBottom: '1px solid #DEE2E6' }}>
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
              </Box>
            )}
            <Box sx={{
              height: 'calc(100vh - 150px)',
              overflowY: 'auto',
              padding: 2,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f8f9fa',
                borderRadius: '3px'
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#ced4da',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#adb5bd',
              },
            }}>
              {sidebarContent === 'tasks' ? (
                events.length === 0 ? (
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
                      <Card
                        key={index}
                        className="task-card"
                        onClick={() => handleEventClick(eventData)}
                        sx={{
                          mb: 2,
                          cursor: 'pointer',
                          backgroundColor: '#FFFFFF', // Base background color
                          backgroundImage: 'radial-gradient(circle at 100% 100%, rgba(76, 70, 218, 0.05) 0%, transparent 40%)', // Added radial gradient
                          borderRadius: '8px',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
                            '&::after': {
                              transform: 'scaleX(1)',
                            },
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '4px',
                            background: 'linear-gradient(to right, #4C46DA, #6E66FF)',
                            transform: 'scaleX(0)',
                            transformOrigin: 'left',
                            transition: 'transform 0.4s ease-out',
                          },
                        }}
                      >
                        <CardContent sx={{ padding: '12px' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#212529' }}>
                            {getDisplayEventName(eventData) || eventData.event}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#6C757D',
                              mt: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {eventData.reasoning_content
                              ? renderContent(eventData.reasoning_content).toString().replace(/^##\s*/, '').substring(0, 100) + '...'
                              : eventData.tools && eventData.tools[0]?.content
                              ? renderContent(eventData.tools[0].content).toString().replace(/^##\s*/, '').substring(0, 100) + '...'
                              : ''}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))
                )
              ) : (
                displayedUrls.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#6C757D' }}>
                    No links in this category.
                  </Typography>
                ) : (
                  displayedUrls.map(({ url, title }, index) => (
                    <Card
                      key={index}
                      sx={{
                        width: '100%',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E9ECEF',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.25s ease-in-out',
                        '&:hover': {
                          backgroundColor: '#F8F9FA',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                      component="a"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <CardContent sx={{ padding: '12px 16px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${url}`}
                            alt={`${url} favicon`}
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '4px',
                              marginRight: '10px',
                            }}
                          />
                          <Typography
                            variant="subtitle1"
                            sx={{
                              color: '#212529',
                              fontWeight: '500',
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {title && title !== 'Untitled' ? title : new URL(url).hostname}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#6C757D',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginLeft: '26px',
                          }}
                        >
                          {title && title !== 'Untitled' ? new URL(url).hostname : url}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                )
              )}
            </Box>
          </Box>
        )}
      </Box>
    </div>
  );
}

export default App;
