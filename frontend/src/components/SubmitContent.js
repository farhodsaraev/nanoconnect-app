import React, { useState } from 'react';
import './SubmitContent.css';

function SubmitContent({ campaign, influencerId, onCancel, onContentSubmitted }) {
  const [contentUrl, setContentUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    // TO (Correct):
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: campaign.id,
        influencerId: influencerId,
        contentUrl: contentUrl,
      }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.error || 'Submission failed.') });
      }
      return response.json();
    })
    .then(data => {
      onContentSubmitted(data.campaign_id); // Pass the campaign ID back up
    })
    .catch(err => setError(err.message));
  };

  return (
    <div className="submit-content-modal">
      <form onSubmit={handleSubmit} className="submit-content-form">
        <h2>Submit Content for "{campaign.name}"</h2>
        <div className="input-group">
          <label htmlFor="content-url">Content URL</label>
          <input 
            id="content-url" 
            type="url" 
            value={contentUrl} 
            onChange={e => setContentUrl(e.target.value)}
            placeholder="e.g., https://www.instagram.com/p/..."
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
          <button type="submit" className="save-button">Submit</button>
        </div>
      </form>
    </div>
  );
}

export default SubmitContent;