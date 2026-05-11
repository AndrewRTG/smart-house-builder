package gr.A4.SmartHouseBuilder.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class S3ServiceTest {

    @Mock
    private S3Client s3Client;

    @InjectMocks
    private S3Service s3Service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(s3Service, "bucket", "test-bucket");
        ReflectionTestUtils.setField(s3Service, "region", "eu-north-1");
    }

    // ── upload() ────────────────────────────────────────────────────────────

    @Test
    void upload_validJpeg_returnsPublicS3Url() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.jpg", "image/jpeg", new byte[100]
        );
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());

        String url = s3Service.upload(file, "avatars");

        assertThat(url).startsWith("https://test-bucket.s3.eu-north-1.amazonaws.com/avatars/");
        assertThat(url).endsWith(".jpg");
        verify(s3Client, times(1)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void upload_validPng_returnsPublicS3Url() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "cover.png", "image/png", new byte[200]
        );
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());

        String url = s3Service.upload(file, "articles");

        assertThat(url).startsWith("https://test-bucket.s3.eu-north-1.amazonaws.com/articles/");
        assertThat(url).endsWith(".png");
    }

    @Test
    void upload_emptyFile_throwsIllegalArgumentException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.jpg", "image/jpeg", new byte[0]
        );

        assertThatThrownBy(() -> s3Service.upload(emptyFile, "avatars"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("empty");

        verifyNoInteractions(s3Client);
    }

    @Test
    void upload_unsupportedContentType_throwsIllegalArgumentException() {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "document.pdf", "application/pdf", new byte[100]
        );

        assertThatThrownBy(() -> s3Service.upload(pdfFile, "avatars"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported image type");

        verifyNoInteractions(s3Client);
    }

    @Test
    void upload_fileTooLarge_throwsIllegalArgumentException() {
        // 6 MB — peste limita de 5 MB
        byte[] bigContent = new byte[6 * 1024 * 1024];
        MockMultipartFile bigFile = new MockMultipartFile(
                "file", "big.jpg", "image/jpeg", bigContent
        );

        assertThatThrownBy(() -> s3Service.upload(bigFile, "avatars"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("5 MB");

        verifyNoInteractions(s3Client);
    }

    @Test
    void upload_nullFile_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> s3Service.upload(null, "avatars"))
                .isInstanceOf(IllegalArgumentException.class);

        verifyNoInteractions(s3Client);
    }

    // ── deleteByUrl() ───────────────────────────────────────────────────────

    @Test
    void deleteByUrl_validS3Url_callsS3Delete() {
        String url = "https://test-bucket.s3.eu-north-1.amazonaws.com/avatars/some-uuid.jpg";

        s3Service.deleteByUrl(url);

        verify(s3Client, times(1)).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void deleteByUrl_nullUrl_doesNothing() {
        s3Service.deleteByUrl(null);

        verifyNoInteractions(s3Client);
    }

    @Test
    void deleteByUrl_emptyUrl_doesNothing() {
        s3Service.deleteByUrl("");

        verifyNoInteractions(s3Client);
    }

    @Test
    void deleteByUrl_externalUrl_doesNothing() {
        // URL care nu aparține bucket-ului nostru — trebuie ignorat
        String externalUrl = "https://via.placeholder.com/150?text=Avatar";

        s3Service.deleteByUrl(externalUrl);

        verifyNoInteractions(s3Client);
    }

    @Test
    void deleteByUrl_differentBucketUrl_doesNothing() {
        String otherBucketUrl = "https://alt-bucket.s3.eu-north-1.amazonaws.com/avatars/file.jpg";

        s3Service.deleteByUrl(otherBucketUrl);

        verifyNoInteractions(s3Client);
    }
}