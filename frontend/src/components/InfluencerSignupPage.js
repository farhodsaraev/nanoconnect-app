import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function InfluencerSignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/influencer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) throw new Error(data.error);
      toast.success('Account created! Please log in.');
      navigate('/influencer/login');
    })
    .catch(err => toast.error(err.message || 'Registration failed.'));
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h1>Influencer Sign Up</h1>
        <p>Create your account to connect with brands.</p>
        <div className="input-group">
          <label htmlFor="name">Your Name / Handle</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="login-button" style={{backgroundColor: '#e83e8c'}}>Create Account</button>
        <p style={{marginTop: '20px'}}>
          Already have an account? <Link to="/influencer/login">Log In</Link>
        </p>
      </form>
    </div>
  );
}
export default InfluencerSignUpPage;