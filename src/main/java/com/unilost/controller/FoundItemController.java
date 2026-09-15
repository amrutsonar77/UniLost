package com.unilost.controller;

import com.unilost.entity.FoundItem;
import com.unilost.entity.User;
import com.unilost.repository.FoundItemRepository;
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
@RequestMapping("/api/found-items")
public class FoundItemController {

    @Autowired private FoundItemRepository foundItemRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private MatchingService matchingService;

    // ── List all ──────────────────────────────────────────────────────────────
    @GetMapping
    public List<FoundItem> getAllFoundItems() {
        return foundItemRepository.findAll();
    }

    // ── Single item (raw) ─────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getFoundItem(@PathVariable Long id) {
        return foundItemRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Found item not found")));
    }

    // ── Full details for Item Details page ────────────────────────────────────
    @GetMapping("/{id}/details")
    public ResponseEntity<?> getFoundItemDetails(@PathVariable Long id) {
        return foundItemRepository.findById(id).map(item -> {
            String reporterName = userRepository.findById(item.getUserId())
                    .map(User::getFullName).orElse("Unknown Student");
            Map<String, Object> result = new HashMap<>();
            result.put("item", item);
            result.put("reporterName", reporterName);
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Found item not found")));
    }

    // ── Search + filter ───────────────────────────────────────────────────────
    @GetMapping("/search")
    public List<FoundItem> searchFoundItems(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String status
    ) {
        List<FoundItem> items = (keyword == null || keyword.isBlank())
                ? foundItemRepository.findAll()
                : foundItemRepository.findByItemNameContainingIgnoreCaseOrLocationContainingIgnoreCase(keyword, keyword);

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
    public List<FoundItem> getFoundItemsByUser(@PathVariable Long userId) {
        return foundItemRepository.findByUserIdOrderByDateDesc(userId);
    }

    // ── Report new found item ─────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> reportFoundItem(
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
        if (isBlank(itemName))    return badRequest("Item name is required.");
        if (isBlank(description)) return badRequest("Description is required.");
        if (isBlank(location))    return badRequest("Location is required.");
        if (isBlank(date))        return badRequest("Date is required.");
        if (userId == null)       return badRequest("User ID is required.");

        String imagePath = null;
        if (image != null && !image.isEmpty()) {
            try {
                imagePath = FileStorageUtil.saveFile(image);
            } catch (IllegalArgumentException ex) {
                return badRequest(ex.getMessage());
            }
        }

        FoundItem item = new FoundItem();
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

        FoundItem saved = foundItemRepository.save(item);

        // Trigger AI matching for all existing lost items against this new found item
        try { matchingService.generateMatchesForNewFoundItem(saved.getId()); }
        catch (Exception ignored) {}

        return ResponseEntity.ok(saved);
    }

    // ── Edit existing found item ──────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateFoundItem(
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
        if (!foundItemRepository.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Found item not found"));
        FoundItem item = foundItemRepository.findById(id).get();
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
        return ResponseEntity.ok(foundItemRepository.save(item));
    }

    // ── Mark recovered ────────────────────────────────────────────────────────
    @PutMapping("/{id}/recover")
    public ResponseEntity<?> markAsRecovered(@PathVariable Long id) {
        if (!foundItemRepository.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Found item not found"));
        FoundItem item = foundItemRepository.findById(id).get();
        item.setStatus("RECOVERED");
        return ResponseEntity.ok(foundItemRepository.save(item));
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFoundItem(@PathVariable Long id) {
        if (!foundItemRepository.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Found item not found"));
        foundItemRepository.deleteById(id);
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
