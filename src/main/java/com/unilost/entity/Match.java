package com.unilost.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a potential match between a lost item and a found item.
 *
 * Score breakdown (weights are configurable in MatchingService):
 *   imageSimilarity    — perceptual-hash similarity of the two images (0–100)
 *   categorySimilarity — exact category match (0 or 100)
 *   textSimilarity     — Jaccard similarity on name + description tokens (0–100)
 *   locationScore      — partial location match bonus (0–100)
 *   finalScore         — weighted combination of the above (0–100)
 *
 * confidenceLabel  — "Very High Match" | "High Match" | "Possible Match" | "Low Match"
 * matchReasons     — comma-separated human-readable reasons, e.g.
 *                    "Similar appearance,Same category,Similar location"
 * status           — PENDING | ACCEPTED | REJECTED (owner/finder can act on it)
 */
@Entity
@Table(name = "matches", indexes = {
    @Index(name = "idx_match_lost_found",  columnList = "lostItemId, foundItemId"),
    @Index(name = "idx_match_final_score", columnList = "finalScore"),
    @Index(name = "idx_match_status",      columnList = "status")
})
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long lostItemId;
    private Long foundItemId;

    /** Raw perceptual-hash image similarity 0–100 */
    private double imageSimilarity;

    /** Category match score 0–100 */
    private double categorySimilarity;

    /** Text (name + description) Jaccard similarity 0–100 */
    private double textSimilarity;

    /** Location partial-match score 0–100 */
    private double locationScore;

    /** Combined weighted final score 0–100 */
    private double finalScore;

    /** Kept for backward compatibility: same value as finalScore */
    private double matchScore;

    private String confidenceLabel;

    @Column(length = 1000)
    private String matchReasons;

    /** PENDING | ACCEPTED | REJECTED */
    private String status = "PENDING";

    private LocalDateTime createdAt = LocalDateTime.now();

    public Match() {}

    /** Convenience constructor used by MatchingService */
    public Match(Long lostItemId, Long foundItemId,
                 double imageSimilarity, double categorySimilarity,
                 double textSimilarity, double locationScore,
                 double finalScore, String confidenceLabel, String matchReasons) {
        this.lostItemId        = lostItemId;
        this.foundItemId       = foundItemId;
        this.imageSimilarity   = imageSimilarity;
        this.categorySimilarity = categorySimilarity;
        this.textSimilarity    = textSimilarity;
        this.locationScore     = locationScore;
        this.finalScore        = finalScore;
        this.matchScore        = finalScore; // mirror for legacy JS
        this.confidenceLabel   = confidenceLabel;
        this.matchReasons      = matchReasons;
        this.status            = "PENDING";
        this.createdAt         = LocalDateTime.now();
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLostItemId() { return lostItemId; }
    public void setLostItemId(Long lostItemId) { this.lostItemId = lostItemId; }

    public Long getFoundItemId() { return foundItemId; }
    public void setFoundItemId(Long foundItemId) { this.foundItemId = foundItemId; }

    public double getImageSimilarity() { return imageSimilarity; }
    public void setImageSimilarity(double imageSimilarity) { this.imageSimilarity = imageSimilarity; }

    public double getCategorySimilarity() { return categorySimilarity; }
    public void setCategorySimilarity(double categorySimilarity) { this.categorySimilarity = categorySimilarity; }

    public double getTextSimilarity() { return textSimilarity; }
    public void setTextSimilarity(double textSimilarity) { this.textSimilarity = textSimilarity; }

    public double getLocationScore() { return locationScore; }
    public void setLocationScore(double locationScore) { this.locationScore = locationScore; }

    public double getFinalScore() { return finalScore; }
    public void setFinalScore(double finalScore) {
        this.finalScore = finalScore;
        this.matchScore = finalScore;
    }

    public double getMatchScore() { return matchScore; }
    public void setMatchScore(double matchScore) { this.matchScore = matchScore; }

    public String getConfidenceLabel() { return confidenceLabel; }
    public void setConfidenceLabel(String confidenceLabel) { this.confidenceLabel = confidenceLabel; }

    public String getMatchReasons() { return matchReasons; }
    public void setMatchReasons(String matchReasons) { this.matchReasons = matchReasons; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
