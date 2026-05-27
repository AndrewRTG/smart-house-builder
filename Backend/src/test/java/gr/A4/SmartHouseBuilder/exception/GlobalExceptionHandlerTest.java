package gr.A4.SmartHouseBuilder.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void mapsDomainConflictsAndNotFoundToExpectedStatuses() {
        assertError(handler.handleResourceNotFound(new ResourceNotFoundException("missing")), HttpStatus.NOT_FOUND, "missing");
        assertError(handler.handleEmailConflict(new EmailAlreadyRegisteredException("email exists")), HttpStatus.CONFLICT, "email exists");
        assertError(handler.handleUsernameConflict(new UsernameAlreadyTakenException("username exists")), HttpStatus.CONFLICT, "username exists");
    }

    @Test
    void mapsAuthenticationModerationRateLimitAndRuntimeErrors() {
        assertError(handler.handleBadCredentials(new BadCredentialsException("bad")), HttpStatus.UNAUTHORIZED, "Email sau");
        assertError(handler.handleInappropriateContent(new InappropriateContentException("bad content")), HttpStatus.BAD_REQUEST, "bad content");
        assertError(handler.handleTooManyComments(new TooManyCommentsException("slow down")), HttpStatus.TOO_MANY_REQUESTS, "slow down");
        assertError(handler.handleRuntime(new RuntimeException("boom")), HttpStatus.INTERNAL_SERVER_ERROR, "boom");
    }

    @Test
    void mapsValidationErrorsByFieldName() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "request");
        bindingResult.addError(new FieldError("request", "email", "must be valid"));
        bindingResult.addError(new FieldError("request", "password", "must not be blank"));

        ResponseEntity<Map<String, Object>> response =
                handler.handleValidation(new MethodArgumentNotValidException(null, bindingResult));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).extractingByKey("error").asString().contains("Validare");
        assertThat(response.getBody()).extractingByKey("fields")
                .isEqualTo(Map.of("email", "must be valid", "password", "must not be blank"));
    }

    private void assertError(ResponseEntity<Map<String, String>> response, HttpStatus status, String messagePart) {
        assertThat(response.getStatusCode()).isEqualTo(status);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("error")).contains(messagePart);
    }
}
