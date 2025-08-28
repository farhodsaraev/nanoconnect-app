import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import LoadingSpinner from './LoadingSpinner';
import ApiErrorMessage from './ApiErrorMessage';
import SubmitContent from './SubmitContent';

// The ProjectStatus helper component remains unchanged
const ProjectStatus = ({ project, onAccept, onDecline, onOpenSubmit }) => {
  if (project.type === 'invitation' && project.status === 'pending') {
    const inviteId = project.project_id.split('_')[1];
    return (
      <div className="project-status">
        <span className="status-tag status-pending">New Invitation!</span>
        <div className="invitation-actions">
          <button className="decline-button" onClick={() => onDecline(inviteId, 'declined')}>Decline</button>
          <button className="accept-button" onClick={() => onAccept(inviteId, 'accepted')}>Accept</button>
        </div>
      </div>
    );
  }
  if (project.type === 'application') {
    const statusText = `Application ${project.status}`;
    return <div className="project-status"><span className={`status-tag status-${project.status}`}>{statusText}</span></div>;
  }
  if (project.status === 'accepted' && !project.submission_status) {
    return (
      <div className="project-status">
        <span className="status-tag status-accepted">Awaiting Content</span>
        <button className="accept-button" onClick={() => onOpenSubmit(project)}>Submit Content</button>
      </div>
    );
  }
  if (project.submission_status === 'pending_review') {
    return <div className="project-status"><span className="status-tag status-pending">Content Under Review</span></div>;
  }
  if (project.submission_status === 'approved') {
    return <div className="project-status"><span className="status-tag status-accepted">Project Complete! 🎉</span></div>;
  }
  if (project.submission_status === 'revision_requested') {
    return <div className="project-status"><span className="status-tag status-declined">Revision Requested</span></div>;
  }
  return <div className="project-status"><span className="status-tag">{project.status}</span></div>;
};


function InfluencerDashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingProject, setSubmittingProject] = useState(null);
  
  // --- CHANGE 1: ADD NEW STATE FOR THE BANNER ---
  // This state will control the visibility of our "profile incomplete" banner.
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  // This function fetches all data needed for the dashboard. It will now be inside the useEffect hook.
  const fetchDashboardData = () => {
    if (!user) return;
    setIsLoading(true);

    // We define two separate API calls as promises.
    const projectsPromise = fetch(`${process.env.REACT_APP_API_BASE_URL}/api/influencer/${user.id}/projects`).then(res => res.json());
    const profilePromise = fetch(`${process.env.REACT_APP_API_BASE_URL}/api/influencer/profile?id=${user.id}`).then(res => res.json());

    // Promise.all runs both promises and waits for them both to finish.
    Promise.all([projectsPromise, profilePromise])
      .then(([projectsData, profileData]) => {
        // This part runs only after both API calls have succeeded.
        setProjects(projectsData);
        
        // --- CHANGE 2: THE NEW LOGIC TO CHECK THE PROFILE ---
        // The banner will show if the niche OR keywords are empty/null.
        if (!profileData.niche || !profileData.keywords) {
          setIsProfileIncomplete(true);
        } else {
          setIsProfileIncomplete(false);
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to load dashboard data.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // This useEffect hook now simply calls our main data fetching function.
  useEffect(fetchDashboardData, [user]);

  const handleInvitationResponse = (inviteId, status) => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/invites/${inviteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status }),
    }).then(res => {
      if (res.ok) {
        fetchDashboardData(); // Refresh all data on success
      } else {
        Promise.reject('Update failed.');
      }
    });
  };
  
  const handleContentSubmitted = () => {
    setSubmittingProject(null); // Close the modal
    fetchDashboardData(); // Refresh all data to show the new "Under Review" status
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ApiErrorMessage error={error} />;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Influencer Dashboard</h1>
        <div>
          <Link to="/influencer/exchange" className="create-campaign-button" style={{marginRight: '10px', backgroundColor: '#e83e8c'}}>Project Exchange</Link>
          <Link to="/influencer/profile" className="create-campaign-button" style={{marginRight: '10px'}}>My Profile</Link>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </header>
      <main className="campaign-list-container">

        {/* --- CHANGE 3: THE NEW BANNER UI --- */}
        {/* This banner will only appear if the isProfileIncomplete state is true. */}
        {isProfileIncomplete && (
          <div className="profile-incomplete-banner">
            Your profile is incomplete! Add your niche and keywords to get discovered by brands. 
            <Link to="/influencer/profile"> Complete Your Profile Now</Link>.
          </div>
        )}

        <h2>My Projects</h2>
        <div className="campaign-list">
          {projects.length > 0 ? projects.map(p => (
            <div key={p.project_id} className="campaign-item">
              <h3>{p.campaign_name}</h3>
              <p className="campaign-brief">{p.campaign_brief}</p>
              <ProjectStatus 
                project={p}
                onAccept={handleInvitationResponse}
                onDecline={handleInvitationResponse}
                onOpenSubmit={(project) => setSubmittingProject(project)}
              />
            </div>
          )) : <p className="no-campaigns-message">You have no active projects or invitations.</p>}
        </div>
      </main>

      {submittingProject && (
        <SubmitContent 
          campaign={submittingProject}
          influencerId={user.id}
          onCancel={() => setSubmittingProject(null)}
          onContentSubmitted={handleContentSubmitted}
        />
      )}
    </div>
  );
}

export default InfluencerDashboard;