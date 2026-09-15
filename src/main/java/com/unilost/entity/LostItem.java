package com.unilost.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Represents a row in the "lost_items" table.
 * Created whenever a student reports something they lost.
 */
@Entity
@Table(name = "lost_items", indexes = {
    @Index(name = "idx_lost_category", columnList = "category"),
    @Index(name = "idx_lost_status",   columnList = "status"),
    @Index(name = "idx_lost_user",     columnList = "userId")
})
public class LostItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String itemName;

    @Column(length = 1000)
    private String description;

    private String location;

    private LocalDate date;

    /** Path/URL of the uploaded image, e.g. "/uploads/abc123.jpg" */
    private String imagePath;

    /** Which user reported this lost item */
    private Long userId;

    /** e.g. Electronics, ID Cards, Books, Bags, Keys, Clothing, Accessories, Documents, Water Bottles, Other */
    private String category;

    /** Primary colour of the item, e.g. "Black", "Blue" */
    private String color;

    /** Brand/make of the item, e.g. "Apple", "Samsung" */
    private String brand;

    /** Any extra identifying details the owner wants to add */
    @Column(length = 1000)
    private String additionalDetails;

    /** Status: PENDING (still lost) | MATCHED | RECOVERED */
    private String status = "PENDING";

    public LostItem() {}

    // ---- Getters & Setters ----

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getAdditionalDetails() { return additionalDetails; }
    public void setAdditionalDetails(String additionalDetails) { this.additionalDetails = additionalDetails; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
