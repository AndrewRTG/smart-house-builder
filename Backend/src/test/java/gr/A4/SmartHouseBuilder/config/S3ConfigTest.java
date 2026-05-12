package gr.A4.SmartHouseBuilder.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class S3ConfigTest {

    private S3Config s3Config;

    @BeforeEach
    void setUp() {
        s3Config = new S3Config();
        ReflectionTestUtils.setField(s3Config, "accessKey", "access");
        ReflectionTestUtils.setField(s3Config, "secretKey", "secret");
        ReflectionTestUtils.setField(s3Config, "region", "eu-north-1");
    }

    @Test
    void s3ClientBeanIsCreated() {
        assertThat(s3Config.s3Client()).isNotNull();
    }

    @Test
    void s3PresignerBeanIsCreated() {
        assertThat(s3Config.s3Presigner()).isNotNull();
    }
}
