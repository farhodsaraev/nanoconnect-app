import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import CreateCampaign from './CreateCampaign';
import LoadingSpinner from './LoadingSpinner';
import ApiErrorMessage from './ApiErrorMessage';

function Dashboard({ onLogout }) {
  const [isCreating, setIsCreating] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/campaigns`)
      .then(response => response.ok ? response.json() : Promise.reject('Failed to fetch campaigns.'))
      .then(data => {
        setCampaigns(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message || err);
        setIsLoading(false);
      });
  }, []);

  const handleCampaignCreated = (newCampaign) => {
    setCampaigns(prevCampaigns => [...prevCampaigns, newCampaign]);
    setIsCreating(false);
  };

  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <ApiErrorMessage error={error} />;
    if (campaigns.length > 0) {
      return (
        <div className="campaign-list">
          {campaigns.map(campaign => (
            <Link to={`/brand/campaign/${campaign.id}`} key={campaign.id} className="campaign-card-link">
              <div className="campaign-item">
                <h3>{campaign.name}</h3>
                <p className="campaign-budget">Budget: ${campaign.budget}</p>
                <p className="campaign-brief">{campaign.brief}</p>
              </div>
            </Link>
          ))}
        </div>
      );
    }
    return <p className="no-campaigns-message">No campaigns found. Create one to get started!</p>;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>NanoConnect Dashboard</h1>
        <div> {/* Use a div to group the buttons */}
          <Link to="/brand/catalog" className="create-campaign-button" style={{marginRight: '10px', backgroundColor: '#17a2b8'}}>Browse Influencers</Link>
          <button onClick={() => setIsCreating(true)} className="create-campaign-button">+ Create New Campaign</button>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </header>
      <main className="campaign-list-container">
        <h2>Your Campaigns</h2>
        {renderContent()}
      </main>
      {isCreating && <CreateCampaign onCancel={() => setIsCreating(false)} onCampaignCreated={handleCampaignCreated} />}
    </div>
  );
}

export default Dashboard;