package com.sliit.it3030.smartcampus.repository;

import com.sliit.it3030.smartcampus.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends MongoRepository<Review, String> {

    List<Review> findByApprovedTrueOrderByCreatedAtDesc();

    List<Review> findByDeletedFalseAndApprovedTrueOrderByCreatedAtDesc();

    List<Review> findByDeletedFalseOrderByCreatedAtDesc();

    Optional<Review> findByIdAndDeletedFalse(String id);
}
