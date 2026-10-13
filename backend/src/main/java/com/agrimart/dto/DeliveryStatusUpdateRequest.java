package com.agrimart.dto;

public class DeliveryStatusUpdateRequest {
    private String status;
    private Double latitude;
    private Double longitude;
    private String eta;

    public DeliveryStatusUpdateRequest() {
    }

    public DeliveryStatusUpdateRequest(String status, Double latitude, Double longitude, String eta) {
        this.status = status;
        this.latitude = latitude;
        this.longitude = longitude;
        this.eta = eta;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getEta() {
        return eta;
    }

    public void setEta(String eta) {
        this.eta = eta;
    }
}
