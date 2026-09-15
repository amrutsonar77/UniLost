package com.unilost.repository;

import com.unilost.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the User entity.
 * Spring automatically implements this interface for us - no SQL needed!
 */
public interface UserRepository extends JpaRepository<User, Long> {

    // Used during login to find a user by their email
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
