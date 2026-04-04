package gr.A4.SmartHouseBuilder.exception;

public class EmailNotVerifiedException extends RuntimeException {

    public EmailNotVerifiedException(String email) {
        super("Email not verified: " + email + ". Please check your inbox.");
    }
}
