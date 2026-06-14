package com.sliit.it3030.smartcampus.repository;

import com.sliit.it3030.smartcampus.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    // Get all notifications for a user (newest first)
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    // Get only unread notifications
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(String userId);

    // Count unread notifications
    long countByUserIdAndReadFalse(String userId);

    // Delete all for a user (when account deleted)
    void deleteByUserId(String userId);
}