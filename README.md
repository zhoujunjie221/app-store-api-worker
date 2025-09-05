# App Store API Worker

A Cloudflare Workers-based API for scraping app data from the iTunes App Store. This project provides a serverless, scalable solution for accessing App Store data with a simple REST API interface.

## ✨ Features

- 🚀 **Serverless**: Runs on Cloudflare Workers with global edge deployment
- 🔒 **Secure**: API key authentication for all endpoints
- 🌍 **Global**: Deployed to Cloudflare's worldwide edge network for low latency
- 💰 **Cost-effective**: Generous free tier (100,000 requests/day)
- 🔄 **Auto-deploy**: GitHub integration for automatic deployments
- ⚡ **Fast**: Sub-100ms response times from edge locations
- 📱 **Comprehensive**: All major App Store data endpoints supported
- 🛠️ **Easy to use**: RESTful API with Postman collection included

## 🙏 Acknowledgments

This project is built upon the excellent work of [app-store-scraper](https://github.com/facundoolano/app-store-scraper) by [Facundo Olano](https://github.com/facundoolano). The original project provided the core scraping logic and API structure that made this Cloudflare Workers adaptation possible.

**Original Project**: https://github.com/facundoolano/app-store-scraper

We've adapted the original Express.js-based server to run on Cloudflare Workers, adding:
- Serverless architecture
- Global edge deployment
- Enhanced security with API key authentication
- Improved performance and scalability
- Modern deployment workflows

## 🚀 Quick Start

### Option 1: Use Our Deployed API
You can immediately start using our deployed API:

**Base URL**: `https://app-store-api-worker.cloudmonitor.workers.dev`

**Authentication**: Include your API key in the `x-api-key` header

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://app-store-api-worker.cloudmonitor.workers.dev/app/553834731"
```

### Option 2: Deploy Your Own Instance

1. **Clone and setup**:
```bash
git clone https://github.com/zhoujunjie221/app-store-api-worker.git
cd app-store-api-worker
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env and set your API_KEY
```

3. **Deploy**:
```bash
npx wrangler login
npx wrangler secret put API_KEY
npx wrangler deploy
```

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Option 3: Test with Postman

1. Import the Postman collection: `App-Store-API-Worker.postman_collection.json`
2. Set your `baseUrl` and `apiKey` variables
3. Start testing all endpoints

📋 **For Postman setup guide, see [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)**

## Usage
Available methods:
- [app](#app): Retrieves the full detail of an application.
- [list](#list): Retrieves a list of applications from one of the collections at iTunes.
- [search](#search): Retrieves a list of apps that results of searching by the given term.
- [developer](#developer): Retrieves a list of apps by the given developer id.
- [privacy](#privacy): Display the privacy details for the app.
- [suggest](#suggest): Given a string returns up to 50 suggestions to complete a search query term.
- [similar](#similar): Returns the list of "customers also bought" apps shown in the app's detail page.
- [reviews](#reviews): Retrieves a page of reviews for the app.
- [ratings](#ratings): Retrieves the ratings for the app.
- [versionHistory](#versionHistory): Retrieves the version history for the app.

## 📋 API Endpoints

This API provides comprehensive access to iTunes App Store data:

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /app/:id` | Get app details | `/app/553834731?country=us&lang=en` |
| `GET /search` | Search for apps | `/search?term=candy%20crush&num=10` |
| `GET /list/:collection` | Get app collection | `/list/topfreeapplications?num=25` |
| `GET /developer/:devId` | Get developer apps | `/developer/526656015?country=us` |
| `GET /privacy/:id` | Get app privacy details | `/privacy/553834731?country=us` |
| `GET /reviews/:id` | Get app reviews | `/reviews/553834731?sort=recent&page=1` |
| `GET /similar/:id` | Get similar apps | `/similar/553834731?country=us` |
| `GET /version-history/:id` | Get app version history | `/version-history/553834731` |

### 🔑 Authentication

All requests require an API key in the `x-api-key` header:

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://your-worker.workers.dev/app/553834731"
```

### 📊 Common Parameters

- **`country`**: Country code (us, cn, jp, uk, etc.) - Default: `us`
- **`lang`**: Language code (en, zh, ja, etc.) - Default: `en`
- **`num`**: Number of results to return - Default: `50`
- **`sort`**: Sort order for reviews (`recent`, `helpful`) - Default: `recent`
- **`page`**: Page number for paginated results - Default: `1`

### 📱 Example App IDs

- `553834731` - Candy Crush Saga
- `6446115147` - Salmon – Finance Made Easy
- `284882215` - Facebook
- `389801252` - Instagram

## 💻 Usage Examples

### Basic cURL Examples

```bash
# Get app details
curl -H "x-api-key: YOUR_API_KEY" \
  "https://your-worker.workers.dev/app/553834731"

# Search for apps
curl -H "x-api-key: YOUR_API_KEY" \
  "https://your-worker.workers.dev/search?term=candy%20crush&num=10"

# Get top free apps
curl -H "x-api-key: YOUR_API_KEY" \
  "https://your-worker.workers.dev/list/topfreeapplications?num=25"

# Get developer apps
curl -H "x-api-key: YOUR_API_KEY" \
  "https://your-worker.workers.dev/developer/526656015"
```

### JavaScript/Node.js Example

```javascript
const API_BASE_URL = 'https://your-worker.workers.dev';
const API_KEY = 'your_api_key_here';

const headers = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json'
};

