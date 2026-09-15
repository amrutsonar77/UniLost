package com.unilost.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

/**
 * Handles saving uploaded item images to the local "uploads" folder.
 *
 * Validation enforced here (server-side, not just client-side):
 *  - File must not be empty
 *  - Extension must be jpg, jpeg, png, or webp
 *  - MIME type must match an allowed image type
 *  - File size must not exceed MAX_FILE_BYTES (5 MB)
 *  - Magic-byte check: first bytes must match a known image signature
 *  - Filename sanitised to UUID — no path traversal possible
 */
public class FileStorageUtil {

    private static final String UPLOAD_DIR = "uploads";
    private static final long MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of("jpg", "jpeg", "png", "webp");

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");

    /**
     * Saves the file and returns the public URL path (e.g. "/uploads/uuid.jpg").
     *
     * @throws IllegalArgumentException if the file fails any validation check.
     */
    public static String saveFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null; // image is optional - null is fine
        }

        // ── Size check ────────────────────────────────────────────────────────
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new IllegalArgumentException(
                    "Image file is too large. Maximum allowed size is 5 MB.");
        }

        // ── Extension check ───────────────────────────────────────────────────
        String originalName = file.getOriginalFilename();
        String extension = extractExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Unsupported file type. Please upload a JPG, JPEG, PNG, or WebP image.");
        }

        // ── MIME type check ───────────────────────────────────────────────────
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Invalid file content type. Only image files are accepted.");
        }

        // ── Magic-byte (file signature) check ─────────────────────────────────
        try {
            if (!hasValidImageSignature(file.getInputStream(), extension)) {
                throw new IllegalArgumentException(
                        "The file does not appear to be a valid image. Please upload a real image file.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read the uploaded file. Please try again.");
        }

        // ── Save file with a UUID name (no path traversal risk) ───────────────
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Normalise to .jpg for jpeg variants so URLs are clean
            String saveExt = extension.equals("jpeg") ? "jpg" : extension;
            String newFileName = UUID.randomUUID() + "." + saveExt;
            Path filePath = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), filePath);

            return "/uploads/" + newFileName;

        } catch (IOException e) {
            throw new RuntimeException("Could not save uploaded file: " + e.getMessage(), e);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase().trim();
    }

    /**
     * Checks the first few bytes of the file stream against known image
     * magic numbers, as an extra layer of protection against disguised files.
     */
    private static boolean hasValidImageSignature(InputStream stream, String ext) throws IOException {
        byte[] header = new byte[12];
        int bytesRead = stream.read(header);
        if (bytesRead < 4) return false;

        // JPEG: FF D8 FF
        if (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF) {
            return true;
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (header[0] == (byte) 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) {
            return true;
        }
        // WebP: RIFF????WEBP
        if (bytesRead >= 12
                && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') {
            return true;
        }
        return false;
    }
}
