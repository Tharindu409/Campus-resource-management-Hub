package com.sliit.it3030.smartcampus.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private String id;
    private String name;
    private String role;
    private int rating;
    private String message;
    private boolean approved;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
