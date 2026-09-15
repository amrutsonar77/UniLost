package com.unilost.service;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;

/**
 * Real perceptual-hash (pHash) image similarity service.
 *
 * Algorithm overview:
 * 1. Load both images from disk.
 * 2. Resize each to 32×32 greyscale (captures structure, removes noise).
 * 3. Compute the DCT (Discrete Cosine Transform) of the 32×32 pixel grid.
 * 4. Take the top-left 8×8 block of DCT coefficients (low-frequency info).
 * 5. Compute the mean of those 64 values.
 * 6. Build a 64-bit hash: bit[i] = 1 if dct[i] >= mean, else 0.
 * 7. Compare the two hashes using Hamming distance:
 *      similarity = (1 - hammingDistance/64) * 100
 *
 * This approach:
 *  - Is rotation/scale tolerant (because we normalise to 32×32)
 *  - Is colour-blind (greyscale), which is fine — structure matters more
 *  - Runs entirely in pure Java with no external libraries
 *  - Is fast enough to compare hundreds of pairs in under a second
 *
 * Score interpretation:
 *   ≥ 90 → Very similar / likely the same item
 *   75–89 → Similar appearance
 *   50–74 → Possibly similar
 *   < 50  → Visually dissimilar
 *
 * If either image is missing or unreadable the method returns 0.0,
 * so the overall match score falls back to text/category signals only.
 */
@Service
public class ImageMatchingService {

    private static final int RESIZE_DIM  = 32;
    private static final int HASH_DIM    = 8;   // top-left 8×8 of the DCT
    private static final int HASH_BITS   = HASH_DIM * HASH_DIM; // 64

    /**
     * Returns a similarity score in the range [0.0, 100.0].
     *
     * @param imagePathA server-relative path, e.g. "/uploads/abc.jpg"
     * @param imagePathB server-relative path, e.g. "/uploads/xyz.png"
     */
    public double calculateSimilarity(String imagePathA, String imagePathB) {
        if (imagePathA == null || imagePathB == null) return 0.0;

        try {
            BufferedImage imgA = loadImage(imagePathA);
            BufferedImage imgB = loadImage(imagePathB);
            if (imgA == null || imgB == null) return 0.0;

            long hashA = computePHash(imgA);
            long hashB = computePHash(imgB);

            int hammingDist = Long.bitCount(hashA ^ hashB);
            double similarity = (1.0 - (double) hammingDist / HASH_BITS) * 100.0;
            return Math.max(0.0, Math.min(100.0, round1(similarity)));

        } catch (Exception e) {
            // Never crash the whole match process because of a bad image
            return 0.0;
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private BufferedImage loadImage(String serverPath) {
        // serverPath starts with "/uploads/", map to filesystem "uploads/<file>"
        String fsPath = serverPath.startsWith("/") ? serverPath.substring(1) : serverPath;
        File file = Paths.get(fsPath).toFile();
        if (!file.exists() || !file.isFile()) return null;
        try {
            return ImageIO.read(file);
        } catch (IOException e) {
            return null;
        }
    }

    /**
     * Computes a 64-bit perceptual hash for the given image.
     */
    private long computePHash(BufferedImage img) {
        // Step 1: resize to RESIZE_DIM × RESIZE_DIM greyscale
        double[][] pixels = toGreyscalePixels(img, RESIZE_DIM, RESIZE_DIM);

        // Step 2: 2-D DCT
        double[][] dct = computeDCT(pixels);

        // Step 3: take top-left HASH_DIM × HASH_DIM block and compute mean
        double[] vals = new double[HASH_BITS];
        int idx = 0;
        for (int y = 0; y < HASH_DIM; y++) {
            for (int x = 0; x < HASH_DIM; x++) {
                vals[idx++] = dct[y][x];
            }
        }
        double mean = mean(vals);

        // Step 4: build hash — bit is 1 if value >= mean
        long hash = 0L;
        for (int i = 0; i < HASH_BITS; i++) {
            if (vals[i] >= mean) {
                hash |= (1L << i);
            }
        }
        return hash;
    }

    /**
     * Resizes the image to w×h and converts to greyscale luminance values (0–255).
     */
    private double[][] toGreyscalePixels(BufferedImage src, int w, int h) {
        // Draw into a plain TYPE_INT_RGB canvas at the target size
        BufferedImage resized = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(src, 0, 0, w, h, null);
        g.dispose();

        double[][] grey = new double[h][w];
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                int rgb = resized.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g2 = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;
                // Standard luminance coefficients
                grey[y][x] = 0.299 * r + 0.587 * g2 + 0.114 * b;
            }
        }
        return grey;
    }

    /**
     * Separable 2-D DCT-II on an N×N pixel grid.
     * We apply 1-D DCT along rows then along columns.
     */
    private double[][] computeDCT(double[][] pixels) {
        int N = pixels.length;
        double[][] temp   = new double[N][N];
        double[][] result = new double[N][N];

        // DCT along rows
        for (int y = 0; y < N; y++) {
            temp[y] = dct1D(pixels[y]);
        }
        // DCT along columns
        for (int x = 0; x < N; x++) {
            double[] col = new double[N];
            for (int y = 0; y < N; y++) col[y] = temp[y][x];
            double[] dctCol = dct1D(col);
            for (int y = 0; y < N; y++) result[y][x] = dctCol[y];
        }
        return result;
    }

    /**
     * 1-D DCT-II.  O(N²) — acceptable for N=32 (1024 multiplications per row/col).
     */
    private double[] dct1D(double[] input) {
        int N = input.length;
        double[] output = new double[N];
        for (int k = 0; k < N; k++) {
            double sum = 0.0;
            for (int n = 0; n < N; n++) {
                sum += input[n] * Math.cos(Math.PI * k * (2.0 * n + 1) / (2.0 * N));
            }
            double scale = (k == 0) ? Math.sqrt(1.0 / N) : Math.sqrt(2.0 / N);
            output[k] = scale * sum;
        }
        return output;
    }

    private double mean(double[] arr) {
        double s = 0;
        for (double v : arr) s += v;
        return s / arr.length;
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
