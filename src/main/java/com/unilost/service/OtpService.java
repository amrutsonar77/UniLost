package com.unilost.service;

import com.unilost.entity.OtpToken;
import com.unilost.repository.OtpTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Handles all OTP lifecycle:
 *  generateAndSend()  → create 6-digit code, persist, send email
 *  verify()           → validate code, mark used, return success/failure reason
 *  Scheduled cleanup  → purge expired rows every 30 minutes
 */
@Service
public class OtpService {

    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    private OtpTokenRepository otpRepo;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${unilost.mail.from}")
    private String fromAddress;

    @Value("${unilost.otp.expiry-minutes:10}")
    private int expiryMinutes;

    @Value("${unilost.otp.resend-cooldown-seconds:60}")
    private int resendCooldownSeconds;

    // ── Public API ────────────────────────────────────────

    /**
     * Generate a 6-digit OTP for the given email + purpose, send it by email,
     * and persist it.
     *
     * @param email   recipient email
     * @param purpose "REGISTER" or "RESET"
     * @return OtpResult with ok=true, or ok=false + reason (rate-limit, mail failure)
     */
    public OtpResult generateAndSend(String email, String purpose) {

        // Rate-limit: check whether a recent OTP was already sent
        Optional<OtpToken> latest = otpRepo.findLatest(email, purpose);
        if (latest.isPresent()) {
            long secondsSinceLast = java.time.Duration.between(
                    latest.get().getCreatedAt(), LocalDateTime.now()).getSeconds();
            if (secondsSinceLast < resendCooldownSeconds) {
                long wait = resendCooldownSeconds - secondsSinceLast;
                return OtpResult.fail("Please wait " + wait + " second(s) before requesting a new code.");
            }
        }

        // Invalidate any previous OTPs for this email + purpose
        otpRepo.deleteAllByEmailAndPurpose(email, purpose);

        // Generate 6-digit code (zero-padded)
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        // Persist
        OtpToken token = new OtpToken();
        token.setEmail(email.toLowerCase().trim());
        token.setCode(code);
        token.setPurpose(purpose);
        token.setCreatedAt(LocalDateTime.now());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        otpRepo.save(token);

        // Send email
        try {
            sendOtpEmail(email, code, purpose);
        } catch (Exception e) {
            // Delete the token if mail failed so the user can retry immediately
            otpRepo.deleteAllByEmailAndPurpose(email, purpose);
            return OtpResult.fail("Could not send email. Please check your address and try again.");
        }

        return OtpResult.ok("OTP sent to " + email + ". Valid for " + expiryMinutes + " minutes.");
    }

    /**
     * Verify the OTP entered by the user.
     *
     * @param email   the email the OTP was sent to
     * @param code    the 6-digit code the user entered
     * @param purpose "REGISTER" or "RESET"
     * @return OtpResult ok=true if correct, or fail with a descriptive message
     */
    public OtpResult verify(String email, String code, String purpose) {

        Optional<OtpToken> opt = otpRepo.findLatestValid(
                email.toLowerCase().trim(), purpose, LocalDateTime.now());

        if (opt.isEmpty()) {
            return OtpResult.fail("OTP expired or not found. Please request a new code.");
        }

        OtpToken token = opt.get();

        // Brute-force guard
        if (token.getAttempts() >= MAX_ATTEMPTS) {
            otpRepo.deleteAllByEmailAndPurpose(email, purpose);
            return OtpResult.fail("Too many incorrect attempts. Please request a new code.");
        }

        if (!token.getCode().equals(code.trim())) {
            token.setAttempts(token.getAttempts() + 1);
            otpRepo.save(token);
            int remaining = MAX_ATTEMPTS - token.getAttempts();
            return OtpResult.fail("Incorrect code. " + remaining + " attempt(s) remaining.");
        }

        // ✓ Correct — mark as used and delete all tokens for this email+purpose
        token.setUsed(true);
        otpRepo.save(token);
        otpRepo.deleteAllByEmailAndPurpose(email, purpose);

        return OtpResult.ok("OTP verified successfully.");
    }

    // ── Email helper ──────────────────────────────────────

    private void sendOtpEmail(String to, String code, String purpose) {
        String subject;
        String body;

        if ("REGISTER".equalsIgnoreCase(purpose)) {
            subject = "UniLost — Your verification code: " + code;
            body = "Hello,\n\n"
                 + "Your UniLost registration verification code is:\n\n"
                 + "    " + code + "\n\n"
                 + "This code expires in " + expiryMinutes + " minutes.\n"
                 + "If you did not request this, please ignore this email.\n\n"
                 + "— The UniLost Team";
        } else {
            subject = "UniLost — Password reset code: " + code;
            body = "Hello,\n\n"
                 + "Your UniLost password reset code is:\n\n"
                 + "    " + code + "\n\n"
                 + "This code expires in " + expiryMinutes + " minutes.\n"
                 + "If you did not request a password reset, please ignore this email.\n\n"
                 + "— The UniLost Team";
        }

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        mailSender.send(msg);
    }

    // ── Scheduled cleanup ─────────────────────────────────

    /** Every 30 minutes: remove tokens that expired over an hour ago. */
    @Scheduled(fixedDelay = 30 * 60 * 1000)
    public void cleanupExpiredTokens() {
        otpRepo.deleteExpiredBefore(LocalDateTime.now().minusHours(1));
    }

    // ── Inner result type ─────────────────────────────────

    public static class OtpResult {
        public final boolean ok;
        public final String message;

        private OtpResult(boolean ok, String message) {
            this.ok = ok;
            this.message = message;
        }

        public static OtpResult ok(String message)   { return new OtpResult(true,  message); }
        public static OtpResult fail(String message) { return new OtpResult(false, message); }
    }
}
