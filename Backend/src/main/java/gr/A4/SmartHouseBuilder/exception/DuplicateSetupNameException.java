package gr.A4.SmartHouseBuilder.exception;

/**
 * Thrown when the current user already has a setup with the same name.
 * Mapped to 409 CONFLICT by {@link GlobalExceptionHandler}.
 */
public class DuplicateSetupNameException extends RuntimeException {
    public DuplicateSetupNameException(String message) {
        super(message);
    }
}
