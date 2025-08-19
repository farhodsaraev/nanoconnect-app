import React from 'react';
import './ApiErrorMessage.css';

function ApiErrorMessage({ error }) {
  return (
    <div className="api-error-container">
      <h3>Oops! Something went wrong.</h3>
      <p>We couldn't fetch the data from our server. Please try refreshing the page.</p>
      <p><strong>Error:</strong> <code>{error}</code></p>
    </div>
  );
}

export default ApiErrorMessage;