package com.unilost.controller;

import com.unilost.entity.ClaimRequest;
import com.unilost.entity.FoundItem;
import com.unilost.entity.LostItem;
import com.unilost.entity.User;
import com.unilost.repository.ClaimRequestRepository;
import com.unilost.repository.FoundItemRepository;
import com.unilost.repository.LostItemRepository;
import com.unilost.repository.MatchRepository;
import com.unilost.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Basic Admin Page backend - lets an admin see a quick overview of the
 * whole platform (users, lost items, found items, matches, claims) and
 * delete bad/spam entries. Kept intentionally simple for a college demo -
 * no separate admin authentication system, just checks role == "ADMIN"
 * on the frontend before showing the page.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LostItemRepository lostItemRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private ClaimRequestRepository claimRequestRepository;

    // Dashboard counters for the admin page
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        long recoveredCount = lostItemRepository.findAll().stream().filter(i -> "RECOVERED".equals(i.getStatus())).count()
                + foundItemRepository.findAll().stream().filter(i -> "RECOVERED".equals(i.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalLostItems", lostItemRepository.count());
        stats.put("totalFoundItems", foundItemRepository.count());
        stats.put("totalMatches", matchRepository.count());
        stats.put("totalRecovered", recoveredCount);
        stats.put("pendingClaims", claimRequestRepository.findByStatus("PENDING").size());
        return stats;
    }

    @GetMapping("/claims")
    public List<ClaimRequest> getAllClaims() {
        return claimRequestRepository.findAll();
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }

    @GetMapping("/lost-items")
    public List<LostItem> getAllLostItems() {
        return lostItemRepository.findAll();
    }

    @GetMapping("/found-items")
    public List<FoundItem> getAllFoundItems() {
        return foundItemRepository.findAll();
    }
}
