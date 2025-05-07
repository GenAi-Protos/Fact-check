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
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachmentIcon from '@mui/icons-material/Attachment';
import genAIIcon from './assets/genAI_icon.png';
import genAILogo from './assets/genaiLogo.png';
import './App.css';
import EventCard from './components/EventCard';
import Loader from './components/Loader';

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
    [],
  );

  // Utility function to render content, handling JSON objects
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
        try {
          const parsedFinal = JSON.parse(accumulatedFinalContent.trim());
          let normalizedResult;
          if (parsedFinal.findings || parsedFinal.source_links) {
            normalizedResult = {
              claim: selectedClaims.join(', '),
              verdict: 'Unknown',
              explanation: JSON.stringify(parsedFinal, null, 2),
              confidence: 0,
            };
          } else if (parsedFinal.claim && parsedFinal.verdict) {
            normalizedResult = parsedFinal;
          } else {
            normalizedResult = {
              claim: selectedClaims.join(', '),
              verdict: 'Unknown',
              explanation: JSON.stringify(parsedFinal, null, 2),
              confidence: 0,
            };
          }
          setFinalResult(parsedFinal);
          setParsedResult(normalizedResult);
          if (parsedFinal.citations && Array.isArray(parsedFinal.citations)) {
            parsedFinal.citations.forEach((url) => {
              if (typeof url === 'string') {
                const category = getUrlCategory(url);
                addCategorizedUrl(category, url);
              }
            });
          }
          if (parsedFinal.source_links) {
            Object.entries(parsedFinal.source_links).forEach(([platform, links]) => {
              const urls = Array.isArray(links) ? links : [links];
              urls.forEach((url) => {
                if (typeof url === 'string') {
                  const category = getUrlCategory(url);
                  addCategorizedUrl(category, url, `${platform} Link`);
                }
              });
            });
          }
        } catch (finalParseError) {
          console.error(
            'Error parsing final accumulated content:',
            finalParseError,
            'Content:',
            accumulatedFinalContent
          );
          setError('Failed to parse the final result from the stream.');
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
  }, [selectedClaims, findAndCategorizeUrls]);

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

  return (
    <div className="app-container">
      <div className="facts-checker-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={genAIIcon}
            alt="GenAI Icon"
            style={{ width: '32px', height: '32px' }}
          />
          <img
            src={genAILogo}
            alt="GenAI Logo"
            style={{ width: 'auto', height: '18px' }}
          />
        </Box>
      </div>
      {!showResults && (
        <div className="facts-checker-container">
          <div className="facts-checker-content">
            {isLoading ? (
              <Loader />
            ) : (
              <>
                <h2 className="facts-checker-question">
                  What would you like to verify?
                </h2>
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip
                              title="Add attachment (link, image, video)"
                              arrow
                              componentsProps={{
                                tooltip: {
                                  sx: {
                                    fontSize: '1rem',
                                  },
                                },
                                arrow: {
                                  sx: {},
                                },
                              }}
                            >
                              <IconButton
                                onClick={() => setOpenPopup(true)}
                                sx={{ color: '#6C757D', p: '8px' }}
                              >
                                <AttachmentIcon />
                              </IconButton>
                            </Tooltip>
                            <Button
                              variant="contained"
                              className="facts-checker-button"
                              onClick={handleQuerySubmit}
                              disabled={isLoading}
                              sx={{ mb: 0 }}
                            >
                              <ArrowUpwardIcon />
                            </Button>
                          </Box>
                        </InputAdornment>
                      ),
                      className: 'facts-checker-input',
                    }}
                    sx={{ mb: 2 }}
                  />
                </div>
              </>
            )}
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
            <h2 className="searched-query">{query || searchedQuery}</h2>
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
              <div className="response-content">
                <Box sx={{ display: 'flex', gap: '8px' }}>
                  {totalLinks > 0 && (
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
                      {totalLinks} web pages
                    </Button>
                  )}
                  {leftEventsState.length > 0 && (
                    <Button
                      onClick={() => setOpenTasksDrawer(true)}
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
                      startIcon={<AssignmentIcon />}
                    >
                      Tasks
                    </Button>
                  )}
                </Box>
              </div>
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
          {parsedResult && (
            <div>
              {Array.isArray(parsedResult) ? (
                parsedResult.map((item, index) => {
                  let itemBackgroundColor = '#0056e0';
                  if (item.verdict === 'False') {
                    itemBackgroundColor = '#E72929';
                  } else if (item.verdict === 'True') {
                    itemBackgroundColor = '#347928';
                  }
                  return (
                    <div
                      key={index}
                      ref={index === parsedResult.length - 1 ? bottomRef : null}
                      className="response-card-finalResult"
                      style={{ backgroundColor: itemBackgroundColor, marginBottom: '15px' }}
                    >
                      <div className="response-content" style={{ margin: '0', padding: '16px' }}>
                        <h3>Fact-Checking Result {parsedResult.length > 1 ? ` ${index + 1}` : ''}</h3>
                        <p><strong>Claim:</strong> {renderContent(item.claim)}</p>
                        <p><strong>Verdict:</strong> {renderContent(item.verdict)}</p>
                        <p><strong>Explanation:</strong> {renderContent(item.explanation)}</p>
                        <p><strong>Confidence Level:</strong> {item.confidence ? Math.round(item.confidence * 10) : 'N/A'}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                (() => {
                  let finalResultBackgroundColor = '#0056e0';
                  if (parsedResult.verdict === 'False') {
                    finalResultBackgroundColor = '#E72929';
                  } else if (parsedResult.verdict === 'True') {
                    finalResultBackgroundColor = '#347928';
                  }
                  return (
                    <div
                      ref={bottomRef}
                      className="response-card-finalResult"
                      style={{ backgroundColor: finalResultBackgroundColor }}
                    >
                      <div className="response-content" style={{ margin: '0', padding: '16px' }}>
                        <h3>Fact-Checking Result</h3>
                        <p><strong>Claim:</strong> {renderContent(parsedResult.claim)}</p>
                        <p><strong>Verdict:</strong> {renderContent(parsedResult.verdict)}</p>
                        <p><strong>Explanation:</strong> {renderContent(parsedResult.explanation)}</p>
                        <p><strong>Confidence Level:</strong> {parsedResult.confidence ? Math.round(parsedResult.confidence * 10) : 'N/A'}</p>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip
                      title="Add attachment (link, image, video)"
                      arrow
                      componentsProps={{
                        tooltip: {
                          sx: {
                            fontSize: '0.9rem',
                          },
                        },
                        arrow: {
                          sx: {},
                        },
                      }}
                    >
                      <IconButton
                        onClick={() => setOpenPopup(true)}
                        sx={{ color: '#6C757D', p: '8px' }}
                      >
                        <AttachmentIcon />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      className="facts-checker-button"
                      onClick={handleQuerySubmit}
                      disabled={
                        isLoading ||
                        (!query.trim() &&
                          !xLink.trim() &&
                          !facebookLink.trim() &&
                          !instagramLink.trim() &&
                          !youtubeLink.trim() &&
                          !genericLink.trim() &&
                          !imageFile &&
                          !videoFile)
                      }
                      sx={{ marginBottom: 0 }}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} sx={{ color: '#ffffff' }} />
                      ) : (
                        <ArrowUpwardIcon sx={{ color: '#ffffff' }} />
                      )}
                    </Button>
                  </Box>
                </InputAdornment>
              ),
              className: 'facts-checker-input',
            }}
            sx={{ marginBottom: 2 }}
          />
        </div>
      )}
    </div>
  );
}

export default App;