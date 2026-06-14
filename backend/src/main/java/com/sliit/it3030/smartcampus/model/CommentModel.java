package com.sliit.it3030.smartcampus.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Document(collection = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentModel {
    @Id
    private String id;
    private String message;
    private String createdBy;
    private LocalDateTime createdAt;

    @Field("ticketId")
    private String ticketId;
}
