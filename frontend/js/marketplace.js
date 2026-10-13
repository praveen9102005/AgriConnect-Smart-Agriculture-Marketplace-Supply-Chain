/**
 * AgriConnect Marketplace Controller
 * Handles 60+ agricultural products, multi-faceted filtering, sorting, pagination, and details modal
 */

const Marketplace = {
  state: {
    category: '',
    search: '',
    minPrice: null,
    maxPrice: null,
    minRating: null,
    sortBy: 'id',
    sortDir: 'asc',
    page: 0,
    size: 12,
    totalPages: 1,
    totalElements: 0,
    selectedProduct: null
  },

  async init() {
    this.parseUrlParams();
    this.setupEventListeners();
    await this.loadCategoriesFilter();
    await this.loadProducts();

    // Check if productId in URL for auto-opening modal
    const urlParams = new URLSearchParams(window.location.search);
    const prodId = urlParams.get('productId');
    if (prodId) {
      this.openProductModal(prodId);
    }
  },

  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('category')) this.state.category = params.get('category');
    if (params.get('search')) this.state.search = params.get('search');
    if (params.get('page')) this.state.page = parseInt(params.get('page'), 10);

    const searchInput = document.getElementById('market-search-input');
    if (searchInput && this.state.search) searchInput.value = this.state.search;
  },

  setupEventListeners() {
    const searchInput = document.getElementById('market-search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.state.search = e.target.value;
          this.state.page = 0;
          this.loadProducts();
        }, 400);
      });
    }

    const sortSelect = document.getElementById('market-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'price-asc') {
          this.state.sortBy = 'price';
          this.state.sortDir = 'asc';
        } else if (val === 'price-desc') {
          this.state.sortBy = 'price';
          this.state.sortDir = 'desc';
        } else if (val === 'rating') {
          this.state.sortBy = 'rating';
          this.state.sortDir = 'desc';
        } else {
          this.state.sortBy = 'id';
          this.state.sortDir = 'asc';
        }
        this.state.page = 0;
        this.loadProducts();
      });
    }
  },

  async loadCategoriesFilter() {
    const container = document.getElementById('market-categories-list');
    if (!container) return;

    try {
      const categories = await api.categories.getAll();
      let html = `
        <button class="filter-pill ${!this.state.category ? 'active' : ''}" onclick="Marketplace.filterCategory('')">
          All Products
        </button>
      `;

      categories.forEach(cat => {
        const activeClass = this.state.category.toLowerCase() === cat.name.toLowerCase() ? 'active' : '';
        html += `
          <button class="filter-pill ${activeClass}" onclick="Marketplace.filterCategory('${cat.name}')">
            ${cat.name}
          </button>
        `;
      });

      container.innerHTML = html;
    } catch (err) {
      console.error('Failed to load categories for filter:', err);
    }
  },

  filterCategory(catName) {
    this.state.category = catName;
    this.state.page = 0;
    this.loadCategoriesFilter();
    this.loadProducts();
  },

  filterPrice(min, max) {
    this.state.minPrice = min;
    this.state.maxPrice = max;
    this.state.page = 0;
    this.loadProducts();
  },

  filterRating(minRating) {
    this.state.minRating = minRating;
    this.state.page = 0;
    this.loadProducts();
  },

  async loadProducts() {
    const container = document.getElementById('market-products-grid');
    const countDisplay = document.getElementById('market-products-count');
    if (!container) return;

    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--slate-500);">
        <i class="fa-solid fa-spinner fa-spin fa-2xl" style="color: var(--primary-600); margin-bottom: 1rem;"></i>
        <p>Loading farm-fresh harvests...</p>
      </div>
    `;

    try {
      const data = await api.products.getAll({
        category: this.state.category || undefined,
        search: this.state.search || undefined,
        minPrice: this.state.minPrice || undefined,
        maxPrice: this.state.maxPrice || undefined,
        minRating: this.state.minRating || undefined,
        page: this.state.page,
        size: this.state.size,
        sortBy: this.state.sortBy,
        sortDir: this.state.sortDir
      });

      const products = data.content || [];
      this.state.totalPages = data.totalPages || 1;
      this.state.totalElements = data.totalElements || products.length;

      if (countDisplay) {
        countDisplay.textContent = `Showing ${products.length} of ${this.state.totalElements} agricultural products`;
      }

      if (products.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--slate-300);">
            <div style="font-size: 3rem; color: var(--slate-400); margin-bottom: 1rem;">
              <i class="fa-solid fa-seedling"></i>
            </div>
            <h3 style="margin-bottom: 0.5rem;">No Agricultural Products Found</h3>
            <p style="color: var(--slate-500); max-width: 400px; margin: 0 auto 1.5rem;">
              No harvests matched your current filter criteria. Try clearing search filters or selecting another category.
            </p>
            <button class="btn btn-outline" onclick="Marketplace.resetFilters()">Reset All Filters</button>
          </div>
        `;
        this.renderPagination();
        return;
      }

      container.innerHTML = products.map(p => this.renderProductCard(p)).join('');
      this.renderPagination();
    } catch (err) {
      console.error('Error fetching products:', err);
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--danger);">
          <i class="fa-solid fa-triangle-exclamation fa-2xl"></i>
          <p style="margin-top: 1rem;">Failed to connect to backend server. Make sure Spring Boot is running on port 8080.</p>
        </div>
      `;
    }
  },

  renderProductCard(p) {
    const discount = p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : null;

    return `
      <div class="product-card">
        <div class="product-thumb-container" onclick="Marketplace.openProductModal(${p.id})" style="cursor: pointer;">
          <img class="product-thumb" src="${p.imageUrl}" alt="${p.name}" loading="lazy">
          ${discount ? `<span class="product-badge-fresh" style="background-color: var(--terracotta);">${discount}% OFF</span>` : `<span class="product-badge-fresh">Verified Farm</span>`}
          <button class="product-wishlist-btn" onclick="Marketplace.toggleWishlist(event, ${p.id})">
            <i class="fa-regular fa-heart"></i>
          </button>
        </div>
        <div class="product-body">
          <div class="product-farmer-meta">
            <i class="fa-solid fa-tractor"></i>
            <span>${p.farmerName || 'Direct Farm'}</span>
          </div>
          <h3 class="product-title" onclick="Marketplace.openProductModal(${p.id})" style="cursor: pointer;">${p.name}</h3>
          <p class="product-desc">${p.description || ''}</p>
          <div class="product-rating-row">
            <div class="product-rating-stars">
              <i class="fa-solid fa-star"></i>
              <strong style="color: var(--slate-800); margin-left: 0.2rem;">${p.rating || 4.8}</strong>
            </div>
            <span class="product-reviews-count">(${p.reviews || 0} reviews)</span>
            <span style="margin-left: auto; font-size: 0.72rem; color: var(--slate-400);">
              <i class="fa-solid fa-box"></i> Stock: ${p.stock || 0}
            </span>
          </div>
          <div class="product-footer">
            <div class="product-price-box">
              <div class="product-price">₹${p.price}</div>
              <div style="display: flex; gap: 0.4rem; align-items: baseline;">
                ${p.originalPrice ? `<span class="product-original-price">₹${p.originalPrice}</span>` : ''}
                <span class="product-unit">/ ${p.unit}</span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="Marketplace.handleAddToCart(${p.id})">
              <i class="fa-solid fa-cart-plus"></i> Add
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderPagination() {
    const container = document.getElementById('market-pagination');
    if (!container) return;

    if (this.state.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <button class="btn btn-secondary btn-sm" ${this.state.page === 0 ? 'disabled' : ''} onclick="Marketplace.goToPage(${this.state.page - 1})">
        <i class="fa-solid fa-chevron-left"></i> Prev
      </button>
    `;

    for (let i = 0; i < this.state.totalPages; i++) {
      html += `
        <button class="btn ${this.state.page === i ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="Marketplace.goToPage(${i})">
          ${i + 1}
        </button>
      `;
    }

    html += `
      <button class="btn btn-secondary btn-sm" ${this.state.page >= this.state.totalPages - 1 ? 'disabled' : ''} onclick="Marketplace.goToPage(${this.state.page + 1})">
        Next <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    container.innerHTML = html;
  },

  goToPage(page) {
    this.state.page = page;
    this.loadProducts();
    window.scrollTo({ top: 300, behavior: 'smooth' });
  },

  resetFilters() {
    this.state.category = '';
    this.state.search = '';
    this.state.minPrice = null;
    this.state.maxPrice = null;
    this.state.minRating = null;
    this.state.page = 0;

    const searchInput = document.getElementById('market-search-input');
    if (searchInput) searchInput.value = '';

    this.loadCategoriesFilter();
    this.loadProducts();
  },

  async openProductModal(productId) {
    try {
      const product = await api.products.getById(productId);
      this.state.selectedProduct = product;

      let modal = document.getElementById('product-details-modal');
      if (!modal) {
        this.createProductDetailsModal();
        modal = document.getElementById('product-details-modal');
      }

      document.getElementById('modal-prod-img').src = product.imageUrl;
      document.getElementById('modal-prod-title').textContent = product.name;
      document.getElementById('modal-prod-category').textContent = product.category;
      document.getElementById('modal-prod-farmer').textContent = product.farmerName || 'Verified Regional Farmer';
      document.getElementById('modal-prod-desc').textContent = product.description || 'Pesticide-free agricultural harvest.';
      document.getElementById('modal-prod-price').textContent = `₹${product.price}`;
      document.getElementById('modal-prod-unit').textContent = `/ ${product.unit}`;
      document.getElementById('modal-prod-stock').textContent = `${product.stock} ${product.unit} available`;
      document.getElementById('modal-prod-delivery').textContent = product.delivery || 'Standard Delivery (2-3 days)';
      document.getElementById('modal-prod-rating').textContent = product.rating || '4.8';
      document.getElementById('modal-prod-reviews-count').textContent = `(${product.reviews || 0} reviews)`;
      document.getElementById('modal-prod-qty').value = '1';

      // Load reviews
      this.loadProductReviews(productId);

      modal.classList.add('active');
    } catch (err) {
      Auth.showToast('Could not load product details', 'error');
    }
  },

  closeProductModal() {
    const modal = document.getElementById('product-details-modal');
    if (modal) modal.classList.remove('active');
  },

  createProductDetailsModal() {
    const modal = document.createElement('div');
    modal.id = 'product-details-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 720px;">
        <div class="modal-header">
          <span class="badge badge-success" id="modal-prod-category">Category</span>
          <button class="btn btn-secondary btn-sm" onclick="Marketplace.closeProductModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            <div style="height: 280px; border-radius: var(--radius-lg); overflow: hidden; background: var(--slate-100);">
              <img id="modal-prod-img" src="" alt="Product" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div>
              <h2 id="modal-prod-title" style="font-size: 1.4rem; margin-bottom: 0.5rem;">Product Name</h2>
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--primary-700); font-weight: 600; margin-bottom: 0.75rem;">
                <i class="fa-solid fa-tractor"></i>
                <span id="modal-prod-farmer">Farmer</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <div style="color: #f59e0b;"><i class="fa-solid fa-star"></i> <strong id="modal-prod-rating">4.8</strong></div>
                <span id="modal-prod-reviews-count" style="color: var(--slate-400); font-size: 0.8125rem;">(0 reviews)</span>
              </div>
              <p id="modal-prod-desc" style="font-size: 0.875rem; color: var(--slate-600); margin-bottom: 1rem; line-height: 1.5;"></p>
              
              <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 1rem;">
                <span id="modal-prod-price" style="font-size: 1.75rem; font-weight: 800; color: var(--slate-900);">₹0</span>
                <span id="modal-prod-unit" style="font-size: 0.875rem; color: var(--slate-500);">/ unit</span>
              </div>

              <div style="background: var(--slate-50); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.8125rem; margin-bottom: 1.25rem;">
                <div><i class="fa-solid fa-boxes-stacked" style="color: var(--primary-600);"></i> <strong>Stock:</strong> <span id="modal-prod-stock"></span></div>
                <div style="margin-top: 0.25rem;"><i class="fa-solid fa-truck-fast" style="color: var(--info);"></i> <strong>Delivery:</strong> <span id="modal-prod-delivery"></span></div>
              </div>

              <div style="display: flex; gap: 0.75rem; align-items: center;">
                <div style="display: flex; align-items: center; border: 1px solid var(--slate-300); border-radius: var(--radius-md); overflow: hidden;">
                  <button type="button" class="btn btn-secondary btn-sm" style="border: none; border-radius: 0; padding: 0.5rem 0.75rem;" onclick="Marketplace.adjustModalQty(-1)">-</button>
                  <input type="number" id="modal-prod-qty" value="1" min="1" style="width: 45px; text-align: center; border: none; outline: none; font-weight: 700;">
                  <button type="button" class="btn btn-secondary btn-sm" style="border: none; border-radius: 0; padding: 0.5rem 0.75rem;" onclick="Marketplace.adjustModalQty(1)">+</button>
                </div>
                <button class="btn btn-primary" style="flex: 1;" onclick="Marketplace.addModalProductToCart()">
                  <i class="fa-solid fa-cart-shopping"></i> Add to Cart
                </button>
              </div>
            </div>
          </div>

          <!-- Customer Reviews Section -->
          <div style="border-top: 1px solid var(--border-light); padding-top: 1.25rem;">
            <h4 style="font-size: 1rem; margin-bottom: 1rem;">Customer Reviews & Ratings</h4>
            <div id="modal-reviews-list" style="max-height: 180px; overflow-y: auto; margin-bottom: 1rem;">
              <p style="font-size: 0.8125rem; color: var(--slate-400);">No reviews yet.</p>
            </div>

            <!-- Review Input -->
            <form onsubmit="Marketplace.submitReview(event)" style="background: var(--slate-50); padding: 1rem; border-radius: var(--radius-md);">
              <div style="font-weight: 600; font-size: 0.8125rem; margin-bottom: 0.5rem;">Write a Review</div>
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                <select id="review-rating" class="form-control" style="width: 120px;" required>
                  <option value="5">5 ★ Superb</option>
                  <option value="4">4 ★ Good</option>
                  <option value="3">3 ★ Average</option>
                  <option value="2">2 ★ Fair</option>
                  <option value="1">1 ★ Poor</option>
                </select>
                <input type="text" id="review-comment" class="form-control" placeholder="Share your experience with this farm harvest..." required>
                <button type="submit" class="btn btn-primary btn-sm">Post</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  adjustModalQty(delta) {
    const input = document.getElementById('modal-prod-qty');
    if (!input) return;
    let val = parseInt(input.value, 10) + delta;
    if (val < 1) val = 1;
    input.value = val;
  },

  async addModalProductToCart() {
    if (!this.state.selectedProduct) return;
    const qty = parseInt(document.getElementById('modal-prod-qty').value, 10) || 1;

    if (!Auth.isAuthenticated()) {
      Auth.openAuthModal('login');
      Auth.showToast('Please sign in to order farm-fresh produce', 'info');
      return;
    }

    try {
      await api.cart.add(this.state.selectedProduct.id, qty);
      Auth.showToast(`Added ${qty} ${this.state.selectedProduct.unit} to cart!`, 'success');
      Auth.refreshCartBadge();
      this.closeProductModal();
    } catch (err) {
      Auth.showToast(err.message || 'Failed to add to cart', 'error');
    }
  },

  async loadProductReviews(productId) {
    const list = document.getElementById('modal-reviews-list');
    if (!list) return;

    try {
      const reviews = await api.reviews.getByProduct(productId);
      if (!reviews || reviews.length === 0) {
        list.innerHTML = `<p style="font-size: 0.8125rem; color: var(--slate-400); font-style: italic;">No reviews yet. Be the first customer to leave feedback!</p>`;
        return;
      }

      list.innerHTML = reviews.map(r => `
        <div style="border-bottom: 1px solid var(--border-light); padding: 0.6rem 0;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8125rem;">
            <strong>${r.customerName || 'Customer'}</strong>
            <span style="color: #f59e0b;"><i class="fa-solid fa-star"></i> ${r.rating}</span>
          </div>
          <p style="font-size: 0.8125rem; color: var(--slate-600); margin-top: 0.25rem;">${r.comment || ''}</p>
        </div>
      `).join('');
    } catch (err) {
      list.innerHTML = `<p style="font-size: 0.8125rem; color: var(--slate-400);">Reviews currently unavailable.</p>`;
    }
  },

  async submitReview(e) {
    e.preventDefault();
    if (!Auth.isAuthenticated()) {
      Auth.openAuthModal('login');
      Auth.showToast('Please sign in to write a review', 'info');
      return;
    }

    if (!this.state.selectedProduct) return;

    const rating = parseFloat(document.getElementById('review-rating').value);
    const comment = document.getElementById('review-comment').value;

    try {
      await api.reviews.create({
        productId: this.state.selectedProduct.id,
        rating,
        comment
      });
      Auth.showToast('Thank you! Review published.', 'success');
      document.getElementById('review-comment').value = '';
      this.loadProductReviews(this.state.selectedProduct.id);
    } catch (err) {
      Auth.showToast(err.message || 'Could not post review', 'error');
    }
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
      Auth.showToast('Saved to wishlist!', 'success');
    } else {
      icon.className = 'fa-regular fa-heart';
      Auth.showToast('Removed from wishlist', 'info');
    }
  }
};

window.Marketplace = Marketplace;
