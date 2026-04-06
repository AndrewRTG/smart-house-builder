package gr.A4.SmartHouseBuilder.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailException;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.mail.from}")
    private String fromAddress;

    public void sendVerificationEmail(String to, String token) {
        String link = baseUrl + "/api/v1/auth/verify-email?token=" + token;

        String html = """
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                  <h2>Verify your SmartHouseBuilder account</h2>
                  <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
                  <a href="%s"
                     style="display:inline-block;padding:12px 24px;background:#4CAF50;color:white;
                            text-decoration:none;border-radius:4px;font-size:16px;">
                    Verify Email
                  </a>
                  <p style="color:#888;font-size:12px;margin-top:24px;">
                    If you didn't create an account, you can ignore this email.
                  </p>
                </body>
                </html>
                """.formatted(link);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Verify your SmartHouseBuilder account");
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException | MailException e) {
            throw new RuntimeException("Failed to send verification email to " + to, e);
        }
    }
}
