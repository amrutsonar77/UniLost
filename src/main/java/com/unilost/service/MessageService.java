package com.unilost.service;

import com.unilost.entity.Conversation;
import com.unilost.entity.Message;
import com.unilost.entity.User;
import com.unilost.repository.ConversationRepository;
import com.unilost.repository.MessageRepository;
import com.unilost.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Simple database-based messaging system between two students about a
 * specific Lost or Found item. No real-time chat / WebSockets - the
 * frontend just polls or re-fetches when the Messages page is opened.
 */
@Service
public class MessageService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Finds an existing conversation about this item between these two users,
     * or creates a new one. Returns the conversation.
     */
    public Conversation startConversation(Long itemId, String itemType, Long userOneId, Long userTwoId) {
        if (userOneId.equals(userTwoId)) {
            throw new RuntimeException("You cannot start a conversation with yourself.");
        }

        Optional<Conversation> existing = conversationRepository.findExisting(itemId, itemType, userOneId, userTwoId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Conversation conversation = new Conversation(itemId, itemType, userOneId, userTwoId);
        return conversationRepository.save(conversation);
    }

    public Message sendMessage(Long conversationId, Long senderId, String text) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.getUserOneId().equals(senderId) && !conversation.getUserTwoId().equals(senderId)) {
            throw new RuntimeException("You are not part of this conversation.");
        }

        Message message = new Message(conversationId, senderId, text);
        Message saved = messageRepository.save(message);

        // Notify the other person in the conversation
        Long recipientId = conversation.getUserOneId().equals(senderId)
                ? conversation.getUserTwoId()
                : conversation.getUserOneId();

        String senderName = userRepository.findById(senderId).map(User::getFullName).orElse("A student");
        notificationService.create(recipientId, "New Message", senderName + " sent you a message.", "NEW_MESSAGE");

        return saved;
    }

    /**
     * Returns a summary of every conversation the user is part of, with the
     * other student's name and the last message preview - used for the
     * conversation list on the left of the Messages page.
     */
    public List<Map<String, Object>> getUserConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findAllForUser(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Conversation c : conversations) {
            Long otherUserId = c.getUserOneId().equals(userId) ? c.getUserTwoId() : c.getUserOneId();
            User otherUser = userRepository.findById(otherUserId).orElse(null);

            List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(c.getId());
            String lastMessage = messages.isEmpty() ? "" : messages.get(messages.size() - 1).getMessageText();

            long unread = messages.stream()
                    .filter(m -> !m.isRead() && !m.getSenderId().equals(userId))
                    .count();

            Map<String, Object> row = new HashMap<>();
            row.put("conversationId", c.getId());
            row.put("itemId", c.getItemId());
            row.put("itemType", c.getItemType());
            row.put("otherUserName", otherUser != null ? otherUser.getFullName() : "Unknown Student");
            row.put("lastMessage", lastMessage);
            row.put("unreadCount", unread);
            result.add(row);
        }
        return result;
    }

    public List<Message> getConversationMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
    }

    public void markMessagesAsRead(Long conversationId, Long readerId) {
        List<Message> unread = messageRepository.findByConversationIdAndSenderIdNotAndIsReadFalse(conversationId, readerId);
        for (Message m : unread) {
            m.setRead(true);
            messageRepository.save(m);
        }
    }
}
