package com.unilost.repository;

import com.unilost.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findByLostItemId(Long lostItemId);

    /** Order by finalScore desc for the main matches page */
    List<Match> findAllByOrderByFinalScoreDesc();

    /** Legacy ordering kept for any code still using matchScore */
    List<Match> findAllByOrderByMatchScoreDesc();

    Optional<Match> findByLostItemIdAndFoundItemId(Long lostItemId, Long foundItemId);

    List<Match> findByStatus(String status);
}
