package com.unilost.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Very simple password hashing helper using SHA-256.
 *
 * NOTE (for demo/learning purposes): In a real production system you should
 * use a stronger, salted algorithm like BCrypt (via Spring Security).
 * For this college project, SHA-256 hashing is enough to show that we are
 * NOT storing plain text passwords in the database.
 */
public class PasswordUtil {

    public static String hash(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawPassword.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    public static boolean matches(String rawPassword, String hashedPassword) {
        return hash(rawPassword).equals(hashedPassword);
    }
}
