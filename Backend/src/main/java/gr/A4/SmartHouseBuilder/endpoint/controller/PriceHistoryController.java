package gr.A4.SmartHouseBuilder.endpoint.controller;

import gr.A4.SmartHouseBuilder.endpoint.dto.PriceHistoryRequest;
import gr.A4.SmartHouseBuilder.endpoint.dto.PriceHistoryResponse;
import gr.A4.SmartHouseBuilder.endpoint.service.PriceHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prices")
@RequiredArgsConstructor
@Tag(name = "3. Price History", description = "API for recording price evolution")
public class PriceHistoryController {
    private final PriceHistoryService priceHistoryService;

    @Operation(
            summary = "Record a new scraped price",
            description = "Adds a new entry with the current price of a device. WARNING: The date (scrapedAt) must be sent in 'YYYY-MM-DDTHH:MM:SS' format."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Price successfully recorded"),
            @ApiResponse(responseCode = "404", description = "Specified device (deviceId) not found in the database"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping
    public ResponseEntity<PriceHistoryResponse> addPrice (@Valid @RequestBody PriceHistoryRequest request){
        PriceHistoryResponse response = priceHistoryService.addPrice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
