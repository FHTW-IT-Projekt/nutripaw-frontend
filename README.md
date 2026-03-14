# 🐾 nutripaw-frontend

To ensure the frontend can communicate with the backend during development, you need to bypass **CORS (Cross-Origin Resource Sharing)** restrictions.

### 🛠️ Required Setup

1. **Install the Extension:** Download and install the [Allow CORS: Access-Control-Allow-Origin](https://chromewebstore.google.com/detail/lhobafahddgcelffkeicbaginigeejlf) extension for Chrome.
   
2. **Enable Communication:**
   * Open the extension settings.
   * Toggle the switch to **On** (usually turns colorful when active).
   * This allows the browser to accept headers from your local backend server.

> [!IMPORTANT]  
> Make sure to disable the extension when you are done developing or when browsing sensitive sites (like banking), as it bypasses standard web security protocols.