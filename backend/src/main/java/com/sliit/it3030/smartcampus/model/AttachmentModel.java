package com.sliit.it3030.smartcampus.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentModel {
    @Id
    private String id;
    private String fileName;
    private String filePath;
    private String fileType;

    @Field("ticketId")
    private String ticketId;
}
