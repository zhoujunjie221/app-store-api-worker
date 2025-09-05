# App Store API Worker

A Cloudflare Workers-based API for scraping app data from the iTunes App Store. This project has been migrated from Express.js to run on Cloudflare Workers for better performance, scalability, and cost-effectiveness.

## Features

- 🚀 **Serverless**: Runs on Cloudflare Workers
- 🔒 **Secure**: API key authentication
- 🌍 **Global**: Deployed to Cloudflare's global edge network
- 💰 **Cost-effective**: Generous free tier
- 🔄 **Auto-deploy**: GitHub integration for automatic deployments

## Quick Start

### Deploy to Cloudflare Workers

1. **Clone and setup**:
```bash
git clone <your-repo-url>
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

## API Endpoints

This API provides the following endpoints for accessing iTunes App Store data:

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `GET /app/:id` | Get app details | `id`: App ID<br>Query params: `country`, `lang`, `ratings` |
| `GET /search` | Search for apps | Query params: `term`, `num`, `country`, `lang` |
| `GET /list/:collection` | Get app collection | `collection`: Collection name<br>Query params: `category`, `num`, `country` |
| `GET /developer/:devId` | Get developer apps | `devId`: Developer ID<br>Query params: `country`, `lang` |
| `GET /privacy/:id` | Get app privacy details | `id`: App ID<br>Query params: `country` |
| `GET /reviews/:id` | Get app reviews | `id`: App ID<br>Query params: `sort`, `page`, `country` |
| `GET /similar/:id` | Get similar apps | `id`: App ID<br>Query params: `country`, `lang` |
| `GET /version-history/:id` | Get app version history | `id`: App ID<br>Query params: `country` |

### Authentication

All API requests require an API key to be included in the request headers:

```
x-api-key: your_secret_api_key_here
```

### API Endpoints

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `GET /app/:id` | Get app details | `id`: App ID<br>Query params: `country`, `lang`, `ratings` |
| `GET /list/:collection` | Get app collection | `collection`: Collection name<br>Query params: `category`, `country`, `num` |
| `GET /search` | Search for apps | Query params: `term`, `num`, `page`, `country`, `lang` |
| `GET /developer/:devId` | Get developer apps | `devId`: Developer ID<br>Query params: `country`, `lang` |
| `GET /privacy/:id` | Get app privacy details | `id`: App ID |
| `GET /reviews/:id` | Get app reviews | `id`: App ID<br>Query params: `country`, `page`, `sort` |
| `GET /similar/:id` | Get similar apps | `id`: App ID<br>Query params: `country` |
| `GET /version-history/:id` | Get app version history | `id`: App ID<br>Query params: `country` |

### Example Requests

#### 1. Get App Details
```bash
curl -H "x-api-key: your_secret_api_key_here" http://localhost:8081/app/553834731
```

#### 2. Get App Details with Ratings
```bash
curl -H "x-api-key: your_secret_api_key_here" "http://localhost:8081/app/553834731?ratings=true"
```

#### 3. Search for Apps
```bash
curl -H "x-api-key: your_secret_api_key_here" "http://localhost:8081/search?term=candy%20crush&num=5&country=us"
```

#### 4. Get App Collection (Top Free Games)
```bash
curl -H "x-api-key: your_secret_api_key_here" "http://localhost:8081/list/topfreeapplications?category=6014&num=10&country=us"
```

#### 5. Get Developer Apps
```bash
curl -H "x-api-key: your_secret_api_key_here" "http://localhost:8081/developer/526656015?country=us"
```

#### 6. Get App Reviews
```bash
curl -H "x-api-key: your_secret_api_key_here" "http://localhost:8081/reviews/553834731?page=1&sort=recent&country=us"
```

#### 7. Get Similar Apps
```bash
curl -H "x-api-key: your_secret_api_key_here" "http://localhost:8081/similar/553834731?country=us"
```

#### 8. Get App Privacy Details
```bash
curl -H "x-api-key: your_secret_api_key_here" "http://localhost:8081/privacy/553834731"
```

#### 9. Get App Version History
```bash
curl -H "x-api-key: your_secret_api_key_here" "http://localhost:8081/version-history/553834731?country=us"
```

### Example Responses

#### Success Response (App Details)
```json
{
  "id": 553834731,
  "appId": "com.midasplayer.apps.candycrushsaga",
  "title": "Candy Crush Saga",
  "url": "https://itunes.apple.com/us/app/candy-crush-saga/id553834731?mt=8&uo=4",
  "description": "Candy Crush Saga, from the makers of Candy Crush ...",
  "icon": "http://is5.mzstatic.com/image/thumb/Purple30/v4/7a/e4/a9/7ae4a9a9-ff68-cbe4-eed6-fe0a246e625d/source/512x512bb.jpg",
  "genres": [ "Games", "Entertainment", "Puzzle", "Arcade" ],
  "genreIds": [ "6014", "6016", "7012", "7003" ],
  "primaryGenre": "Games",
  "primaryGenreId": 6014,
  "contentRating": "4+",
  "languages": [ "EN", "JA" ],
  "size": "73974859",
  "requiredOsVersion": "5.1.1",
  "released": "2012-11-14T14:41:32Z",
  "updated": "2016-05-31T06:39:52Z",
  "releaseNotes": "We are back with a tasty Candy Crush Saga update ...",
  "version": "1.76.1",
  "price": 0,
  "currency": "USD",
  "free": true,
  "developerId": 526656015,
  "developer": "King",
  "developerUrl": "https://itunes.apple.com/us/developer/king/id526656015?uo=4",
  "developerWebsite": null,
  "score": 4,
  "reviews": 818816,
  "currentVersionScore": 4.5,
  "currentVersionReviews": 1323,
  "screenshots": [
    "http://a3.mzstatic.com/us/r30/Purple49/v4/7a/8a/a0/7a8aa0ec-976d-801f-0bd9-7b753fdaf93c/screen1136x1136.jpeg"
  ]
}
```

#### Error Responses

**401 Unauthorized (Missing or Invalid API Key)**
```json
{
  "error": "Unauthorized - Invalid API Key"
}
```

**404 Not Found (App Not Found)**
```json
{
  "error": "App not found (404)"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "details": "Error message details"
}
```

### Complete API Usage Guide

#### Using with JavaScript/Node.js
```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8081';
const API_KEY = 'your_secret_api_key_here';

