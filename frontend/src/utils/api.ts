import axios from "axios";
import toast from "react-hot-toast";

// Check if we are running in demo mode
let isDemoMode = localStorage.getItem("demo_mode") === "true";

const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Setup mock state in localStorage
const getMockData = (key: string, defaultVal: any) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setMockData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Generate random short codes
const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 10);
};

// Synchronous SHA-256 implementation to secure passwords in frontend simulation
const sha256Sync = (ascii: string): string => {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const words: number[] = [];
  const asciiLength = ascii.length;
  for (let i = 0; i < asciiLength; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  
  const maxWords = ((asciiLength + 8) >> 6) * 16 + 16;
  while (words.length < maxWords) {
    words.push(0);
  }
  
  words[asciiLength >> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);
  words[maxWords - 1] = asciiLength * 8;
  
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    while (w.length < 64) {
      const s0 = rightRotate(w[w.length - 15], 7) ^ rightRotate(w[w.length - 15], 18) ^ (w[w.length - 15] >>> 3);
      const s1 = rightRotate(w[w.length - 2], 17) ^ rightRotate(w[w.length - 2], 19) ^ (w[w.length - 2] >>> 10);
      w.push((w[w.length - 16] + s0 + w[w.length - 7] + s1) | 0);
    }
    
    let [a, b, c, d, e, f, g, h0] = h;
    for (let j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h0 + S1 + ch + k[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      
      h0 = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + h0) | 0;
  }
  
  return h.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
};

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Synchronous mock router handler for offline / demo mode
const handleMockRequestSync = (config: any): { status: number; data: any } => {
  let url = config.url || "";
  const method = (config.method || "get").toLowerCase();
  
  // If url is absolute, extract path
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const urlObj = new URL(url);
      url = urlObj.pathname + urlObj.search;
    } catch (e) {
      console.error("Failed to parse mock URL", e);
    }
  }

  // Standardize URL: strip baseURL prefix if present
  if (url.startsWith("/api/v1")) {
    url = url.substring(7);
  }
  if (!url.startsWith("/")) {
    url = "/" + url;
  }

  const data = config.data ? (typeof config.data === "string" ? JSON.parse(config.data) : config.data) : {};

  // 1. Auth endpoints
  if (url === "/auth/register" && method === "post") {
    const user = {
      id: Math.random().toString(36).substring(7),
      name: data.name || "Demo User",
      email: data.email,
      role: "admin", // Make admin default in demo for quick dashboard inspection
      created_at: new Date().toISOString(),
    };
    setMockData("demo_user", user);
    localStorage.setItem("token", "mock-jwt-token");
    localStorage.setItem("user", JSON.stringify(user));
    return { status: 201, data: { user, token: "mock-jwt-token" } };
  }

  if (url === "/auth/login" && method === "post") {
    const user = getMockData("demo_user", {
      id: "demo-user-id",
      name: "Manoj Reddy",
      email: data.email || "manoj@example.com",
      role: "admin",
      created_at: new Date().toISOString(),
    });
    setMockData("demo_user", user);
    localStorage.setItem("token", "mock-jwt-token");
    localStorage.setItem("user", JSON.stringify(user));
    return { status: 200, data: { user, token: "mock-jwt-token" } };
  }

  if (url === "/auth/me" && method === "get") {
    let user = getMockData("demo_user", null);
    if (!user) {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          user = JSON.parse(stored);
          setMockData("demo_user", user);
        } catch (e) {}
      }
    }
    if (!user) return { status: 401, data: { error: "Unauthorized" } };
    return { status: 200, data: user };
  }

  // 2. API keys endpoints
  if (url === "/auth/keys" && method === "get") {
    const keys = getMockData("demo_keys", [
      { id: "key-1", name: "GitHub Action Deployment Key", last_used_at: new Date().toISOString(), created_at: new Date().toISOString() }
    ]);
    return { status: 200, data: keys };
  }

  if (url === "/auth/keys" && method === "post") {
    const keys = getMockData("demo_keys", []);
    const newKey = `sk_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const keyItem = {
      id: `key-${Math.random().toString(36).substring(5)}`,
      name: data.name || "Default Key",
      last_used_at: null,
      created_at: new Date().toISOString(),
    };
    setMockData("demo_keys", [keyItem, ...keys]);
    return { status: 201, data: { apiKey: newKey, name: keyItem.name } };
  }

  if (url.startsWith("/auth/keys/") && method === "delete") {
    const id = url.split("/").pop();
    const keys = getMockData("demo_keys", []);
    setMockData("demo_keys", keys.filter((k: any) => k.id !== id));
    return { status: 204, data: null };
  }

  // 3. Public redirect check (Place before general URL endpoints)
  if (url.startsWith("/urls/public/") && method === "get") {
    const shortCode = url.split("/")[3].split("?")[0];
    const urls = getMockData("demo_urls", []);
    const match = urls.find((u: any) => u.short_code === shortCode);
    if (!match) return { status: 404, data: { error: "URL not found" } };
    
    // Check if expired
    if (match.expires_at && new Date(match.expires_at) < new Date()) {
      return { status: 410, data: { error: "This link has expired." } };
    }

    // Check header for password submission
    const submittedPassword = config.headers?.["X-Link-Password"] || config.headers?.["x-link-password"];

    if (match.password_hash) {
      if (!submittedPassword) {
        return { status: 401, data: { error: "This link is password protected." } };
      }
      if (sha256Sync(submittedPassword) !== match.password_hash) {
        return { status: 401, data: { error: "Invalid password. Access denied." } };
      }
    }

    return {
      status: 200,
      data: {
        short_code: match.short_code,
        original_url: match.original_url,
        hasPassword: !!match.password_hash,
      }
    };
  }

  // 4. URL endpoints
  if (url === "/urls" && method === "post") {
    const urls = getMockData("demo_urls", []);
    const code = data.customAlias || generateRandomCode();
    
    // Check if alias is duplicate
    if (urls.some((u: any) => u.short_code === code)) {
      return { status: 409, data: { error: "Alias already taken" } };
    }

    let expiresAt: string | null = null;
    if (data.expiry && data.expiry !== "never") {
      if (data.expiry === "1m") {
        expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
      } else if (data.expiry === "5m") {
        expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      } else if (data.expiry === "20m") {
        expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
      } else if (data.expiry === "7d") {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (data.expiry === "30d") {
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (data.expiry === "365d") {
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        // Must be a custom ISO date/time string
        try {
          expiresAt = new Date(data.expiry).toISOString();
        } catch (e) {
          expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        }
      }
    }

    const newUrl = {
      id: Math.random().toString(36).substring(2, 15),
      short_code: code,
      original_url: data.originalUrl,
      title: data.title || new URL(data.originalUrl).hostname,
      // Save SHA-256 secure hash to protect password in local simulated binary storage
      password_hash: data.password ? sha256Sync(data.password) : null,
      expires_at: expiresAt,
      click_count: 0,
      created_at: new Date().toISOString(),
      shortUrl: `${window.location.origin}/r/${code}`,
    };
    setMockData("demo_urls", [newUrl, ...urls]);
    return { status: 201, data: newUrl };
  }

  if (url.startsWith("/urls") && method === "get") {
    const urls = getMockData("demo_urls", [
      {
        id: "1",
        short_code: "git",
        original_url: "https://github.com/dullamanojreddy/distributed-url-shortener",
        title: "Distributed URL Shortener Repository",
        password_hash: null,
        expires_at: null,
        click_count: 184,
        created_at: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
        shortUrl: `${window.location.origin}/r/git`,
      },
      {
        id: "2",
        short_code: "docker",
        original_url: "https://hub.docker.com",
        title: "Docker Registry Hub Documentation",
        password_hash: null,
        expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        click_count: 54,
        created_at: new Date(Date.now() - 10*24*60*60*1000).toISOString(),
        shortUrl: `${window.location.origin}/r/docker`,
      }
    ]);
    
    const parts = url.split("?")[0].split("/");
    // Get single URL: GET /urls/:shortCode
    if (parts.length > 2 && parts[2]) {
      const shortCode = parts[2];
      const match = urls.find((u: any) => u.short_code === shortCode);
      if (!match) return { status: 404, data: { error: "URL not found" } };
      return { status: 200, data: match };
    }

    setMockData("demo_urls", urls);
    return { status: 200, data: urls };
  }

  if (url.startsWith("/urls/") && method === "put") {
    const shortCode = url.split("/")[2];
    const urls = getMockData("demo_urls", []);
    const matchIdx = urls.findIndex((u: any) => u.short_code === shortCode);
    if (matchIdx === -1) return { status: 404, data: { error: "URL not found" } };
    
    urls[matchIdx] = {
      ...urls[matchIdx],
      original_url: data.originalUrl || urls[matchIdx].original_url,
      title: data.title || urls[matchIdx].title,
    };
    setMockData("demo_urls", urls);
    return { status: 200, data: { message: "Updated successfully" } };
  }

  if (url.startsWith("/urls/") && method === "delete") {
    const shortCode = url.split("/")[2];
    const urls = getMockData("demo_urls", []);
    setMockData("demo_urls", urls.filter((u: any) => u.short_code !== shortCode));
    return { status: 204, data: null };
  }

  // 5. QR Codes endpoints
  if (url.startsWith("/qr/")) {
    const shortCode = url.split("/")[2];
    const shortUrl = `${window.location.origin}/r/${shortCode}`;
    // Renders a real scannable QR code by embedding the public QR generation API in the image tag
    const qrSvgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="250" height="250"><rect width="250" height="250" fill="#ffffff"/><image href="https://api.qrserver.com/v1/create-qr-code/?size=250x250&amp;data=${encodeURIComponent(shortUrl)}" x="0" y="0" height="250" width="250"/></svg>`;
    return { status: 200, data: qrSvgString };
  }

  // 6. Analytics endpoints
  if (url.startsWith("/analytics/") && url.endsWith("/clicks")) {
    const mockClicks = [
      { id: "c1", browser: "Chrome", os: "Windows 11", device: "desktop", referer: "https://google.com", clicked_at: new Date(Date.now() - 50000).toISOString() },
      { id: "c2", browser: "Safari", os: "iOS 17", device: "mobile", referer: "direct", clicked_at: new Date(Date.now() - 120000).toISOString() },
      { id: "c3", browser: "Firefox", os: "Linux", device: "desktop", referer: "https://linkedin.com", clicked_at: new Date(Date.now() - 360000).toISOString() },
      { id: "c4", browser: "Edge", os: "Windows 11", device: "desktop", referer: "https://t.co", clicked_at: new Date(Date.now() - 860000).toISOString() },
      { id: "c5", browser: "Chrome Mobile", os: "Android 14", device: "mobile", referer: "https://github.com", clicked_at: new Date(Date.now() - 1440000).toISOString() }
    ];
    return { status: 200, data: { data: mockClicks } };
  }

  if (url.startsWith("/analytics/")) {
    const shortCode = url.split("/")[2];
    const urls = getMockData("demo_urls", []);
    const match = urls.find((u: any) => u.short_code === shortCode) || { click_count: 184 };
    
    const responseSummary = {
      shortCode,
      totalClicks: match.click_count || 184,
      browsers: [
        { browser: "Chrome", count: Math.ceil((match.click_count || 1) * 0.52) },
        { browser: "Safari", count: Math.ceil((match.click_count || 1) * 0.22) },
        { browser: "Firefox", count: Math.ceil((match.click_count || 1) * 0.12) },
        { browser: "Edge", count: Math.ceil((match.click_count || 1) * 0.08) },
        { browser: "Opera", count: Math.ceil((match.click_count || 1) * 0.06) }
      ],
      devices: [
        { device: "desktop", count: Math.ceil((match.click_count || 1) * 0.76) },
        { device: "mobile", count: Math.ceil((match.click_count || 1) * 0.20) },
        { device: "tablet", count: Math.ceil((match.click_count || 1) * 0.04) }
      ],
      operatingSystems: [
        { os: "Windows", count: Math.ceil((match.click_count || 1) * 0.48) },
        { os: "macOS", count: Math.ceil((match.click_count || 1) * 0.24) },
        { os: "Android", count: Math.ceil((match.click_count || 1) * 0.14) },
        { os: "iOS", count: Math.ceil((match.click_count || 1) * 0.10) },
        { os: "Linux", count: Math.ceil((match.click_count || 1) * 0.04) }
      ],
      clicksLast30Days: [
        { day: new Date(Date.now() - 4*24*60*60*1000).toISOString().split('T')[0], count: Math.ceil((match.click_count || 1) * 0.1) },
        { day: new Date(Date.now() - 3*24*60*60*1000).toISOString().split('T')[0], count: Math.ceil((match.click_count || 1) * 0.25) },
        { day: new Date(Date.now() - 2*24*60*60*1000).toISOString().split('T')[0], count: Math.ceil((match.click_count || 1) * 0.15) },
        { day: new Date(Date.now() - 1*24*60*60*1000).toISOString().split('T')[0], count: Math.ceil((match.click_count || 1) * 0.35) },
        { day: new Date().toISOString().split('T')[0], count: Math.ceil((match.click_count || 1) * 0.15) }
      ]
    };
    return { status: 200, data: responseSummary };
  }

  // 7. Admin Dashboard endpoints
  if (url === "/admin/users" && method === "get") {
    const users = getMockData("demo_users", [
      { id: "1", name: "System Admin", email: "admin@short.ly", role: "admin", is_active: true, created_at: new Date().toISOString(), url_count: 5 },
      { id: "2", name: "Demo Developer", email: "developer@short.ly", role: "user", is_active: true, created_at: new Date().toISOString(), url_count: 12 },
      { id: "3", name: "Spam Account", email: "spam@gmail.com", role: "user", is_active: false, created_at: new Date().toISOString(), url_count: 2 },
    ]);
    return { status: 200, data: users };
  }

  if (url.startsWith("/admin/users/") && method === "put") {
    return { status: 200, data: { message: "Status updated successfully" } };
  }

  if (url.startsWith("/admin/users/") && method === "delete") {
    return { status: 204, data: null };
  }

  if (url === "/admin/health/top-urls" && method === "get") {
    const top = [
      { short_code: "git", original_url: "https://github.com/dullamanojreddy", click_count: 184, created_at: new Date().toISOString() },
      { short_code: "docker", original_url: "https://hub.docker.com", click_count: 54, created_at: new Date().toISOString() }
    ];
    return { status: 200, data: top };
  }

  if (url === "/admin/health" && method === "get") {
    return {
      status: 200,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: { status: "up", latencyMs: 6 },
        redis: { status: "up", latencyMs: 1, keyCount: 42 },
        stats: {
          activeUrls: 254,
          activeUsers: 3,
          totalClicks: 238,
        }
      }
    };
  }

  return { status: 404, data: { error: "Not found" } };
};

