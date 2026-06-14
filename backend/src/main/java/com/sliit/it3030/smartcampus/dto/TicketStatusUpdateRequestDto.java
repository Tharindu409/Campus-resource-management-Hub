package com.sliit.it3030.smartcampus.dto;

import com.sliit.it3030.smartcampus.model.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketStatusUpdateRequestDto {

    private TicketStatus status;
    private String actorRole;
    private String resolutionNotes;
    private String rejectionReason;
}
