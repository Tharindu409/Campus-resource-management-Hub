package com.sliit.it3030.smartcampus.dto.resource;

import com.sliit.it3030.smartcampus.model.ResourceStatus;
import com.sliit.it3030.smartcampus.model.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResourceCreateRequest {

    @NotBlank(message = "Resource name is required")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType type;

    @NotNull(message = "Capacity is required")
    @Min(value = 0, message = "Capacity cannot be negative")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    private String location;

    private String description;

    @NotNull(message = "Status is required")
    private ResourceStatus status;

    private String imageUrl;

    private String availableFrom;

    private String availableTo;
}