// Response Interceptor: Handle auth errors and fallback to Mock database
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we are in demo mode, the mock request was already handled by handleMockRequestSync.
    // We just reject directly so the caller catches the mock error.
    if (isDemoMode) {
      return Promise.reject(error);
    }

    // If request failed because Nginx port 80 is not listening, or server returns 5xx error
    const isNetworkError = error.message === "Network Error" || !error.response;
    const isGatewayError = error.response && (error.response.status >= 500 && error.response.status <= 504);
    
    if (isNetworkError || isGatewayError) {
      if (!isDemoMode) {
        console.warn("API Connection failed. Activating local demo simulation mode.");
        localStorage.setItem("demo_mode", "true");
        isDemoMode = true;
        
        toast("Demo Mode Activated 🚀 (Docker daemon is offline. Running simulation mode locally.)", { duration: 6000, icon: "💡" });
      }

      let cleanUrl = error.config.url || "";
      if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
        try {
          const urlObj = new URL(cleanUrl);
          cleanUrl = urlObj.pathname + urlObj.search;
        } catch (e) {}
      }
      if (cleanUrl.startsWith("/api/v1")) {
        cleanUrl = cleanUrl.substring(7);
      }

      // Handle QR generation by fetching a real vector SVG from public API
      if (cleanUrl.startsWith("/qr/")) {
        try {
          const shortCode = cleanUrl.split("/")[2];
          const shortUrl = `${window.location.origin}/r/${shortCode}`;
          const res = await axios.get(
            `https://api.qrserver.com/v1/create-qr-code/?size=250x250&format=svg&data=${encodeURIComponent(shortUrl)}`
          );
          return Promise.resolve({
            data: res.data,
            status: 200,
            statusText: "OK",
            headers: {},
            config: error.config,
          });
        } catch (e) {
          console.error("Failed to fetch vector QR SVG in response interceptor", e);
        }
      }

      // Convert config mock request to response resolve/reject structure
      const mockRes = handleMockRequestSync(error.config);
      const axiosResponse = {
        data: mockRes.data,
        status: mockRes.status,
        statusText: mockRes.status >= 400 ? "Error" : "OK",
        headers: {},
        config: error.config,
      };

      if (mockRes.status >= 400) {
        return Promise.reject({ response: axiosResponse });
      }
      return Promise.resolve(axiosResponse);
    }

    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Do not redirect to login for public redirect requests (password checks)
      const reqUrl = error.config?.url || "";
      if (reqUrl.includes("/urls/public/")) {
        return Promise.reject(error);
      }

      if (!isDemoMode) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register") && window.location.pathname !== "/") {
          window.location.href = "/login?expired=true";
        }
      } else {
        const mockRes = handleMockRequestSync(error.config);
        const axiosResponse = {
          data: mockRes.data,
          status: mockRes.status,
          statusText: "OK",
          headers: {},
          config: error.config,
        };
        if (mockRes.status >= 400) {
          return Promise.reject({ response: axiosResponse });
        }
        return Promise.resolve(axiosResponse);
      }
    }
    return Promise.reject(error);
  }
);

