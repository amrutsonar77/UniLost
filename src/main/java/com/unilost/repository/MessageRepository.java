package com.unilost.repository;

import com.unilost.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderBySentAtAsc(Long conversationId);

    List<Message> findByConversationIdAndSenderIdNotAndIsReadFalse(Long conversationId, Long senderId);
}
