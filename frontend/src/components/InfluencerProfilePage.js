
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './InfluencerProfilePage.css';
import LoadingSpinner from './LoadingSpinner';
import ApiErrorMessage from './ApiErrorMessage';

function InfluencerProfilePage({ user }) {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/influencer/profile?id=${user.id}`)
      .then(res => {
        // --- THIS IS THE IMPROVEMENT ---
        // We check for the 404 error specifically to give a better message.
        if (res.status === 404) {
          throw new Error('Your user profile was not found. Please try logging out and back in.');
        }
        if (!res.ok) {
          throw new Error('Failed to load profile due to a server error.');
        }
        return res.json();
      })
      .then(data => {
        setProfileData(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [user]);

  // The rest of the file (handleChange, handleSubmit, and the return statement) remains the same.
  // ... (copy the rest of your existing file here)
  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.promise(
      fetch(`${process.env.REACT_APP_API_BASE_URL}/api/influencer/profile?id=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      }).then(res => {
        if (!res.ok) throw new Error('Update failed!');
        return res.json();
      }),
      {
        loading: 'Saving profile...',
        success: <b>Profile saved successfully!</b>,
        error: <b>Could not save profile.</b>,
      }
    );
  };
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ApiErrorMessage error={error} />;
  if (!profileData) return <p>Could not load profile data.</p>;
  return (
    <div className="profile-page">
      <Link to="/influencer/dashboard" className="back-button" style={{ marginBottom: '20px' }}>
        ← Back to Dashboard
      </Link>
      <form className="profile-form" onSubmit={handleSubmit}>
        <h1>Edit Your Profile</h1>
        <div className="form-grid">
          <div className="input-group">
            <label htmlFor="name">Display Name</label>
            <input type="text" id="name" name="name" value={profileData.name} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Address (read-only)</label>
            <input type="email" id="email" name="email" value={profileData.email} readOnly />
          </div>
          <div className="input-group">
            <label htmlFor="niche">Primary Niche</label>
            <select id="niche" name="niche" value={profileData.niche || ''} onChange={handleChange}>
                <option value="">Select a Niche</option>
                <option value="Food & Drink">Food & Drink</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Travel">Travel</option>
                <option value="Fashion & Beauty">Fashion & Beauty</option>
                <option value="Gaming">Gaming</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="location">Location</label>
            <input type="text" id="location" name="location" value={profileData.location || ''} onChange={handleChange} />
          </div>
           <div className="input-group">
            <label htmlFor="engagement_rate">Engagement Rate (%)</label>
            <input type="number" step="0.1" id="engagement_rate" name="engagement_rate" value={profileData.engagement_rate || ''} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="audience_age_range">Audience Age Range</label>
            <input type="text" id="audience_age_range" name="audience_age_range" value={profileData.audience_age_range || ''} onChange={handleChange} placeholder="e.g., 25-34" />
          </div>
        </div>
        <div className="input-group">
            <label htmlFor="keywords">Keywords (comma-separated)</label>
            <input type="text" id="keywords" name="keywords" value={profileData.keywords || ''} onChange={handleChange} placeholder="food, coffee, tacos..." />
        </div>
         <div className="input-group">
            <label htmlFor="audience_gender_split">Audience Gender Split</label>
            <input type="text" id="audience_gender_split" name="audience_gender_split" value={profileData.audience_gender_split || ''} onChange={handleChange} placeholder="e.g., 60% Female, 40% Male" />
        </div>
        <div className="form-actions-profile">
          <button type="submit" className="save-button">Save Changes</button>
        </div>
      </form>
    </div>
  );
}
export default InfluencerProfilePage;