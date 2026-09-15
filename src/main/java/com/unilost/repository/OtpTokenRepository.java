package com.unilost.repository;

import com.unilost.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    /**
     * Find the most-recently-created, still-valid (not used, not expired) OTP
     * for a given email + purpose. We take the latest one in case of duplicates.
     */
    @Query("SELECT o FROM OtpToken o WHERE o.email = :email AND o.purpose = :purpose " +
           "AND o.used = false AND o.expiresAt > :now ORDER BY o.createdAt DESC LIMIT 1")
    Optional<OtpToken> findLatestValid(String email, String purpose, LocalDateTime now);

    /**
     * Find the most-recently-created OTP for an email + purpose (valid or not)
     * so we can enforce the resend rate-limit.
     */
    @Query("SELECT o FROM OtpToken o WHERE o.email = :email AND o.purpose = :purpose " +
           "ORDER BY o.createdAt DESC LIMIT 1")
    Optional<OtpToken> findLatest(String email, String purpose);

    /** Purge all OTPs for an email + purpose (after successful verification or re-send). */
    @Modifying
    @Transactional
    @Query("DELETE FROM OtpToken o WHERE o.email = :email AND o.purpose = :purpose")
    void deleteAllByEmailAndPurpose(String email, String purpose);

    /** Scheduled cleanup — remove expired tokens older than 1 hour to keep the table small. */
    @Modifying
    @Transactional
    @Query("DELETE FROM OtpToken o WHERE o.expiresAt < :cutoff")
    void deleteExpiredBefore(LocalDateTime cutoff);
}
