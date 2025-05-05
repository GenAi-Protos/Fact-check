/* eslint-disable no-case-declarations */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  Modal,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

const formatKey = (key) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const renderObject = (obj) =>
  Object.entries(obj).map(([key, value]) => (
    <div key={key} style={{ marginBottom: '10px' }}>
      <strong style={{ color: '#e2e2e2' }}>{formatKey(key)}:</strong>{' '}
      {typeof value === 'object' && value !== null ? (
        Array.isArray(value) ? (
          <ul style={{ color: '#e2e2e2', marginTop: 4 }}>
            {value.map((item, index) => (
              <li key={index}>
                {typeof item === 'object' ? renderObject(item) : item}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ paddingLeft: '16px' }}>{renderObject(value)}</div>
        )
      ) : (
        <span style={{ color: '#e2e2e2' }}>{value}</span>
      )}
    </div>
  ));

const renderJsonLikeContent = (content) => {
  let cleanJsonStr = content.trim();
  if (cleanJsonStr.startsWith('```json')) {
    cleanJsonStr = cleanJsonStr.replace(/^```json\s*|\s*```$/g, '');
  }

  try {
    cleanJsonStr = JSON.parse(cleanJsonStr);
    return <div>{renderObject(cleanJsonStr)}</div>;
  } catch (e) {
    console.warn('Could not parse JSON-like content:', content, e);
    return (
      <Typography sx={{ color: '#e2e2e2', whiteSpace: 'pre-wrap' }}>
        {content}
      </Typography>
    );
  }
};

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
      return (
        <pre style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '8px', fontSize: '1rem', border: '1px solid #4A4B4D' }}>
          Tools data (unparseable): {tools}
        </pre>
      );
    }
  }

  if (!Array.isArray(toolList)) {
    return (
      <pre style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '8px', fontSize: '1rem', border: '1px solid #4A4B4D' }}>
        Tools data (not an array): {JSON.stringify(toolList, null, 2)}
      </pre>
    );
  }

  const filteredTools = toolList.filter(tool => !tool.tool_args?.state);

  return (
    <List sx={{ p: 0, pl: 0 }}>
      {filteredTools.map((tool, index) => (
        <ListItem
          key={index}
          sx={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            mb: 1,
            p: 1,
            background: '#fff',
            color: '#000',
          }}
          className="event-cards"
        >
          <Typography sx={{ p: 0, fontSize: '1.2rem', color: '#000' }}>
            <strong>Tool:</strong> {tool.tool_name || tool.name || 'N/A'}
          </Typography>
          {tool.tool_args && (
            <List sx={{ pl: 0, mt: 0.5 }}>
              {['title', 'action', 'confidence'].map((field) =>
                tool.tool_args[field] ? (
                  <ListItem sx={{ p: 0 }} key={field}>
                    <Typography sx={{ color: '#000' }}>
                      • <strong>{formatKey(field)}:</strong>{' '}
                      {field === 'confidence'
                        ? Math.round(parseFloat(tool.tool_args[field]) * 10)
                        : tool.tool_args[field]}
                    </Typography>
                  </ListItem>
                ) : null
              )}
              {Object.entries(tool.tool_args).map(([key, value]) => {
                if (!['title', 'action', 'confidence'].includes(key)) {
                  return (
                    <ListItem key={key} sx={{ p: 0 }}>
                      <Typography sx={{ color: '#000' }}>
                        • <strong>{formatKey(key)}:</strong> {value}
                      </Typography>
                    </ListItem>
                  );
                }
                return null;
              })}
            </List>
          )}
          {tool.content && (
            <List sx={{ pl: 0, mt: 0.5 }}>
              <ListItem sx={{ p: 0 }}>
                <Box
                  sx={{
                    background: '#222831',
                    color: '#e2e2e2',
                    p: 2,
                    borderRadius: '8px',
                    width: '100%',
                  }}
                >
                  <Typography sx={{ color: '#e2e2e2', mb: 1 }}>
                    <strong>Result:</strong>
                  </Typography>
                  {tool.content.trim().startsWith('```json') ? (
                    renderJsonLikeContent(tool.content)
                  ) : (
                    <Typography sx={{ color: '#e2e2e2', whiteSpace: 'pre-wrap' }}>
                      {tool.content}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            </List>
          )}
        </ListItem>
      ))}
    </List>
  );
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 800,
  bgcolor: '#fff',
  color: '#000',
  border: '2px solid #4A4B4D',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: '10px',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#3A3B3D',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#4A4B4D',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#5A5B5D',
  },
  scrollbarWidth: 'thin',
  scrollbarColor: '#4A4B4D #3A3B3D',
};

const EventCard = ({ eventData }) => {
  const { event, tools = [], reasoning_content = '' } = eventData || {};
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderContent = () => {
    if (Array.isArray(tools) && tools.length > 0) {
      return <Box>{renderTools(tools)}</Box>;
    }

    if (!tools || tools.length === 0) {
      if (reasoning_content) {
        let markdownContent = reasoning_content
          .replace(/^##\s*/gm, '') // Removes '##' and any trailing space, but keeps the content like "Event XYZ"
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
          <Box
            sx={{
              mt: 1,
              '& ul': { pl: 4 },
              '& li': { mb: 1, color: '#000' },
              '& p': { color: '#000' },
              '& strong': { color: '#000' },
            }}
            style={{ padding: '16px' }}
          >
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </Box>
        );
      }
    }

    return null;
  };

  return (
    <Card sx={{ mb: 2, p: 2, backgroundColor: '#f9f9f9' }}>
      <CardContent>
        {event && (
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#212529' }}>
            {event}
          </Typography>
        )}
        {renderContent()}
      </CardContent>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box sx={modalStyle}>
          {event && (
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#212529' }}>
              {event}
            </Typography>
          )}
          {renderContent()}
        </Box>
      </Modal>
    </Card>
  );
};

export default EventCard;