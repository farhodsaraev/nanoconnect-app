import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ProjectExchangePage.css';
import LoadingSpinner from './LoadingSpinner';
import ApiErrorMessage from './ApiErrorMessage';

function ProjectExchangePage({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  // Keep track of which campaigns the user has already applied to
  const [appliedCampaignIds, setAppliedCampaignIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the list of public campaigns
  useEffect(() => {
    setIsLoading(true);
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/campaigns/public`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load campaigns.'))
      .then(data => {
        setCampaigns(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message || err);
        setIsLoading(false);
      });
  }, []);

  // Handle the "Apply" button click
  const handleApply = (campaignId) => {
    // Send the application to the backend
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: campaignId, influencerId: user.id }),
    })
    .then(res => {
      if (res.status === 409) { // 409 Conflict means "already applied"
        toast.error('You have already applied to this campaign.');
      } else if (!res.ok) {
        throw new Error('Application failed!');
      }
      return res.json();
    })
    .then(() => {
      toast.success('Application submitted successfully!');
      // Add the campaign ID to our set to update the button state
      setAppliedCampaignIds(prevIds => new Set(prevIds).add(campaignId));
    })
    .catch(err => {
      if (err.message !== 'Application failed!') { // Avoid double-toasting for 409
        toast.error(err.message || 'An error occurred.');
      }
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ApiErrorMessage error={error} />;

  return (
    <div className="exchange-page">
      <Link to="/influencer/dashboard" className="back-button" style={{ marginBottom: '20px' }}>
        ← Back to Dashboard
      </Link>
      <h1>Project Exchange</h1>
      <p>Browse public campaigns from brands and apply to the ones that fit your style.</p>
      <div className="project-grid">
        {campaigns.map(c => {
          const hasApplied = appliedCampaignIds.has(c.id);
          return (
            <div key={c.id} className="project-card">
              <h3>{c.name}</h3>
              <p className="brand-name">by {c.brand_name}</p>
              <div className="project-details">
                <span><strong>Budget:</strong> ${c.budget}</span>
                <span><strong>Location:</strong> {c.target_location}</span>
              </div>
              <p className="project-brief">{c.brief}</p>
              <div className="project-actions">
                <button
                  className={`save-button ${hasApplied ? 'invited' : ''}`}
                  onClick={() => handleApply(c.id)}
                  disabled={hasApplied}
                >
                  {hasApplied ? 'Applied ✔' : 'Apply Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectExchangePage;