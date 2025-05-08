import React from 'react';
import { Box, Typography } from '@mui/material';
import { FaBahai } from "react-icons/fa6";
import { MdOutlineSecurity } from "react-icons/md";
import { FaChartLine } from "react-icons/fa6";
import genAIIcon from '../assets/genAI_icon.png';
import genAILogo from '../assets/GenaiLogo.png';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <Box className="sidebar">
      <Box className="sidebar-content">
        <Typography variant="h3" className="sidebar-title">
          Fact Check
        </Typography>
        <Typography variant="subtitle1" className="sidebar-subtitle">
          
        </Typography>
        <Box className="sidebar-features">
          <Box className="feature-chip">
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
        <Box className="sidebar-powered-by">
          <Typography className='feature-chip-text' style={{justifyContent:"center"}}>
            powered by 
          </Typography>
          <img src={genAIIcon} alt="GenAI Icon" className="genai-icon" />
          <img src={genAILogo} alt="GenAI Logo" className="genai-logo" />
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