// Get app details
async function getAppDetails(appId) {
  const response = await fetch(`${API_BASE_URL}/app/${appId}`, { headers });
  return response.json();
}

// Search for apps
async function searchApps(term, num = 10) {
  const response = await fetch(`${API_BASE_URL}/search?term=${encodeURIComponent(term)}&num=${num}`, { headers });
  return response.json();
}

// Usage
getAppDetails('553834731').then(console.log);
searchApps('candy crush', 5).then(console.log);
```

### Python Example

```python
import requests

API_BASE_URL = 'https://your-worker.workers.dev'
API_KEY = 'your_api_key_here'

headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
}

def get_app_details(app_id):
    response = requests.get(f'{API_BASE_URL}/app/{app_id}', headers=headers)
    return response.json()

def search_apps(term, num=10):
    params = {'term': term, 'num': num}
    response = requests.get(f'{API_BASE_URL}/search', headers=headers, params=params)
    return response.json()

# Usage
app_data = get_app_details('553834731')
search_results = search_apps('candy crush', 5)
```

## 📊 Response Examples

### App Details Response
```json
{
  "id": 553834731,
  "appId": "com.midasplayer.apps.candycrushsaga",
  "title": "Candy Crush Saga",
  "url": "https://itunes.apple.com/us/app/candy-crush-saga/id553834731",
  "description": "Candy Crush Saga, from the makers of Candy Crush...",
  "icon": "https://is5.mzstatic.com/image/thumb/Purple30/v4/7a/e4/a9/...",
  "genres": ["Games", "Entertainment", "Puzzle", "Arcade"],
  "primaryGenre": "Games",
  "contentRating": "4+",
  "price": 0,
  "currency": "USD",
  "free": true,
  "developer": "King",
  "developerId": 526656015,
  "score": 4,
  "reviews": 818816,
  "screenshots": ["https://..."]
}
```

### Search Results Response
```json
[
  {
    "id": "553834731",
    "title": "Candy Crush Saga",
    "developer": "King",
    "price": 0,
    "icon": "https://...",
    "url": "https://..."
  }
]
```

## ⚠️ Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized - Invalid API Key"
}
```

**404 Not Found**
```json
{
  "error": "App not found (404)"
}
```

**500 Internal Server Error**
```json
{
  "error": "HTTP 403: Forbidden"
}
```

## 📚 Available Collections & Categories

### Collections (for `/list/:collection`)
- `topfreeapplications` - Top Free Apps
- `toppaidapplications` - Top Paid Apps
- `topgrossingapplications` - Top Grossing Apps
- `newfreeapplications` - New Free Apps
- `newpaidapplications` - New Paid Apps

### Categories (use with `category` parameter)
- `6014` - Games
- `6016` - Entertainment
- `6017` - Education
- `6018` - Photo & Video
- `6020` - Medical
- `6021` - Music
- `6022` - Productivity
- `6023` - Business

## 🚀 Performance & Limits

- **Response Time**: Sub-100ms from edge locations
- **Rate Limits**: 100,000 requests/day (Cloudflare Workers free tier)
- **Global Availability**: Deployed to 300+ edge locations worldwide
- **Uptime**: 99.9% availability guaranteed by Cloudflare

## 📖 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Complete deployment instructions
- **[Postman Collection](./POSTMAN_GUIDE.md)** - API testing with Postman
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the original [app-store-scraper](https://github.com/facundoolano/app-store-scraper) project for details.

## 🔗 Links

- **GitHub Repository**: https://github.com/zhoujunjie221/app-store-api-worker
- **Original Project**: https://github.com/facundoolano/app-store-scraper
- **Cloudflare Workers**: https://workers.cloudflare.com/
- **Live API**: https://app-store-api-worker.cloudmonitor.workers.dev

---

**Built with ❤️ using [Cloudflare Workers](https://workers.cloudflare.com/) and based on [app-store-scraper](https://github.com/facundoolano/app-store-scraper)**
