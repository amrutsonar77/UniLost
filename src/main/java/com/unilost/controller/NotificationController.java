package com.unilost.controller;

import com.unilost.entity.Notification;
import com.unilost.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles the notification bell dropdown in the navbar.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/{userId}")
    public List<Notification> getNotifications(@PathVariable Long userId) {
        return notificationService.getForUser(userId);
    }

    @GetMapping("/{userId}/unread-count")
    public Map<String, Long> getUnreadCount(@PathVariable Long userId) {
        Map<String, Long> result = new HashMap<>();
        result.put("count", notificationService.unreadCount(userId));
        return result;
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
    }

    @PutMapping("/{userId}/read-all")
    public void markAllAsRead(@PathVariable Long userId) {
        notificationService.markAllAsRead(userId);
    }
}
