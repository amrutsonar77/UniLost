package com.unilost.service;

import com.unilost.entity.FoundItem;
import com.unilost.entity.LostItem;
import com.unilost.entity.Match;
import com.unilost.repository.FoundItemRepository;
import com.unilost.repository.LostItemRepository;
import com.unilost.repository.MatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * AI-based matching service — adaptive scoring.
 *
 * When BOTH items have images:
 *   60% image + 20% category + 10% text + 10% location
 *
 * When ONE or BOTH images are missing the image weight is
 * redistributed proportionally to the remaining signals:
 *   0% image + 40% category + 35% text + 25% location
 *
 * This ensures items without photos still match on text/category,
 * which is the common case for new users.
 *
 * Thresholds:
 *   ≥ 90 → Very High Match
 *   ≥ 75 → High Match
 *   ≥ 55 → Possible Match
 *   < 55 → Low Match
 *
 * Save threshold  : 25%   (generous — better to show and let user judge)
 * Notify threshold: 55%
 */
@Service
public class MatchingService {

    // Full-image weights
    private static final double W_IMAGE_FULL    = 0.60;
    private static final double W_CATEGORY_FULL = 0.20;
    private static final double W_TEXT_FULL     = 0.10;
    private static final double W_LOCATION_FULL = 0.10;

    // No-image weights (image weight redistributed proportionally)
    private static final double W_CATEGORY_NOIMG = 0.40;
    private static final double W_TEXT_NOIMG     = 0.35;
    private static final double W_LOCATION_NOIMG = 0.25;

    private static final double SAVE_THRESHOLD   = 25.0;
    private static final double NOTIFY_THRESHOLD = 55.0;

    @Autowired private LostItemRepository   lostItemRepository;
    @Autowired private FoundItemRepository  foundItemRepository;
    @Autowired private MatchRepository      matchRepository;
    @Autowired private NotificationService  notificationService;
    @Autowired private ImageMatchingService imageMatchingService;

    // ─────────────────────────────────────────────────────────
    //  Public API
    // ─────────────────────────────────────────────────────────

    /** Live suggestions for ONE lost item. NOT saved to DB. */
    public List<Map<String, Object>> findMatchesForLostItem(Long lostItemId) {
        LostItem lost = lostItemRepository.findById(lostItemId)
                .orElseThrow(() -> new RuntimeException("Lost item not found: " + lostItemId));

        List<Map<String, Object>> results = new ArrayList<>();
        for (FoundItem found : foundItemRepository.findAll()) {
            ScoreBreakdown sb = score(lost, found);
            if (sb.finalScore >= SAVE_THRESHOLD) {
                results.add(buildResultMap(lost, found, sb));
            }
        }
        results.sort((a, b) ->
                Double.compare((double) b.get("finalScore"), (double) a.get("finalScore")));
        return results;
    }

    /** Scan ALL lost × found pairs and persist new matches ≥ threshold. */
    public List<Match> generateAllMatches() {
        List<Match> saved = new ArrayList<>();
        for (LostItem lost : lostItemRepository.findAll()) {
            for (FoundItem found : foundItemRepository.findAll()) {
                saved.addAll(tryPersistMatch(lost, found));
            }
        }
        return saved;
    }

    public void generateMatchesForNewLostItem(Long lostItemId) {
        LostItem lost = lostItemRepository.findById(lostItemId).orElse(null);
        if (lost == null) return;
        for (FoundItem found : foundItemRepository.findAll()) tryPersistMatch(lost, found);
    }

    public void generateMatchesForNewFoundItem(Long foundItemId) {
        FoundItem found = foundItemRepository.findById(foundItemId).orElse(null);
        if (found == null) return;
        for (LostItem lost : lostItemRepository.findAll()) tryPersistMatch(lost, found);
    }

    // ─────────────────────────────────────────────────────────
    //  Core scoring
    // ─────────────────────────────────────────────────────────

