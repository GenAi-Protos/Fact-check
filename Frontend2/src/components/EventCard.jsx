/* eslint-disable no-case-declarations */
import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, Button, Modal, Tooltip, IconButton } from '@mui/material';
import ReactMarkdown from 'react-markdown';

// Render tools with updated styling
const renderTools = (tools) => {
  let toolList = tools;
  if (typeof tools === 'string') {
    try {
      const correctedString = tools
        .replace(/None/g, 'null')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/'/g, '"');
      toolList = JSON.parse(correctedString);
    } catch (e) {
      console.warn('Could not parse tools string:', tools, e);
      return <pre style={{ background: '#000', color: '#e2e2e2', padding: '16px', borderRadius: '8px', fontSize: '1rem', border: '1px solid #4A4B4D' }}>
        Tools data (unparseable): {tools}
      </pre>;
    }
  }

  if (!Array.isArray(toolList)) {
    return <pre style={{ background: '#000', color: '#e2e2e2', padding: '16px', borderRadius: '8px', fontSize: '1rem', border: '1px solid #4A4B4D' }}>
      Tools data (not an array): {JSON.stringify(toolList, null, 2)}
    </pre>;
  }

  return (
    <List sx={{ p: 0, pl: 0 }}>
      {toolList.map((tool, index) => (
        <ListItem
          key={index}
          sx={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            mb: 1,
            p: 1,
            background: '#000', // Slightly lighter than card background for hierarchy
            color: '#e2e2e2', // Updated for readability
          }}
          className="event-cards"
        >
          <Typography sx={{ p: 0, fontSize: '1.2rem', color: '#e2e2e2' }}>
            <strong>Tool:</strong> {tool.tool_name || tool.name || 'N/A'}
          </Typography>
          {tool.tool_args && (
            <List sx={{ pl: 0, mt: 0.5 }}>
              {tool.tool_args.title && (
                <ListItem sx={{ p: 0 }}>
                  <Typography sx={{ color: '#e2e2e2' }}>
                    • <strong>Title:</strong> {tool.tool_args.title}
                  </Typography>
                </ListItem>
              )}
              {tool.tool_args.action && (
                <ListItem sx={{ p: 0 }}>
                  <Typography sx={{ color: '#e2e2e2' }}>
                    • <strong>Next Action: </strong> {tool.tool_args.action}
                  </Typography>
                </ListItem>
              )}
              {tool.tool_args.confidence && (
                <ListItem sx={{ p: 0 }}>
                  <Typography sx={{ color: '#e2e2e2' }}>
                    • <strong>Confidence: </strong> {Math.round(parseFloat(tool.tool_args.confidence) * 10)}
                  </Typography>
                </ListItem>
              )}
              {Object.entries(tool.tool_args).map(([key, value]) => {
                if (key !== 'title' && key !== 'action' && key !== 'confidence') {
                  const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                  return (
                    <ListItem key={key} sx={{ p: 0 }}>
                      <Typography sx={{ color: '#e2e2e2' }}>
                        • <strong>{capitalizedKey}:</strong> {value}
                      </Typography>
                    </ListItem>
                  );
                }
                return null;
              })}
            </List>
          )}
        </ListItem>
      ))}
    </List>
  );
};

// Updated modal styles to match the app theme
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 800,
  bgcolor: '#fff', // Matches card background
  color: '#e2e2e2', // Updated for readability
  border: '2px solid #4A4B4D', // Matches scrollbar thumb color
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: '10px',
  // WebKit scrollbar styles (matches app's Grok-like scrollbars)
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#3A3B3D', // Matches gradient end color
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#4A4B4D', // Matches app scrollbar thumb
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#5A5B5D', // Matches app scrollbar hover
  },
  // Firefox scrollbar styles
  scrollbarWidth: 'thin',
  scrollbarColor: '#4A4B4D #3A3B3D',
};

