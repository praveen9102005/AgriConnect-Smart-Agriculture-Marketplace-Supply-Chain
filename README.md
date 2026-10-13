# AgriConnect — Smart Agriculture Marketplace & Supply Chain Platform

![AgriConnect Banner](https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80)

**AgriConnect** is a full-stack agricultural platform designed to empower farmers, eliminate exploitative intermediaries, and ensure temperature-controlled supply chain traceability from farm to doorstep.

Built with **Spring Boot 3.4.5**, **PostgreSQL**, **Spring Security (JWT)**, **Leaflet Maps**, and **Chart.js**.

---

## Key Platform Modules

### 1. Home & Discovery Engine
- **Hero & Animated Live Counters**: Verified farmers, catalogued crops, on-time transit rate, direct farmer revenue.
- **Agricultural Category Showcase**: 10 distinct categories (Vegetables, Fruits, Grains, Millets, Pulses, Oilseeds, Spices, Herbs, Natural Products, Dry Fruits).
- **Featured Harvests Preview**: Top-rated regional produce with immediate Add to Cart triggers.
- **Champion Farmers Spotlight**: Profiles highlighting farming methods (Jeevamrutha, organic mulching, zero pesticide), location, and ratings.
- **Interactive Supply Chain Flow**: Transparent 4-stage pipeline visualization from sunrise harvest to urban doorstep.
- **Logistics Telemetry Preview**: Instant order lookup displaying live carrier position on an interactive OpenStreetMap.

### 2. Full-Scale Marketplace
- **60+ Verified Agricultural Products**: Realistic Indian commodities with botanical descriptions, packaging units, and stock quantities.
- **Multi-Faceted Filtering**: Search query debounce, category pills, price range boundaries, rating thresholds.
- **Sorting & Pagination**: Sort by price, rating, or newest listing; responsive pagination controls.
- **Product Details Modal**: High-resolution imagery, farmer origin details, real-time inventory counter, customer ratings, and community reviews.

### 3. Customer Hub
- **Cart Management**: Real-time quantity adjustments, subtotal updates, free cold-chain delivery eligibility thresholds.
- **One-Click Farm Checkout**: Recipient address input, payment method selection, and order generation.
- **Order History & Detailed Invoices**: Past orders with item breakdowns, pricing, and live status.
- **Live 8-Stage Logistics Tracking**:
  $$\text{PLACED} \rightarrow \text{CONFIRMED} \rightarrow \text{FARMER\_PROCESSING} \rightarrow \text{READY\_FOR\_PICKUP} \rightarrow \text{PICKED\_UP} \rightarrow \text{IN\_TRANSIT} \rightarrow \text{OUT\_FOR\_DELIVERY} \rightarrow \text{DELIVERED}$$
- **Interactive Leaflet Route Map**: Displays the regional farm origin, moving refrigerated carrier, and customer doorstep.

### 4. Farmer Producer Portal
- **Crop Catalog Management**: Add, edit, and delete produce with pricing, units, and inventory levels.
- **Quick Stock Inventory Updater**: Direct stock adjustments to prevent overselling.
- **Incoming Orders Dispatch Center**: Advance orders through `CONFIRMED`, `FARMER_PROCESSING`, and `READY_FOR_PICKUP`.
- **Farmer Revenue & Ratings KPI**: Track performance, GMV, and customer review scores.

### 5. Cold Chain Logistics Portal
- **Fleet Shipments Dashboard**: Monitor active vs. completed shipments.
- **Carrier Telemetry & Route Mapping**: Visualizes road routes on OpenStreetMap with speed, ETA, and cargo temperature indicators.
- **Transit Status Progression**: Advance shipments through `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, and `DELIVERED`, automatically synchronizing customer order tracking and database state.

### 6. Admin Command & Analytics Control
- **Executive KPIs**: Total users, verified farmers, live products, total platform revenue, active transit count, and low-stock alarms.
- **Rich Chart.js Visualizations**:
  - *Monthly Revenue & Volume*: Dual-axis bar and trendline chart.
  - *Product Category Distribution*: Multi-segment doughnut chart.
  - *Order Status Distribution*: Polar area fulfillment status breakdown.
  - *Farmer Performance & Revenue*: Comparative horizontal bar chart.
- **Management Tables**: Real-time oversight of users, farmers, inventory, and orders.

### 7. Extensible AI Recommendation Service
- Endpoint: `GET /api/ai/recommendations`
- Hybrid scoring engine analyzing:
  1. Consumer purchase history & cross-category preferences.
  2. Crop seasonality & organic companion pairing patterns.
  3. Social proof ratings & review volumes.
- Architecture contains modular adapter hooks ready for plug-and-play Python FastAPI/PyTorch ML microservices.

---

## Tech Stack Summary

```
agriconnect/
├── frontend/                     # Pure HTML5, Modern CSS3, Component JS Architecture
│   ├── index.html                # Premium Agriculture Landing Page
│   ├── css/
│   │   ├── styles.css            # Agricultural Design Tokens & Base Styles
│   │   └── components.css        # Stepper, Map, Cards, Nav, and Modals
│   ├── js/
│   │   ├── api.js                # Centralized REST HTTP Client Layer
│   │   ├── auth.js               # Session, JWT, & 1-Click Demo Login
│   │   ├── app.js                # Home Interactions, Stats, & Leaflet Map
│   │   ├── marketplace.js        # 60+ Products, Filter, Sort, & Reviews
│   │   ├── customer.js           # Cart, Checkout, Order Tracking & Maps
│   │   ├── farmer.js             # Harvest Catalog, Stock, & Order Fulfillment
│   │   ├── logistics.js          # Carrier Fleet, OpenStreetMap Telemetry
│   │   └── admin.js              # Chart.js Dashboard & Management Tables
│   └── pages/
│       ├── marketplace.html
│       ├── customer.html
│       ├── farmer.html
│       ├── logistics.html
│       └── admin.html
│
└── backend/                      # Spring Boot 3.4.5 Java Application
    ├── pom.xml
    └── src/main/
        ├── java/com/agrimart/
        │   ├── AgriConnectApplication.java
        │   ├── config/           # SecurityConfig, CorsConfig, DataInitializer
        │   ├── controller/       # 11 REST API Controllers
        │   ├── dto/              # Request / Response Data Transfer Objects
        │   ├── entity/           # 12 Relational Entities & Enums
        │   ├── exception/        # Global Exception Handling & Error Responses
        │   ├── repository/       # Spring Data JPA Repositories
        │   ├── security/         # JWT Provider, Auth Filter, UserDetails
        │   └── service/          # Core Business Logic & AI Engine
        └── resources/
            └── application.properties # PostgreSQL & JWT Configuration
```

---

## Database Configuration

- **Host**: `localhost:5432`
- **Database Name**: `agrimart`
- **Username**: `postgres`
- **Password**: `pravee`

Hibernate automatically creates the tables and seeds 6 farmers, 60+ products, customers, and active orders upon startup.

---

## Quickstart Commands

### 1. Launch Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```
*(Backend runs on `http://localhost:8080`)*

### 2. Launch Frontend
```bash
cd frontend
python -m http.server 5500
```
*(Or right-click `frontend/index.html` $\rightarrow$ "Open with Live Server" in VS Code)*

Browse to: **`http://localhost:5500`**

---

## Default Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@agriconnect.com` | `admin123` |
| **Farmer** | `ramesh.patel@agriconnect.com` | `farmer123` |
| **Logistics** | `vikram.logistics@agriconnect.com` | `logistics123` |
| **Customer** | `priya.sharma@gmail.com` | `customer123` |
