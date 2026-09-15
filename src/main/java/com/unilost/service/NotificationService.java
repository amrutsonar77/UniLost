package com.unilost.service;

import com.unilost.entity.Notification;
import com.unilost.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Handles creating and reading in-app notifications.
 * Kept simple on purpose - this is just database rows read by the frontend
 * every time the page loads or the bell icon is clicked. No Firebase,
 * no WebSockets, no push notifications.
 */
@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification create(Long userId, String title, String message, String type) {
        Notification n = new Notification(userId, title, message, type);
        return notificationRepository.save(n);
    }

    public List<Notification> getForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(Long userId) {
        List<Notification> all = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Notification n : all) {
            if (!n.isRead()) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        }
    }
}
