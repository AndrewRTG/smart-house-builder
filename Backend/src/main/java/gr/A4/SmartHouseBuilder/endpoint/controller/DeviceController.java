package gr.A4.SmartHouseBuilder.endpoint.controller;

import gr.A4.SmartHouseBuilder.endpoint.dto.DeviceRequest;
import gr.A4.SmartHouseBuilder.endpoint.dto.DeviceResponse;
import gr.A4.SmartHouseBuilder.endpoint.service.DeviceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/devices")
@Tag(name = "2. Devices", description = "API for managing Smart Home appliances")
public class DeviceController {
    private final DeviceService deviceService;

    @Operation(
            summary = "Retrieve all devices",
            description = "Returns all devices along with their category details and complete specifications."
    )
    @ApiResponse(responseCode = "200", description = "List retrieved successfully")
    @GetMapping
    public ResponseEntity<List<DeviceResponse>> getAllDevices (
            @RequestParam(required = false) List<Integer> categoryIds,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) List<String> protocols)
    {
        List<DeviceResponse> devices = deviceService.getFilteredDevices(categoryIds, brand, maxPrice, minPrice, protocols);
        return ResponseEntity.ok(devices);
    }
    @Operation(
            summary = "Add a new device",
            description = "Associates a device with an existing category. The 'specifications' field accepts any JSON structure depending on the appliance type."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Device successfully saved"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Specified category not found in the database"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping
    public ResponseEntity<DeviceResponse> createDevice (@Valid @RequestBody DeviceRequest request) {
        DeviceResponse response = deviceService.createDevice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @Operation(summary = "Get a 'Did you mean?' suggestion")
    @GetMapping("/suggest")
    public ResponseEntity<Map<String, String>> getSearchSuggestion(@RequestParam("q") String keyword) {
        String suggestion = deviceService.getSearchSuggestion(keyword);
        return ResponseEntity.ok(Map.of("suggestion", suggestion != null ? suggestion : ""));
    }
}
