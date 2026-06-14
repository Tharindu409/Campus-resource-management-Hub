package com.sliit.it3030.smartcampus.repository;

import com.sliit.it3030.smartcampus.model.AttachmentModel;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AttachmentRepository extends MongoRepository<AttachmentModel, String> {

    // Get attachments by ticket id
    List<AttachmentModel> findByTicketId(String ticketId);

    long countByTicketId(String ticketId);

}
