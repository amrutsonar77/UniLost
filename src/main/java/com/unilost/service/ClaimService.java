package com.unilost.service;

import com.unilost.entity.ClaimRequest;
import com.unilost.entity.FoundItem;
import com.unilost.repository.ClaimRequestRepository;
import com.unilost.repository.FoundItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Handles the "Claim This Item" workflow for Found Items.
 * A student submits a claim -> the finder reviews it -> approve marks the
 * item RECOVERED, reject just closes the request.
 */
@Service
public class ClaimService {

    @Autowired
    private ClaimRequestRepository claimRequestRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private NotificationService notificationService;

    public ClaimRequest createClaim(Long foundItemId, Long claimantUserId, String reason,
                                     String identifyingDetail, String lostLocation) {
        FoundItem foundItem = foundItemRepository.findById(foundItemId)
                .orElseThrow(() -> new RuntimeException("Found item not found"));

        if (foundItem.getUserId() != null && foundItem.getUserId().equals(claimantUserId)) {
            throw new RuntimeException("You cannot claim an item you reported yourself.");
        }

        ClaimRequest claim = new ClaimRequest();
        claim.setFoundItemId(foundItemId);
        claim.setClaimantUserId(claimantUserId);
        claim.setReason(reason);
        claim.setIdentifyingDetail(identifyingDetail);
        claim.setLostLocation(lostLocation);
        claim.setStatus("PENDING");
        ClaimRequest saved = claimRequestRepository.save(claim);

        // Notify the finder that someone wants to claim their found item
        if (foundItem.getUserId() != null) {
            notificationService.create(
                    foundItem.getUserId(),
                    "New Claim Request",
                    "A student wants to claim the item you found: " + foundItem.getItemName(),
                    "CLAIM_REQUEST"
            );
        }

        return saved;
    }

    public List<ClaimRequest> getClaimsForFoundItem(Long foundItemId) {
        return claimRequestRepository.findByFoundItemId(foundItemId);
    }

    public List<ClaimRequest> getClaimsByUser(Long claimantUserId) {
        return claimRequestRepository.findByClaimantUserId(claimantUserId);
    }

    public List<ClaimRequest> getAllPendingClaims() {
        return claimRequestRepository.findByStatus("PENDING");
    }

    public ClaimRequest approveClaim(Long claimId) {
        ClaimRequest claim = claimRequestRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        claim.setStatus("APPROVED");
        claimRequestRepository.save(claim);

        // Mark the found item as recovered
        foundItemRepository.findById(claim.getFoundItemId()).ifPresent(item -> {
            item.setStatus("RECOVERED");
            foundItemRepository.save(item);
        });

        notificationService.create(
                claim.getClaimantUserId(),
                "Claim Approved",
                "Your claim was approved! You can now message the finder to arrange pickup.",
                "CLAIM_APPROVED"
        );

        return claim;
    }

    public ClaimRequest rejectClaim(Long claimId) {
        ClaimRequest claim = claimRequestRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        claim.setStatus("REJECTED");
        claimRequestRepository.save(claim);

        notificationService.create(
                claim.getClaimantUserId(),
                "Claim Rejected",
                "Your claim request was not approved by the finder.",
                "CLAIM_REJECTED"
        );

        return claim;
    }
}
