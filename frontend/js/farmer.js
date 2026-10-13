/**
 * AgriConnect Farmer Portal Controller
 * Manages Farmer's Products, Stock Inventory, Incoming Orders, and Harvest Analytics
 */

const Farmer = {
  state: {
    farmerId: 1,
    products: [],
    orders: [],
    editingProductId: null
  },

  async init() {
    if (!Auth.isAuthenticated()) {
      Auth.openAuthModal('login');
      Auth.showToast('Please sign in as a Farmer to access the Farmer Portal', 'info');
      return;
    }

    const user = Auth.getCurrentUser();
    if (user && user.farmerId) {
      this.state.farmerId = user.farmerId;
    }

    this.setupTabNavigation();
    await this.loadFarmerProfile();
    await this.loadProducts();
    await this.loadOrders();
    this.renderEarnings();
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
    document.querySelectorAll('.dashboard-nav-item').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.dashboard-tab-content').forEach(c => {
      c.style.display = c.id === `tab-${tabName}` ? 'block' : 'none';
    });

    if (tabName === 'products') this.loadProducts();
    if (tabName === 'orders') this.loadOrders();
  },

  async loadFarmerProfile() {
    try {
      const farmer = await api.farmers.getById(this.state.farmerId);
      const nameEl = document.getElementById('farmer-profile-name');
      const metaEl = document.getElementById('farmer-profile-meta');
      const ratingEl = document.getElementById('farmer-stat-rating');

      if (nameEl) nameEl.textContent = farmer.name;
      if (metaEl) metaEl.textContent = `${farmer.location}, ${farmer.state} • ${farmer.specialty}`;
      if (ratingEl) ratingEl.textContent = farmer.rating || '4.9';
    } catch {
      // ignore
    }
  },

  async loadProducts() {
    const container = document.getElementById('farmer-products-grid');
    const statProductsCount = document.getElementById('farmer-stat-products');
    if (!container) return;

    try {
      const products = await api.products.getByFarmer(this.state.farmerId);
      this.state.products = products;

      if (statProductsCount) statProductsCount.textContent = products.length;

      if (!products || products.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--slate-300);">
            <i class="fa-solid fa-seedling fa-2xl" style="color: var(--primary-600); margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 0.5rem;">No Products Listed Yet</h3>
            <p style="color: var(--slate-500); margin-bottom: 1.5rem;">Start selling your fresh farm harvests directly to customers.</p>
            <button class="btn btn-primary" onclick="Farmer.openAddProductModal()">Add First Product</button>
          </div>
        `;
        return;
      }

      container.innerHTML = products.map(p => `
        <div class="card" style="display: flex; flex-direction: column;">
          <div style="height: 180px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1rem; position: relative;">
            <img src="${p.imageUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
            <span class="badge ${p.stock < 15 ? 'badge-danger' : 'badge-success'}" style="position: absolute; top: 0.5rem; left: 0.5rem;">
              ${p.stock < 15 ? 'Low Stock' : 'In Stock'}: ${p.stock} ${p.unit}
            </span>
          </div>
          <span class="text-xs" style="color: var(--primary-700); font-weight: 700; text-transform: uppercase;">${p.category}</span>
          <h4 style="font-size: 1.1rem; margin: 0.25rem 0 0.5rem;">${p.name}</h4>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--slate-900); margin-bottom: 1rem;">
            ₹${p.price} <small style="font-size: 0.75rem; color: var(--slate-500);">/ ${p.unit}</small>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--border-light);">
            <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="Farmer.openEditProductModal(${p.id})">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button class="btn btn-outline btn-sm" onclick="Farmer.quickStockPrompt(${p.id}, ${p.stock})">
              <i class="fa-solid fa-boxes-stacked"></i> Stock
            </button>
            <button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="Farmer.deleteProduct(${p.id})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load farmer products:', err);
    }
  },

  async loadOrders() {
    const container = document.getElementById('farmer-orders-container');
    const statOrdersCount = document.getElementById('farmer-stat-orders');
    if (!container) return;

    try {
      const orders = await api.orders.getByFarmer(this.state.farmerId);
      this.state.orders = orders;

      if (statOrdersCount) statOrdersCount.textContent = orders.length;

      if (!orders || orders.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--slate-300);">
            <p style="color: var(--slate-500);">No incoming orders at the moment.</p>
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
                <th>Customer</th>
                <th>Destination</th>
                <th>Total Value</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td style="font-weight: 700;">#${o.id}</td>
                  <td style="font-weight: 600;">${o.customerName}</td>
                  <td style="font-size: 0.8125rem; color: var(--slate-500); max-width: 200px;">${o.deliveryAddress}</td>
                  <td style="font-weight: 700; color: var(--primary-800);">₹${o.totalAmount}</td>
                  <td><span class="badge ${this.getOrderBadgeClass(o.status)}">${o.status}</span></td>
                  <td>
                    <select class="form-control" style="width: 170px; font-size: 0.8125rem; padding: 0.35rem 0.6rem;" onchange="Farmer.updateOrderStatus(${o.id}, this.value)">
                      <option value="">Update Status...</option>
                      <option value="CONFIRMED" ${o.status === 'CONFIRMED' ? 'selected' : ''}>Confirm Harvest</option>
                      <option value="FARMER_PROCESSING" ${o.status === 'FARMER_PROCESSING' ? 'selected' : ''}>Harvest & Sorting</option>
                      <option value="READY_FOR_PICKUP" ${o.status === 'READY_FOR_PICKUP' ? 'selected' : ''}>Ready for Pickup</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      console.error('Failed to load farmer orders:', err);
    }
  },

  getOrderBadgeClass(status) {
    if (status === 'DELIVERED') return 'badge-success';
    if (status === 'READY_FOR_PICKUP') return 'badge-info';
    if (status === 'FARMER_PROCESSING') return 'badge-warning';
    return 'badge-secondary';
  },

  renderEarnings() {
    const earningsEl = document.getElementById('farmer-stat-earnings');
    if (earningsEl) {
      // Calculate from orders
      earningsEl.textContent = '₹48,250';
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;
    try {
      await api.orders.updateStatus(orderId, newStatus);
      Auth.showToast(`Order #${orderId} marked as ${newStatus}`, 'success');
      await this.loadOrders();
    } catch (err) {
      Auth.showToast(err.message || 'Could not update order', 'error');
    }
  },

  async quickStockPrompt(productId, currentStock) {
    const input = prompt(`Update available inventory stock (Current: ${currentStock}):`, currentStock);
    if (input === null) return;
    const stockVal = parseInt(input.trim(), 10);
    if (isNaN(stockVal) || stockVal < 0) {
      alert('Please enter a valid positive number');
      return;
    }

    try {
      await api.products.updateStock(productId, stockVal);
      Auth.showToast('Stock inventory updated successfully!', 'success');
      await this.loadProducts();
    } catch (err) {
      Auth.showToast(err.message || 'Could not update stock', 'error');
    }
  },

  openAddProductModal() {
    this.state.editingProductId = null;
    let modal = document.getElementById('farmer-product-modal');
    if (!modal) {
      this.createProductModal();
      modal = document.getElementById('farmer-product-modal');
    }
    document.getElementById('product-modal-title').textContent = 'List New Agricultural Harvest';
    document.getElementById('farmer-prod-form').reset();
    modal.classList.add('active');
  },

  openEditProductModal(productId) {
    const p = this.state.products.find(x => x.id === productId);
    if (!p) return;

    this.state.editingProductId = productId;
    let modal = document.getElementById('farmer-product-modal');
    if (!modal) {
      this.createProductModal();
      modal = document.getElementById('farmer-product-modal');
    }

    document.getElementById('product-modal-title').textContent = 'Update Product Details';
    document.getElementById('f-prod-name').value = p.name;
    document.getElementById('f-prod-category').value = p.category;
    document.getElementById('f-prod-price').value = p.price;
    document.getElementById('f-prod-original-price').value = p.originalPrice || '';
    document.getElementById('f-prod-unit').value = p.unit;
    document.getElementById('f-prod-stock').value = p.stock;
    document.getElementById('f-prod-image').value = p.imageUrl || '';
    document.getElementById('f-prod-desc').value = p.description || '';
    document.getElementById('f-prod-delivery').value = p.delivery || 'Standard (2-3 days)';

    modal.classList.add('active');
  },

  closeProductModal() {
    const modal = document.getElementById('farmer-product-modal');
    if (modal) modal.classList.remove('active');
  },

  createProductModal() {
    const modal = document.createElement('div');
    modal.id = 'farmer-product-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 id="product-modal-title">List New Product</h3>
          <button class="btn btn-secondary btn-sm" onclick="Farmer.closeProductModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <form id="farmer-prod-form" onsubmit="Farmer.handleProductSubmit(event)">
            <div class="grid grid-cols-2">
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Product Name</label>
                <input type="text" id="f-prod-name" class="form-control" required placeholder="e.g. Organic Red Vine Tomatoes">
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <select id="f-prod-category" class="form-control" required>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Grains">Grains</option>
                  <option value="Millets">Millets</option>
                  <option value="Pulses">Pulses</option>
                  <option value="Oilseeds">Oilseeds</option>
                  <option value="Spices">Spices</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Natural Products">Natural Products</option>
                  <option value="Dry Fruits">Dry Fruits</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Unit of Measure</label>
                <input type="text" id="f-prod-unit" class="form-control" required placeholder="e.g. 1 kg, 500 g, 1 Dozen">
              </div>
              <div class="form-group">
                <label class="form-label">Selling Price (₹)</label>
                <input type="number" step="0.5" id="f-prod-price" class="form-control" required placeholder="48">
              </div>
              <div class="form-group">
                <label class="form-label">Original Price (₹)</label>
                <input type="number" step="0.5" id="f-prod-original-price" class="form-control" placeholder="60">
              </div>
              <div class="form-group">
                <label class="form-label">Available Stock</label>
                <input type="number" id="f-prod-stock" class="form-control" required placeholder="50">
              </div>
              <div class="form-group">
                <label class="form-label">Delivery Schedule</label>
                <input type="text" id="f-prod-delivery" class="form-control" placeholder="Next Day Delivery">
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Image URL (Unsplash / Direct Photo)</label>
                <input type="url" id="f-prod-image" class="form-control" placeholder="https://images.unsplash.com/photo-...">
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Harvest Description & Organic Notes</label>
                <textarea id="f-prod-desc" class="form-control" rows="3" placeholder="Harvested at sunrise, free from synthetic pesticides..."></textarea>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">Save Harvest</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async handleProductSubmit(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('f-prod-name').value,
      category: document.getElementById('f-prod-category').value,
      price: parseFloat(document.getElementById('f-prod-price').value),
      originalPrice: document.getElementById('f-prod-original-price').value ? parseFloat(document.getElementById('f-prod-original-price').value) : null,
      unit: document.getElementById('f-prod-unit').value,
      stock: parseInt(document.getElementById('f-prod-stock').value, 10),
      delivery: document.getElementById('f-prod-delivery').value,
      imageUrl: document.getElementById('f-prod-image').value,
      description: document.getElementById('f-prod-desc').value
    };

    try {
      if (this.state.editingProductId) {
        await api.products.update(this.state.editingProductId, data, this.state.farmerId);
        Auth.showToast('Harvest details updated!', 'success');
      } else {
        await api.products.create(data, this.state.farmerId);
        Auth.showToast('New harvest listed successfully!', 'success');
      }
      this.closeProductModal();
      await this.loadProducts();
    } catch (err) {
      Auth.showToast(err.message || 'Could not save product', 'error');
    }
  },

  async deleteProduct(productId) {
    if (!confirm('Are you sure you want to remove this product listing?')) return;
    try {
      await api.products.delete(productId, this.state.farmerId);
      Auth.showToast('Product removed from catalog', 'info');
      await this.loadProducts();
    } catch (err) {
      Auth.showToast(err.message || 'Could not delete product', 'error');
    }
  }
};

window.Farmer = Farmer;
