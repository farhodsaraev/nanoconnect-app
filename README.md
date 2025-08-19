NanoConnect: Influencer Marketing Platform
- NanoConnect is a full-stack web application designed to be a marketplace connecting brands with influencers. It provides a seamless workflow for brands to create marketing campaigns and discover relevant influencers, and for influencers to manage collaboration invitations and submit their creative work.

Core Features
For Brands:
- Authentication: Secure login portal for brand users.
- Campaign Dashboard: View a list of all created campaigns with key details.
- Campaign Creation: An intuitive multi-step wizard to create new campaigns, specifying goals, budget, target audience, and a creative brief.
- Influencer Matching: A powerful matching algorithm that finds and ranks relevant influencers based on keywords in the campaign brief.
- Campaign Details: A detailed view of each campaign's progress, including a list of invited influencers, their response status (pending, accepted, declined), and links to submitted content.
- Invite System: Easily send collaboration invitations to matched influencers.

For Influencers
- Authentication: Secure login portal for influencers.
- Profile Management: Influencers can create and update their public profile, including their niche, location, keywords, engagement rate, and audience demographics.
- Invitations Dashboard: View and manage incoming campaign invitations. Influencers can accept or decline offers.
- Active Campaigns: A dedicated section to track all accepted campaigns.
- Content Submission: A simple modal to submit the URL of the created content for a specific campaign.

technology Stack
Backend:
- Framework: Python, Flask
- Database: PostgreSQL (or any other SQLAlchemy-compatible DB)
- ORM: Flask-SQLAlchemy
- Environment Variables: python-dotenv
- CORS: Flask-CORS
Frontend:
- Library: React.js
- Routing: React Router (react-router-dom)
- Notifications: React Hot Toast
- Styling: CSS
Database Management:
- Custom Flask CLI commands for database initialization (init-db) and seeding (seed-db)."# nanoconnect-app" 
"# nanoconnect-app" 
