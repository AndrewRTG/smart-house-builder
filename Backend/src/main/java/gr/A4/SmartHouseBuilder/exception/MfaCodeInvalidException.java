package gr.A4.SmartHouseBuilder.exception;

public class MfaCodeInvalidException extends RuntimeException {

    public MfaCodeInvalidException() {
        super("Invalid or expired MFA code.");
    }
}
