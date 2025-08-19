import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Import the toaster
import './App.css'; 

// Import all our pages/components
import LandingPage from './components/LandingPage';
import BrandLoginPage from './components/BrandLoginPage';
import Dashboard from './components/Dashboard';
import MatchPage from './components/MatchPage';
import InfluencerLoginPage from './components/InfluencerLoginPage';
import InfluencerDashboard from './components/InfluencerDashboard';
import CampaignDetailPage from './components/CampaignDetailPage';
import InfluencerProfilePage from './components/InfluencerProfilePage';
import InfluencerCatalogPage from './components/InfluencerCatalogPage';
import ProjectExchangePage from './components/ProjectExchangePage';
import BrandSignUpPage from './components/BrandSignUpPage';
import InfluencerSignUpPage from './components/InfluencerSignupPage';



function App() {
  const [isBrandLoggedIn, setIsBrandLoggedIn] = useState(() => localStorage.getItem('isBrandLoggedIn') === 'true');
  const [influencerUser, setInfluencerUser] = useState(() => JSON.parse(localStorage.getItem('influencerUser')) || null);

  useEffect(() => {
    localStorage.setItem('isBrandLoggedIn', isBrandLoggedIn);
  }, [isBrandLoggedIn]);

  useEffect(() => {
    if (influencerUser) {
      localStorage.setItem('influencerUser', JSON.stringify(influencerUser));
    } else {
      localStorage.removeItem('influencerUser');
    }
  }, [influencerUser]);

  const handleBrandLoginSuccess = () => setIsBrandLoggedIn(true);
  const handleBrandLogout = () => setIsBrandLoggedIn(false);
  const handleInfluencerLoginSuccess = (user) => setInfluencerUser(user);
  const handleInfluencerLogout = () => setInfluencerUser(null);

  return (
    <BrowserRouter>
      <div className="App">
        {/* The Toaster component is placed here to be available on all pages */}
        <Toaster position="top-center" reverseOrder={false} />
        
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<LandingPage />} />
          
          {/* --- BRAND ROUTES --- */}
          <Route path="/brand/login" element={isBrandLoggedIn ? <Navigate to="/brand/dashboard" /> : <BrandLoginPage onLoginSuccess={handleBrandLoginSuccess} />} />
          <Route path="/brand/dashboard" element={isBrandLoggedIn ? <Dashboard onLogout={handleBrandLogout} /> : <Navigate to="/brand/login" />} />
          <Route path="/campaign/:campaignId/matches" element={isBrandLoggedIn ? <MatchPage /> : <Navigate to="/brand/login" />} />
          <Route path="/brand/campaign/:campaignId" element={isBrandLoggedIn ? <CampaignDetailPage /> : <Navigate to="/brand/login" />} />
          <Route path="/brand/catalog" element={isBrandLoggedIn ? <InfluencerCatalogPage /> : <Navigate to="/brand/login" />} />

          {/* --- INFLUENCER ROUTES --- */}
          <Route path="/influencer/login" element={influencerUser ? <Navigate to="/influencer/dashboard" /> : <InfluencerLoginPage onLoginSuccess={handleInfluencerLoginSuccess} />} />
          <Route path="/influencer/dashboard" element={influencerUser ? <InfluencerDashboard user={influencerUser} onLogout={handleInfluencerLogout} /> : <Navigate to="/influencer/login" />} />
          <Route path="/influencer/profile" element={influencerUser ? <InfluencerProfilePage user={influencerUser} /> : <Navigate to="/influencer/login" />} />
          <Route path="/influencer/exchange" element={influencerUser ? <ProjectExchangePage user={influencerUser} /> : <Navigate to="/influencer/login" />} />

          <Route path="*" element={<Navigate to="/" />} />

          <Route path="/brand/signup" element={<BrandSignUpPage />} />
          <Route path="/influencer/signup" element={<InfluencerSignUpPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;