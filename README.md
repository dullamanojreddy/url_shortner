# 🚀 Distributed URL Shortener - Microservices Architecture

A production-style **distributed URL shortening platform** built using **microservices architecture** with authentication, caching, event-driven analytics, monitoring, and containerized deployment.

This project demonstrates real-world distributed system concepts such as:

- Microservices communication
- API Gateway pattern
- Redis caching
- Kafka event streaming
- Database design
- Observability
- Docker-based deployment

Inspired by systems like Bitly.

---

# 🏗️ Architecture Overview

```
                         Client
                           |
                           |
                     Nginx API Gateway
                           |
      ------------------------------------------------
      |          |          |        |        |
   Auth      URL        Redirect    QR     Admin
 Service   Service      Service  Service Service
      |          |          |
      |          |          |
      ----------- MySQL ----
                 |
              Redis Cache


Redirect Service
        |
        |
      Kafka
        |
        |
Analytics Consumer
        |
        |
      MySQL


Monitoring Layer:

Prometheus  --->  Grafana
```

---

# ✨ Features

## 🔗 URL Shortening

- Generate unique short URLs
- Convert long URLs into compact links
- Store URL information securely
- Redirect users instantly
- Support expiration handling

Example:

```
Original URL:

https://github.com


Generated:

http://localhost/Q3pdJRi2
```

---

# 🔐 Authentication System

Implemented using JWT authentication.

Features:

- User registration
- User login
- Secure authentication
- Protected APIs
- Role-based authorization

Roles:

```
User
Admin
```

---

# ⚡ High Performance Redirect System

Redirect flow:

```
User clicks short URL

        |
        ↓

Redirect Service

        |
        ↓

Check Redis Cache

        |
        |
    Cache Hit
        |
        ↓

Instant Redirect


    Cache Miss

        |
        ↓

    MySQL Lookup

        |
        ↓

    Update Redis

        |
        ↓

    Redirect User
```

Benefits:

- Faster response time
- Reduced database queries
- Better scalability

---

# 📊 Event Driven Analytics

Analytics processing is implemented using Apache Kafka.

Flow:

```
User Click

    |
    ↓

Redirect Service

    |
    ↓

Kafka Topic
(url.clicks)

    |
    ↓

Analytics Consumer

    |
    ↓

MySQL Analytics Database
```

Collected information:

- Browser
- Operating System
- Device type
- IP Address
- Referrer
- Click timestamp


Example:

```
Chrome | Windows | Desktop | 2026-07-15
```

---

# 🧩 Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| Nginx Gateway | 80 | API Gateway |
| Auth Service | 3001 | Authentication |
| URL Service | 3002 | URL creation |
| Analytics Service | 3003 | Click tracking |
| QR Service | 3004 | QR generation |
| Admin Service | 3005 | Administration |
| Redirect Service | 3006 | URL redirection |

---

# 🛠️ Technology Stack

## Backend

- Node.js
- TypeScript
- Express.js

## Database

- MySQL 8

## Cache

- Redis

## Messaging

- Apache Kafka
- Zookeeper

## Gateway

- Nginx

## Monitoring

- Prometheus
- Grafana

## Deployment

- Docker
- Docker Compose

---

# 🐳 Docker Deployment

The complete application runs using Docker Compose.

Included containers:

```
✓ Nginx
✓ Auth Service
✓ URL Service
✓ Redirect Service
✓ Analytics Service
✓ QR Service
✓ Admin Service
✓ MySQL
✓ Redis
✓ Kafka
✓ Zookeeper
✓ Prometheus
✓ Grafana
```

---

# 🚀 Running the Project

Clone repository:

```bash
git clone https://github.com/dullamanojreddy/url_shortner.git
```

Move into project:

```bash
cd url_shortner
```

Build and start:

```bash
docker compose up --build
```

Run in background:

```bash
docker compose up -d
```

Check running services:

```bash
docker compose ps
```

---

# 🔄 Request Flow

## Creating Short URL

```
Client

 ↓

Nginx

 ↓

URL Service

 ↓

Generate Short Code

 ↓

Store in MySQL

 ↓

Return Short URL
```

---

## Redirecting URL

```
Browser

 ↓

localhost/{shortCode}

 ↓

Nginx

 ↓

Redirect Service

 ↓

Redis Lookup

 ↓

MySQL Lookup

 ↓

Kafka Event

 ↓

Redirect Destination
```

---

# 📈 Monitoring & Observability

## Prometheus

URL:

```
http://localhost:9090
```

Used for:

- Service monitoring
- Metrics collection
- Health tracking


## Grafana

URL:

```
http://localhost:3000
```

Used for:

- Dashboards
- Visualization
- Performance analysis

---

# 🗄️ Database Design

## Users Table

```
users

id
name
email
password
role
created_at
```

---

## URLs Table

```
urls

id
user_id
short_code
original_url
created_at
expires_at
```

---

## Click Analytics Table

```
clicks

id
url_id
ip_address
browser
os
device
referer
clicked_at
```

---

# 🔒 Security Features

Implemented:

- JWT authentication
- Protected API routes
- Environment based configuration
- Password encryption
- Service isolation
- Secure communication between services

---

# 📂 Project Structure

```
distributed-url-shortener

│
├── gateway
│   └── nginx.conf
│
├── services
│
│   ├── auth-service
│   ├── url-service
│   ├── redirect-service
│   ├── analytics-service
│   ├── qr-service
│   └── admin-service
│
├── infrastructure
│
│   ├── mysql
│   ├── redis
│   └── monitoring
│
├── docker-compose.yml
│
└── README.md
```

---

# 🧪 API Testing

## Register User

```
POST /api/v1/auth/register
```

---

## Login

```
POST /api/v1/auth/login
```

---

## Create Short URL

```
POST /api/v1/urls
```

---

## Redirect

```
GET /{shortCode}
```

---

# 🚀 Future Improvements

- Kubernetes deployment
- AWS cloud deployment
- CI/CD pipeline
- Horizontal service scaling
- Multiple Kafka partitions
- Rate limiting
- Distributed tracing
- OpenTelemetry integration
- CDN support

---

# 👨‍💻 Author

## Manoj Reddy Dulla

GitHub:

https://github.com/dullamanojreddy


---

# ⭐ Project Highlights

This project demonstrates:

✅ Microservices Architecture  
✅ Distributed Systems Design  
✅ Event Driven Architecture  
✅ Kafka Streaming  
✅ Redis Caching  
✅ Database Design  
✅ Docker Containerization  
✅ Monitoring & Observability  


Built as a production-oriented distributed system project.