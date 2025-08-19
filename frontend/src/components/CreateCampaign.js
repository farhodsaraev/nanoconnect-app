import React, { useState } from 'react';
import toast from 'react-hot-toast';
import './CreateCampaign.css';

function CreateCampaign({ onCancel, onCampaignCreated }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    goal: 'Brand Awareness',
    targetAudience: '',
    targetLocation: 'Austin',
    budget: '',
    brief: '',
    isPublic: false // Initial state is a correct boolean
  });
  const [error, setError] = useState('');

  const nextStep = () => setStep(prevStep => prevStep + 1);
  const prevStep = () => setStep(prevStep => prevStep - 1);

  // --- THIS IS THE CORRECTED FUNCTION ---
  const handleChange = (input) => (e) => {
    // We check the type of the input element.
    // If it's a checkbox, we use its 'checked' property, which is a true boolean (true/false).
    // For all other inputs, we use the standard 'value'.
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    // This now correctly sets 'isPublic' to true or false in our state.
    setFormData({ ...formData, [input]: value });
  };

  const handleSubmit = () => {
    setError('');
    // Now, JSON.stringify(formData) will correctly send {"isPublic": true} or {"isPublic": false}
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.error || 'Failed to create campaign.') });
      }
      return response.json();
    })
    .then(newCampaign => {
      toast.success('Campaign created successfully!');
      onCampaignCreated(newCampaign);
    })
    .catch(err => {
      setError(err.message);
      toast.error('Could not create campaign.');
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <div className="input-group">
              <label htmlFor="campaign-name">Campaign Name</label>
              <input id="campaign-name" type="text" value={formData.name} onChange={handleChange('name')} placeholder="e.g., Austin Summer Coffee Promo" />
            </div>
            <div className="input-group">
              <label htmlFor="goal">Primary Goal</label>
              <select id="goal" value={formData.goal} onChange={handleChange('goal')}>
                <option value="Brand Awareness">Brand Awareness</option>
                <option value="Website Clicks">Website Clicks</option>
                <option value="Sales & Conversions">Sales & Conversions</option>
                <option value="User Generated Content">User Generated Content</option>
              </select>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <div className="input-group">
              <label htmlFor="targetAudience">Describe Your Target Audience</label>
              <textarea id="targetAudience" rows="4" value={formData.targetAudience} onChange={handleChange('targetAudience')} placeholder="e.g., 'Young professionals aged 25-40 who enjoy artisan coffee and outdoor activities.'"></textarea>
            </div>
            <div className="input-group">
              <label htmlFor="targetLocation">Target Location</label>
              <input id="targetLocation" type="text" value={formData.targetLocation} onChange={handleChange('targetLocation')} placeholder="e.g., Austin" />
            </div>
             <div className="input-group">
              <label htmlFor="budget">Budget (per influencer)</label>
              <input id="budget" type="number" value={formData.budget} onChange={handleChange('budget')} placeholder="e.g., 150" />
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <div className="input-group">
              <label htmlFor="brief">Creative Brief</label>
              <textarea id="brief" rows="6" value={formData.brief} onChange={handleChange('brief')} placeholder="Describe the content you want influencers to create. Include keywords like 'food', 'coffee', etc."></textarea>
            </div>
            <div className="input-group" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <input type="checkbox" id="isPublic" checked={formData.isPublic} onChange={handleChange('isPublic')} style={{width: 'auto'}} />
              <label htmlFor="isPublic" style={{marginBottom: 0, fontWeight: 'normal'}}>List this campaign on the public Project Exchange</label>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>
        );
      default:
        return <div>Something went wrong.</div>;
    }
  };

  return (
    <div className="create-campaign-modal">
      <div className="create-campaign-form">
        <header className="wizard-header">
          <h2>Create New Campaign</h2>
          <div className="step-indicator">
            <div className={`step ${step === 1 ? 'active' : ''}`}>Step 1: Basics</div>
            <div className={`step ${step === 2 ? 'active' : ''}`}>Step 2: Audience</div>
            <div className={`step ${step === 3 ? 'active' : ''}`}>Step 3: Creative</div>
          </div>
        </header>
        <main className="wizard-content">
          {renderStepContent()}
        </main>
        <footer className="wizard-actions">
          {step > 1 ? (<button className="wizard-button-prev" onClick={prevStep}>Back</button>) : (<div></div>)}
          {step < 3 && (<button className="wizard-button-next" onClick={nextStep}>Next</button>)}
          {step === 3 && (<button className="wizard-button-submit" onClick={handleSubmit}>Create Campaign</button>)}
        </footer>
      </div>
    </div>
  );
}

export default CreateCampaign;