// If the app starts up and demo mode was previously active, intercept and bypass requests directly
api.interceptors.request.use(
  (config) => {
    if (isDemoMode) {
      const mockRes = handleMockRequestSync(config);
      const axiosResponse = {
        data: mockRes.data,
        status: mockRes.status,
        statusText: mockRes.status >= 400 ? "Error" : "OK",
        headers: {},
        config,
      };
      
      // We return a custom adapter to bypass HTTP execution entirely
      config.adapter = async () => {
        let cleanUrl = config.url || "";
        if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
          try {
            const urlObj = new URL(cleanUrl);
            cleanUrl = urlObj.pathname + urlObj.search;
          } catch (e) {}
        }
        if (cleanUrl.startsWith("/api/v1")) {
          cleanUrl = cleanUrl.substring(7);
        }

        // Handle QR generation by fetching a real vector SVG from public API
        if (cleanUrl.startsWith("/qr/")) {
          try {
            const shortCode = cleanUrl.split("/")[2];
            const shortUrl = `${window.location.origin}/r/${shortCode}`;
            const res = await axios.get(
              `https://api.qrserver.com/v1/create-qr-code/?size=250x250&format=svg&data=${encodeURIComponent(shortUrl)}`
            );
            return {
              data: res.data,
              status: 200,
              statusText: "OK",
              headers: {},
              config,
            };
          } catch (e) {
            console.error("Failed to fetch vector QR SVG in request interceptor", e);
            const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="250" height="250"><rect width="250" height="250" fill="#ffffff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#333333">QR Code Error</text></svg>`;
            return {
              data: fallbackSvg,
              status: 200,
              statusText: "OK",
              headers: {},
              config,
            };
          }
        }

        if (mockRes.status >= 400) {
          return Promise.reject({ response: axiosResponse });
        }
        return Promise.resolve(axiosResponse);
      };
    }
    return config;
  }
);

export default api;
