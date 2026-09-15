package com.unilost.controller;

import com.unilost.entity.User;
import com.unilost.repository.UserRepository;
import com.unilost.util.PasswordUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Handles all authentication flows:
 *
 *  POST /api/auth/register          — direct registration (no OTP)
 *  POST /api/auth/login             — student login
 *  POST /api/auth/admin-login       — admin login
 *  POST /api/auth/forgot-password   — reset password directly (no OTP)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // Basic email regex — complements HTML5 type="email"
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    @Autowired private UserRepository userRepository;

    // ────────────────────────────────────────────────────────────────────────
    // REGISTRATION — direct, no OTP
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Validates inputs and creates the account immediately — no email required.
     *
     * Request body: { fullName, email, password, collegeName? }
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();

        String fullName    = trim(body.get("fullName"));
        String email       = trim(body.get("email")).toLowerCase();
        String password    = body.getOrDefault("password", "");
        String collegeName = trim(body.getOrDefault("collegeName", ""));

        if (fullName.isEmpty())
            return bad(response, "Full name is required.");
        if (fullName.length() > 100)
            return bad(response, "Full name must be 100 characters or fewer.");
        if (email.isEmpty())
            return bad(response, "Email address is required.");
        if (!EMAIL_PATTERN.matcher(email).matches())
            return bad(response, "Please enter a valid email address.");
        if (password.length() < 6)
            return bad(response, "Password must be at least 6 characters.");
        if (password.length() > 128)
            return bad(response, "Password is too long (max 128 characters).");
        if (userRepository.existsByEmail(email))
            return bad(response, "An account with this email already exists.");

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(PasswordUtil.hash(password));
        user.setRole("STUDENT");
        if (!collegeName.isEmpty()) user.setCollegeName(collegeName);
        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Account created successfully! You can now sign in.");
        return ResponseEntity.ok(response);
    }

    // Keep old endpoint names as aliases so nothing breaks if called directly
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtpAlias(@RequestBody Map<String, String> body) {
        return register(body);
    }

    @PostMapping("/verify-register")
    public ResponseEntity<?> verifyRegisterAlias(@RequestBody Map<String, String> body) {
        // OTP step removed — treat any call as already verified
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Account created successfully! You can now sign in.");
        return ResponseEntity.ok(response);
    }

    // ────────────────────────────────────────────────────────────────────────
    // LOGIN
    // ────────────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        Map<String, Object> response = new HashMap<>();

        String email    = trim(credentials.getOrDefault("email", "")).toLowerCase();
        String password = credentials.getOrDefault("password", "");

        if (email.isEmpty() || password.isEmpty()) {
            return bad(response, "Email and password are required.");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !PasswordUtil.matches(password, userOpt.get().getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid email or password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User user = userOpt.get();
        return ok(response, user);
    }

    // ────────────────────────────────────────────────────────────────────────
    // ADMIN LOGIN
    // ────────────────────────────────────────────────────────────────────────

    @PostMapping("/admin-login")
    public ResponseEntity<?> adminLogin(@RequestBody Map<String, String> credentials) {
        Map<String, Object> response = new HashMap<>();

        String email    = trim(credentials.getOrDefault("email", "")).toLowerCase();
        String password = credentials.getOrDefault("password", "");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !PasswordUtil.matches(password, userOpt.get().getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid admin credentials.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User user = userOpt.get();
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            response.put("success", false);
            response.put("message", "Access denied. This account does not have admin privileges.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        return ok(response, user);
    }

    // ────────────────────────────────────────────────────────────────────────
    // FORGOT PASSWORD — direct reset (no OTP)
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Step 1: verify the email exists and issue a reset token.
     * Request body: { email }
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();

        String email = trim(body.getOrDefault("email", "")).toLowerCase();

        if (email.isEmpty() || !EMAIL_PATTERN.matcher(email).matches())
            return bad(response, "Please enter a valid email address.");

        if (!userRepository.existsByEmail(email)) {
            // Don't reveal whether the account exists
            response.put("success", true);
            response.put("message", "If that email is registered, you can reset your password.");
            response.put("resetToken", "");
            return ResponseEntity.ok(response);
        }

        // Issue a short-lived token (email + timestamp, valid 15 min)
        String resetToken = java.util.Base64.getEncoder().encodeToString(
                (email + "|" + System.currentTimeMillis()).getBytes());

        response.put("success", true);
        response.put("message", "Email verified. You can now set a new password.");
        response.put("resetToken", resetToken);
        return ResponseEntity.ok(response);
    }

    // Keep OTP verify endpoint as a no-op alias (frontend may call it)
    @PostMapping("/verify-otp-reset")
    public ResponseEntity<?> verifyOtpResetAlias(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        String email = trim(body.getOrDefault("email", "")).toLowerCase();
        String resetToken = java.util.Base64.getEncoder().encodeToString(
                (email + "|" + System.currentTimeMillis()).getBytes());
        response.put("success", true);
        response.put("message", "Verified.");
        response.put("resetToken", resetToken);
        return ResponseEntity.ok(response);
    }

    // ────────────────────────────────────────────────────────────────────────
    // FORGOT PASSWORD — STEP 3: set new password
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Sets the new password. Requires the resetToken issued by /verify-otp-reset
     * to be presented within 15 minutes.
     *
     * Request body: { email, resetToken, newPassword, confirmPassword }
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();

        String email       = trim(body.getOrDefault("email", "")).toLowerCase();
        String resetToken  = trim(body.getOrDefault("resetToken", ""));
        String newPassword = body.getOrDefault("newPassword", "");
        String confirmPwd  = body.getOrDefault("confirmPassword", "");

        // ── Validate inputs ───────────────────────────────────────────────
        if (email.isEmpty() || resetToken.isEmpty() || newPassword.isEmpty()) {
            return bad(response, "All fields are required.");
        }
        if (newPassword.length() < 6) {
            return bad(response, "Password must be at least 6 characters.");
        }
        if (newPassword.length() > 128) {
            return bad(response, "Password is too long.");
        }
        if (!newPassword.equals(confirmPwd)) {
            return bad(response, "Passwords do not match.");
        }

        // ── Validate resetToken (email + timestamp, max 15 minutes old) ──
        try {
            String decoded = new String(java.util.Base64.getDecoder().decode(resetToken));
            String[] parts = decoded.split("\\|", 2);
            if (parts.length != 2) {
                return bad(response, "Invalid or expired session. Please start over.");
            }
            String tokenEmail = parts[0];
            long   issuedAt   = Long.parseLong(parts[1]);

            if (!tokenEmail.equals(email)) {
                return bad(response, "Session mismatch. Please start over.");
            }
            long ageMillis = System.currentTimeMillis() - issuedAt;
            if (ageMillis > 15L * 60 * 1000) {          // 15-minute window
                return bad(response, "Session expired. Please start over.");
            }
        } catch (Exception e) {
            return bad(response, "Invalid session. Please start over.");
        }

        // ── Update password ───────────────────────────────────────────────
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return bad(response, "Account not found.");
        }

        User user = userOpt.get();
        user.setPassword(PasswordUtil.hash(newPassword));
        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Password updated successfully! You can now sign in.");
        return ResponseEntity.ok(response);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private String trim(String s) {
        return s == null ? "" : s.trim();
    }

    private ResponseEntity<?> bad(Map<String, Object> response, String message) {
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    private ResponseEntity<?> ok(Map<String, Object> response, User user) {
        response.put("success",  true);
        response.put("id",       user.getId());
        response.put("fullName", user.getFullName());
        response.put("email",    user.getEmail());
        response.put("role",     user.getRole());
        return ResponseEntity.ok(response);
    }
}
