package com.unilost.repository;

import com.unilost.entity.FoundItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoundItemRepository extends JpaRepository<FoundItem, Long> {

    List<FoundItem> findByItemNameContainingIgnoreCaseOrLocationContainingIgnoreCase(String itemName, String location);

    List<FoundItem> findByUserIdOrderByDateDesc(Long userId);

    List<FoundItem> findByCategory(String category);
}
