import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './MatchPage.css';
import LoadingSpinner from './LoadingSpinner'; // Import
import ApiErrorMessage from './ApiErrorMessage'; // Import

function MatchPage() {
  const { campaignId } = useParams();
  
  const [matches, setMatches] = useState([]);
  const [invitedInfluencerIds, setInvitedInfluencerIds] = useState(new Set());

  // --- NEW STATE MANAGEMENT ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/campaigns/${campaignId}/match`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch matches. The campaign may not exist.');
        }
        return response.json();
      })
      .then(data => {
        setMatches(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching matches:", err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [campaignId]);

  const handleInvite = (influencerId) => {
    // This logic remains the same
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: parseInt(campaignId), influencerId: influencerId }),
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      setInvitedInfluencerIds(prevIds => new Set(prevIds).add(influencerId));
    })
    .catch(error => console.error("Error sending invite:", error));
  };

  // --- NEW RENDER LOGIC ---
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className="match-page">
        <div className="match-page-header">
          <Link to="/" className="back-button">← Back to Dashboard</Link>
        </div>
        <ApiErrorMessage error={error} />
      </div>
    );
  }

  return (
    <div className="match-page">
      <div className="match-page-header">
        <Link to="/" className="back-button">← Back to Dashboard</Link>
        <h1>Influencer Matches for Campaign #{campaignId}</h1>
      </div>
      
      <div className="matches-container">
        {matches.length > 0 ? matches.map(match => {
          const isInvited = invitedInfluencerIds.has(match.influencer.id);
          return (
            <div key={match.influencer.id} className="influencer-card">
              <h3>{match.influencer.name}</h3>
              <p className="location">{match.influencer.location}</p>
              <p className="followers">Followers: {match.influencer.followers.toLocaleString()}</p>
              <div className="keywords">
                {match.influencer.keywords.map(kw => (
                  <span key={kw} className="keyword-tag">{kw}</span>
                ))}
              </div>
              <div className="influencer-actions">
                <button
                  onClick={() => handleInvite(match.influencer.id)}
                  className={`invite-button ${isInvited ? 'invited' : ''}`}
                  disabled={isInvited}
                >
                  {isInvited ? 'Invited ✔' : 'Invite'}
                </button>
              </div>
            </div>
          )
        }) : <p>No matches found based on your brief's keywords.</p>}
      </div>
    </div>
  );
}

export default MatchPage;