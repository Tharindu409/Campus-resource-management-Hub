package com.sliit.it3030.smartcampus.repository;

import com.sliit.it3030.smartcampus.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {

    // Get all non-deleted comments for a ticket
    List<Comment> findByTicketIdAndDeletedFalseOrderByCreatedAtAsc(String ticketId);

    // Count comments per ticket
    long countByTicketIdAndDeletedFalse(String ticketId);

    // Get comments by author
    List<Comment> findByAuthorIdAndDeletedFalse(String authorId);
}
