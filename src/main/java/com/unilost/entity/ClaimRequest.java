package com.unilost.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a row in the "claim_requests" table.
 * Created when a student believes a Found Item belongs to them and
 * submits proof so the finder can verify and approve/reject it.
 */
@Entity
@Table(name = "claim_requests")
public class ClaimRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long foundItemId;

    private Long claimantUserId;

    @Column(length = 1000)
    private String reason;

    @Column(length = 1000)
    private String identifyingDetail;

    private String lostLocation;

    // PENDING, APPROVED, or REJECTED
    private String status = "PENDING";

    private LocalDateTime createdAt = LocalDateTime.now();

    public ClaimRequest() {
    }

    // ----- Getters and Setters -----

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFoundItemId() {
        return foundItemId;
    }

    public void setFoundItemId(Long foundItemId) {
        this.foundItemId = foundItemId;
    }

    public Long getClaimantUserId() {
        return claimantUserId;
    }

    public void setClaimantUserId(Long claimantUserId) {
        this.claimantUserId = claimantUserId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getIdentifyingDetail() {
        return identifyingDetail;
    }

    public void setIdentifyingDetail(String identifyingDetail) {
        this.identifyingDetail = identifyingDetail;
    }

    public String getLostLocation() {
        return lostLocation;
    }

    public void setLostLocation(String lostLocation) {
        this.lostLocation = lostLocation;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
