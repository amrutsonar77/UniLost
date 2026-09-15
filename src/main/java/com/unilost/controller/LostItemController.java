package com.unilost.controller;

import com.unilost.entity.LostItem;
import com.unilost.entity.User;
import com.unilost.repository.LostItemRepository;
import com.unilost.repository.UserRepository;
import com.unilost.service.MatchingService;
import com.unilost.util.FileStorageUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lost-items")
public class LostItemController {

    @Autowired private LostItemRepository lostItemRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private MatchingService matchingService;

    // ── List all ──────────────────────────────────────────────────────────────
    @GetMapping
    public List<LostItem> getAllLostItems() {
        return lostItemRepository.findAll();
    }

    // ── Single item (raw) ─────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getLostItem(@PathVariable Long id) {
        return lostItemRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Lost item not found")));
    }

    // ── Full details for Item Details page ────────────────────────────────────
    @GetMapping("/{id}/details")
    public ResponseEntity<?> getLostItemDetails(@PathVariable Long id) {
        return lostItemRepository.findById(id).map(item -> {
            String reporterName = userRepository.findById(item.getUserId())
                    .map(User::getFullName).orElse("Unknown Student");
            Map<String, Object> result = new HashMap<>();
            result.put("item", item);
            result.put("reporterName", reporterName);
            result.put("possibleMatches", matchingService.findMatchesForLostItem(id));
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Lost item not found")));
    }

    // ── Search + filter ───────────────────────────────────────────────────────
    @GetMapping("/search")
    public List<LostItem> searchLostItems(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String status
    ) {
        List<LostItem> items = (keyword == null || keyword.isBlank())
                ? lostItemRepository.findAll()
                : lostItemRepository.findByItemNameContainingIgnoreCaseOrLocationContainingIgnoreCase(keyword, keyword);

        return items.stream()
                .filter(i -> isBlank(category) || category.equalsIgnoreCase(i.getCategory()))
                .filter(i -> isBlank(location)  || contains(i.getLocation(), location))
                .filter(i -> isBlank(color)     || contains(i.getColor(), color))
                .filter(i -> isBlank(brand)     || contains(i.getBrand(), brand))
                .filter(i -> isBlank(status)    || status.equalsIgnoreCase(i.getStatus()))
                .collect(Collectors.toList());
    }

    // ── Items by user ─────────────────────────────────────────────────────────
    @GetMapping("/user/{userId}")
    public List<LostItem> getLostItemsByUser(@PathVariable Long userId) {
        return lostItemRepository.findByUserIdOrderByDateDesc(userId);
    }

    // ── Report new lost item ──────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> reportLostItem(
            @RequestParam("itemName")    String itemName,
            @RequestParam("description") String description,
            @RequestParam("location")    String location,
            @RequestParam("date")        String date,
            @RequestParam("userId")      Long userId,
            @RequestParam(value = "category",          required = false) String category,
            @RequestParam(value = "color",             required = false) String color,
            @RequestParam(value = "brand",             required = false) String brand,
            @RequestParam(value = "additionalDetails", required = false) String additionalDetails,
            @RequestParam(value = "image",             required = false) MultipartFile image
    ) {
        // Backend validation
        if (isBlank(itemName))    return badRequest("Item name is required.");
        if (isBlank(description)) return badRequest("Description is required.");
        if (isBlank(location))    return badRequest("Location is required.");
        if (isBlank(date))        return badRequest("Date is required.");
        if (userId == null)       return badRequest("User ID is required.");

        // Image validation (optional field but validated if provided)
        String imagePath = null;
        if (image != null && !image.isEmpty()) {
            try {
                imagePath = FileStorageUtil.saveFile(image);
            } catch (IllegalArgumentException ex) {
                return badRequest(ex.getMessage());
            }
        }

        LostItem item = new LostItem();
        item.setItemName(itemName.trim());
        item.setDescription(description.trim());
        item.setLocation(location.trim());
        item.setDate(LocalDate.parse(date));
        item.setUserId(userId);
        item.setCategory(category);
        item.setColor(color);
        item.setBrand(brand);
        item.setAdditionalDetails(additionalDetails);
        item.setStatus("PENDING");
        item.setImagePath(imagePath);

        LostItem saved = lostItemRepository.save(item);

        // Trigger AI matching asynchronously (catch errors so the save isn't lost)
        try { matchingService.generateMatchesForNewLostItem(saved.getId()); }
        catch (Exception ignored) {}

        return ResponseEntity.ok(saved);
    }

    // ── Edit existing lost item ───────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateLostItem(
            @PathVariable Long id,
            @RequestParam("itemName")    String itemName,
            @RequestParam("description") String description,
            @RequestParam("location")    String location,
            @RequestParam("date")        String date,
            @RequestParam(value = "category",          required = false) String category,
            @RequestParam(value = "color",             required = false) String color,
            @RequestParam(value = "brand",             required = false) String brand,
            @RequestParam(value = "additionalDetails", required = false) String additionalDetails,
            @RequestParam(value = "image",             required = false) MultipartFile image
    ) {
        if (!lostItemRepository.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Lost item not found"));
        LostItem item = lostItemRepository.findById(id).get();
        if (!isBlank(itemName))    item.setItemName(itemName.trim());
        if (!isBlank(description)) item.setDescription(description.trim());
        if (!isBlank(location))    item.setLocation(location.trim());
        if (!isBlank(date))        item.setDate(LocalDate.parse(date));
        item.setCategory(category);
        item.setColor(color);
        item.setBrand(brand);
        item.setAdditionalDetails(additionalDetails);
        if (image != null && !image.isEmpty()) {
            try { item.setImagePath(FileStorageUtil.saveFile(image)); }
            catch (IllegalArgumentException ex) { return badRequest(ex.getMessage()); }
        }
        return ResponseEntity.ok(lostItemRepository.save(item));
    }

    // ── Mark recovered ────────────────────────────────────────────────────────
    @PutMapping("/{id}/recover")
    public ResponseEntity<?> markAsRecovered(@PathVariable Long id) {
        if (!lostItemRepository.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Lost item not found"));
        LostItem item = lostItemRepository.findById(id).get();
        item.setStatus("RECOVERED");
        return ResponseEntity.ok(lostItemRepository.save(item));
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLostItem(@PathVariable Long id) {
        if (!lostItemRepository.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Lost item not found"));
        lostItemRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private boolean isBlank(String s) { return s == null || s.isBlank(); }

    private boolean contains(String field, String filter) {
        if (field == null) return false;
        return field.toLowerCase().contains(filter.toLowerCase());
    }

    private ResponseEntity<Map<String, String>> badRequest(String msg) {
        return ResponseEntity.badRequest().body(Map.of("message", msg));
    }
}
