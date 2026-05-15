package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.CategoryResponse;
import gr.A4.SmartHouseBuilder.service.CategoryService;
import gr.A4.SmartHouseBuilder.dto.CategoryRequest;
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

@RestController
@RequestMapping("api/categories")
@RequiredArgsConstructor
@Tag(name = "1. Categories", description = "API for managing Smart Home device categories")
public class CategoryController {
    private final CategoryService categoryService;

    @Operation(
            summary = "Retrieve all categories",
            description = "Use this endpoint on the Front-end to populate the drop-down menu when creating a new device."
    )
    @ApiResponse(responseCode = "200", description = "List retrieved successfully")
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(){
        List<CategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
    @Operation(
            summary = "Add a new category",
            description = "This endpoint receives a name and description and creates the category in the database. The ID is auto-generated."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Category successfully created"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory (@Valid @RequestBody CategoryRequest request){
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
