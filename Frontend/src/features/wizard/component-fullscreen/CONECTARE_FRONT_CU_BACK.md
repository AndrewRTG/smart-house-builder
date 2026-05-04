_______________________________________________________________________________
|                                                                             |
|             🚀 SMARTHOUSE WIZARD - BACKEND INTEGRATION GUIDE                |
|_____________________________________________________________________________|
|                                                                             |
|  [ 📌 OVERVIEW ]                                                            |
|  The Wizard is a standalone component designed to collect user preferences  |
|  and request recommended smart devices from the backend.[cite: 1, 3]       |
|                                                                             |
|  [ 🛠️ CONNECTION STEPS ]                                                     |
|                                                                             |
|  1. SET THE API ENDPOINT                                                    |
|     Inside fetchSuggestions() (SuggestedProductsView), update API_URL:      |
|     - Local Dev:  http://localhost:8080/api/recommendations[cite: 1]       |
|     - Production: https://api.yourdomain.com/v1/recommendations[cite: 1]   |
|                                                                             |
|  2. THE DATA PAYLOAD (POST)[cite: 1]                                       |
|     The backend expects a JSON object containing:                           |
|     - maxBudget  (Numeric value from slider)                                |
|     - ecosystem  (String: "Alexa", "Apple Home", etc.)                      |
|     - categories (Array of strings)                                         |
|     - techLevel  (String indicating expertise)                               |
|     - rooms      (Array of selected room IDs)                               |
|                                                                             |
|  3. EXPECTED BACKEND RESPONSE[cite: 1]                                     |
|     Ensure your API returns an array of objects:                            |
|     [                                                                       |
|       { "id", "name", "brand", "price", "category", "icon", "protocol" }    |
|     ]                                                                       |
|                                                                             |
|  [ 🏗️ IMPLEMENTATION PATTERN ]                                              |
|  - Trigger: Runs on results step or budget change.[cite: 1]                |
|  - Loading: setLoading(true) displays the animated spinner.[cite: 1]        |
|  - Fetch: Asynchronous call to the provided API_URL.[cite: 1]              |
|  - State: Data is stored in the local 'products' state.[cite: 1]           |
|                                                                             |
|  [ ⚠️ ERROR HANDLING ]                                                       |
|  - Errors are logged if status is not 200.[cite: 1]                        |
|  - !! ALWAYS ENABLE CORS !! on your server to allow requests.               |
|                                                                             |
|  [ 🎨 DESIGN TEAM NOTES ]                                                    |
|  - "Rooms" step uses .image-placeholder-frame (Dashed Frame).[cite: 2]     |
|  - Replace <span> icons with <img> when assets are ready.[cite: 1]         |
|_____________________________________________________________________________|