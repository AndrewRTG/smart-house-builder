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

    public void sendResetPasswordEmail(String to, String token) {
        // Link that directs the user to the Reset Password page in the Frontend (React)
        String link = "http://localhost:5173/reset-password?token=" + token;

        String html = """
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #333;">Reset Your SmartHouse Password</h2>
              <p>We received a request to reset your password. Use the unique code below or click the button to set a new password.</p>
              
              <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #2196F3; border: 1px dashed #2196F3; margin: 20px 0;">
                %s
              </div>

              <p>Or click the button below to proceed:</p>
              <a href="%s"
                 style="display:inline-block;padding:12px 24px;background:#2196F3;color:white;
                        text-decoration:none;border-radius:4px;font-size:16px;font-weight: bold;">
                Reset Password
              </a>
              
              <p style="color:#888;font-size:12px;margin-top:24px;">
                This link and code will expire in <b>1 hour</b>.<br>
                If you didn't request this, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
              <p style="font-size: 11px; color: #aaa;">SmartHouseBuilder - Secure Home Automation</p>
            </body>
            </html>
            """.formatted(token, link);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Reset Your SmartHouse Password");
            helper.setText(html, true); // 'true' indicates HTML content
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send reset password email to " + to, e);
        }
    }
}
