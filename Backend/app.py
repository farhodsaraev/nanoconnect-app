from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

# --- DATABASE SETUP ---
app = Flask(__name__)
# This explicitly tells the server that for any route starting with /api/,
# it should accept requests from any origin (*), allowing all standard methods.
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Read the database URL from the environment variable
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- DATABASE MODELS ---
class BrandUser(db.Model):
    """
    Model for brand users who create campaigns
    Represents companies/brands looking to hire influencers
    """
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False) # Unique login identifier
    password_hash = db.Column(db.String(256)) # Hashed
    campaigns = db.relationship('Campaign', backref='brand', lazy=True) # One-to-many relationship: one brand can have multiple campaigns

    def set_password(self, password):
        # Creates a secure hash of the password
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        # Checks if the provided password matches the stored hash
        return check_password_hash(self.password_hash, password)

class Influencer(db.Model):
    """
    Model for influencer users who participate in campaigns
    Contains profile information and audience demographics
    """
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False) # Unique login identifier
    password_hash = db.Column(db.String(256)) # Hashed
    name = db.Column(db.String(80), nullable=False) # Display name for the influencer
    followers = db.Column(db.Integer, nullable=False) # Social media follower count
    location = db.Column(db.String(80), nullable=False) # Geographic location for targeting
    keywords = db.Column(db.String(200), nullable=False) # e.g., "food,coffee,restaurants"
    
    # The primary niche the influencer identifies with.
    niche = db.Column(db.String(80), nullable=True) # e.g., "Food & Drink"
    # The influencer's calculated engagement rate.
    engagement_rate = db.Column(db.Float, nullable=True)
    # A description of the influencer's primary audience.
    audience_age_range = db.Column(db.String(50), nullable=True) # e.g., "25-34"
    # The gender split of the audience.
    audience_gender_split = db.Column(db.String(50), nullable=True) # e.g., "60% Female, 40% Male"

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Campaign(db.Model):
    """
    Model for marketing campaigns created by brands
    Contains campaign details, targeting, and requirements
    """
    id = db.Column(db.Integer, primary_key=True) 
    name = db.Column(db.String(120), nullable=False) # Campaign title
    budget = db.Column(db.Float, nullable=False) # Payment per influencer
    brief = db.Column(db.Text, nullable=False) # Detailed campaign description and requirements
    brand_id = db.Column(db.Integer, db.ForeignKey('brand_user.id'), nullable=False) # Foreign key linking to the brand that created this campaign
    
    # --- CAMPAIGN MANAGEMENT FIELDS ---
    # The current state of the campaign. 
    status = db.Column(db.String(50), nullable=False, default='planning') # 'planning', 'active', 'completed'
    # The primary objective of the campaign.
    goal = db.Column(db.String(100), nullable=True) # e.g., "Brand Awareness", "Website Clicks"
    # Specific notes about the target audience for this campaign.
    target_audience_notes = db.Column(db.Text, nullable=True) # Detailed audience targeting description
    target_location = db.Column(db.String(100), nullable=True) # Geographic targeting for influencer matching
    # If true, this campaign will appear on the Project Exchange for influencers to apply to.
    is_public = db.Column(db.Boolean, default=False, nullable=False)

