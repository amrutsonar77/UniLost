package com.unilost.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a row in the "messages" table.
 * One text message sent by a student inside a Conversation.
 */
@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long conversationId;

    private Long senderId;

    @Column(length = 2000)
    private String messageText;

    private LocalDateTime sentAt = LocalDateTime.now();

    private boolean isRead = false;

    public Message() {
    }

    public Message(Long conversationId, Long senderId, String messageText) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.messageText = messageText;
        this.sentAt = LocalDateTime.now();
        this.isRead = false;
    }

    // ----- Getters and Setters -----

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }
}
