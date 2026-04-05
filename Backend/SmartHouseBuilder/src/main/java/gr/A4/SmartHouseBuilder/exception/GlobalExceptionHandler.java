package gr.A4.SmartHouseBuilder.exception;


import gr.A4.SmartHouseBuilder.model.ValidationResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<List<ValidationResult>> handleValidationExceptions(MethodArgumentNotValidException ex) {

        List<ValidationResult> validationErrors = new ArrayList<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            String mesajEroare = error.getDefaultMessage();

            validationErrors.add(new ValidationResult(false, "ERROR", mesajEroare));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationErrors);
    }

}