package com.agrimart.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AnalyticsDto {
    private long totalUsers;
    private long totalFarmers;
    private long totalCustomers;
    private long totalProducts;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long activeDeliveries;
    private long completedDeliveries;
    private long lowStockProducts;

    private List<OrderDto> recentOrders;

    // Chart Data
    private Map<String, Long> productCategoryDistribution;
    private Map<String, Long> orderStatusDistribution;
    private List<MonthlySalesData> monthlySales;
    private List<FarmerPerformanceData> farmerPerformance;
    private InventorySummaryData inventorySummary;
    private DeliveryPerformanceData deliveryPerformance;

    public AnalyticsDto() {
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalFarmers() {
        return totalFarmers;
    }

    public void setTotalFarmers(long totalFarmers) {
        this.totalFarmers = totalFarmers;
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getActiveDeliveries() {
        return activeDeliveries;
    }

    public void setActiveDeliveries(long activeDeliveries) {
        this.activeDeliveries = activeDeliveries;
    }

    public long getCompletedDeliveries() {
        return completedDeliveries;
    }

    public void setCompletedDeliveries(long completedDeliveries) {
        this.completedDeliveries = completedDeliveries;
    }

    public long getLowStockProducts() {
        return lowStockProducts;
    }

    public void setLowStockProducts(long lowStockProducts) {
        this.lowStockProducts = lowStockProducts;
    }

    public List<OrderDto> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<OrderDto> recentOrders) {
        this.recentOrders = recentOrders;
    }

    public Map<String, Long> getProductCategoryDistribution() {
        return productCategoryDistribution;
    }

    public void setProductCategoryDistribution(Map<String, Long> productCategoryDistribution) {
        this.productCategoryDistribution = productCategoryDistribution;
    }

    public Map<String, Long> getOrderStatusDistribution() {
        return orderStatusDistribution;
    }

    public void setOrderStatusDistribution(Map<String, Long> orderStatusDistribution) {
        this.orderStatusDistribution = orderStatusDistribution;
    }

    public List<MonthlySalesData> getMonthlySales() {
        return monthlySales;
    }

    public void setMonthlySales(List<MonthlySalesData> monthlySales) {
        this.monthlySales = monthlySales;
    }

    public List<FarmerPerformanceData> getFarmerPerformance() {
        return farmerPerformance;
    }

    public void setFarmerPerformance(List<FarmerPerformanceData> farmerPerformance) {
        this.farmerPerformance = farmerPerformance;
    }

    public InventorySummaryData getInventorySummary() {
        return inventorySummary;
    }

    public void setInventorySummary(InventorySummaryData inventorySummary) {
        this.inventorySummary = inventorySummary;
    }

    public DeliveryPerformanceData getDeliveryPerformance() {
        return deliveryPerformance;
    }

    public void setDeliveryPerformance(DeliveryPerformanceData deliveryPerformance) {
        this.deliveryPerformance = deliveryPerformance;
    }

    public static class MonthlySalesData {
        private String month;
        private double sales;
        private int orderCount;

        public MonthlySalesData() {}
        public MonthlySalesData(String month, double sales, int orderCount) {
            this.month = month;
            this.sales = sales;
            this.orderCount = orderCount;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public double getSales() { return sales; }
        public void setSales(double sales) { this.sales = sales; }
        public int getOrderCount() { return orderCount; }
        public void setOrderCount(int orderCount) { this.orderCount = orderCount; }
    }

    public static class FarmerPerformanceData {
        private String farmerName;
        private double revenue;
        private int productCount;
        private double rating;

        public FarmerPerformanceData() {}
        public FarmerPerformanceData(String farmerName, double revenue, int productCount, double rating) {
            this.farmerName = farmerName;
            this.revenue = revenue;
            this.productCount = productCount;
            this.rating = rating;
        }

        public String getFarmerName() { return farmerName; }
        public void setFarmerName(String farmerName) { this.farmerName = farmerName; }
        public double getRevenue() { return revenue; }
        public void setRevenue(double revenue) { this.revenue = revenue; }
        public int getProductCount() { return productCount; }
        public void setProductCount(int productCount) { this.productCount = productCount; }
        public double getRating() { return rating; }
        public void setRating(Double rating) { this.rating = rating != null ? rating : 0.0; }
    }

    public static class InventorySummaryData {
        private long inStock;
        private long lowStock;
        private long outOfStock;

        public InventorySummaryData() {}
        public InventorySummaryData(long inStock, long lowStock, long outOfStock) {
            this.inStock = inStock;
            this.lowStock = lowStock;
            this.outOfStock = outOfStock;
        }

        public long getInStock() { return inStock; }
        public void setInStock(long inStock) { this.inStock = inStock; }
        public long getLowStock() { return lowStock; }
        public void setLowStock(long lowStock) { this.lowStock = lowStock; }
        public long getOutOfStock() { return outOfStock; }
        public void setOutOfStock(long outOfStock) { this.outOfStock = outOfStock; }
    }

    public static class DeliveryPerformanceData {
        private double onTimeRate;
        private double avgTransitHours;
        private long completed;
        private long active;

        public DeliveryPerformanceData() {}
        public DeliveryPerformanceData(double onTimeRate, double avgTransitHours, long completed, long active) {
            this.onTimeRate = onTimeRate;
            this.avgTransitHours = avgTransitHours;
            this.completed = completed;
            this.active = active;
        }

        public double getOnTimeRate() { return onTimeRate; }
        public void setOnTimeRate(double onTimeRate) { this.onTimeRate = onTimeRate; }
        public double getAvgTransitHours() { return avgTransitHours; }
        public void setAvgTransitHours(double avgTransitHours) { this.avgTransitHours = avgTransitHours; }
        public long getCompleted() { return completed; }
        public void setCompleted(long completed) { this.completed = completed; }
        public long getActive() { return active; }
        public void setActive(long active) { this.active = active; }
    }
}
