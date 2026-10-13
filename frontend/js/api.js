/**
 * AgriConnect API Service Layer
 * Centralized HTTP communication with Spring Boot REST API
 */

const API_BASE_URL = 'http://localhost:8080/api';

class ApiClient {
  static getToken() {
    return localStorage.getItem('agriconnect_token');
  }

  static setToken(token) {
    if (token) {
      localStorage.setItem('agriconnect_token', token);
    } else {
      localStorage.removeItem('agriconnect_token');
    }
  }

  static getUser() {
    const userStr = localStorage.getItem('agriconnect_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user) {
    if (user) {
      localStorage.setItem('agriconnect_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('agriconnect_user');
    }
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMsg = (data && data.message) || response.statusText || 'API Request failed';
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.warn(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  static get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  }

  static post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  static put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  static patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  static delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// API Resource Endpoints
const api = {
  auth: {
    login: (credentials) => ApiClient.post('/auth/login', credentials),
    register: (userData) => ApiClient.post('/auth/register', userData),
    me: () => ApiClient.get('/auth/me')
  },
  products: {
    getAll: (params) => ApiClient.get('/products', params),
    getFeatured: () => ApiClient.get('/products/featured'),
    getById: (id) => ApiClient.get(`/products/${id}`),
    getByFarmer: (farmerId) => ApiClient.get(`/products/farmer/${farmerId}`),
    create: (data, farmerId) => ApiClient.post(`/products${farmerId ? `?farmerId=${farmerId}` : ''}`, data),
    update: (id, data, farmerId) => ApiClient.put(`/products/${id}${farmerId ? `?farmerId=${farmerId}` : ''}`, data),
    delete: (id, farmerId) => ApiClient.delete(`/products/${id}${farmerId ? `?farmerId=${farmerId}` : ''}`),
    updateStock: (id, stock) => ApiClient.patch(`/products/${id}/stock`, { stock })
  },
  categories: {
    getAll: () => ApiClient.get('/categories'),
    getById: (id) => ApiClient.get(`/categories/${id}`)
  },
  farmers: {
    getAll: () => ApiClient.get('/farmers'),
    getFeatured: () => ApiClient.get('/farmers/featured'),
    getById: (id) => ApiClient.get(`/farmers/${id}`),
    getByUserId: (userId) => ApiClient.get(`/farmers/user/${userId}`),
    update: (id, data) => ApiClient.put(`/farmers/${id}`, data)
  },
  cart: {
    get: () => ApiClient.get('/cart'),
    add: (productId, quantity = 1) => ApiClient.post('/cart/add', { productId, quantity }),
    updateQty: (itemId, quantity) => ApiClient.put(`/cart/items/${itemId}`, { quantity }),
    remove: (itemId) => ApiClient.delete(`/cart/items/${itemId}`),
    clear: () => ApiClient.delete('/cart/clear')
  },
  orders: {
    create: (orderData) => ApiClient.post('/orders', orderData),
    getAll: () => ApiClient.get('/orders'),
    getMyOrders: () => ApiClient.get('/orders/my-orders'),
    getByFarmer: (farmerId) => ApiClient.get(`/orders/farmer/${farmerId}`),
    getById: (id) => ApiClient.get(`/orders/${id}`),
    updateStatus: (id, status) => ApiClient.patch(`/orders/${id}/status`, { status })
  },
  deliveries: {
    getAll: (status) => ApiClient.get('/deliveries', { status }),
    getById: (id) => ApiClient.get(`/deliveries/${id}`),
    getByOrderId: (orderId) => ApiClient.get(`/deliveries/order/${orderId}`),
    updateStatus: (id, updateData) => ApiClient.patch(`/deliveries/${id}/status`, updateData)
  },
  analytics: {
    getDashboard: () => ApiClient.get('/analytics/dashboard')
  },
  ai: {
    getRecommendations: (params) => ApiClient.get('/ai/recommendations', params)
  },
  reviews: {
    getByProduct: (productId) => ApiClient.get(`/reviews/product/${productId}`),
    create: (reviewData) => ApiClient.post('/reviews', reviewData)
  },
  users: {
    getAll: () => ApiClient.get('/users'),
    getProfile: () => ApiClient.get('/users/profile'),
    update: (id, data) => ApiClient.put(`/users/${id}`, data),
    delete: (id) => ApiClient.delete(`/users/${id}`)
  }
};

window.ApiClient = ApiClient;
window.api = api;
