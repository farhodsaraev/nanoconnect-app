import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // We'll continue using these styles
import LoadingSpinner from './LoadingSpinner';
import ApiErrorMessage from './ApiErrorMessage';
import SubmitContent from './SubmitContent'; // We still need this for the modal

// A new helper component to render the correct status and actions for each project
// --- Replace the entire ProjectStatus component with this corrected version ---

const ProjectStatus = ({ project, onAccept, onDecline, onOpenSubmit }) => {
  // Case 1: The project is a direct invitation that is still pending
  if (project.type === 'invitation' && project.status === 'pending') {
    // Get the raw ID from the project_id string (e.g., "invite_1" -> "1")
    const inviteId = project.project_id.split('_')[1];
    return (
      <div className="project-status">
        <span className="status-tag status-pending">New Invitation!</span>
        <div className="invitation-actions">
          {/* --- THIS IS THE FIX --- */}
          {/* We now pass the string 'declined' as the second argument */}
          <button className="decline-button" onClick={() => onDecline(inviteId, 'declined')}>Decline</button>
          
          {/* --- THIS IS THE FIX --- */}
          {/* We now pass the string 'accepted' as the second argument */}
          <button className="accept-button" onClick={() => onAccept(inviteId, 'accepted')}>Accept</button>
        </div>
      </div>
    );
  }

  // Case 2: The project is an application the influencer submitted
  if (project.type === 'application') {
    const statusText = `Application ${project.status}`;
    return (
      <div className="project-status">
        <span className={`status-tag status-${project.status}`}>{statusText}</span>
      </div>
    );
  }

  // Case 3: The project has been accepted and is awaiting content submission
  if (project.status === 'accepted' && !project.submission_status) {
    return (
      <div className="project-status">
        <span className="status-tag status-accepted">Awaiting Content</span>
        <button className="accept-button" onClick={() => onOpenSubmit(project)}>Submit Content</button>
      </div>
    );
  }

  // Case 4: Content has been submitted and is awaiting review by the brand
  if (project.submission_status === 'pending_review') {
    return <div className="project-status"><span className="status-tag status-pending">Content Under Review</span></div>;
  }
  
  // Case 5: The brand has approved the content!
  if (project.submission_status === 'approved') {
    return <div className="project-status"><span className="status-tag status-accepted">Project Complete! 🎉</span></div>;
  }

  // Case 6: The brand has requested revisions
  if (project.submission_status === 'revision_requested') {
    return (
      <div className="project-status">
        <span className="status-tag status-declined">Revision Requested</span>
      </div>
    );
  }

  // Fallback for any other state
  return <div className="project-status"><span className="status-tag">{project.status}</span></div>;
};

function InfluencerDashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingProject, setSubmittingProject] = useState(null);

  // Function to fetch all project data from our new endpoint
  const fetchProjects = () => {
    if (!user) return;
    setIsLoading(true);
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/influencer/${user.id}/projects`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load projects.'))
      .then(data => {
        setProjects(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message || err);
        setIsLoading(false);
      });
  };

  // Fetch data on initial load
  useEffect(fetchProjects, [user]);

  const handleInvitationResponse = (inviteId, status) => {
    // ... (this function can remain the same, but we will refresh the list after)
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/invites/${inviteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status }),
    }).then(res => res.ok ? fetchProjects() : Promise.reject('Update failed.')); // Refresh list on success
  };
  
  const handleContentSubmitted = () => {
    setSubmittingProject(null); // Close the modal
    fetchProjects(); // Refresh the entire project list to show the new "Under Review" status
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