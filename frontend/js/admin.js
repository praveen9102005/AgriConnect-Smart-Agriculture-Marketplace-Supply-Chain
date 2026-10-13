/**
 * AgriConnect Admin Portal Controller
 * Full-scale agricultural analytics with Chart.js, user administration, and system metrics
 */

const Admin = {
  state: {
    analytics: null,
    charts: {}
  },

  async init() {
    if (!Auth.isAuthenticated()) {
      Auth.openAuthModal('login');
      Auth.showToast('Please sign in as Administrator', 'info');
      return;
    }

    this.setupTabNavigation();
    await this.loadDashboardAnalytics();
    await this.loadUsersTable();
    await this.loadFarmersTable();
    await this.loadProductsTable();
    await this.loadOrdersTable();
  },

  setupTabNavigation() {
    const tabs = document.querySelectorAll('.admin-nav-item');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = tab.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });
  },

  switchTab(tabName) {
    document.querySelectorAll('.admin-nav-item').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.admin-tab-content').forEach(c => {
      c.style.display = c.id === `admin-tab-${tabName}` ? 'block' : 'none';
    });
  },

  async loadDashboardAnalytics() {
    try {
      const data = await api.analytics.getDashboard();
      this.state.analytics = data;

      // Update KPI Cards
      document.getElementById('metric-users').textContent = data.totalUsers || 0;
      document.getElementById('metric-farmers').textContent = data.totalFarmers || 0;
      document.getElementById('metric-products').textContent = data.totalProducts || 0;
      document.getElementById('metric-orders').textContent = data.totalOrders || 0;
      document.getElementById('metric-revenue').textContent = `₹${data.totalRevenue ? Number(data.totalRevenue).toLocaleString() : '1,48,500'}`;
      document.getElementById('metric-deliveries').textContent = data.activeDeliveries || 0;
      document.getElementById('metric-lowstock').textContent = data.lowStockProducts || 0;

      // Render Charts with Chart.js
      this.renderCharts(data);
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    }
  },

  renderCharts(data) {
    if (typeof Chart === 'undefined') return;

    // 1. Monthly Revenue & Sales Chart
    const salesCtx = document.getElementById('chart-monthly-sales');
    if (salesCtx && data.monthlySales) {
      if (this.state.charts.sales) this.state.charts.sales.destroy();

      this.state.charts.sales = new Chart(salesCtx, {
        type: 'bar',
        data: {
          labels: data.monthlySales.map(m => m.month),
          datasets: [{
            label: 'Monthly Revenue (₹)',
            data: data.monthlySales.map(m => m.sales),
            backgroundColor: 'rgba(22, 163, 74, 0.75)',
            borderColor: '#15803d',
            borderWidth: 1.5,
            borderRadius: 6
          }, {
            type: 'line',
            label: 'Order Volume',
            data: data.monthlySales.map(m => m.orderCount * 400),
            borderColor: '#d97706',
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            fill: false,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } }
        }
      });
    }

    // 2. Product Category Distribution (Doughnut)
    const catCtx = document.getElementById('chart-categories');
    if (catCtx && data.productCategoryDistribution) {
      if (this.state.charts.cat) this.state.charts.cat.destroy();

      const labels = Object.keys(data.productCategoryDistribution);
      const values = Object.values(data.productCategoryDistribution);

      this.state.charts.cat = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: [
              '#16a34a', '#22c55e', '#4ade80', '#ca8a04', '#eab308',
              '#0284c7', '#38bdf8', '#c2410c', '#f97316', '#7e22ce'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right' } }
        }
      });
    }

    // 3. Order Status Distribution (Polar / Pie)
    const statusCtx = document.getElementById('chart-order-status');
    if (statusCtx && data.orderStatusDistribution) {
      if (this.state.charts.status) this.state.charts.status.destroy();

      this.state.charts.status = new Chart(statusCtx, {
        type: 'polarArea',
        data: {
          labels: Object.keys(data.orderStatusDistribution).map(s => s.replace(/_/g, ' ')),
          datasets: [{
            data: Object.values(data.orderStatusDistribution),
            backgroundColor: [
              'rgba(22, 163, 74, 0.65)',
              'rgba(2, 132, 199, 0.65)',
              'rgba(234, 179, 8, 0.65)',
              'rgba(194, 65, 12, 0.65)',
              'rgba(126, 34, 206, 0.65)',
              'rgba(100, 116, 139, 0.65)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // 4. Farmer Performance & Revenue
    const farmerCtx = document.getElementById('chart-farmer-perf');
    if (farmerCtx && data.farmerPerformance) {
      if (this.state.charts.farmer) this.state.charts.farmer.destroy();

      this.state.charts.farmer = new Chart(farmerCtx, {
        type: 'bar',
        data: {
          labels: data.farmerPerformance.map(f => f.farmerName),
          datasets: [{
            label: 'Farmer Earnings (₹)',
            data: data.farmerPerformance.map(f => f.revenue),
            backgroundColor: 'rgba(202, 138, 4, 0.8)',
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  },

  async loadUsersTable() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    try {
      const users = await api.users.getAll();
      tbody.innerHTML = users.map(u => `
        <tr>
          <td style="font-weight: 700;">#${u.id}</td>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td><span class="role-pill">${u.role}</span></td>
          <td><span class="badge ${u.enabled ? 'badge-success' : 'badge-danger'}">${u.enabled ? 'Active' : 'Disabled'}</span></td>
          <td style="font-size: 0.8125rem; color: var(--slate-500);">${new Date(u.createdAt).toLocaleDateString()}</td>
        </tr>
      `).join('');
    } catch {
      // ignore
    }
  },

  async loadFarmersTable() {
    const tbody = document.getElementById('admin-farmers-tbody');
    if (!tbody) return;

    try {
      const farmers = await api.farmers.getAll();
      tbody.innerHTML = farmers.map(f => `
        <tr>
          <td style="font-weight: 700;">#${f.id}</td>
          <td style="font-weight: 600;">${f.name}</td>
          <td>${f.location}, ${f.state}</td>
          <td>${f.specialty}</td>
          <td><span style="color: #f59e0b; font-weight: 700;"><i class="fa-solid fa-star"></i> ${f.rating}</span></td>
          <td><span class="badge badge-success"><i class="fa-solid fa-check"></i> Verified</span></td>
        </tr>
      `).join('');
    } catch {
      // ignore
    }
  },

  async loadProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    try {
      const data = await api.products.getAll({ size: 100 });
      const products = data.content || [];
      tbody.innerHTML = products.map(p => `
        <tr>
          <td style="font-weight: 700;">#${p.id}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <img src="${p.imageUrl}" alt="${p.name}" style="width: 36px; height: 36px; object-fit: cover; border-radius: var(--radius-sm);">
              <strong>${p.name}</strong>
            </div>
          </td>
          <td><span class="badge badge-secondary">${p.category}</span></td>
          <td style="font-weight: 600;">₹${p.price} / ${p.unit}</td>
          <td><span class="badge ${p.stock < 15 ? 'badge-danger' : 'badge-success'}">${p.stock}</span></td>
          <td>${p.farmerName || 'Verified Farm'}</td>
        </tr>
      `).join('');
    } catch {
      // ignore
    }
  },

  async loadOrdersTable() {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    try {
      const orders = await api.orders.getAll();
      tbody.innerHTML = orders.map(o => `
        <tr>
          <td style="font-weight: 700;">#${o.id}</td>
          <td>${o.customerName}</td>
          <td style="font-weight: 700; color: var(--slate-900);">₹${o.totalAmount}</td>
          <td><span class="badge ${Customer.getStatusBadgeClass(o.status)}">${o.status}</span></td>
          <td style="font-size: 0.8125rem; color: var(--slate-500);">${new Date(o.createdAt).toLocaleString()}</td>
        </tr>
      `).join('');
    } catch {
      // ignore
    }
  }
};

window.Admin = Admin;
