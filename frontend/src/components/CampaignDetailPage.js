import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './CampaignDetailPage.css';
import LoadingSpinner from './LoadingSpinner';
import ApiErrorMessage from './ApiErrorMessage';

function CampaignDetailPage() {
  const { campaignId } = useParams();
  
  // --- STATE MANAGEMENT ---
  // State for the main campaign details (name, brief, invites, etc.)
  const [campaignDetails, setCampaignDetails] = useState(null);
  // State to hold the list of applications from the Project Exchange
  const [applications, setApplications] = useState([]);
  
  // A single loading and error state for the entire page
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- DATA FETCHING ---
  // We wrap our data fetching logic in a useCallback hook. This is a React best practice
  // that prevents the function from being recreated on every render, which can optimize performance.
  const fetchPageData = useCallback(() => {
    setIsLoading(true);
    // Promise.all lets us make multiple API calls in parallel. The page will only
    // stop loading after ALL of them have successfully completed.
    Promise.all([
      fetch(`${process.env.REACT_APP_API_BASE_URL}/api/campaigns/${campaignId}/details`),
      fetch(`${process.env.REACT_APP_API_BASE_URL}/api/campaigns/${campaignId}/applications`)
    ])
    .then(async ([detailsRes, appsRes]) => {
      // Check if both server responses were successful
      if (!detailsRes.ok) throw new Error('Failed to load campaign details.');
      if (!appsRes.ok) throw new Error('Failed to load campaign applications.');
      
      // Parse the JSON data from both responses
      const detailsData = await detailsRes.json();
      const appsData = await appsRes.json();
      
      // Update our component's state with the new data
      setCampaignDetails(detailsData);
      setApplications(appsData);
    })
    .catch(err => {
      // If any part of the process fails, we set an error message
      setError(err.message || 'An error occurred while loading page data.');
    })
    .finally(() => {
      // This part always runs, whether the fetch succeeded or failed
      setIsLoading(false);
    });
  }, [campaignId]); // The dependency array tells React to only recreate this function if campaignId changes.

  // This useEffect hook runs once when the component first loads, triggering the data fetch.
  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  // --- EVENT HANDLERS ---

  // Handles "Approve" or "Reject" clicks for applications
  const handleApplicationReview = (applicationId, status) => {
    toast.promise(
      fetch(`${process.env.REACT_APP_API_BASE_URL}/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status }),
      }).then(res => {
        if (!res.ok) throw new Error(`Failed to ${status} application.`);
        return res.json();
      }),
      {
        loading: 'Updating status...',
        success: <b>Application {status}!</b>,
        error: <b>Could not update status.</b>,
      }
    ).then(() => {
      // For a great UX, we instantly update the UI without a page refresh.
      setApplications(prevApps =>
        prevApps.map(app =>
          app.application_id === applicationId ? { ...app, status: status } : app
        )
      );
      // If we approved an application, we should also refresh the main campaign details
      // to show the new 'invite' that was created on the backend.
      if (status === 'approved') {
        fetchPageData();
      }
    });
  };

  // Handles "Approve" or "Request Revisions" for submitted content
  const handleSubmissionReview = (submissionId, status) => {
    toast.promise(
      fetch(`${process.env.REACT_APP_API_BASE_URL}/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status }),
      }).then(res => {
        if (!res.ok) throw new Error(`Failed to update submission.`);
        return res.json();
      }),
      {
        loading: 'Updating submission...',
        success: <b>Submission status updated!</b>,
        error: <b>Could not update status.</b>,
      }
    ).then(() => {
      // Instantly update the UI for the submission status
      setCampaignDetails(prevDetails => {
        const newInvites = prevDetails.invites.map(invite => {
          if (invite.submission_id === submissionId) {
            return { ...invite, submission_status: status };
          }
          return invite;
        });
        return { ...prevDetails, invites: newInvites };
      });
    });
  };

  // --- RENDER LOGIC ---

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ApiErrorMessage error={error} />;
  if (!campaignDetails) return <p>Campaign not found.</p>;

  // Helper function to render the section for applications
  const renderApplicationsSection = () => (
    <section className="applications-section">
      <h2>Influencer Applications</h2>
      <div className="invites-list">
        <div className="invite-item invite-header">
          <span>Influencer</span>
          <span>Status</span>
          <span style={{textAlign: 'right'}}>Actions</span>
        </div>
        {applications.length > 0 ? applications.map(app => (
          <div key={app.application_id} className="invite-item">
            <span className="invite-name">{app.influencer.name} ({app.influencer.followers.toLocaleString()} followers)</span>
            <div className="invite-status">
              <span className={`status-${app.status}`}>{app.status}</span>
            </div>
            <div className="application-actions" style={{textAlign: 'right'}}>
              {app.status === 'pending' ? (
                <>
                  <button className="reject-button" onClick={() => handleApplicationReview(app.application_id, 'rejected')}>Reject</button>
                  <button className="approve-button" onClick={() => handleApplicationReview(app.application_id, 'approved')}>Approve</button>
                </>
              ) : (
                <span className="application-status-text">{app.status}</span>
              )}
            </div>
          </div>
        )) : <p style={{padding: '20px', textAlign: 'center'}}>No influencers have applied to this campaign yet.</p>}
      </div>
    </section>
  );

  // Helper function to render the section for invites and submissions
  const renderInvitesSection = () => (
    <section className="invites-section">
      <h2>Campaign Progress (Invited & Approved Influencers)</h2>
      <div className="invites-list">
        <div className="invite-item invite-header">
          <span>Influencer</span>
          <span>Submitted Content</span>
          <span style={{textAlign: 'right'}}>Review Actions</span>
        </div>
        {campaignDetails.invites.length > 0 ? campaignDetails.invites.map(invite => (
          <div key={invite.invite_id} className="invite-item">
            <span className="invite-name">{invite.influencer.name}</span>
            <div>
              {invite.submission_url ? (
                <a href={invite.submission_url} target="_blank" rel="noopener noreferrer">View Content</a>
              ) : ( 'Not Submitted Yet' )}
            </div>
            <div className="submission-actions" style={{textAlign: 'right'}}>
              {invite.submission_status === 'pending_review' ? (
                <>
                  <button className="revision-button" onClick={() => handleSubmissionReview(invite.submission_id, 'revision_requested')}>Request Revisions</button>
                  <button className="approve-button" onClick={() => handleSubmissionReview(invite.submission_id, 'approved')}>Approve</button>
                </>
              ) : invite.submission_status ? (
                <span className="application-status-text">{invite.submission_status.replace(/_/g, ' ')}</span>
              ) : ( 'N/A' )}
            </div>
          </div>
        )) : <p style={{padding: '20px', textAlign: 'center'}}>No influencers are currently part of this campaign.</p>}
      </div>
    </section>
  );

  return (
    <div className="campaign-detail-page">
      <Link to="/brand/dashboard" className="back-button" style={{ marginBottom: '20px' }}>
        ← Back to Dashboard
      </Link>
      <header className="campaign-detail-header">
        <div className="campaign-title-actions">
          <h1>{campaignDetails.name}</h1>
          <Link to={`/campaign/${campaignId}/matches`} className="find-influencers-button">
            + Find New Influencers
          </Link>
        </div>
        <p className="campaign-brief-display">{campaignDetails.brief}</p>
      </header>
      
      {renderInvitesSection()}
      {renderApplicationsSection()}
    </div>
  );
}

export default CampaignDetailPage;