class Invite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    influencer_id = db.Column(db.Integer, db.ForeignKey('influencer.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')
    campaign = db.relationship('Campaign', backref='invites')
    influencer = db.relationship('Influencer', backref='invites')

class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invite_id = db.Column(db.Integer, db.ForeignKey('invite.id'), nullable=False)
    content_url = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending_review')
    invite = db.relationship('Invite', backref='submission', uselist=False)

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # The ID of the campaign the influencer is applying to.
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    # The ID of the influencer who is applying.
    influencer_id = db.Column(db.Integer, db.ForeignKey('influencer.id'), nullable=False)
    # The brand can later approve or reject this application.
    status = db.Column(db.String(50), nullable=False, default='pending') # 'pending', 'approved', 'rejected'

    # Define relationships to easily access campaign and influencer info
    campaign = db.relationship('Campaign', backref='applications')
    influencer = db.relationship('Influencer', backref='applications')

# --- API Endpoints ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    brand_user = BrandUser.query.filter_by(email=email).first()

    # Use the new check_password method
    if brand_user and brand_user.check_password(password):
        return jsonify({"message": "Login successful!"})
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/influencer/login', methods=['POST'])
def influencer_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = Influencer.query.filter_by(email=email).first()

    # Use the new check_password method
    if user and user.check_password(password):
        user_data = {"id": user.id, "email": user.email, "profile_id": user.id}
        return jsonify({"message": "Login successful!", "user": user_data})
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/campaigns', methods=['GET'])
def get_campaigns():
    all_campaigns = Campaign.query.all()
    campaigns_list = [{"id": c.id, "name": c.name, "budget": c.budget, "brief": c.brief} for c in all_campaigns]
    return jsonify(campaigns_list)

@app.route('/api/campaigns', methods=['POST'])
def create_campaign():
    # Get all the new data from the incoming request
    data = request.get_json()
    
    # Create a new Campaign object with all the new fields
    new_campaign = Campaign(
        name=data.get('name'),
        goal=data.get('goal'),
        target_audience_notes=data.get('targetAudience'),
        target_location=data.get('targetLocation'),
        brief=data.get('brief'),
        budget=float(data.get('budget')),
        is_public=data.get('isPublic', False), # Default to False if not provided
        brand_id=1 # Hardcoded for now, would come from logged-in user session
    )
    
    # Add to the database session and commit to save
    db.session.add(new_campaign)
    db.session.commit()
    
    # Return the data of the newly created campaign, including its new ID
    return jsonify({
        "id": new_campaign.id, 
        "name": new_campaign.name, 
        "goal": new_campaign.goal,
        "target_audience_notes": new_campaign.target_audience_notes,
        "brief": new_campaign.brief,
        "budget": new_campaign.budget
    }), 201

@app.route('/api/campaigns/<int:campaign_id>/details', methods=['GET'])
def get_campaign_details(campaign_id):
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    invites_data = []
    for invite in campaign.invites:
        # Find the first submission linked to this invite.
        submission = Submission.query.filter_by(invite_id=invite.id).first()
        
        invites_data.append({
            "invite_id": invite.id,
            "status": invite.status,
            "influencer": {
                "id": invite.influencer.id,
                "name": invite.influencer.name,
                "followers": invite.influencer.followers
            },
            # If a submission exists, include its id, url, and status. Otherwise, None.
            "submission_id": submission.id if submission else None,
            "submission_url": submission.content_url if submission else None,
            "submission_status": submission.status if submission else None
        })

    campaign_details = {
        "id": campaign.id, "name": campaign.name, "budget": campaign.budget,
        "brief": campaign.brief, "invites": invites_data
    }
    
    return jsonify(campaign_details)

@app.route('/api/campaigns/<int:campaign_id>/match', methods=['GET'])
def find_matches(campaign_id):
    # --- Step 1: Get the Campaign ---
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
    
    # Get the target location from the campaign itself.
    target_location = campaign.target_location
    if not target_location:
        return jsonify({"error": "This campaign has no target location specified."}), 400

    # --- Step 2: Normalize the Campaign Brief Keywords ---
    # This is our new, more robust text cleaning process.
    import string
    # First, remove all punctuation from the brief (e.g., "coffee." becomes "coffee")
    translator = str.maketrans('', '', string.punctuation)
    clean_brief = campaign.brief.lower().translate(translator)
    # Then, split into a set of unique words.
    campaign_keywords = set(clean_brief.split())

    # --- Step 3: Find All Potential Influencers ---
    all_influencers = Influencer.query.filter(Influencer.location.ilike(target_location)).all()

    # --- Step 4: Score Each Influencer ---
    matches = []
    for influencer in all_influencers:
        # Normalize the influencer's keywords by splitting AND stripping whitespace.
        # This turns "food, coffee, restaurants" into {'food', 'coffee', 'restaurants'}
        influencer_keywords = {kw.strip() for kw in influencer.keywords.lower().split(',')}
        
        # Calculate the score based on the intersection of the two sets.
        common_keywords = campaign_keywords.intersection(influencer_keywords)
        score = len(common_keywords)

        # Only include influencers who have at least one matching keyword.
        if score > 0:
            # Prepare the influencer data to be sent to the frontend.
            influencer_data = {
                "id": influencer.id, 
                "name": influencer.name, 
                "followers": influencer.followers,
                "location": influencer.location, 
                "niche": influencer.niche,
                "engagement_rate": influencer.engagement_rate,
                "keywords": [kw.strip() for kw in influencer.keywords.split(',')] # Send as a clean list
            }
            matches.append({"influencer": influencer_data, "match_score": score})
    
    # Sort the results from highest score to lowest.
    sorted_matches = sorted(matches, key=lambda x: x['match_score'], reverse=True)
    
    return jsonify(sorted_matches)

@app.route('/api/invites', methods=['POST'])
def create_invite():
    data = request.get_json()
    existing_invite = Invite.query.filter_by(campaign_id=data.get('campaignId'), influencer_id=data.get('influencerId')).first()
    if existing_invite: return jsonify({"message": "This influencer has already been invited."}), 200
    new_invite = Invite(campaign_id=data.get('campaignId'), influencer_id=data.get('influencerId'))
    db.session.add(new_invite)
    db.session.commit()
    return jsonify({"message": "Invitation sent successfully!", "invite_id": new_invite.id}), 201


# @app.route('/api/influencer/login', methods=['POST'])
# def influencer_login():
#     data = request.get_json()
#     email = data.get('email')
#     password = data.get('password')

#     # Step 1: Find the influencer by their unique email.
#     user = Influencer.query.filter_by(email=email).first()

#     # Step 2: Check if a user was found AND if their password matches.
#     if user and user.password == password:
#         user_data = {"id": user.id, "email": user.email, "profile_id": user.id}
#         return jsonify({"message": "Login successful!", "user": user_data})
#     else:
#         return jsonify({"error": "Invalid credentials"}), 401


@app.route('/api/influencer/profile', methods=['GET'])
def get_influencer_profile():
    # In a real app, we'd get the ID from a secure session/token.
    # For now, we'll get it from a query parameter, e.g., /api/influencer/profile?id=1
    influencer_id = request.args.get('id')
    if not influencer_id:
        return jsonify({"error": "Influencer ID is required"}), 400

    # Find the influencer in the database by their ID
    influencer = Influencer.query.get(influencer_id)
    if not influencer:
        return jsonify({"error": "Influencer not found"}), 404

    # Convert the influencer object to a dictionary to send as JSON
    profile_data = {
        "id": influencer.id,
        "name": influencer.name,
        "email": influencer.email,
        "followers": influencer.followers,
        "location": influencer.location,
        "keywords": influencer.keywords,
        "niche": influencer.niche,
        "engagement_rate": influencer.engagement_rate,
        "audience_age_range": influencer.audience_age_range,
        "audience_gender_split": influencer.audience_gender_split,
    }
    return jsonify(profile_data)

@app.route('/api/influencer/profile', methods=['PUT'])
def update_influencer_profile():
    # Get the ID from the query parameter
    influencer_id = request.args.get('id')
    if not influencer_id:
        return jsonify({"error": "Influencer ID is required"}), 400

    # Find the existing influencer record
    influencer = Influencer.query.get(influencer_id)
    if not influencer:
        return jsonify({"error": "Influencer not found"}), 404

    # Get the new data from the request body
    data = request.get_json()

    # Update each field if new data was provided for it
    influencer.name = data.get('name', influencer.name)
    influencer.location = data.get('location', influencer.location)
    influencer.keywords = data.get('keywords', influencer.keywords)
    influencer.niche = data.get('niche', influencer.niche)
    influencer.engagement_rate = data.get('engagement_rate', influencer.engagement_rate)
    influencer.audience_age_range = data.get('audience_age_range', influencer.audience_age_range)
    influencer.audience_gender_split = data.get('audience_gender_split', influencer.audience_gender_split)

    # Commit the changes to the database
    db.session.commit()

    # Send back a success message
    return jsonify({"message": "Profile updated successfully!"})

@app.route('/api/influencer/<int:influencer_id>/invitations', methods=['GET'])
def get_influencer_invitations(influencer_id):
    invites = Invite.query.filter_by(influencer_id=influencer_id).all()
    enriched_invites = [{"invite_id": invite.id, "status": invite.status, "campaign": {"id": invite.campaign.id, "name": invite.campaign.name, "budget": invite.campaign.budget, "brief": invite.campaign.brief}} for invite in invites]
    return jsonify(enriched_invites)

@app.route('/api/invites/<int:invite_id>', methods=['PUT'])
def update_invite_status(invite_id):
    data = request.get_json()
    invite = Invite.query.get(invite_id)
    if not invite: return jsonify({"error": "Invitation not found"}), 404
    invite.status = data.get('status')
    db.session.commit()
    return jsonify({"invite_id": invite.id, "status": invite.status})


@app.route('/api/influencer/<int:influencer_id>/projects', methods=['GET'])
def get_influencer_projects(influencer_id):
    """
    Gathers all projects associated with an influencer:
    - Direct invitations
    - Their applications to public campaigns
    """
    
    # --- Step 1: Get all direct invitations ---
    invites = Invite.query.filter_by(influencer_id=influencer_id).all()
    
    # --- Step 2: Get all their applications ---
    applications = Application.query.filter_by(influencer_id=influencer_id).all()

    # --- Step 3: Combine and format the data into a unified list ---
    projects = []

    # Process direct invitations
    for invite in invites:
        submission = Submission.query.filter_by(invite_id=invite.id).first()
        projects.append({
            "project_id": f"invite_{invite.id}", # Unique ID for the frontend
            "campaign_id": invite.campaign.id,
            "campaign_name": invite.campaign.name,
            "campaign_brief": invite.campaign.brief,
            "budget": invite.campaign.budget,
            "status": invite.status, # 'pending', 'accepted', 'declined'
            "submission_status": submission.status if submission else None,
            "type": "invitation"
        })

    # Process their applications
    for app in applications:
        # Avoid showing an application if it was approved (it's now an 'invite')
        if app.status == 'approved':
            continue
            
        projects.append({
            "project_id": f"app_{app.id}",
            "campaign_id": app.campaign.id,
            "campaign_name": app.campaign.name,
            "campaign_brief": app.campaign.brief,
            "budget": app.campaign.budget,
            "status": app.status, # 'pending', 'rejected'
            "submission_status": None,
            "type": "application"
        })

    return jsonify(projects)

@app.route('/api/submissions', methods=['POST'])
def create_submission():
    data = request.get_json()
    invite = Invite.query.filter_by(campaign_id=data.get('campaignId'), influencer_id=data.get('influencerId'), status='accepted').first()
    if not invite: return jsonify({"error": "No accepted invitation found for this submission."}), 404
    new_submission = Submission(invite_id=invite.id, content_url=data.get('contentUrl'))
    db.session.add(new_submission)
    db.session.commit()
    return jsonify({"submission_id": new_submission.id}), 201

@app.route('/api/influencers/search', methods=['GET'])
def search_influencers():
    # This endpoint will build a database query dynamically based on the filters provided.
    
    # --- Step 1: Start with a base query for all influencers ---
    # This is the starting point before we add any filters.
    query = Influencer.query

    # --- Step 2: Get all possible filters from the request's query parameters ---
    # e.g., /api/influencers/search?niche=Food%20&%20Drink&location=Austin
    niche_filter = request.args.get('niche')
    location_filter = request.args.get('location')
    min_followers_filter = request.args.get('min_followers')
    max_followers_filter = request.args.get('max_followers')

    # --- Step 3: Dynamically add filters to the query if they exist ---
    
    # If a 'niche' filter was provided in the URL...
    if niche_filter:
        # ...add a filter to our query. We use .ilike() for case-insensitive matching.
        query = query.filter(Influencer.niche.ilike(f'%{niche_filter}%'))

    # If a 'location' filter was provided...
    if location_filter:
        # ...add a case-insensitive filter for the location.
        query = query.filter(Influencer.location.ilike(f'%{location_filter}%'))

    # If a 'min_followers' filter was provided...
    if min_followers_filter:
        # ...add a filter for influencers with followers greater than or equal to the value.
        # We convert the value to an integer.
        query = query.filter(Influencer.followers >= int(min_followers_filter))

    # If a 'max_followers' filter was provided...
    if max_followers_filter:
        # ...add a filter for influencers with followers less than or equal to the value.
        query = query.filter(Influencer.followers <= int(max_followers_filter))

    # --- Step 4: Execute the final, constructed query ---
    # The 'query' variable now has all the requested filters applied.
    filtered_influencers = query.all()

    # --- Step 5: Convert the results to a JSON-friendly format ---
    # We create a list of dictionaries to send to the frontend.
    results = [
        {
            "id": inf.id,
            "name": inf.name,
            "followers": inf.followers,
            "location": inf.location,
            "niche": inf.niche,
            "engagement_rate": inf.engagement_rate,
            "keywords": [kw.strip() for kw in inf.keywords.split(',')]
        } for inf in filtered_influencers
    ]

    # Return the final list of results.
    return jsonify(results)

@app.route('/api/campaigns/public', methods=['GET'])
def get_public_campaigns():
    """Returns a list of all campaigns marked as public."""
    # Query the database for all campaigns where is_public is True.
    public_campaigns = Campaign.query.filter_by(is_public=True).all()

    # Convert the results to a JSON-friendly format.
    results = [
        {
            "id": c.id,
            "name": c.name,
            "goal": c.goal,
            "brief": c.brief,
            "budget": c.budget,
            "target_location": c.target_location,
            # We can even include the brand's name later if we add it to the BrandUser model.
            "brand_name": "A Great Brand" 
        } for c in public_campaigns
    ]
    return jsonify(results)

@app.route('/api/applications', methods=['POST'])
def create_application():
    """Allows an influencer to apply for a public campaign."""
    data = request.get_json()
    campaign_id = data.get('campaignId')
    influencer_id = data.get('influencerId')

    # Prevent duplicate applications.
    existing_application = Application.query.filter_by(
        campaign_id=campaign_id, 
        influencer_id=influencer_id
    ).first()
    if existing_application:
        return jsonify({"message": "You have already applied to this campaign."}), 409 # 409 Conflict

    # Create a new Application record in the database.
    new_application = Application(campaign_id=campaign_id, influencer_id=influencer_id)
    db.session.add(new_application)
    db.session.commit()

    print(f"New Application: Influencer #{influencer_id} applied to Campaign #{campaign_id}")
    return jsonify({"message": "Application submitted successfully!", "application_id": new_application.id}), 201

@app.route('/api/campaigns/<int:campaign_id>/applications', methods=['GET'])
def get_campaign_applications(campaign_id):
    """Returns all applications for a specific campaign."""
    # Find the campaign to ensure it exists.
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    # The 'applications' backref from our Campaign model makes this easy.
    # We will gather all applications and enrich them with influencer details.
    applications_data = [
        {
            "application_id": app.id,
            "status": app.status,
            "influencer": {
                "id": app.influencer.id,
                "name": app.influencer.name,
                "followers": app.influencer.followers,
                "niche": app.influencer.niche,
                "engagement_rate": app.influencer.engagement_rate
            }
        } for app in campaign.applications
    ]
    return jsonify(applications_data)

@app.route('/api/applications/<int:application_id>', methods=['PUT'])
def update_application_status(application_id):
    """Updates the status of an application (e.g., to 'approved' or 'rejected')."""
    data = request.get_json()
    new_status = data.get('status')

    # Find the application by its ID.
    application = Application.query.get(application_id)
    if not application:
        return jsonify({"error": "Application not found"}), 404

    if new_status not in ['approved', 'rejected']:
        return jsonify({"error": "Invalid status"}), 400

    # Update the status in the database.
    application.status = new_status
    db.session.commit()

    # If an application is approved, we should also create an 'Invite' record
    # to signify that this influencer is now officially part of the campaign.
    if new_status == 'approved':
        # Check if an invite already exists to avoid duplicates.
        existing_invite = Invite.query.filter_by(
            campaign_id=application.campaign_id,
            influencer_id=application.influencer_id
        ).first()
        if not existing_invite:
            new_invite = Invite(
                campaign_id=application.campaign_id,
                influencer_id=application.influencer_id,
                status='accepted' # The invite is automatically accepted upon approval
            )
            db.session.add(new_invite)
            db.session.commit()
            print(f"Created a new 'accepted' invite for approved application #{application.id}")

    return jsonify({"message": "Application status updated successfully."})


@app.route('/api/submissions/<int:submission_id>', methods=['PUT'])
def update_submission_status(submission_id):
    """Updates the status of a content submission."""
    data = request.get_json()
    new_status = data.get('status')

    # Find the submission by its ID.
    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({"error": "Submission not found"}), 404

    if new_status not in ['approved', 'revision_requested']:
        return jsonify({"error": "Invalid status"}), 400

    # Update the status and commit to the database.
    submission.status = new_status
    db.session.commit()

    print(f"Submission #{submission.id} status updated to '{new_status}'")
    return jsonify({"message": "Submission status updated successfully."})

# --- REGISTRATION ENDPOINTS ---

@app.route('/api/register', methods=['POST'])
def register_brand():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Check if a user with this email already exists
    if BrandUser.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    # Create the new user and set their hashed password
    new_brand = BrandUser(email=email)
    new_brand.set_password(password)
    db.session.add(new_brand)
    db.session.commit()
    
    return jsonify({"message": "Brand account created successfully!"}), 201

# --- Find and replace this entire function ---

@app.route('/api/influencer/register', methods=['POST'])
def register_influencer():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if Influencer.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    # We now provide default values for all the "not-null" fields.
    new_influencer = Influencer(
        email=email, 
        name=name,
        followers=0, # Default to 0 followers
        location='Not Set', # Provide a default string
        keywords='new user, profile not updated' # Provide default keywords
    )
    new_influencer.set_password(password)
    db.session.add(new_influencer)
    db.session.commit()

    return jsonify({"message": "Influencer account created successfully!"}), 201

# --- DATABASE COMMANDS ---
@app.cli.command('init-db')
def init_db_command():
    db.create_all()
    print('Initialized the database.')

# @app.cli.command('seed-db')
# def seed_db_command():
#     """Seeds the database with initial test data including new fields."""
#     # Create test brand user
#     if not BrandUser.query.filter_by(email='brand@test.com').first():
#         db.session.add(BrandUser(email='brand@test.com', password='password123'))

#     # Create test influencers with new, detailed data
#     if not Influencer.query.filter_by(email='austinfoodie@test.com').first():
#         db.session.add(Influencer(
#             email='austinfoodie@test.com', password='password123', name='AustinFoodie', 
#             followers=5500, location='Austin', keywords='food,coffee,restaurants',
#             niche='Food & Drink', engagement_rate=4.5, audience_age_range='25-34', audience_gender_split='70% Female, 30% Male'
#         ))
#         print('Created influencer: AustinFoodie.')

#     if not Influencer.query.filter_by(email='atxeats@test.com').first():
#         db.session.add(Influencer(
#             email='atxeats@test.com', password='password123', name='ATX_Eats', 
#             followers=8200, location='Austin', keywords='food,tacos,bbq,brunch',
#             niche='Food & Drink', engagement_rate=5.1, audience_age_range='18-24', audience_gender_split='55% Female, 45% Male'
#         ))
#         print('Created influencer: ATX_Eats.')
    
#     if not Influencer.query.filter_by(email='texasfitfam@test.com').first():
#         db.session.add(Influencer(
#             email='texasfitfam@test.com', password='password123', name='TexasFitFam', 
#             followers=9100, location='Austin', keywords='fitness,health,gym,workout',
#             niche='Health & Fitness', engagement_rate=3.8, audience_age_range='25-34', audience_gender_split='50% Female, 50% Male'
#         ))
#         print('Created influencer: TexasFitFam.')

#     db.session.commit()
#     print('Database seeded!')

@app.cli.command('seed-db')
def seed_db_command():
    """Seeds the database with hashed passwords."""
    if not BrandUser.query.filter_by(email='brand@test.com').first():
        brand = BrandUser(email='brand@test.com')
        brand.set_password('password123') # Use the new method
        db.session.add(brand)

    if not Influencer.query.filter_by(email='austinfoodie@test.com').first():
        influencer = Influencer(email='austinfoodie@test.com', name='AustinFoodie', followers=5500, location='Austin', keywords='food,coffee,restaurants', niche='Food & Drink', engagement_rate=4.5, audience_age_range='25-34', audience_gender_split='70% Female, 30% Male')
        influencer.set_password('password123') # Use the new method
        db.session.add(influencer)
    # ... (add other influencers similarly if you wish)
    db.session.commit()
    print('Database seeded with hashed passwords!')

if __name__ == '__main__':
    app.run(port=5000, debug=True)