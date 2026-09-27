ZEVORA 8 — THE LIVING ATELIER

WHAT IS NEW
- Complete ivory / espresso / champagne editorial redesign and responsive mobile layout.
- The Heirloom Code: private, interactive story-to-stone design ritual; symbol/metal/piece selector; deterministic design direction; downloadable story passport; transfer into Dream Studio.
- Preserves catalogue, country pricing, sketch canvas, AI sketch-render integration, five-finger illustrative ring try-on, favourites and demo admin.

DEPLOYMENT
1. Extract ZIP. Upload the FILES (not ZIP) to the ROOT of your GitHub repository.
2. To use AI image generation, use the Node WEB SERVICE described in SETUP_ON_RENDER.txt, not a static Render site. Set OPENAI_API_KEY and ENABLE_PUBLIC_GENERATION=true in Render environment; do not put your API key in GitHub or the browser. This is a paid API feature.
3. Test site and API after Render deployment. No API key is included.

HONEST LIMITATIONS
- Story-to-stone creates a personalized creative design brief, NOT a new AI render by itself. AI rendering uses the existing /api/render-sketch backend and only works after setup.
- Five-finger try-on is 2D landmark-assisted preview, not accurate 3D AR or sizing.
- Catalogue photos and indicative prices are inherited from prior versions. Admin PIN/pricing are browser-local, not a secure centralized production admin.
- The website does not automatically send enquiries, take payments or arrange manufacturing.
- We cannot establish that any concept is the first of its kind in the global jewellery industry.
