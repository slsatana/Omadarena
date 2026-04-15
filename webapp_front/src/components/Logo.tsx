import React from 'react';

export const Logo = ({ className = "" }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
    <path 
      d="M50 15L85 75H15L50 15Z" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="50" cy="50" r="10" fill="currentColor" />
    <path 
      d="M30 85C30 85 40 80 50 80C60 80 70 85 70 85" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round"
    />
  </svg>
);
