package com.unilost.repository;

import com.unilost.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    // Finds an existing conversation between the same two users about the same item
    // (checked both ways round, since we don't know who messaged first)
    @Query("SELECT c FROM Conversation c WHERE c.itemId = :itemId AND c.itemType = :itemType " +
           "AND ((c.userOneId = :userA AND c.userTwoId = :userB) OR (c.userOneId = :userB AND c.userTwoId = :userA))")
    Optional<Conversation> findExisting(@Param("itemId") Long itemId, @Param("itemType") String itemType,
                                         @Param("userA") Long userA, @Param("userB") Long userB);

    // All conversations a given student is part of (for the Messages page)
    @Query("SELECT c FROM Conversation c WHERE c.userOneId = :userId OR c.userTwoId = :userId ORDER BY c.createdAt DESC")
    List<Conversation> findAllForUser(@Param("userId") Long userId);
}
