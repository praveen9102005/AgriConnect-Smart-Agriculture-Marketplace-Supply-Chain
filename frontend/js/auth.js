/**
 * AgriConnect Authentication & Session Manager
 */

const Auth = {
  getCurrentUser() {
    return ApiClient.getUser();
  },

  getToken() {
    return ApiClient.getToken();
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  },

  async login(email, password) {
    try {
      const response = await api.auth.login({ email, password });
      ApiClient.setToken(response.token);
      ApiClient.setUser({
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        farmerId: response.farmerId
      });
      this.updateNavbarAuth();
      this.showToast(`Welcome back, ${response.name}!`, 'success');
      return response;
    } catch (err) {
      this.showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  },

  async register(data) {
    try {
      const response = await api.auth.register(data);
      ApiClient.setToken(response.token);
      ApiClient.setUser({
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        farmerId: response.farmerId
      });
      this.updateNavbarAuth();
      this.showToast(`Account registered as ${response.role}!`, 'success');
      return response;
    } catch (err) {
      this.showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  },

  logout() {
    ApiClient.setToken(null);
    ApiClient.setUser(null);
    this.updateNavbarAuth();
    this.showToast('You have been logged out.', 'info');
    setTimeout(() => {
      window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
    }, 500);
  },

  updateNavbarAuth() {
    const user = this.getCurrentUser();
    const authActionsContainer = document.getElementById('nav-auth-actions');
    const roleNavLinks = document.getElementById('role-nav-links');

    if (!authActionsContainer) return;

    if (user) {
      authActionsContainer.innerHTML = `
        <div class="user-profile-menu">
          <div style="display: flex; flex-direction: column; align-items: flex-end;">
            <span style="font-weight: 700; font-size: 0.875rem; color: var(--slate-900);">${user.name}</span>
            <span class="role-pill">${user.role}</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="Auth.logout()">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </button>
        </div>
      `;

      if (roleNavLinks) {
        let roleLinkHtml = '';
        const inPages = window.location.pathname.includes('/pages/');
        const prefix = inPages ? '' : 'pages/';

        if (user.role === 'CUSTOMER') {
          roleLinkHtml = `<li><a href="${prefix}customer.html" class="nav-link ${window.location.pathname.includes('customer') ? 'active' : ''}">Customer Hub</a></li>`;
        } else if (user.role === 'FARMER') {
          roleLinkHtml = `<li><a href="${prefix}farmer.html" class="nav-link ${window.location.pathname.includes('farmer') ? 'active' : ''}">Farmer Portal</a></li>`;
        } else if (user.role === 'LOGISTICS') {
          roleLinkHtml = `<li><a href="${prefix}logistics.html" class="nav-link ${window.location.pathname.includes('logistics') ? 'active' : ''}">Logistics Portal</a></li>`;
        } else if (user.role === 'ADMIN') {
          roleLinkHtml = `<li><a href="${prefix}admin.html" class="nav-link ${window.location.pathname.includes('admin') ? 'active' : ''}">Admin Control</a></li>`;
        }
        roleNavLinks.innerHTML = roleLinkHtml;
      }
    } else {
      authActionsContainer.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="Auth.openAuthModal('login')">
          <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In
        </button>
        <button class="btn btn-primary btn-sm" onclick="Auth.openAuthModal('register')">
          <i class="fa-solid fa-user-plus"></i> Join Us
        </button>
      `;
      if (roleNavLinks) roleNavLinks.innerHTML = '';
    }

    this.refreshCartBadge();
  },

  async refreshCartBadge() {
    const badge = document.getElementById('nav-cart-count');
    if (!badge) return;

    if (!this.isAuthenticated()) {
      badge.textContent = '0';
      return;
    }

    try {
      const cart = await api.cart.get();
      if (cart && cart.totalCount !== undefined) {
        badge.textContent = cart.totalCount;
      }
    } catch {
      // ignore
    }
  },

  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'error' ? 'fa-triangle-exclamation' : (type === 'info' ? 'fa-info-circle' : 'fa-circle-check');
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  openAuthModal(mode = 'login') {
    let modal = document.getElementById('auth-modal');
    if (!modal) {
      this.createAuthModal();
      modal = document.getElementById('auth-modal');
    }
    this.switchAuthTab(mode);
    modal.classList.add('active');
  },

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
  },

  switchAuthTab(tab) {
    const loginForm = document.getElementById('auth-form-login');
    const registerForm = document.getElementById('auth-form-register');
    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');

    if (!loginForm || !registerForm) return;

    if (tab === 'login') {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      tabLogin.classList.add('btn-primary');
      tabLogin.classList.remove('btn-secondary');
      tabRegister.classList.add('btn-secondary');
      tabRegister.classList.remove('btn-primary');
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      tabRegister.classList.add('btn-primary');
      tabRegister.classList.remove('btn-secondary');
      tabLogin.classList.add('btn-secondary');
      tabLogin.classList.remove('btn-primary');
    }
  },

  createAuthModal() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'auth-modal';
    modalDiv.className = 'modal-overlay';
    modalDiv.innerHTML = `
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <div style="display: flex; gap: 0.5rem;">
            <button id="tab-btn-login" class="btn btn-primary btn-sm" onclick="Auth.switchAuthTab('login')">Sign In</button>
            <button id="tab-btn-register" class="btn btn-secondary btn-sm" onclick="Auth.switchAuthTab('register')">Register</button>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Auth.closeAuthModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <!-- Quick Demo Switcher -->
          <div style="background-color: var(--primary-50); border: 1px dashed var(--primary-400); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1.25rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary-800); margin-bottom: 0.5rem; text-transform: uppercase;">
              <i class="fa-solid fa-bolt"></i> 1-Click Demo Login
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
              <button class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="Auth.quickLogin('customer')">Customer</button>
              <button class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="Auth.quickLogin('farmer')">Farmer</button>
              <button class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="Auth.quickLogin('logistics')">Logistics</button>
              <button class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="Auth.quickLogin('admin')">Admin</button>
            </div>
          </div>

          <!-- Login Form -->
          <form id="auth-form-login" onsubmit="Auth.handleLoginSubmit(event)">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="login-email" class="form-control" required placeholder="e.g. priya.sharma@gmail.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="login-password" class="form-control" required placeholder="••••••••">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Sign In</button>
          </form>

          <!-- Register Form -->
          <form id="auth-form-register" style="display: none;" onsubmit="Auth.handleRegisterSubmit(event)">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="reg-name" class="form-control" required placeholder="Ramesh Patel">
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="reg-email" class="form-control" required placeholder="ramesh.patel@agriconnect.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password (min 6 characters)</label>
              <input type="password" id="reg-password" class="form-control" required minlength="6" placeholder="••••••••">
            </div>
            <div class="form-group">
              <label class="form-label">I am joining as</label>
              <select id="reg-role" class="form-control" onchange="Auth.toggleFarmerFields(this.value)">
                <option value="CUSTOMER">Customer / Consumer</option>
                <option value="FARMER">Farmer / Producer</option>
                <option value="LOGISTICS">Logistics / Delivery Partner</option>
              </select>
            </div>
            <div id="farmer-fields" style="display: none; border-top: 1px solid var(--border-light); padding-top: 1rem;">
              <div class="form-group">
                <label class="form-label">Farm Location & State</label>
                <input type="text" id="reg-location" class="form-control" placeholder="Nashik Valley, Maharashtra">
              </div>
              <div class="form-group">
                <label class="form-label">Crop Specialty</label>
                <input type="text" id="reg-specialty" class="form-control" placeholder="Organic Vegetables & Grapes">
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv);
  },

  toggleFarmerFields(role) {
    const fields = document.getElementById('farmer-fields');
    if (fields) {
      fields.style.display = role === 'FARMER' ? 'block' : 'none';
    }
  },

  async quickLogin(role) {
    const demoAccounts = {
      customer: { email: 'priya.sharma@gmail.com', password: 'customer123', target: 'customer.html' },
      farmer: { email: 'ramesh.patel@agriconnect.com', password: 'farmer123', target: 'farmer.html' },
      logistics: { email: 'vikram.logistics@agriconnect.com', password: 'logistics123', target: 'logistics.html' },
      admin: { email: 'admin@agriconnect.com', password: 'admin123', target: 'admin.html' }
    };

    const acc = demoAccounts[role];
    if (!acc) return;

    try {
      await this.login(acc.email, acc.password);
      this.closeAuthModal();
      const inPages = window.location.pathname.includes('/pages/');
      const targetUrl = inPages ? acc.target : `pages/${acc.target}`;
      window.location.href = targetUrl;
    } catch {
      // login method already shows toast
    }
  },

  async handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      const res = await this.login(email, password);
      this.closeAuthModal();
      // Redirect to role hub
      const inPages = window.location.pathname.includes('/pages/');
      const prefix = inPages ? '' : 'pages/';
      if (res.role === 'FARMER') window.location.href = `${prefix}farmer.html`;
      else if (res.role === 'LOGISTICS') window.location.href = `${prefix}logistics.html`;
      else if (res.role === 'ADMIN') window.location.href = `${prefix}admin.html`;
      else if (res.role === 'CUSTOMER') window.location.href = `${prefix}customer.html`;
    } catch {
      // handled
    }
  },

  async handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const location = document.getElementById('reg-location') ? document.getElementById('reg-location').value : '';
    const specialty = document.getElementById('reg-specialty') ? document.getElementById('reg-specialty').value : '';

    try {
      const res = await this.register({ name, email, password, role, location, specialty });
      this.closeAuthModal();
      const inPages = window.location.pathname.includes('/pages/');
      const prefix = inPages ? '' : 'pages/';
      if (res.role === 'FARMER') window.location.href = `${prefix}farmer.html`;
      else if (res.role === 'LOGISTICS') window.location.href = `${prefix}logistics.html`;
      else if (res.role === 'ADMIN') window.location.href = `${prefix}admin.html`;
      else if (res.role === 'CUSTOMER') window.location.href = `${prefix}customer.html`;
    } catch {
      // handled
    }
  }
};

window.Auth = Auth;
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavbarAuth();
});
