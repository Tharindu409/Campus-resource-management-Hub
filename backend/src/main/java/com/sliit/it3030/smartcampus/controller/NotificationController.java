package com.sliit.it3030.smartcampus.controller;

import com.sliit.it3030.smartcampus.dto.notification.NotificationResponse;
import com.sliit.it3030.smartcampus.model.User;
import com.sliit.it3030.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications/my
     * Get all notifications for logged-in user
     */
    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(
                notificationService.getMyNotifications(currentUser.getId())
        );
    }

    /**
     * GET /api/notifications/unread-count
     * Get count of unread notifications
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal User currentUser) {

        long count = notificationService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * PUT /api/notifications/{id}/read
     * Mark notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(
                notificationService.markAsRead(id, currentUser.getId())
        );
    }

    /**
     * PUT /api/notifications/read-all
     * Mark all notifications as read
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal User currentUser) {

        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * DELETE /api/notifications/{id}
     * Delete a notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser) {

        notificationService.deleteNotification(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}