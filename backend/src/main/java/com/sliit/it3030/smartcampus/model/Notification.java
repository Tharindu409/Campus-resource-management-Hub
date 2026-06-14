package com.sliit.it3030.smartcampus.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;      // who receives it

    private String title;

    private String message;

    private NotificationType type;

    private String referenceId;  // bookingId or ticketId

    @Builder.Default
    private boolean read = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum NotificationType {
        BOOKING_APPROVED,
        BOOKING_REJECTED,
        TICKET_STATUS_CHANGED,
        TICKET_ASSIGNED,
        NEW_COMMENT
    }
}