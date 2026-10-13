/**
 * AgriConnect Home Page & Application Interactions
 */

const App = {
  async initHome() {
    this.initStatsCounter();
    await Promise.allSettled([
      this.loadCategoryCards(),
      this.loadMarketplacePreview(),
      this.loadFeaturedFarmers(),
      this.loadAiRecommendations()
    ]);
  },

  initStatsCounter() {
    const stats = [
      { elementId: 'stat-farmers', target: 5420, suffix: '+' },
      { elementId: 'stat-products', target: 68, suffix: '+' },
      { elementId: 'stat-ontime', target: 99.4, suffix: '%', isDecimal: true },
      { elementId: 'stat-earnings', target: 2.8, suffix: ' Cr', isDecimal: true, prefix: '₹' }
    ];

    stats.forEach(s => {
      const el = document.getElementById(s.elementId);
      if (!el) return;
      let start = 0;
      const duration = 1500;
      const stepTime = 30;
      const steps = duration / stepTime;
      const increment = s.target / steps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= s.target) {
          start = s.target;
          clearInterval(timer);
        }
        el.textContent = `${s.prefix || ''}${s.isDecimal ? start.toFixed(1) : Math.floor(start)}${s.suffix}`;
      }, stepTime);
    });
  },

  async loadCategoryCards() {
    const container = document.getElementById('home-categories-grid');
    if (!container) return;

    try {
      const categories = await api.categories.getAll();
      if (!categories || categories.length === 0) return;

      container.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="window.location.href='pages/marketplace.html?category=${encodeURIComponent(cat.name)}'">
          <div class="category-icon-box">
            <i class="fa-solid ${cat.icon || 'fa-seedling'}"></i>
          </div>
          <div class="category-name">${cat.name}</div>
          <div class="category-count">${cat.productCount || '6+'} Varieties</div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  async loadMarketplacePreview() {
    const container = document.getElementById('home-products-grid');
    if (!container) return;

    try {
      const products = await api.products.getFeatured();
      if (!products || products.length === 0) return;

      container.innerHTML = products.slice(0, 8).map(p => this.renderProductCard(p)).join('');
    } catch (err) {
      console.error('Failed to load featured products:', err);
    }
  },

  async loadFeaturedFarmers() {
    const container = document.getElementById('home-farmers-grid');
    if (!container) return;

    try {
      const farmers = await api.farmers.getFeatured();
      if (!farmers || farmers.length === 0) return;

      container.innerHTML = farmers.slice(0, 6).map(f => `
        <div class="card" style="text-align: center; position: relative;">
          <div style="width: 5rem; height: 5rem; border-radius: var(--radius-full); margin: 0 auto 1rem; background: linear-gradient(135deg, var(--primary-600), var(--primary-800)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: var(--shadow-md);">
            <i class="fa-solid fa-user-tie"></i>
          </div>
          <div class="badge badge-success" style="position: absolute; top: 1rem; right: 1rem;">
            <i class="fa-solid fa-certificate"></i> Verified
          </div>
          <h4 style="font-size: 1.15rem; margin-bottom: 0.25rem;">${f.name}</h4>
          <p style="font-size: 0.8125rem; color: var(--primary-700); font-weight: 600; margin-bottom: 0.5rem;">
            <i class="fa-solid fa-location-dot"></i> ${f.location}, ${f.state}
          </p>
          <p style="font-size: 0.8125rem; color: var(--slate-600); margin-bottom: 1rem; min-height: 2.4rem;">
            ${f.specialty}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-around; padding-top: 0.875rem; border-top: 1px solid var(--border-light); font-size: 0.8125rem;">
            <span><i class="fa-solid fa-star" style="color: #f59e0b;"></i> <strong>${f.rating || 4.9}</strong></span>
            <span><i class="fa-solid fa-basket-shopping" style="color: var(--primary-600);"></i> <strong>${f.productsCount || '10+'}</strong> crops</span>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load featured farmers:', err);
    }
  },

  async loadAiRecommendations() {
    const container = document.getElementById('home-ai-recommendations-grid');
    if (!container) return;

    try {
      const user = Auth.getCurrentUser();
      const recs = await api.ai.getRecommendations({
        customerId: user ? user.id : null,
        limit: 4
      });

      if (!recs || recs.length === 0) return;

      container.innerHTML = recs.map(rec => `
        <div class="card" style="border: 1px solid var(--primary-300); background: linear-gradient(to bottom, #ffffff, var(--primary-50));">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <span class="badge badge-success" style="background-color: var(--primary-200); color: var(--primary-900);">
              <i class="fa-solid fa-brain"></i> ${rec.matchScore}% Match
            </span>
            <span style="font-size: 0.75rem; color: #f59e0b; font-weight: 700;">
              <i class="fa-solid fa-star"></i> ${rec.rating}
            </span>
          </div>
          <div style="height: 160px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1rem;">
            <img src="${rec.imageUrl}" alt="${rec.name}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <h4 style="font-size: 1.05rem; margin-bottom: 0.25rem;">${rec.name}</h4>
          <p style="font-size: 0.75rem; color: var(--slate-500); margin-bottom: 0.5rem; font-style: italic;">
            "${rec.recommendationReason}"
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 0.75rem;">
            <span style="font-size: 1.2rem; font-weight: 800; color: var(--slate-900);">₹${rec.price} <small style="font-size: 0.7rem; color: var(--slate-500);">/ ${rec.unit}</small></span>
            <button class="btn btn-primary btn-sm" onclick="App.handleAddToCart(${rec.productId})">
              <i class="fa-solid fa-cart-plus"></i> Add
            </button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load AI recommendations:', err);
    }
  },

  renderProductCard(p) {
    const isPages = window.location.pathname.includes('/pages/');
    const detailsUrl = isPages ? `marketplace.html?productId=${p.id}` : `pages/marketplace.html?productId=${p.id}`;

    return `
      <div class="product-card">
        <div class="product-thumb-container">
          <img class="product-thumb" src="${p.imageUrl}" alt="${p.name}" loading="lazy">
          <span class="product-badge-fresh">Direct Farm</span>
          <button class="product-wishlist-btn" onclick="App.toggleWishlist(event, ${p.id})">
            <i class="fa-regular fa-heart"></i>
          </button>
        </div>
        <div class="product-body">
          <div class="product-farmer-meta">
            <i class="fa-solid fa-tractor"></i>
            <span>${p.farmerName || 'Verified Farm'}</span>
          </div>
          <a href="${detailsUrl}">
            <h3 class="product-title">${p.name}</h3>
          </a>
          <p class="product-desc">${p.description || ''}</p>
          <div class="product-rating-row">
            <div class="product-rating-stars">
              <i class="fa-solid fa-star"></i>
              <strong style="color: var(--slate-800); margin-left: 0.2rem;">${p.rating || 4.8}</strong>
            </div>
            <span class="product-reviews-count">(${p.reviews || 0} reviews)</span>
          </div>
          <div class="product-footer">
            <div class="product-price-box">
              <div class="product-price">₹${p.price}</div>
              <div class="product-unit">per ${p.unit}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="App.handleAddToCart(${p.id})">
              <i class="fa-solid fa-basket-shopping"></i> Add
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async handleAddToCart(productId) {
    if (!Auth.isAuthenticated()) {
      Auth.openAuthModal('login');
      Auth.showToast('Please sign in to add products to your cart', 'info');
      return;
    }

    try {
      await api.cart.add(productId, 1);
      Auth.showToast('Added to cart!', 'success');
      Auth.refreshCartBadge();
    } catch (err) {
      Auth.showToast(err.message || 'Could not add to cart', 'error');
    }
  },

  toggleWishlist(e, productId) {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.classList.toggle('active');
    const icon = btn.querySelector('i');
    if (btn.classList.contains('active')) {
      icon.className = 'fa-solid fa-heart';
      Auth.showToast('Harvest saved to your wishlist!', 'success');
    } else {
      icon.className = 'fa-regular fa-heart';
      Auth.showToast('Removed from wishlist', 'info');
    }
  },

  handleHomeSearch(e) {
    e.preventDefault();
    const query = document.getElementById('home-search-input').value;
    const prefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';
    window.location.href = `${prefix}marketplace.html?search=${encodeURIComponent(query)}`;
  },

  async previewTrackingOnHome(e) {
    e.preventDefault();
    const orderIdInput = document.getElementById('home-track-order-id');
    const orderId = orderIdInput ? orderIdInput.value.trim() : '2';

    const mapBox = document.getElementById('home-map-container');
    const trackingInfo = document.getElementById('home-tracking-info');
    if (!mapBox) return;

    try {
      const delivery = await api.deliveries.getByOrderId(orderId);
      if (trackingInfo) {
        trackingInfo.innerHTML = `
          <div style="background: #fff; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-weight: 700; color: var(--slate-900);">Order #${delivery.orderId} Shipment</span>
              <span class="badge badge-success">${delivery.status}</span>
            </div>
            <p style="font-size: 0.8125rem; color: var(--slate-600);"><i class="fa-solid fa-truck"></i> <strong>Vehicle:</strong> ${delivery.vehicleNumber}</p>
            <p style="font-size: 0.8125rem; color: var(--slate-600);"><i class="fa-solid fa-user-clock"></i> <strong>ETA:</strong> ${delivery.eta}</p>
            <p style="font-size: 0.8125rem; color: var(--slate-600);"><i class="fa-solid fa-location-dot"></i> <strong>Destination:</strong> ${delivery.destination}</p>
          </div>
        `;
      }
      this.renderLeafletMap('home-map-container', delivery.latitude || 19.2183, delivery.longitude || 72.9781, delivery.pickup, delivery.destination);
    } catch {
      // Default coordinates
      this.renderLeafletMap('home-map-container', 19.2183, 72.9781, "Nashik Hub, Maharashtra", "Powai, Mumbai");
      if (trackingInfo) {
        trackingInfo.innerHTML = `
          <div style="background: #fff; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-weight: 700; color: var(--slate-900);">Sample AgriExpress Route</span>
              <span class="badge badge-success">IN_TRANSIT</span>
            </div>
            <p style="font-size: 0.8125rem; color: var(--slate-600);"><i class="fa-solid fa-truck"></i> <strong>Vehicle:</strong> MH-12-CD-5544 (Cold Chain Van)</p>
            <p style="font-size: 0.8125rem; color: var(--slate-600);"><i class="fa-solid fa-clock"></i> <strong>ETA:</strong> Arriving in 3 hours</p>
          </div>
        `;
      }
    }
  },

  renderLeafletMap(elementId, lat, lng, pickup, destination) {
    if (typeof L === 'undefined') return;

    if (window.homeLeafletMap) {
      window.homeLeafletMap.remove();
    }

    const map = L.map(elementId).setView([lat, lng], 10);
    window.homeLeafletMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Marker for current truck
    const truckIcon = L.divIcon({
      className: 'custom-map-icon',
      html: '<div style="background: #16a34a; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #fff;"><i class="fa-solid fa-truck"></i></div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    L.marker([lat, lng], { icon: truckIcon })
      .addTo(map)
      .bindPopup(`<b>Current Logistics Position</b><br>Active Cold Chain Transit`)
      .openPopup();

    // Draw route polyline from Farm pickup to Customer destination
    const farmCoords = [19.9975, 73.7898];
    const dropCoords = [19.0760, 72.8777];

    L.marker(farmCoords)
      .addTo(map)
      .bindPopup(`<b>Farm Origin:</b> ${pickup || 'Nashik Valley Farms'}`);

    L.marker(dropCoords)
      .addTo(map)
      .bindPopup(`<b>Destination:</b> ${destination || 'Customer Doorstep'}`);

    const routeLine = L.polyline([farmCoords, [lat, lng], dropCoords], {
      color: '#16a34a',
      weight: 4,
      dashArray: '8, 8'
    }).addTo(map);

    map.fitBounds(routeLine.getBounds().pad(0.1));
  }
};

window.App = App;