const EventCard = ({ eventData }) => {
  const { event, content, tools = [], member_responses = [], reasoning_content = '', error } = eventData || {};
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderContent = () => {
    if (reasoning_content) {
      const isAnalysisMessage =
        reasoning_content.includes('## Initial Analysis of User Request') ||
        reasoning_content.includes('## Response Strategy');

      if (isAnalysisMessage) {
        // Transform the content for markdown rendering
        let markdownContent = reasoning_content
          .replace(/## ([^\n]+)/g, '**$1**\n\n')
          .replace(/\nAction: /g, '\n- **Action:** ')
          .replace(/\nConfidence: /g, '\n- **Confidence:** ')
          .replace(/\nNext - Action: /g, '\n- **Next Action:** ')
          .replace(/\nNext Action: /g, '\n- **Next Action:** ')
          .replace(/\nResult: /g, '\n- **Result:** ')
          .replace(/,\s*Result:/g, '')
          .trim()
          .replace(/(\d+\.\s)/g, '\n$1')
          .replace(/\n\n/g, '\n\n \n\n');

        return (
          <Box sx={{ mt: 1, '& ul': { pl: 4 }, '& li': { mb: 1, color: '#e2e2e2' }, '& p': { color: '#e2e2e2' }, '& strong': { color: '#e2e2e2' } }} style={{ padding: '16px' }}>
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </Box>
        );
      } else {
        // Remove leading '## ' if present before truncating
        const cleanedContent = reasoning_content.startsWith('## ') 
          ? reasoning_content.substring(3) 
          : reasoning_content;

        // Format confidence values in the content
        const formattedContent = cleanedContent.replace(
          /Confidence:\s*(0\.\d+)/g, 
          (match, confidenceValue) => `Confidence: ${Math.round(parseFloat(confidenceValue) * 10)}`
        );

        const truncatedContent = formattedContent.substring(0, 700);
        const needsExpansion = formattedContent.length > 700 || (Array.isArray(tools) && tools.length > 0);

        return (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'none' }}>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  flexGrow: 1,
                  marginRight: 1,
                  background: '#222831', // Matches card background
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#e2e2e2', // Updated for readability
                }}
              >
                {truncatedContent}
                {formattedContent.length > 700 ? '...' : ''}
              </pre>
              {needsExpansion && (
                <Tooltip title="Expand to see full data">
                  <span style={{ cursor: 'pointer', color: '#0d6efd', marginTop: '8px' }} onClick={() => setIsModalOpen(true)}>
                    Show more
                  </span>
                </Tooltip>
              )}
            </Box>
            <Modal
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              aria-labelledby="reasoning-modal-title"
              aria-describedby="reasoning-modal-description"
            >
              <Box sx={modalStyle}>
                <Typography id="reasoning-modal-title" variant="h6" component="h2" style={{ fontSize: '1.5rem', color: '#000' }}>
                  Full Details
                </Typography>
                <pre
                  id="reasoning-modal-description"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    marginTop: 2,
                    background: 'linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%)', // Slightly lighter for contrast
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#000', // Updated for readability
                  }}
                >
                  {formattedContent}
                </pre>
                {Array.isArray(tools) && tools.length > 0 && (
                  <Box sx={{ mt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)', pt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom style={{ fontSize: '1.5rem', color: '#000' }}>
                      Tools Used:
                    </Typography>
                    {renderTools(tools, event)}
                  </Box>
                )}
                <Button onClick={() => setIsModalOpen(false)} sx={{ mt: 2, color: '#0d6efd' }}>
                  Close
                </Button>
              </Box>
            </Modal>
          </>
        );
      }
    }

    if (Array.isArray(tools) && tools.length > 0) {
      if (event === 'ToolCallStarted') {
        return <Box>{renderTools(tools, event)}</Box>;
      }
      if (event === 'ToolCallCompleted') {
        return (
          <Box>
            <Typography sx={{ color: '#e2e2e2' }}>Tool Call(s) Completed:</Typography>
            {renderTools(tools, event)}
          </Box>
        );
      }
    }

    switch (event) {
      case 'RunStarted':
      case 'ReasoningStarted':
      case 'ReasoningCompleted':
      case 'RunCompleted':
        const eventContent = typeof content === 'string' ? content : JSON.stringify(content || {});
        return <Typography sx={{ color: '#000' }}>{eventContent}</Typography>;

      case 'RunResponse':
        return null;

      case 'MemberResponse':
        return (
          <Box>
            <Typography sx={{ color: '#e2e2e2' }}>
              <strong>Member Response(s):</strong>
            </Typography>
            <pre style={{ background: 'none', color: '#e2e2e2', padding: '16px', borderRadius: '8px', fontSize: '1rem', border: '1px solid #4A4B4D' }}>
              {JSON.stringify(member_responses, null, 2)}
            </pre>
          </Box>
        );

      case 'ParseError':
      case 'StreamError':
      case 'SerializationError':
      case 'RecursiveSerializationError':
        return <Typography sx={{ color: '#ff6b6b' }}>Error: {error || content || 'Unknown stream error'}</Typography>;

      default:
        return <pre style={{ background: 'none', color: '#e2e2e2', padding: '16px', borderRadius: '8px', fontSize: '1rem', border: '1px solid #4A4B4D' }}>
          {JSON.stringify(eventData || {}, null, 2)}
        </pre>;
    }
  };

  const contentToRender = renderContent();
  if (!contentToRender) return null;

  return (
    <Card className="event-card" sx={{ mb: 2 }} style={{ background: 'none' }}>
      <CardContent style={{ background: 'none', color: '#e2e2e2' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000' }}>
          {event || 'Unknown Event'}
        </Typography>
        {contentToRender}
      </CardContent>
    </Card>
  );
};

export default EventCard;