    private ScoreBreakdown score(LostItem lost, FoundItem found) {
        boolean hasImages = lost.getImagePath() != null && found.getImagePath() != null;

        double imageSim = 0.0;
        double finalScore;

        double catSim   = categorySimilarity(lost.getCategory(),  found.getCategory());
        double textSim  = textSimilarity(lost, found);
        double locScore = locationSimilarity(lost.getLocation(), found.getLocation());

        // Color bonus: add up to 10 extra points if colors match
        double colorBonus = colorSimilarity(lost.getColor(), found.getColor());

        if (hasImages) {
            imageSim   = imageMatchingService.calculateSimilarity(
                    lost.getImagePath(), found.getImagePath());
            finalScore = imageSim   * W_IMAGE_FULL
                       + catSim     * W_CATEGORY_FULL
                       + textSim    * W_TEXT_FULL
                       + locScore   * W_LOCATION_FULL
                       + colorBonus * 0.05; // small bonus when using images too
        } else {
            // No images: redistribute weight to metadata signals
            finalScore = catSim     * W_CATEGORY_NOIMG
                       + textSim    * W_TEXT_NOIMG
                       + locScore   * W_LOCATION_NOIMG
                       + colorBonus * 0.10; // larger color bonus when no images
        }

        finalScore = Math.min(100.0, round1(finalScore));

        List<String> reasons = buildReasons(
                imageSim, catSim, textSim, locScore, hasImages,
                lost.getColor(), found.getColor(),
                lost.getBrand(), found.getBrand());
        String reasonsStr = String.join(",", reasons);

        return new ScoreBreakdown(imageSim, catSim, textSim, locScore, finalScore, reasonsStr);
    }

    // ─────────────────────────────────────────────────────────
    //  Similarity sub-scores
    // ─────────────────────────────────────────────────────────

    private double categorySimilarity(String a, String b) {
        if (isBlank(a) || isBlank(b)) return 0.0;
        return a.trim().equalsIgnoreCase(b.trim()) ? 100.0 : 0.0;
    }

    private double textSimilarity(LostItem lost, FoundItem found) {
        // Name similarity (weighted higher)
        double nameSim  = jaccard(lost.getItemName(),   found.getItemName());
        // Description similarity
        double descSim  = jaccard(lost.getDescription(), found.getDescription());
        // Brand exact match bonus
        double brandSim = brandSimilarity(lost.getBrand(), found.getBrand());

        // Weighted: name 50%, desc 30%, brand 20%
        return round1(nameSim * 0.50 + descSim * 0.30 + brandSim * 0.20);
    }

    private double locationSimilarity(String locA, String locB) {
        if (isBlank(locA) || isBlank(locB)) return 0.0;
        String a = locA.trim().toLowerCase();
        String b = locB.trim().toLowerCase();
        if (a.equals(b)) return 100.0;
        if (a.contains(b) || b.contains(a)) return 70.0;
        Set<String> wa = tokenize(locA);
        Set<String> wb = tokenize(locB);
        if (wa.isEmpty() || wb.isEmpty()) return 0.0;
        Set<String> inter = new HashSet<>(wa); inter.retainAll(wb);
        Set<String> union = new HashSet<>(wa); union.addAll(wb);
        return union.isEmpty() ? 0.0 : round1((double) inter.size() / union.size() * 100.0);
    }

    /** Returns 0–100. Partial matches (e.g. "dark blue" vs "blue") score 50. */
    private double colorSimilarity(String a, String b) {
        if (isBlank(a) || isBlank(b)) return 0.0;
        String la = a.trim().toLowerCase();
        String lb = b.trim().toLowerCase();
        if (la.equals(lb)) return 100.0;
        if (la.contains(lb) || lb.contains(la)) return 50.0;
        return 0.0;
    }

    private double brandSimilarity(String a, String b) {
        if (isBlank(a) || isBlank(b)) return 0.0;
        return a.trim().equalsIgnoreCase(b.trim()) ? 100.0 : 0.0;
    }

    // ─────────────────────────────────────────────────────────
    //  Reasons builder
    // ─────────────────────────────────────────────────────────

