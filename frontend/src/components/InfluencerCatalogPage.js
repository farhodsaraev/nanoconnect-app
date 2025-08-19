import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './InfluencerCatalogPage.css'; // Import our new styles
import LoadingSpinner from './LoadingSpinner';
import ApiErrorMessage from './ApiErrorMessage';

function InfluencerCatalogPage() {
  // State to hold the list of influencers returned from the API
  const [influencers, setInfluencers] = useState([]);
  
  // State for the filter values currently in the input fields
  const [filters, setFilters] = useState({
    niche: '',
    location: '',
    min_followers: '',
    max_followers: ''
  });
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // This function will be called to fetch data from the backend
  const fetchData = useCallback(() => {
    setIsLoading(true);

    // Use URLSearchParams to easily build the query string from our filters state
    const params = new URLSearchParams();
    // Only add a parameter if its value is not empty
    if (filters.niche) params.append('niche', filters.niche);
    if (filters.location) params.append('location', filters.location);
    if (filters.min_followers) params.append('min_followers', filters.min_followers);
    if (filters.max_followers) params.append('max_followers', filters.max_followers);

    // Fetch from our new search endpoint with the constructed query string
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/influencers/search?${params.toString()}`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch influencers.'))
      .then(data => {
        setInfluencers(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message || err);
        setIsLoading(false);
      });
  }, [filters]); // This function depends on the 'filters' state

  // Use useEffect to call fetchData when the component first loads
  useEffect(() => {
    fetchData();
  }, [fetchData]); // The dependency array includes fetchData

  // This function updates the filters state when a user types in an input
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };
  
  // This function is called when the form is submitted to trigger a new search
  const handleSearch = (e) => {
    e.preventDefault(); // Prevent the form from causing a page reload
    fetchData(); // Manually trigger a data fetch with the current filters
  };

  return (
    <div className="catalog-page">
      <aside className="filter-sidebar">
        <h2>Filters</h2>
        <form onSubmit={handleSearch}>
          <div className="filter-group">
            <label htmlFor="niche">Niche</label>
            <select id="niche" name="niche" value={filters.niche} onChange={handleFilterChange}>
              <option value="">All Niches</option>
              <option value="Food & Drink">Food & Drink</option>
              <option value="Health & Fitness">Health & Fitness</option>
              <option value="Travel">Travel</option>
              <option value="Fashion & Beauty">Fashion & Beauty</option>
              <option value="Gaming">Gaming</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="location">Location</label>
            <input type="text" id="location" name="location" value={filters.location} onChange={handleFilterChange} placeholder="e.g., Austin" />
          </div>
          <div className="filter-group">
            <label>Followers</label>
            <div className="follower-range">
              <input type="number" name="min_followers" value={filters.min_followers} onChange={handleFilterChange} placeholder="Min" />
              <span>-</span>
              <input type="number" name="max_followers" value={filters.max_followers} onChange={handleFilterChange} placeholder="Max" />
            </div>
          </div>
          <button type="submit" className="save-button" style={{width: '100%', marginTop: '10px'}}>Apply Filters</button>
        </form>
      </aside>

      <main className="results-area">
        {isLoading ? <LoadingSpinner /> : error ? <ApiErrorMessage error={error} /> : (
          <div className="results-grid">
            {influencers.length > 0 ? influencers.map(inf => (
              <div key={inf.id} className="influencer-card">
                <h3>{inf.name}</h3>
                <span className="niche-tag">{inf.niche}</span>
                <p className="stats">
                  <strong>{inf.followers.toLocaleString()}</strong> Followers &middot; <strong>{inf.engagement_rate}%</strong> ER
                </p>
                <p>{inf.location}</p>
              </div>
            )) : <p>No influencers found matching your criteria.</p>}
          </div>
        )}
      </main>
    </div>
  );
}

export default InfluencerCatalogPage;