package com.sliit.it3030.smartcampus.dto;

import com.sliit.it3030.smartcampus.model.PriorityLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketCreateRequestDto {

    private String title;
    private String description;
    private String category;
    private String location;
    private String preferredContact;
    private String createdBy;
    private PriorityLevel priority;
}
