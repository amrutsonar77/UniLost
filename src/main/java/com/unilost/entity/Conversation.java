package com.unilost.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a row in the "conversations" table.
 * A conversation is created the first time two students message each other
 * about a specific Lost or Found item.
 */
@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long itemId;

    // "LOST" or "FOUND" - tells us whether itemId refers to lost_items or found_items
    private String itemType;

    // The two students in this conversation (order doesn't matter)
    private Long userOneId;
    private Long userTwoId;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Conversation() {
    }

    public Conversation(Long itemId, String itemType, Long userOneId, Long userTwoId) {
        this.itemId = itemId;
        this.itemType = itemType;
        this.userOneId = userOneId;
        this.userTwoId = userTwoId;
        this.createdAt = LocalDateTime.now();
    }

    // ----- Getters and Setters -----

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }

    public Long getUserOneId() {
        return userOneId;
    }

    public void setUserOneId(Long userOneId) {
        this.userOneId = userOneId;
    }

    public Long getUserTwoId() {
        return userTwoId;
    }

    public void setUserTwoId(Long userTwoId) {
        this.userTwoId = userTwoId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
