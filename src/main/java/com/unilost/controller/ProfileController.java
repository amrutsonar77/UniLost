package com.unilost.controller;

import com.unilost.entity.LostItem;
import com.unilost.entity.User;
import com.unilost.repository.FoundItemRepository;
import com.unilost.repository.LostItemRepository;
import com.unilost.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Handles the basic student Profile page: viewing account info plus a
 * few personal stats, and editing name / college name.
 * (Role changes are intentionally NOT allowed here.)
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LostItemRepository lostItemRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @GetMapping("/{userId}")
    public Map<String, Object> getProfile(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        var lostItems = lostItemRepository.findByUserIdOrderByDateDesc(userId);
        var foundItems = foundItemRepository.findByUserIdOrderByDateDesc(userId);

        long recoveredCount = lostItems.stream().filter(i -> "RECOVERED".equals(i.getStatus())).count()
                + foundItems.stream().filter(i -> "RECOVERED".equals(i.getStatus())).count();

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("fullName", user.getFullName());
        result.put("email", user.getEmail());
        result.put("collegeName", user.getCollegeName());
        result.put("role", user.getRole());
        result.put("totalLostReports", lostItems.size());
        result.put("totalFoundReports", foundItems.size());
        result.put("itemsRecovered", recoveredCount);
        return result;
    }

    // Update just the name and college name - NOT the role
    @PutMapping("/{userId}")
    public User updateProfile(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (body.get("fullName") != null && !body.get("fullName").isBlank()) {
            user.setFullName(body.get("fullName"));
        }
        if (body.get("collegeName") != null) {
            user.setCollegeName(body.get("collegeName"));
        }

        return userRepository.save(user);
    }
}
