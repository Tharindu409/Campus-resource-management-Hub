package com.sliit.it3030.smartcampus.dto;

import com.sliit.it3030.smartcampus.model.PriorityLevel;
import com.sliit.it3030.smartcampus.model.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponseDto {

    private String id;
    private String title;
    private String description;
    private String category;
    private String location;
    private String preferredContact;
    private String createdBy;
    private String assignedTechnician;
    private String resolutionNotes;
    private String rejectionReason;
    private PriorityLevel priority;
    private TicketStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime firstRespondedAt;
    private LocalDateTime resolvedAt;
}
