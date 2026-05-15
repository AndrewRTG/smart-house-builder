package gr.A4.SmartHouseBuilder.exception;

/**
 * Thrown when a user tries to publish a copied setup whose devices and
 * description still match the original snapshot taken at copy time.
 *
 * Business rule: you cannot publish a verbatim copy. Modify the devices
 * or the description first so the community doesn't see duplicates.
 *
 * Mapped to 400 BAD_REQUEST by {@link GlobalExceptionHandler}.
 */
public class UnchangedCopyPublishException extends RuntimeException {
    public UnchangedCopyPublishException(String message) {
        super(message);
    }
}
