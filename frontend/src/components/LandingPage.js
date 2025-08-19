import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-page">
      <h1>Welcome to NanoConnect</h1>
      <p>The marketplace for authentic voices.</p>
      <div className="role-selection">
        <Link to="/brand/login" className="brand-link">I'm a Brand</Link>
        <Link to="/influencer/login" className="influencer-link">I'm an Influencer</Link>
      </div>
    </div>
  );
}

export default LandingPage;