import React from 'react';
import { Box, Typography } from '@mui/material';
import { FaBahai } from "react-icons/fa6";
import { MdOutlineSecurity } from "react-icons/md";
import { FaChartLine } from "react-icons/fa6";
import genAIIcon from '../assets/genAI_icon.png';
import genAILogo from '../assets/GenaiLogo.png';
import factCheckLogo from '../assets/FactPulse Logo.png';
import './Sidebar.css';

const Sidebar = ({ searchHistory }) => {
  return (
    <Box className="sidebar">
      <Box className="sidebar-content">
        <img 
          src={factCheckLogo} 
          alt="FactPulse Logo" 
          style={{
            width: 'auto',
            height: '55px',
            borderRadius: '10px',
            objectFit: 'cover',
            marginBottom: '16px'
          }}
        />
        <Typography variant="subtitle1" className="sidebar-subtitle">
          
        </Typography>
        
        {searchHistory && searchHistory.length > 0 ? (
          // Search History Section
          <Box className="search-history-section" sx={{ marginTop: '24px', width: '100%' }}>
            <Typography variant="h6" sx={{ marginBottom: '10px', color: '#686D76', fontSize: '0.9rem', fontWeight: '500' }}>
              Recent Searches
            </Typography>
            <Box className="search-history-items" sx={{ /* Add any specific styles for the box here if needed */ }}>
              {searchHistory}
            </Box>
          </Box>
        ) : (
          // Sidebar Features Section
          <Box className="sidebar-features">
            <Box className="sidebar-feature-chip">
              <FaBahai className="sidebar-feature-chip-icon" />
              <Typography className='sidebar-feature-chip-text'>AI-Powered</Typography>
            </Box>
            <Box className="sidebar-feature-chip">
              <MdOutlineSecurity className="sidebar-feature-chip-icon" style={{ color: 'rgb(133, 57, 224)'}}/>
              <Typography className='sidebar-feature-chip-text'>Reliable Sources</Typography>
            </Box>
            <Box className="sidebar-feature-chip">
              <FaChartLine className="sidebar-feature-chip-icon-3"/>
              <Typography className='sidebar-feature-chip-text'>Real-time Analysis</Typography>
            </Box>
          </Box>
        )}
        
        <Box className="sidebar-powered-by">
          <Typography className='feature-chip-text' style={{justifyContent:"center"}}>
            powered by 
          </Typography>
          <div className='logo-container'>
          <img src={genAIIcon} alt="GenAI Icon" className="genai-icon" />
          <img src={genAILogo} alt="GenAI Logo" className="genai-logo" />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
