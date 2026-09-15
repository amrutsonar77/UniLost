package com.unilost.repository;

import com.unilost.entity.LostItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LostItemRepository extends JpaRepository<LostItem, Long> {

    // Simple search - looks for the keyword inside item name or location
    List<LostItem> findByItemNameContainingIgnoreCaseOrLocationContainingIgnoreCase(String itemName, String location);

    // Used by the "My Reports" page
    List<LostItem> findByUserIdOrderByDateDesc(Long userId);

    // Used by the category filter dropdown
    List<LostItem> findByCategory(String category);
}
