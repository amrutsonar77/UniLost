package com.unilost.repository;

import com.unilost.entity.ClaimRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClaimRequestRepository extends JpaRepository<ClaimRequest, Long> {

    List<ClaimRequest> findByFoundItemId(Long foundItemId);

    List<ClaimRequest> findByClaimantUserId(Long claimantUserId);

    List<ClaimRequest> findByStatus(String status);
}
