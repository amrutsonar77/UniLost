package com.unilost.controller;

import com.unilost.entity.ClaimRequest;
import com.unilost.service.ClaimService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Handles the "Claim This Item" workflow for Found Items.
 */
@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    @Autowired
    private ClaimService claimService;

    // Submit a new claim request on a found item
    @PostMapping
    public ClaimRequest createClaim(@RequestBody Map<String, String> body) {
        Long foundItemId = Long.valueOf(body.get("foundItemId"));
        Long claimantUserId = Long.valueOf(body.get("claimantUserId"));
        String reason = body.get("reason");
        String identifyingDetail = body.get("identifyingDetail");
        String lostLocation = body.get("lostLocation");
        return claimService.createClaim(foundItemId, claimantUserId, reason, identifyingDetail, lostLocation);
    }

    // The finder views all claims made on their found item
    @GetMapping("/found-item/{foundItemId}")
    public List<ClaimRequest> getClaimsForFoundItem(@PathVariable Long foundItemId) {
        return claimService.getClaimsForFoundItem(foundItemId);
    }

    // A student views the claims they've submitted
    @GetMapping("/user/{userId}")
    public List<ClaimRequest> getClaimsByUser(@PathVariable Long userId) {
        return claimService.getClaimsByUser(userId);
    }

    // Admin: view every pending claim across the platform
    @GetMapping("/pending")
    public List<ClaimRequest> getAllPendingClaims() {
        return claimService.getAllPendingClaims();
    }

    @PutMapping("/{id}/approve")
    public ClaimRequest approveClaim(@PathVariable Long id) {
        return claimService.approveClaim(id);
    }

    @PutMapping("/{id}/reject")
    public ClaimRequest rejectClaim(@PathVariable Long id) {
        return claimService.rejectClaim(id);
    }
}
