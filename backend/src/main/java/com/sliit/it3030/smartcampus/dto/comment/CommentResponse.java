package com.sliit.it3030.smartcampus.dto.comment;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private String id;
    private String ticketId;
    private String authorId;
    private String authorName;
    private String authorAvatar;
    private String content;
    private boolean edited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // whether the current user owns this comment
    private boolean isOwner;
}