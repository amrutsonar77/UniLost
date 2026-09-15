package com.unilost.controller;

import com.unilost.entity.Match;
import com.unilost.repository.MatchRepository;
import com.unilost.service.MatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AI Match endpoints.
 *
 * GET  /api/matches/suggest/{lostItemId}  – live suggestions (not saved)
 * POST /api/matches/generate              – scan all pairs and save matches
 * GET  /api/matches                       – all saved matches (ordered by finalScore)
 * PUT  /api/matches/{id}/status           – accept or reject a match
 */
@RestController
@RequestMapping("/api/matches")
public class MatchController {

    @Autowired private MatchingService matchingService;
    @Autowired private MatchRepository matchRepository;

    /** Live AI suggestions for one specific lost item – does NOT save to DB */
    @GetMapping("/suggest/{lostItemId}")
    public List<Map<String, Object>> suggestMatches(@PathVariable Long lostItemId) {
        return matchingService.findMatchesForLostItem(lostItemId);
    }

    /** Scan ALL lost × found pairs and persist any new matches ≥ threshold */
    @PostMapping("/generate")
    public List<Match> generateMatches() {
        return matchingService.generateAllMatches();
    }

    /** All previously saved matches, best first */
    @GetMapping
    public List<Match> getAllMatches() {
        return matchRepository.findAllByOrderByFinalScoreDesc();
    }

    /** Admin / item owner can accept or reject a match */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String newStatus = body.getOrDefault("status", "").toUpperCase();
        if (!newStatus.equals("ACCEPTED") && !newStatus.equals("REJECTED") && !newStatus.equals("PENDING")) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Invalid status. Use ACCEPTED, REJECTED, or PENDING."));
        }
        return matchRepository.findById(id).map(m -> {
            m.setStatus(newStatus);
            return ResponseEntity.ok(matchRepository.save(m));
        }).orElse(ResponseEntity.notFound().build());
    }
}
