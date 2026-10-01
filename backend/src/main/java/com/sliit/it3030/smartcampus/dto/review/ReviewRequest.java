package com.sliit.it3030.smartcampus.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String role = "Student";

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private int rating = 5;

    @NotBlank(message = "Review message is required")
    private String message;
}
