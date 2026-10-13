/**
 * AgriConnect Customer Hub Controller
 * Manages Cart, Checkout, Order History, and Real-Time Logistics Tracking
 */

const Customer = {
  state: {
    cart: null,
    orders: [],
    selectedOrder: null,
    activeTab: 'cart',
    leafletMap: null
  },

  async init() {
    if (!Auth.isAuthenticated()) {
      Auth.openAuthModal('login');
      Auth.showToast('Please sign in as a Customer to view your dashboard', 'info');
      return;
    }

    this.setupTabNavigation();
    await this.loadCart();
    await this.loadOrders();
    this.renderUserProfile();
  },

  setupTabNavigation() {
    const tabs = document.querySelectorAll('.dashboard-nav-item');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = tab.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });
  },

  switchTab(tabName) {
    this.state.activeTab = tabName;
    document.querySelectorAll('.dashboard-nav-item').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.dashboard-tab-content').forEach(c => {
      c.style.display = c.id === `tab-${tabName}` ? 'block' : 'none';
    });

    if (tabName === 'cart') this.loadCart();
    if (tabName === 'orders') this.loadOrders();
    if (tabName === 'tracking' && this.state.selectedOrder) {
      setTimeout(() => this.renderTrackingView(this.state.selectedOrder), 100);
    }
  },

  renderUserProfile() {
    const user = Auth.getCurrentUser();
    const profileContainer = document.getElementById('customer-profile-card');
    if (!profileContainer || !user) return;

    profileContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="width: 3.5rem; height: 3.5rem; border-radius: var(--radius-full); background: var(--primary-100); color: var(--primary-800); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700;">
          ${user.name.charAt(0)}
        </div>
        <div>
          <h3 style="font-size: 1.15rem; margin-bottom: 0.2rem;">${user.name}</h3>
          <p style="font-size: 0.8125rem; color: var(--slate-500);">${user.email}</p>
        </div>
        <span class="role-pill" style="margin-left: auto;">${user.role}</span>
      </div>
    `;
  },

  async loadCart() {
    const container = document.getElementById('cart-items-container');
    const summaryContainer = document.getElementById('cart-summary-container');
    if (!container) return;

    try {
      const cart = await api.cart.get();
      this.state.cart = cart;
      Auth.refreshCartBadge();

      if (!cart || !cart.items || cart.items.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 4rem 1rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--slate-300);">
            <div style="font-size: 3rem; color: var(--slate-300); margin-bottom: 1rem;">
              <i class="fa-solid fa-basket-shopping"></i>
            </div>
            <h3 style="margin-bottom: 0.5rem;">Your Cart is Empty</h3>
            <p style="color: var(--slate-500); margin-bottom: 1.5rem;">Discover direct-from-farm vegetables, fruits, and millets.</p>
            <a href="marketplace.html" class="btn btn-primary">Browse Marketplace</a>
          </div>
        `;
        if (summaryContainer) summaryContainer.style.display = 'none';
        return;
      }

      if (summaryContainer) summaryContainer.style.display = 'block';

      container.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${cart.items.map(item => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <img src="${item.productImageUrl}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-md);">
                      <div>
                        <div style="font-weight: 700; color: var(--slate-900);">${item.productName}</div>
                        <div style="font-size: 0.75rem; color: var(--slate-500);">${item.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-weight: 600;">₹${item.price}</td>
                  <td>
                    <div style="display: flex; align-items: center; border: 1px solid var(--slate-300); border-radius: var(--radius-sm); width: fit-content;">
                      <button class="btn btn-secondary btn-sm" style="border: none; padding: 0.2rem 0.6rem;" onclick="Customer.updateItemQty(${item.id}, ${item.quantity - 1})">-</button>
                      <span style="padding: 0 0.6rem; font-weight: 700; font-size: 0.875rem;">${item.quantity}</span>
                      <button class="btn btn-secondary btn-sm" style="border: none; padding: 0.2rem 0.6rem;" onclick="Customer.updateItemQty(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                  </td>
                  <td style="font-weight: 700; color: var(--primary-800);">₹${item.subtotal.toFixed(2)}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="Customer.removeCartItem(${item.id})">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      if (summaryContainer) {
        const subtotal = cart.totalAmount;
        const deliveryFee = subtotal > 500 ? 0 : 40;
        const grandTotal = subtotal + deliveryFee;

        summaryContainer.innerHTML = `
          <div class="card" style="position: sticky; top: 6rem;">
            <h4 style="margin-bottom: 1.25rem;">Order Summary</h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.9375rem;">
              <span class="text-muted">Subtotal (${cart.totalCount} items)</span>
              <strong>₹${subtotal.toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.9375rem;">
              <span class="text-muted">Farm-to-Door Cold Transit</span>
              <strong style="color: ${deliveryFee === 0 ? 'var(--primary-600)' : 'inherit'};">
                ${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}
              </strong>
            </div>
            <div style="border-top: 1px solid var(--border-light); margin: 1rem 0; padding-top: 1rem; display: flex; justify-content: space-between; font-size: 1.15rem;">
              <strong>Total Amount</strong>
              <strong style="color: var(--primary-800);">₹${grandTotal.toFixed(2)}</strong>
            </div>
            <button class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem;" onclick="Customer.openCheckoutModal()">
              Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error loading cart:', err);
    }
  },

  async updateItemQty(itemId, newQty) {
    try {
      await api.cart.updateQty(itemId, newQty);
      await this.loadCart();
    } catch (err) {
      Auth.showToast(err.message || 'Could not update quantity', 'error');
    }
  },

  async removeCartItem(itemId) {
    try {
      await api.cart.remove(itemId);
      Auth.showToast('Item removed from cart', 'info');
      await this.loadCart();
    } catch (err) {
      Auth.showToast(err.message || 'Could not remove item', 'error');
    }
  },

  openCheckoutModal() {
    let modal = document.getElementById('checkout-modal');
    if (!modal) {
      this.createCheckoutModal();
      modal = document.getElementById('checkout-modal');
    }
    const user = Auth.getCurrentUser();
    if (user && document.getElementById('checkout-name')) {
      document.getElementById('checkout-name').value = user.name;
    }
    modal.classList.add('active');
  },

  closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('active');
  },

  createCheckoutModal() {
    const modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3><i class="fa-solid fa-truck-ramp-box" style="color: var(--primary-600);"></i> Farm Direct Checkout</h3>
          <button class="btn btn-secondary btn-sm" onclick="Customer.closeCheckoutModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <form onsubmit="Customer.handlePlaceOrder(event)">
            <div class="form-group">
              <label class="form-label">Recipient Name</label>
              <input type="text" id="checkout-name" class="form-control" required placeholder="Priya Sharma">
            </div>
            <div class="form-group">
              <label class="form-label">Full Delivery Address</label>
              <textarea id="checkout-address" class="form-control" rows="3" required placeholder="Flat 402, Green Acres, Powai, Mumbai - 400076"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <div style="background: var(--slate-50); border: 1px solid var(--slate-300); border-radius: var(--radius-md); padding: 0.75rem; display: flex; align-items: center; gap: 0.75rem;">
                <input type="radio" checked id="pay-cod">
                <label for="pay-cod" style="font-weight: 600; font-size: 0.875rem;">
                  <i class="fa-solid fa-hand-holding-dollar" style="color: var(--primary-600);"></i> Cash on Delivery / UPI upon Farm Delivery
                </label>
              </div>
            </div>
            <div style="background: var(--primary-50); border: 1px solid var(--primary-200); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.8125rem; color: var(--primary-900); margin-bottom: 1.25rem;">
              <i class="fa-solid fa-shield-halved"></i> 100% Quality Assurance Guarantee: Inspected & packed directly at the farm source.
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
              Confirm & Place Order (₹${this.state.cart ? this.state.cart.totalAmount : 0})
            </button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async handlePlaceOrder(e) {
    e.preventDefault();
    const customerName = document.getElementById('checkout-name').value;
    const deliveryAddress = document.getElementById('checkout-address').value;

    try {
      const order = await api.orders.create({ customerName, deliveryAddress });
      this.closeCheckoutModal();
      Auth.showToast(`Order #${order.id} placed successfully!`, 'success');
      await this.loadCart();
      await this.loadOrders();
      this.trackOrderById(order.id);
    } catch (err) {
      Auth.showToast(err.message || 'Could not place order', 'error');
    }
  },

  async loadOrders() {
    const container = document.getElementById('orders-list-container');
    if (!container) return;

    try {
      const orders = await api.orders.getMyOrders();
      this.state.orders = orders;

      if (!orders || orders.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--slate-300);">
            <p style="color: var(--slate-500);">No orders placed yet.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td style="font-weight: 700;">#${o.id}</td>
                  <td style="font-size: 0.8125rem; color: var(--slate-500);">${new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>${o.items ? o.items.length : 0} items</td>
                  <td style="font-weight: 700; color: var(--slate-900);">₹${o.totalAmount}</td>
                  <td><span class="badge ${this.getStatusBadgeClass(o.status)}">${o.status}</span></td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="Customer.trackOrderById(${o.id})">
                      <i class="fa-solid fa-map-location-dot"></i> Track
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Default tracking to first order if available
      if (orders.length > 0 && !this.state.selectedOrder) {
        this.state.selectedOrder = orders[0];
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  },

  getStatusBadgeClass(status) {
    if (status === 'DELIVERED') return 'badge-success';
    if (status === 'OUT_FOR_DELIVERY' || status === 'IN_TRANSIT') return 'badge-warning';
    return 'badge-info';
  },

  async trackOrderById(orderId) {
    try {
      const order = await api.orders.getById(orderId);
      this.state.selectedOrder = order;
      this.switchTab('tracking');
      this.renderTrackingView(order);
    } catch (err) {
      Auth.showToast('Could not fetch tracking for order #' + orderId, 'error');
    }
  },

  renderTrackingView(order) {
    const container = document.getElementById('tracking-content-container');
    if (!container || !order) return;

    const stages = [
      'PLACED',
      'CONFIRMED',
      'FARMER_PROCESSING',
      'READY_FOR_PICKUP',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED'
    ];

    const currentStageIndex = stages.indexOf(order.status) !== -1 ? stages.indexOf(order.status) : 0;
    const progressPercent = (currentStageIndex / (stages.length - 1)) * 100;

    container.innerHTML = `
      <div class="card" style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <div>
            <h3 style="font-size: 1.25rem;">Order #${order.id} Live Supply Chain Tracking</h3>
            <p style="font-size: 0.8125rem; color: var(--slate-500);">Destination: ${order.deliveryAddress}</p>
          </div>
          <div style="text-align: right;">
            <span class="badge ${this.getStatusBadgeClass(order.status)}" style="font-size: 0.875rem; padding: 0.35rem 0.8rem;">
              ${order.status.replace(/_/g, ' ')}
            </span>
            <div style="font-size: 0.75rem; color: var(--slate-500); margin-top: 0.25rem;">ETA: ${order.deliveryEta || 'In Transit'}</div>
          </div>
        </div>

        <!-- 8-Step Interactive Progress Stepper -->
        <div class="stepper-container">
          <div class="stepper-line">
            <div class="stepper-progress" style="width: ${progressPercent}%;"></div>
          </div>
          ${stages.map((stage, idx) => {
            let stateClass = '';
            if (idx < currentStageIndex) stateClass = 'completed';
            else if (idx === currentStageIndex) stateClass = 'active';

            const stageIcons = ['fa-file-invoice', 'fa-thumbs-up', 'fa-tractor', 'fa-box', 'fa-truck-ramp-box', 'fa-truck-fast', 'fa-route', 'fa-circle-check'];
            return `
              <div class="step-item ${stateClass}">
                <div class="step-circle">
                  <i class="fa-solid ${stageIcons[idx]}"></i>
                </div>
                <div class="step-label">${stage.replace(/_/g, ' ')}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Live Route Map Container -->
      <div class="card">
        <h4 style="margin-bottom: 1rem;"><i class="fa-solid fa-map-location-dot" style="color: var(--primary-600);"></i> GPS Route & Cold Chain Van Movement</h4>
        <div id="customer-tracking-map" style="width: 100%; height: 420px; border-radius: var(--radius-lg); overflow: hidden;"></div>
      </div>
    `;

    setTimeout(() => {
      this.initCustomerTrackingMap(order);
    }, 200);
  },

  async initCustomerTrackingMap(order) {
    if (typeof L === 'undefined') return;

    if (this.state.leafletMap) {
      this.state.leafletMap.remove();
    }

    try {
      const delivery = await api.deliveries.getByOrderId(order.id);
      const lat = delivery.latitude || 19.2183;
      const lng = delivery.longitude || 72.9781;

      const map = L.map('customer-tracking-map').setView([lat, lng], 10);
      this.state.leafletMap = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Farm Marker
      const farmCoords = [19.9975, 73.7898];
      L.marker(farmCoords).addTo(map).bindPopup(`<b>Farm Source:</b> ${delivery.pickup || 'AgriConnect Farms'}`);

      // Moving Truck Marker
      const truckIcon = L.divIcon({
        className: 'custom-map-icon',
        html: '<div style="background: #16a34a; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #fff;"><i class="fa-solid fa-truck"></i></div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker([lat, lng], { icon: truckIcon }).addTo(map)
        .bindPopup(`<b>AgriLogistics Carrier</b><br>${delivery.vehicleNumber || 'Cold Chain Truck'}<br>Status: ${delivery.status}`)
        .openPopup();

      // Destination Marker
      const destCoords = [19.0760, 72.8777];
      L.marker(destCoords).addTo(map).bindPopup(`<b>Your Address:</b> ${delivery.destination}`);

      const routeLine = L.polyline([farmCoords, [lat, lng], destCoords], {
        color: '#16a34a',
        weight: 4,
        dashArray: '6, 6'
      }).addTo(map);

      map.fitBounds(routeLine.getBounds().pad(0.1));
    } catch (err) {
      console.warn('Map initialization with default coords:', err);
    }
  }
};

window.Customer = Customer;
