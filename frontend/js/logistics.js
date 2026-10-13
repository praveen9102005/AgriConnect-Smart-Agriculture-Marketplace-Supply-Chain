/**
 * AgriConnect Logistics & Supply Chain Fleet Controller
 * Route visualization with Leaflet, GPS tracking, and delivery status advancement
 */

const Logistics = {
  state: {
    deliveries: [],
    activeDelivery: null,
    leafletMap: null,
    truckMarker: null,
    routeLine: null
  },

  async init() {
    if (!Auth.isAuthenticated()) {
      Auth.openAuthModal('login');
      Auth.showToast('Please sign in with Logistics or Admin credentials', 'info');
      return;
    }

    await this.loadDeliveries();
  },

  async loadDeliveries() {
    const listContainer = document.getElementById('logistics-deliveries-list');
    const statActive = document.getElementById('logistics-stat-active');
    const statDelivered = document.getElementById('logistics-stat-delivered');
    const statTotal = document.getElementById('logistics-stat-total');

    try {
      const deliveries = await api.deliveries.getAll();
      this.state.deliveries = deliveries;

      const activeCount = deliveries.filter(d => d.status !== 'DELIVERED').length;
      const deliveredCount = deliveries.filter(d => d.status === 'DELIVERED').length;

      if (statActive) statActive.textContent = activeCount;
      if (statDelivered) statDelivered.textContent = deliveredCount;
      if (statTotal) statTotal.textContent = deliveries.length;

      if (!listContainer) return;

      if (!deliveries || deliveries.length === 0) {
        listContainer.innerHTML = `<p style="padding: 2rem; color: var(--slate-400); text-align: center;">No active logistics shipments.</p>`;
        return;
      }

      listContainer.innerHTML = deliveries.map(d => `
        <div class="card" style="cursor: pointer; border-left: 4px solid ${this.getStatusColor(d.status)}; margin-bottom: 1rem; transition: all 0.2s;" onclick="Logistics.selectDelivery(${d.id})">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: var(--slate-900);">Shipment #${d.id} (Order #${d.orderId})</strong>
            <span class="badge ${this.getStatusBadgeClass(d.status)}">${d.status}</span>
          </div>
          <div style="font-size: 0.8125rem; color: var(--slate-600); margin-bottom: 0.25rem;">
            <i class="fa-solid fa-truck" style="color: var(--primary-600);"></i> ${d.vehicleNumber || 'AgriCarrier'}
          </div>
          <div style="font-size: 0.8125rem; color: var(--slate-600); margin-bottom: 0.25rem;">
            <i class="fa-solid fa-user-shield"></i> Driver: ${d.driverName || 'Verified Pilot'}
          </div>
          <div style="font-size: 0.8125rem; color: var(--slate-500); display: flex; justify-content: space-between; margin-top: 0.5rem; border-top: 1px solid var(--border-light); padding-top: 0.5rem;">
            <span><i class="fa-solid fa-clock"></i> ETA: ${d.eta || 'Calculating'}</span>
            <span style="font-weight: 700; color: var(--primary-700);">View Route <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>
      `).join('');

      // Auto select first delivery
      if (deliveries.length > 0 && !this.state.activeDelivery) {
        this.selectDelivery(deliveries[0].id);
      }
    } catch (err) {
      console.error('Failed to load logistics shipments:', err);
    }
  },

  getStatusBadgeClass(status) {
    if (status === 'DELIVERED') return 'badge-success';
    if (status === 'OUT_FOR_DELIVERY') return 'badge-warning';
    if (status === 'IN_TRANSIT') return 'badge-info';
    return 'badge-secondary';
  },

  getStatusColor(status) {
    if (status === 'DELIVERED') return '#16a34a';
    if (status === 'OUT_FOR_DELIVERY') return '#f59e0b';
    if (status === 'IN_TRANSIT') return '#0284c7';
    return '#94a3b8';
  },

  selectDelivery(deliveryId) {
    const d = this.state.deliveries.find(x => x.id === deliveryId);
    if (!d) return;

    this.state.activeDelivery = d;
    this.renderActiveDeliveryDetails(d);
    this.renderRouteMap(d);
  },

  renderActiveDeliveryDetails(d) {
    const detailsContainer = document.getElementById('active-delivery-card');
    if (!detailsContainer) return;

    detailsContainer.innerHTML = `
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem; margin-bottom: 1rem;">
          <div>
            <h3 style="font-size: 1.25rem;">Shipment #${d.id} Details</h3>
            <span style="font-size: 0.8125rem; color: var(--slate-500);">Linked to Customer Order #${d.orderId}</span>
          </div>
          <span class="badge ${this.getStatusBadgeClass(d.status)}" style="font-size: 0.875rem;">
            ${d.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div class="grid grid-cols-2" style="margin-bottom: 1.5rem;">
          <div style="background: var(--slate-50); padding: 1rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--slate-500); font-weight: 700; margin-bottom: 0.25rem;">
              <i class="fa-solid fa-wheat-awn" style="color: var(--primary-600);"></i> Farm Pickup Origin
            </div>
            <div style="font-weight: 700; color: var(--slate-900); font-size: 0.9375rem;">${d.pickup || 'AgriFarm Hub'}</div>
          </div>
          <div style="background: var(--slate-50); padding: 1rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--slate-500); font-weight: 700; margin-bottom: 0.25rem;">
              <i class="fa-solid fa-house-chimney" style="color: var(--info);"></i> Customer Destination
            </div>
            <div style="font-weight: 700; color: var(--slate-900); font-size: 0.9375rem;">${d.destination || 'Customer Address'}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--primary-50); border: 1px solid var(--primary-200); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.8125rem; color: var(--primary-800);"><i class="fa-solid fa-truck"></i> <strong>Vehicle:</strong> ${d.vehicleNumber}</div>
            <div style="font-size: 0.8125rem; color: var(--primary-800);"><i class="fa-solid fa-id-badge"></i> <strong>Driver:</strong> ${d.driverName}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: var(--slate-500);">Current ETA</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary-900);">${d.eta || 'Standard'}</div>
          </div>
        </div>

        <!-- Progress Action Controls -->
        <div>
          <h4 style="font-size: 0.9375rem; margin-bottom: 0.75rem;">Advance Shipment Status</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <button class="btn btn-outline btn-sm" onclick="Logistics.updateDeliveryStatus(${d.id}, 'PICKED_UP', 19.8, 73.5, '6-8 Hours')">
              <i class="fa-solid fa-box"></i> Picked Up
            </button>
            <button class="btn btn-outline btn-sm" onclick="Logistics.updateDeliveryStatus(${d.id}, 'IN_TRANSIT', 19.39, 73.12, '3-4 Hours')">
              <i class="fa-solid fa-truck-fast"></i> In Transit
            </button>
            <button class="btn btn-outline btn-sm" onclick="Logistics.updateDeliveryStatus(${d.id}, 'OUT_FOR_DELIVERY', 19.12, 72.90, 'Within 45 mins')">
              <i class="fa-solid fa-route"></i> Out for Delivery
            </button>
            <button class="btn btn-primary btn-sm" onclick="Logistics.updateDeliveryStatus(${d.id}, 'DELIVERED', 19.07, 72.87, 'Delivered')">
              <i class="fa-solid fa-circle-check"></i> Delivered
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async updateDeliveryStatus(deliveryId, newStatus, lat, lng, eta) {
    try {
      await api.deliveries.updateStatus(deliveryId, {
        status: newStatus,
        latitude: lat,
        longitude: lng,
        eta: eta
      });
      Auth.showToast(`Shipment status advanced to ${newStatus}!`, 'success');
      await this.loadDeliveries();
      this.selectDelivery(deliveryId);
    } catch (err) {
      Auth.showToast(err.message || 'Could not update delivery status', 'error');
    }
  },

  renderRouteMap(d) {
    if (typeof L === 'undefined') return;

    const mapElement = document.getElementById('logistics-live-map');
    if (!mapElement) return;

    if (this.state.leafletMap) {
      this.state.leafletMap.remove();
    }

    const lat = d.latitude || 19.2183;
    const lng = d.longitude || 72.9781;

    const map = L.map('logistics-live-map').setView([lat, lng], 10);
    this.state.leafletMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const farmCoords = [19.9975, 73.7898];
    const destCoords = [19.0760, 72.8777];

    // Farm Marker
    L.marker(farmCoords)
      .addTo(map)
      .bindPopup(`<b>Farm Origin:</b> ${d.pickup || 'AgriFarm'} (Pickup Point)`);

    // Destination Marker
    L.marker(destCoords)
      .addTo(map)
      .bindPopup(`<b>Destination:</b> ${d.destination || 'Customer Address'}`);

    // Vehicle Marker
    const vehicleIcon = L.divIcon({
      className: 'custom-map-icon',
      html: '<div style="background: #16a34a; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #fff;"><i class="fa-solid fa-truck"></i></div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    this.state.truckMarker = L.marker([lat, lng], { icon: vehicleIcon })
      .addTo(map)
      .bindPopup(`<b>${d.vehicleNumber}</b><br>Speed: 48 km/h • Temp: 4°C<br>Status: ${d.status}`)
      .openPopup();

    this.state.routeLine = L.polyline([farmCoords, [lat, lng], destCoords], {
      color: '#16a34a',
      weight: 4,
      dashArray: '8, 8'
    }).addTo(map);

    map.fitBounds(this.state.routeLine.getBounds().pad(0.1));
  }
};

window.Logistics = Logistics;
