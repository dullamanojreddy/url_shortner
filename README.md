# 🚀 Distributed URL Shortener

A production-inspired **Distributed URL Shortener** built using a **Microservices Architecture**. The project demonstrates how modern backend systems are designed using independent services, asynchronous communication, caching, monitoring, containerization, and a centralized API gateway.

Unlike traditional URL shorteners, this project focuses on scalability, modularity, and observability while providing a clean dashboard for managing shortened links.

---

# ✨ Features

### 🔐 Authentication
- User Registration
- User Login
- JWT Authentication
- Protected APIs
- Role-based architecture (Admin/User ready)

---

### 🔗 URL Shortening
- Generate short URLs instantly
- Unique short code generation
- Original URL storage
- URL expiration support
- Creation timestamp
- Short URL generation
- Copy-friendly links

Example:

```
https://google.com

↓

http://localhost/Q3pmYUQT
```

---

### 🔁 Redirect Service
When a shortened URL is opened:

1. Receives request
2. Looks up original URL
3. Redirects user instantly
4. Records analytics event
5. Publishes click event to Kafka
6. Analytics service consumes event
7. Click stored in MySQL

---

### 📊 Analytics
Every click is tracked automatically.

Current analytics include:

- Browser
- Operating System
- Device Type
- Click Timestamp
- Original URL
- Short URL

Example Database Record

| Short URL | Browser | OS | Device | Time |
|-----------|----------|-----|---------|------|
| Q3pmYUQT | Chrome | Windows | Desktop | 2026-07-15 11:21 |

---

### ⚡ Redis Caching
Frequently accessed URLs are cached inside Redis.

Benefits:

- Faster redirects
- Reduced MySQL queries
- Lower latency
- Better scalability

---

### 📨 Kafka Event Streaming
Instead of writing analytics during redirects, click events are published to Kafka.

Flow:

```
Redirect Service
        │
        ▼
Kafka Topic
(url.clicks)
        │
        ▼
Analytics Service
        │
        ▼
MySQL
```

This keeps redirects extremely fast while analytics are processed asynchronously.

---

### 📈 Monitoring
Integrated monitoring stack includes:

- Prometheus
- Grafana

Prometheus continuously scrapes metrics from all services.

Grafana visualizes system performance.

Current metrics include:

- Service metrics
- Request metrics
- Redirect metrics
- Application health

---

### 🌐 API Gateway
Nginx serves as the centralized API Gateway.

Responsibilities:

- Reverse Proxy
- Route requests to services
- Single public endpoint
- Simplified architecture

---

### 🐳 Dockerized Architecture
Every component runs in its own Docker container.

Services include:

- Auth Service
- URL Service
- Redirect Service
- Analytics Service
- QR Service
- Admin Service
- MySQL
- Redis
- Kafka
- Zookeeper
- Nginx
- Prometheus
- Grafana

---

# 🖥 Current Frontend

The project currently includes a modern dashboard interface.

Features available:

- Dark professional UI
- Dashboard overview
- Sidebar navigation
- URL creation interface
- URL management table
- Search functionality
- Status indicators
- Expiration information
- Creation timestamps
- Remaining validity display

The UI is designed with a SaaS-inspired look similar to modern developer platforms and serves as the foundation for future analytics and monitoring pages.

---

# 🏗 Architecture

```
                    Client
                      │
                      ▼
                 Nginx Gateway
                      │
 ┌──────────────┬───────────────┬───────────────┐
 ▼              ▼               ▼               ▼
Auth        URL Service   Redirect Service  Analytics
                │               │               │
                ▼               ▼               ▼
             MySQL          Redis Cache      Kafka
                                  │             │
                                  └──────► Analytics
                                                │
                                                ▼
                                              MySQL

Prometheus
      │
      ▼
Grafana
```

---

# 🛠 Tech Stack

### Backend
- Node.js
- Express
- TypeScript

### Database
- MySQL

### Cache
- Redis

### Messaging
- Apache Kafka

### API Gateway
- Nginx

### Monitoring
- Prometheus
- Grafana

### Authentication
- JWT

### Containerization
- Docker
- Docker Compose

---

# 📂 Microservices

```
Auth Service
│
├── Register
├── Login
└── JWT Authentication

URL Service
│
├── Create Short URL
├── Manage URLs
└── Expiration Handling

Redirect Service
│
├── Resolve Short URL
├── Redis Cache
└── Kafka Event Publishing

Analytics Service
│
├── Consume Kafka Events
├── Store Click Data
└── Generate Analytics

QR Service
│
└── QR Code Support (Foundation)

Admin Service
│
└── Administrative APIs
```

---

# 📊 Monitoring Stack

The application includes production-style monitoring using:

- Prometheus
- Grafana

These tools monitor service metrics, application performance, and overall system health.

---

# 📁 Project Structure

```
distributed-url-shortener/
│
├── gateway/
├── services/
│   ├── auth-service/
│   ├── url-service/
│   ├── redirect-service/
│   ├── analytics-service/
│   ├── qr-service/
│   └── admin-service/
│
├── infrastructure/
│   ├── mysql/
│   ├── redis/
│   ├── monitoring/
│
├── docker-compose.yml
└── README.md
```

---

# 🚀 Current Status

### Completed

- Microservices Architecture
- JWT Authentication
- URL Shortening
- URL Redirection
- Click Tracking
- Browser Detection
- Device Detection
- OS Detection
- Redis Integration
- Kafka Event Streaming
- Prometheus Monitoring
- Grafana Dashboard
- Docker Deployment
- Modern Dashboard UI
- API Gateway
- MySQL Persistence

---

# 🔮 Future Enhancements

- Custom URL aliases
- Password-protected links
- QR code generation
- Advanced analytics dashboard
- Geographic click tracking
- Click history charts
- User profile management
- Team workspaces
- Rate limiting
- API keys
- Public REST API
- Cloud deployment (AWS/GCP/Azure)
- HTTPS support
- Custom domains
- Mobile-responsive enhancements
- CI/CD pipeline



---

# 👨‍💻 Author

**Dulla Manoj Reddy**

GitHub: https://github.com/dullamanojreddy

---

# ⭐ If you found this project useful, consider giving it a star!
