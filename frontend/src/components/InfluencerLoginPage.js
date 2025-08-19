import React, { useState } from 'react';
// --- CHANGE 1: Import the Link component ---
import { Link } from 'react-router-dom';

function InfluencerLoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (event) => {
    event.preventDefault();
    setErrorMessage('');

    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/influencer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.error) });
      }
      return response.json();
    })
    .then(data => {
      onLoginSuccess(data.user);
    })
    .catch(error => {
      setErrorMessage(error.message);
    });
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h1>Influencer Portal</h1>
        <p>Manage your brand collaborations.</p>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., austinfoodie@test.com" 
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="password123"
          />
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button type="submit" className="login-button" style={{backgroundColor: '#e83e8c'}}>
          Login
        </button>

        {/* --- CHANGE 2: Add this new paragraph with the Link --- */}
        <p style={{marginTop: '20px'}}>
          Don't have an account? <Link to="/influencer/signup">Sign Up</Link>
        </p>
        
      </form>
    </div>
  );
}

export default InfluencerLoginPage;