const headers = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json'
};

// Get app details
async function getAppDetails(appId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/app/${appId}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Search for apps
async function searchApps(term, num = 10) {
  try {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      headers,
      params: { term, num }
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Usage examples
getAppDetails('553834731').then(console.log);
searchApps('candy crush', 5).then(console.log);
```

#### Using with Python
```python
import requests

API_BASE_URL = 'http://localhost:8081'
API_KEY = 'your_secret_api_key_here'

headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
}

def get_app_details(app_id):
    try:
        response = requests.get(f'{API_BASE_URL}/app/{app_id}', headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
        return None

def search_apps(term, num=10):
    try:
        params = {'term': term, 'num': num}
        response = requests.get(f'{API_BASE_URL}/search', headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
        return None

# Usage examples
app_data = get_app_details('553834731')
search_results = search_apps('candy crush', 5)
```

#### Available Collections for /list endpoint
- `topfreeapplications` - Top Free Apps
- `toppaidapplications` - Top Paid Apps
- `topgrossingapplications` - Top Grossing Apps
- `newfreeapplications` - New Free Apps
- `newpaidapplications` - New Paid Apps

#### Available Categories (use with /list endpoint)
- `6014` - Games
- `6016` - Entertainment
- `6017` - Education
- `6018` - Photo & Video
- `6020` - Medical
- `6021` - Music
- `6022` - Productivity
- `6023` - Business
- `6024` - Reference
- `6025` - Travel
- `6026` - Utilities
- `6027` - Weather

### Method Documentation

### app
Retrieves the full detail of an application. Options:

* `id`: the iTunes "trackId" of the app, for example `553834731` for Candy Crush Saga. Either this or the `appId` should be provided.
* `appId`: the iTunes "bundleId" of the app, for example `com.midasplayer.apps.candycrushsaga` for Candy Crush Saga. Either this or the `id` should be provided.
* `country`: the two letter country code to get the app details from. Defaults to `us`. Note this also affects the language of the data.
* `lang`: language code for the result text. Defaults to undefined, so country specific language should be used automatically.
+ `ratings`: load additional ratings information like `ratings` number and `histogram`

Example:

```javascript
var store = require('app-store-scraper');

store.app({id: 553834731}).then(console.log).catch(console.log);
```

Results:

```javascript
{ id: 553834731,
  appId: 'com.midasplayer.apps.candycrushsaga',
  title: 'Candy Crush Saga',
  url: 'https://itunes.apple.com/us/app/candy-crush-saga/id553834731?mt=8&uo=4',
  description: 'Candy Crush Saga, from the makers of Candy Crush ...',
  icon: 'http://is5.mzstatic.com/image/thumb/Purple30/v4/7a/e4/a9/7ae4a9a9-ff68-cbe4-eed6-fe0a246e625d/source/512x512bb.jpg',
  genres: [ 'Games', 'Entertainment', 'Puzzle', 'Arcade' ],
  genreIds: [ '6014', '6016', '7012', '7003' ],
  primaryGenre: 'Games',
  primaryGenreId: 6014,
  contentRating: '4+',
  languages: [ 'EN', 'JA' ],
  size: '73974859',
  requiredOsVersion: '5.1.1',
  released: '2012-11-14T14:41:32Z',
  updated: '2016-05-31T06:39:52Z',
  releaseNotes: 'We are back with a tasty Candy Crush Saga update ...',
  version: '1.76.1',
  price: 0,
  currency: 'USD',
  free: true,
  developerId: 526656015,
  developer: 'King',
  developerUrl: 'https://itunes.apple.com/us/developer/king/id526656015?uo=4',
  developerWebsite: undefined,
  score: 4,
  reviews: 818816,
  currentVersionScore: 4.5,
  currentVersionReviews: 1323,
  screenshots:
   [ 'http://a3.mzstatic.com/us/r30/Purple49/v4/7a/8a/a0/7a8aa0ec-976d-801f-0bd9-7b753fdaf93c/screen1136x1136.jpeg',
     ... ],
  ipadScreenshots:
   [ 'http://a1.mzstatic.com/us/r30/Purple49/v4/db/45/cf/db45cff9-bdb6-0832-157f-ac3f14565aef/screen480x480.jpeg',
     ... ],
  appletvScreenshots: [],
  supportedDevices:
   [ 'iPhone-3GS',
     'iPadWifi',
     ... ]}
```

Example with `ratings` option:

```javascript
var store = require('app-store-scraper');

store.app({id: 553834731, ratings: true}).then(console.log).catch(console.log);
```

Results:

```javascript
{ id: 553834731,
  appId: 'com.midasplayer.apps.candycrushsaga',

  // ... like above

  ratings: 652230,
  histogram: {
    '1': 7004,
    '2': 6650,
    '3': 26848,
    '4': 140625,
    '5': 471103
  }
}
```

### list

Retrieves a list of applications from one of the collections at iTunes. Options:

* `collection`: the collection to look up. Defaults to `collection.TOP_FREE_IOS`, available options can be found [here](https://github.com/facundoolano/app-store-scraper/blob/master/lib/constants.js#L3).
* `category`: the category to look up. This is a number associated with the genre for the application. Defaults to no specific category. Available options can be found [here](https://github.com/facundoolano/app-store-scraper/blob/master/lib/constants.js#L19).
* `country`: the two letter country code to get the list from. Defaults to `us`.
* `lang`: language code for the result text. Defaults to undefined, so country specific language should be used automatically.
* `num`: the amount of elements to retrieve. Defaults to `50`, maximum
  allowed is `200`.
* `fullDetail`: If this is set to `true`, an extra request will be
  made to get extra attributes of the resulting applications (like
  those returned by the `app` method).

Example:

```js
var store = require('app-store-scraper');

store.list({
  collection: store.collection.TOP_FREE_IPAD,
  category: store.category.GAMES_ACTION,
  num: 2
})
.then(console.log)
.catch(console.log);
```

Returns:

```js
[ { id: '1091944550',
    appId: 'com.hypah.io.slither',
    title: 'slither.io',
    icon: 'http://is4.mzstatic.com/image/thumb/Purple30/v4/68/d7/4d/68d74df4-f4e7-d4a4-a8ea-dbab686e5554/mzl.ujmngosn.png/100x100bb-85.png',
    url: 'https://itunes.apple.com/us/app/slither.io/id1091944550?mt=8&uo=2',
    price: 0,
    currency: 'USD',
    free: true,
    description: 'Play against other people online! ...',
    developer: 'Steve Howse',
    developerUrl: 'https://itunes.apple.com/us/developer/steve-howse/id867992583?mt=8&uo=2',
    developerId: '867992583',
    genre: 'Games',
    genreId: '6014',
    released: '2016-03-25T10:01:46-07:00' },
  { id: '1046846443',
    appId: 'com.ubisoft.hungrysharkworld',
    title: 'Hungry Shark World',
    icon: 'http://is5.mzstatic.com/image/thumb/Purple60/v4/08/1a/8d/081a8d06-b4d5-528b-fa8e-f53646b6f797/mzl.ehtjvlft.png/100x100bb-85.png',
    url: 'https://itunes.apple.com/us/app/hungry-shark-world/id1046846443?mt=8&uo=2',
    price: 0,
    currency: 'USD',
    free: true,
    description: 'The stunning sequel to Hungry ...',
    developer: 'Ubisoft',
    developerUrl: 'https://itunes.apple.com/us/developer/ubisoft/id317644720?mt=8&uo=2',
    developerId: '317644720',
    genre: 'Games',
    genreId: '6014',
    released: '2016-05-04T09:43:06-07:00' } ]
```

### search

Retrieves a list of apps that results of searching by the given term. Options:

* `term`: the term to search for (required).
* `num`: the amount of elements to retrieve. Defaults to `50`.
* `page`: page of results to retrieve. Defaults to to `1`.
* `country`: the two letter country code to get the similar apps
  from. Defaults to `us`.
* `lang`: language code for the result text. Defaults to `en-us`.
* `idsOnly`: (optional, defaults to `false`): skip extra lookup request. Search results will contain array of application ids.

Example:

```js
var store = require('app-store-scraper');

store.search({
  term: 'panda',
  num: 2,
  page: 3,
  country : 'us',
  lang: 'lang'
})
.then(console.log)
.catch(console.log);
```

Results:

```js
[
  { id: 903990394,
    appId: 'com.pandarg.pxmobileapp',
    title: 'Panda Express Chinese Kitchen',
    (...)
  },
  {
    id: 700970012,
    appId: 'com.sgn.pandapop',
    title: 'Panda Pop',
    (...)
  }
]
```

### developer
Retrieves a list of applications by the give developer id. Options:

* `devId`: the iTunes "artistId" of the developer, for example `284882218` for Facebook.
* `country`: the two letter country code to get the app details from. Defaults to `us`. Note this also affects the language of the data.
* `lang`: language code for the result text. Defaults to undefined, so country specific language should be used automatically.

Example:

```javascript
var store = require('app-store-scraper');

store.developer({devId: 284882218}).then(console.log).catch(console.log);
```

Results:

```js
[
  { id: 284882215,
    appId: 'com.facebook.Facebook',
    title: 'Facebook',
    (...)
  },
  { id: 454638411,
    appId: 'com.facebook.Messenger',
    title: 'Messenger',
    (...)
  },
  (...)
]
```

### privacy

Retrieves the ratings for the app. Currently only for US App Store. Options:

* `id`: the iTunes "trackId" of the app, for example `553834731` for Candy Crush Saga.

Example:

```js
var store = require('app-store-scraper');

store.privacy({
  id: 324684580,
})
.then(console.log)
.catch(console.log);
```

Returns:

```js
{
  "managePrivacyChoicesUrl": null,
  "privacyTypes": [
    {
      "privacyType": "Data Used to Track You",
      "identifier": "DATA_USED_TO_TRACK_YOU",
      "description": "The following data may be used to track you across apps and websites owned by other companies:",
      "dataCategories": [
        {
          "dataCategory": "Contact Info",
          "identifier": "CONTACT_INFO",
          "dataTypes": [
            "Email Address",
            "Phone Number"
          ]
        },
        ...
      ],
      "purposes": []
    },
    ...
  ]
}
```

### suggest

Given a string returns up to 50 suggestions to complete a search query term.
A priority index is also returned which goes from `0` for terms with low traffic
to `10000` for the most searched terms.

Example:

```js
var store = require('app-store-scraper');

store.suggest({term: 'panda'}).then(console.log).catch(console.log);
```

Results:

```js
[
  { term: 'panda pop' },
  { term: 'panda pop free' },
  { term: 'panda' },
  { term: 'panda express' },
  { term: 'panda games' },
  { term: 'panda pop 2' },
  ...
]
```

### similar
Returns the list of "customers also bought" apps shown in the app's detail page. Options:

* `id`: the iTunes "trackId" of the app, for example `553834731` for Candy Crush Saga. Either this or the `appId` should be provided.
* `appId`: the iTunes "bundleId" of the app, for example `com.midasplayer.apps.candycrushsaga` for Candy Crush Saga. Either this or the `id` should be provided.

Example:

```js
var store = require('app-store-scraper');

store.similar({id: 553834731}).then(console.log).catch(console.log);
```

Results:

```js
[
  {
    id: 632285588,
    appId: 'com.nerdyoctopus.dots',
    title: 'Dots: A Game About Connecting',
    (...)
  },
  {
    id: 727296976,
    appId: 'com.sgn.cookiejam',
    title: 'Cookie Jam',
    (...)
  }
  (...)
]
```

### reviews

Retrieves a page of reviews for the app. Options:

* `id`: the iTunes "trackId" of the app, for example `553834731` for Candy Crush Saga. Either this or the `appId` should be provided.
* `appId`: the iTunes "bundleId" of the app, for example `com.midasplayer.apps.candycrushsaga` for Candy Crush Saga. Either this or the `id` should be provided.
* `country`: the two letter country code to get the reviews from. Defaults to `us`.
* `page`: the review page number to retrieve. Defaults to `1`, maximum allowed is `10`.
* `sort`: the review sort order. Defaults to `store.sort.RECENT`, available options are `store.sort.RECENT` and `store.sort.HELPFUL`.

Example:

```js
var store = require('app-store-scraper');

store.reviews({
  appId: 'com.midasplayer.apps.candycrushsaga',
  sort: store.sort.HELPFUL,
  page: 2
})
.then(console.log)
.catch(console.log);
```

Returns:

```js
[ { id: '1472864600',
    userName: 'Linda D. Lopez',
    userUrl: 'https://itunes.apple.com/us/reviews/id324568166',
    version: '1.80.1',
    score: 5,
    title: 'Great way to pass time or unwind',
    text: 'I was a fan of Bejeweled many moons ago...',
    updated: '2021-07-26T18:26:24-07:00',
    url: 'https://itunes.apple.com/us/review?id=553834731&type=Purple%20Software' },,
  { id: '1472864708',
    userName: 'Jennamaxkidd',
    userUrl: 'https://itunes.apple.com/us/reviews/id223990784',
    version: '1.80.1',
    score: 1,
    title: 'Help! THE PROBLEM IS NOT FIXED!',
    text: 'STILL HAVING THE SAME ISSUE.  It\'s happening again...',
    updated: '2021-07-26T18:04:41-07:00',
    url: 'https://itunes.apple.com/us/review?id=553834731&type=Purple%20Software' },
  (...)
]
```

### ratings

Retrieves the ratings for the app. Options:

* `id`: the iTunes "trackId" of the app, for example `553834731` for Candy Crush Saga. Either this or the `appId` should be provided.
* `appId`: the iTunes "bundleId" of the app, for example `com.midasplayer.apps.candycrushsaga` for Candy Crush Saga. Either this or the `id` should be provided.
* `country`: the two letter country code to get the reviews from. Defaults to `us`.

Example:

```js
var store = require('app-store-scraper');

store.ratings({
  appId: 'com.midasplayer.apps.candycrushsaga',
})
.then(console.log)
.catch(console.log);
```

Returns:

```js
{
  ratings: 652719,
  histogram: {
    '1': 7012,
    '2': 6655,
    '3': 26876,
    '4': 140680,
    '5': 471496
  }
}
```

### versionHistory

Retrieves the version history for the app. Options:

* `id`: the iTunes "trackId" of the app, for example `553834731` for Candy Crush Saga.

Example:

```js
var store = require('app-store-scraper');

store.versionHistory({
  id: 324684580,
})
.then(console.log)
.catch(console.log);
```

Returns:

```js
[
  {
    "versionDisplay": "3.416.0",
    "releaseNotes": "• Minor UI enhancements and bug fixes",
    "releaseDate": "2024-08-14",
    "releaseTimestamp": "2024-08-14T14:52:32Z"
  }
]
```

### Memoization

Since every library call performs one or multiple requests to
an iTunes API or web page, sometimes it can be useful to cache the results
to avoid requesting the same data twice. The `memoized` function returns the
store object that caches its results:

``` javascript
var store = require('app-store-scraper'); // regular non caching version
var memoized = require('app-store-scraper').memoized(); // cache with default options
var memoizedCustom = require('app-store-scraper').memoized({ maxAge: 1000 * 60 }); // cache with default options

memoized.app({id: 553834731}) // will make a request
  .then(() => memoized.app({id: 553834731})); // will resolve to the cached value without requesting
```

The options available are those supported by the [memoizee](https://github.com/medikoo/memoizee) module.
By default up to 1000 values are cached by each method and they expire after 5 minutes.
