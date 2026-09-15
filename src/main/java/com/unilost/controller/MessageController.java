package com.unilost.controller;

import com.unilost.entity.Conversation;
import com.unilost.entity.Message;
import com.unilost.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Handles: Start Conversation, Send Message, Get User Conversations,
 * Get Conversation Messages, Mark Messages as Read.
 */
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    // Start (or reuse) a conversation about a specific item between two students
    @PostMapping("/start")
    public Conversation startConversation(@RequestBody Map<String, Object> body) {
        Long itemId = Long.valueOf(body.get("itemId").toString());
        String itemType = body.get("itemType").toString(); // "LOST" or "FOUND"
        Long userOneId = Long.valueOf(body.get("userOneId").toString());
        Long userTwoId = Long.valueOf(body.get("userTwoId").toString());
        return messageService.startConversation(itemId, itemType, userOneId, userTwoId);
    }

    // Send a message inside an existing conversation
    @PostMapping("/send")
    public Message sendMessage(@RequestBody Map<String, Object> body) {
        Long conversationId = Long.valueOf(body.get("conversationId").toString());
        Long senderId = Long.valueOf(body.get("senderId").toString());
        String text = body.get("messageText").toString();
        return messageService.sendMessage(conversationId, senderId, text);
    }

    // All conversations for the Messages page conversation list
    @GetMapping("/conversations/{userId}")
    public List<Map<String, Object>> getUserConversations(@PathVariable Long userId) {
        return messageService.getUserConversations(userId);
    }

    // All messages inside one conversation, in order
    @GetMapping("/conversation/{conversationId}")
    public List<Message> getConversationMessages(@PathVariable Long conversationId) {
        return messageService.getConversationMessages(conversationId);
    }

    // Mark every message in a conversation as read (called when the reader opens it)
    @PutMapping("/read/{conversationId}/{readerId}")
    public void markAsRead(@PathVariable Long conversationId, @PathVariable Long readerId) {
        messageService.markMessagesAsRead(conversationId, readerId);
    }
}
