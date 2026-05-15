package gr.A4.SmartHouseBuilder.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    /**
     * Uploads a file to S3 under the given folder prefix and returns the public URL.
     *
     * @param file   the multipart file to upload
     * @param folder e.g. "articles" or "avatars"
     * @return public HTTPS URL of the uploaded object
     */
    public String upload(MultipartFile file, String folder) {
        validateFile(file);

        String ext = extractExtension(file.getOriginalFilename());
        String key = folder + "/" + UUID.randomUUID() + ext;

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    // Bucket must have "Block all public access" OFF and a bucket policy
                    // granting s3:GetObject to "*". See README for the policy snippet.
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("Uploaded S3 object: {}", key);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read upload stream", e);
        }

        return buildPublicUrl(key);
    }

    /**
     * Deletes an object from S3 identified by its full public URL.
     * Silently ignores URLs that don't belong to this bucket/region.
     */
    public void deleteByUrl(String url) {
        if (url == null || url.isBlank()) return;

        String prefix = buildPublicUrl("");          // e.g. https://bucket.s3.region.amazonaws.com/
        if (!url.startsWith(prefix)) {
            log.debug("Skipping delete — URL not owned by this bucket: {}", url);
            return;
        }

        String key = url.substring(prefix.length());
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
        log.info("Deleted S3 object: {}", key);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload file must not be empty");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException(
                    "Unsupported image type: " + file.getContentType() +
                    ". Allowed: jpeg, png, webp, gif");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("File exceeds maximum size of 5 MB");
        }
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot).toLowerCase() : "";
    }

    private String buildPublicUrl(String key) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, key);
    }
}
