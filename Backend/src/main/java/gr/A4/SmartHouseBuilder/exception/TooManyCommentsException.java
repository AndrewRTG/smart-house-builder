package gr.A4.SmartHouseBuilder.exception;

public class TooManyCommentsException extends RuntimeException {
    public TooManyCommentsException(String message) {
        super(message);
    }
}