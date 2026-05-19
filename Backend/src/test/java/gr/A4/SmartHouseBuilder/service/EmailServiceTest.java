package gr.A4.SmartHouseBuilder.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private EmailService service;

    @BeforeEach
    void setUp() {
        service = new EmailService(mailSender);
        ReflectionTestUtils.setField(service, "baseUrl", "https://api.example.test");
        ReflectionTestUtils.setField(service, "fromAddress", "noreply@example.test");
    }

    @Test
    void sendsVerificationEmail() throws Exception {
        MimeMessage message = message();
        when(mailSender.createMimeMessage()).thenReturn(message);

        service.sendVerificationEmail("user@example.test", "verify-token");

        verify(mailSender).send(message);
        assertThat(message.getSubject()).isEqualTo("Verify your SmartHouseBuilder account");
        assertThat(message.getAllRecipients()[0].toString()).isEqualTo("user@example.test");
        assertThat(message.getFrom()[0].toString()).isEqualTo("noreply@example.test");
        assertThat(content(message)).contains("verify-token");
    }

    @Test
    void sendsResetPasswordEmail() throws Exception {
        MimeMessage message = message();
        when(mailSender.createMimeMessage()).thenReturn(message);

        service.sendResetPasswordEmail("user@example.test", "reset-token");

        verify(mailSender).send(message);
        assertThat(message.getSubject()).isEqualTo("Reset Your SmartHouse Password");
        assertThat(message.getAllRecipients()[0].toString()).isEqualTo("user@example.test");
        assertThat(content(message)).contains("reset-token");
    }

    @Test
    void sendsCommentNotificationEmail() throws Exception {
        MimeMessage message = message();
        when(mailSender.createMimeMessage()).thenReturn(message);

        service.sendCommentNotificationEmail("owner@example.test", "alice", "My Setup", "SETUP", "Great setup!");

        verify(mailSender).send(message);
        assertThat(message.getSubject()).isEqualTo("alice commented on your setup — Smart House Builder");
        assertThat(message.getAllRecipients()[0].toString()).isEqualTo("owner@example.test");
        assertThat(content(message)).contains("alice").contains("My Setup").contains("Great setup!");
    }

    @Test
    void sendsReplyNotificationEmail() throws Exception {
        MimeMessage message = message();
        when(mailSender.createMimeMessage()).thenReturn(message);

        service.sendReplyNotificationEmail("owner@example.test", "bob", "My Article", "ARTICLE", "Interesting point.");

        verify(mailSender).send(message);
        assertThat(message.getSubject()).isEqualTo("bob replied to your comment — Smart House Builder");
        assertThat(message.getAllRecipients()[0].toString()).isEqualTo("owner@example.test");
        assertThat(content(message)).contains("bob").contains("My Article").contains("Interesting point.");
    }

    @Test
    void sendsLikeNotificationEmail() throws Exception {
        MimeMessage message = message();
        when(mailSender.createMimeMessage()).thenReturn(message);

        service.sendLikeNotificationEmail("owner@example.test", "carol", "Smart Living Room", "SETUP");

        verify(mailSender).send(message);
        assertThat(message.getSubject()).isEqualTo("carol liked your setup — Smart House Builder");
        assertThat(message.getAllRecipients()[0].toString()).isEqualTo("owner@example.test");
        assertThat(content(message)).contains("carol").contains("Smart Living Room");
    }

    @Test
    void sendsWishlistNotificationEmail() throws Exception {
        MimeMessage message = message();
        when(mailSender.createMimeMessage()).thenReturn(message);

        service.sendWishlistNotificationEmail("owner@example.test", "dave", "Dream Setup");

        verify(mailSender).send(message);
        assertThat(message.getSubject()).isEqualTo("dave saved your setup — Smart House Builder");
        assertThat(message.getAllRecipients()[0].toString()).isEqualTo("owner@example.test");
        assertThat(content(message)).contains("dave").contains("Dream Setup");
    }

    @Test
    void wrapsVerificationMailFailures() {
        MimeMessage message = message();
        when(mailSender.createMimeMessage()).thenReturn(message);
        doThrow(new MailSendException("SMTP down")).when(mailSender).send(message);

        assertThatThrownBy(() -> service.sendVerificationEmail("user@example.test", "token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to send verification email");
    }

    private static MimeMessage message() {
        return new MimeMessage(Session.getInstance(new Properties()));
    }

    private static String content(MimeMessage message) throws Exception {
        return content(message.getContent());
    }

    private static String content(Object content) throws Exception {
        if (content instanceof MimeMultipart multipart) {
            StringBuilder text = new StringBuilder();
            for (int i = 0; i < multipart.getCount(); i++) {
                text.append(content(multipart.getBodyPart(i).getContent()));
            }
            return text.toString();
        }
        return content.toString();
    }
}
