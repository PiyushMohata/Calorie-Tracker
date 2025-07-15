import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-spinner">
      <div className="flex-center flex-column gap-2">
        <div className="spinner"></div>
        <span className="text-secondary text-sm">{message}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner; 