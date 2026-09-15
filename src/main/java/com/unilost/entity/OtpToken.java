package com.unilost.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores one-time passwords for:
 *  - PURPOSE "REGISTER"  → email verification before account creation
 *  - PURPOSE "RESET"     → password reset verification
 *
 * A row is created when the user requests an OTP and deleted after
 * successful verification OR after it has expired.
 */
@Entity
@Table(name = "otp_tokens")
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The email address this OTP was sent to. */
    @Column(nullable = false)
    private String email;

    /** 6-digit numeric code, stored as plain text (short-lived, not a credential). */
    @Column(nullable = false, length = 6)
    private String code;

    /**
     * REGISTER — sent before account creation (verify email ownership).
     * RESET     — sent for forgot-password flow.
     */
    @Column(nullable = false, length = 10)
    private String purpose;

    /** When this OTP expires (set to now + expiry-minutes at creation). */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** When the OTP was created (used for resend rate-limiting). */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /** How many failed verification attempts have been made (max 5). */
    @Column(nullable = false)
    private int attempts = 0;

    /** Whether this OTP has already been successfully consumed. */
    @Column(nullable = false)
    private boolean used = false;

    public OtpToken() {}

    // ── Getters & Setters ─────────────────────────────────

    public Long getId() { return id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
}
