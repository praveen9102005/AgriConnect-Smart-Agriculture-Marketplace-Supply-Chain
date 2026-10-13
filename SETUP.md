# AgriConnect - Complete Setup Guide

This guide walks you through setting up and running the **AgriConnect** Smart Agriculture Marketplace and Supply Chain Platform.

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your system:

| Tool | Version Required | Verification Command |
|---|---|---|
| **Java JDK** | Java 17, 21, or 22 | `java -version` |
| **Apache Maven** | 3.8+ | `mvn -version` |
| **PostgreSQL** | 14+ (Installed & Running) | `psql -U postgres` |
| **Web Browser / Dev Server** | Chrome / Edge / Firefox | VS Code Live Server or Python HTTP Server |

---

## 2. PostgreSQL Database Setup

AgriConnect uses PostgreSQL as its primary transactional database.

1. Ensure the PostgreSQL service is running on `localhost:5432`.
2. Connect to PostgreSQL using `psql` or pgAdmin:
   ```bash
   psql -U postgres -h localhost -p 5432
   ```
   *(Password: `pravee`)*

3. Create the database `agrimart` if it does not already exist:
   ```sql
   CREATE DATABASE agrimart;
   ```

4. Hibernate is pre-configured with `spring.jpa.hibernate.ddl-auto=update`. When you start the Spring Boot backend, it will automatically:
   - Create or update all 12 relational tables: `users`, `farmers`, `categories`, `products`, `carts`, `cart_items`, `orders`, `order_items`, `deliveries`, `reviews`, `wishlists`, `notifications`.
   - Seed **6 verified Indian farmers** with regional profiles.
   - Seed **60+ agricultural products** across all 10 categories (Vegetables, Fruits, Grains, Millets, Pulses, Oilseeds, Spices, Herbs, Natural Products, Dry Fruits).
   - Seed sample customer orders, live cold-chain transit tracking data, and customer reviews.

---

## 3. Backend Run Command (Spring Boot 3.4.5)

The Spring Boot backend runs on `http://localhost:8080`.

1. Open your terminal in the backend directory:
   ```bash
   cd C:\Users\prave\.gemini\antigravity\scratch\agriconnect\backend
   ```

2. Compile and launch the application:
   ```bash
   mvn spring-boot:run
   ```
   *(Or build a JAR: `mvn clean package -DskipTests` and run `java -jar target/agriconnect-1.0.0.jar`)*

3. Verify the backend is active:
   - Browse to: `http://localhost:8080/api/products`
   - You should receive the JSON response containing the agricultural product catalog.

---

## 4. Frontend Run Command (Port 5500)

The frontend is built using standard HTML5, modern CSS3, and JavaScript with Leaflet and Chart.js, designed to run on `http://localhost:5500`.

### Option A: VS Code Live Server (Recommended)
1. Open the folder `C:\Users\prave\.gemini\antigravity\scratch\agriconnect` in VS Code.
2. Right-click on `frontend/index.html` and click **"Open with Live Server"**.
3. It will launch on `http://localhost:5500` or `http://127.0.0.1:5500`.

### Option B: Python HTTP Server
1. Open terminal:
   ```bash
   cd C:\Users\prave\.gemini\antigravity\scratch\agriconnect\frontend
   python -m http.server 5500
   ```
2. Open your browser and go to `http://localhost:5500`.

### Option C: Node / npx serve
1. Run in terminal:
   ```bash
   npx serve C:\Users\prave\.gemini\antigravity\scratch\agriconnect\frontend -p 5500
   ```

---

## 5. Default Test Credentials

AgriConnect includes pre-configured demo credentials with one-click demo login buttons directly in the UI modal:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@agriconnect.com` | `admin123` | System metrics, user management, order oversight, full catalog & delivery audit |
| **Farmer** | `ramesh.patel@agriconnect.com` | `farmer123` | Product listings, stock adjustments, farm order status updates, earnings |
| **Farmer 2** | `gurpreet.singh@agriconnect.com` | `farmer123` | Basmati & Sharbati wheat catalog management |
| **Logistics** | `vikram.logistics@agriconnect.com` | `logistics123` | Delivery fleet dashboard, status progression (`PICKED_UP` $\rightarrow$ `DELIVERED`), GPS telemetry |
| **Customer** | `priya.sharma@gmail.com` | `customer123` | Marketplace browsing, cart, checkout, live order route tracking |
| **Customer 2** | `arun.kumar@gmail.com` | `customer123` | General consumer shopping & reviews |

---

## 6. Complete REST API Reference

All endpoints are hosted under `http://localhost:8080/api`:

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate and receive JWT token
- `POST /api/auth/register` — Register as Customer, Farmer, or Logistics
- `GET /api/auth/me` — Get current logged-in profile

### Products (`/api/products`)
- `GET /api/products` — Filter products by `category`, `search`, `minPrice`, `maxPrice`, `minRating`, `page`, `size`, `sortBy`, `sortDir`
- `GET /api/products/featured` — Get top 8 rated farm harvests
- `GET /api/products/{id}` — Get detailed product info
- `GET /api/products/farmer/{farmerId}` — Get all products for a specific farmer
- `POST /api/products` — Create new harvest listing (Farmer/Admin)
- `PUT /api/products/{id}` — Update harvest listing (Farmer/Admin)
- `DELETE /api/products/{id}` — Delete listing (Farmer/Admin)
- `PATCH /api/products/{id}/stock` — Rapid inventory update

### Categories & Farmers
- `GET /api/categories` — List 10 agricultural categories
- `GET /api/farmers` — List all verified farmers
- `GET /api/farmers/featured` — Top rated farmers
- `GET /api/farmers/{id}` — Farmer profile details

### Cart & Orders (`/api/cart`, `/api/orders`)
- `GET /api/cart` — Get customer cart
- `POST /api/cart/add` — Add product to cart
- `PUT /api/cart/items/{itemId}` — Update quantity
- `DELETE /api/cart/items/{itemId}` — Remove item
- `DELETE /api/cart/clear` — Clear entire cart
- `POST /api/orders` — Checkout cart and create Order with tracking
- `GET /api/orders/my-orders` — Customer's order history
- `GET /api/orders/farmer/{farmerId}` — Incoming orders for farmer
- `PATCH /api/orders/{id}/status` — Update order status

### Logistics & Tracking (`/api/deliveries`)
- `GET /api/deliveries` — List shipments
- `GET /api/deliveries/order/{orderId}` — Get shipment for order
- `PATCH /api/deliveries/{id}/status` — Update GPS latitude/longitude, ETA, and delivery status

### AI Recommendations (`/api/ai`)
- `GET /api/ai/recommendations?customerId=&productId=&category=&limit=` — Multi-factor hybrid AI recommendation engine

### Analytics (`/api/analytics`)
- `GET /api/analytics/dashboard` — Platform GMV, category distribution, monthly sales data, and performance stats