    private List<String> buildReasons(double imageSim, double catSim,
                                       double textSim, double locScore,
                                       boolean hasImages,
                                       String lostColor, String foundColor,
                                       String lostBrand, String foundBrand) {
        List<String> r = new ArrayList<>();
        if (hasImages && imageSim >= 65) r.add("Similar visual appearance");
        if (catSim == 100)               r.add("Same item category");
        if (textSim >= 40)               r.add("Similar name or description");
        if (locScore >= 60)              r.add("Same or nearby location");
        if (colorSimilarity(lostColor, foundColor) >= 50) r.add("Matching colour");
        if (brandSimilarity(lostBrand, foundBrand) == 100) r.add("Same brand");
        if (!hasImages && (catSim > 0 || textSim > 0))
            r.add("Matched on text/category (no images)");
        if (r.isEmpty()) r.add("Partial metadata similarity");
        return r;
    }

    // ─────────────────────────────────────────────────────────
    //  Persist helpers
    // ─────────────────────────────────────────────────────────

    private List<Match> tryPersistMatch(LostItem lost, FoundItem found) {
        ScoreBreakdown sb = score(lost, found);
        if (sb.finalScore < SAVE_THRESHOLD) return Collections.emptyList();

        if (matchRepository.findByLostItemIdAndFoundItemId(
                lost.getId(), found.getId()).isPresent()) {
            return Collections.emptyList();
        }

        Match m = new Match(
                lost.getId(), found.getId(),
                sb.imageSim, sb.catSim, sb.textSim, sb.locScore,
                sb.finalScore, confidenceLabel(sb.finalScore), sb.reasons);
        Match saved = matchRepository.save(m);

        if (sb.finalScore >= NOTIFY_THRESHOLD && lost.getUserId() != null) {
            notificationService.create(
                    lost.getUserId(),
                    "New AI Match Found",
                    "We found a " + (int) sb.finalScore
                            + "% match for your \"" + lost.getItemName() + "\".",
                    "AI_MATCH");
        }
        return List.of(saved);
    }

    private Map<String, Object> buildResultMap(LostItem lost, FoundItem found,
                                                ScoreBreakdown sb) {
        Map<String, Object> row = new HashMap<>();
        row.put("lostItem",           lost);
        row.put("foundItem",          found);
        row.put("matchScore",         sb.finalScore);
        row.put("finalScore",         sb.finalScore);
        row.put("imageSimilarity",    sb.imageSim);
        row.put("categorySimilarity", sb.catSim);
        row.put("textSimilarity",     sb.textSim);
        row.put("locationScore",      sb.locScore);
        row.put("confidenceLabel",    confidenceLabel(sb.finalScore));
        row.put("matchReasons",       sb.reasons);
        return row;
    }

    // ─────────────────────────────────────────────────────────
    //  Utilities
    // ─────────────────────────────────────────────────────────

    private double jaccard(String textA, String textB) {
        Set<String> wa = tokenize(textA);
        Set<String> wb = tokenize(textB);
        if (wa.isEmpty() && wb.isEmpty()) return 0.0;
        Set<String> intersection = new HashSet<>(wa); intersection.retainAll(wb);
        Set<String> union = new HashSet<>(wa); union.addAll(wb);
        return union.isEmpty() ? 0.0
                : round1((double) intersection.size() / union.size() * 100.0);
    }

    private static final Set<String> STOP_WORDS = Set.of(
            "a","an","the","is","of","in","on","with","and","my","it",
            "i","was","at","to","for","this","that","have","has","been");

    private Set<String> tokenize(String text) {
        if (isBlank(text)) return Collections.emptySet();
        String[] words = text.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ").split("\\s+");
        Set<String> result = new HashSet<>();
        for (String w : words) {
            if (!w.isBlank() && !STOP_WORDS.contains(w)) result.add(w);
        }
        return result;
    }

    public String confidenceLabel(double score) {
        if (score >= 90) return "Very High Match";
        if (score >= 75) return "High Match";
        if (score >= 55) return "Possible Match";
        return "Low Match";
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }
    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }

    // ─────────────────────────────────────────────────────────
    //  Inner DTO
    // ─────────────────────────────────────────────────────────

    private static class ScoreBreakdown {
        final double imageSim, catSim, textSim, locScore, finalScore;
        final String reasons;

        ScoreBreakdown(double imageSim, double catSim, double textSim,
                       double locScore, double finalScore, String reasons) {
            this.imageSim   = imageSim;
            this.catSim     = catSim;
            this.textSim    = textSim;
            this.locScore   = locScore;
            this.finalScore = finalScore;
            this.reasons    = reasons;
        }
    }
}
