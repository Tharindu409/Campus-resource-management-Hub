package com.sliit.it3030.smartcampus.service;

import com.sliit.it3030.smartcampus.dto.notification.NotificationResponse;
import com.sliit.it3030.smartcampus.exception.ResourceNotFoundException;
import com.sliit.it3030.smartcampus.exception.UnauthorizedException;
import com.sliit.it3030.smartcampus.model.Notification;
import com.sliit.it3030.smartcampus.model.Notification.NotificationType;
import com.sliit.it3030.smartcampus.repository.NotificationRepository;
import com.sliit.it3030.smartcampus.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TicketRepository ticketRepository;

    // ========== QUERY METHODS ==========

    // Get all notifications for current user
    public List<NotificationResponse> getMyNotifications(String userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Get unread count
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    // Mark single notification as read
    public NotificationResponse markAsRead(String notificationId, String currentUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        // Only owner can mark as read
        if (!notification.getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("Access denied to this notification");
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    // Mark all as read for user
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository
                .findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        log.info("Marked {} notifications as read for user {}", unread.size(), userId);
    }

    // Delete a notification
    public void deleteNotification(String notificationId, String currentUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("Access denied to this notification");
        }

        notificationRepository.delete(notification);
        log.info("Notification {} deleted by user {}", notificationId, currentUserId);
    }

    // ========== TRIGGER METHODS (called by other services) ==========

    // Called when booking is approved
    public void sendBookingApprovedNotification(String userId, String bookingId) {
        createNotification(
                userId,
                "Booking Approved ✅",
                "Your booking has been approved.",
                NotificationType.BOOKING_APPROVED,
                bookingId
        );
    }

    // Called when booking is rejected
    public void sendBookingRejectedNotification(String userId, String bookingId) {
        createNotification(
                userId,
                "Booking Rejected ❌",
                "Your booking request was rejected.",
                NotificationType.BOOKING_REJECTED,
                bookingId
        );
    }

    // Called when ticket status changes
    public void sendTicketStatusNotification(String userId, String ticketId, String newStatus) {
        createNotification(
                userId,
                "Ticket Status Updated 🔄",
                "Your ticket status changed to: " + newStatus,
                NotificationType.TICKET_STATUS_CHANGED,
                ticketId
        );
    }

    // Called when technician is assigned
    public void sendTicketAssignedNotification(String technicianId, String ticketId) {
        createNotification(
                technicianId,
                "New Ticket Assigned 📋",
                "A new ticket has been assigned to you.",
                NotificationType.TICKET_ASSIGNED,
                ticketId
        );
    }

    // Called when a new comment is added
    public void sendNewCommentNotification(String ticketId, String commenterName, String commenterId) {
        ticketRepository.findById(ticketId).ifPresentOrElse(ticket -> {
            String ticketOwnerId = ticket.getCreatedBy();
            String assignedTechId = ticket.getAssignedTechnician();

            // Notify Ticket Owner
            if (ticketOwnerId != null && !ticketOwnerId.isBlank() && !ticketOwnerId.equals(commenterId)) {
                createNotification(
                        ticketOwnerId,
                        "New Comment 💬",
                        commenterName + " commented on your ticket.",
                        NotificationType.NEW_COMMENT,
                        ticketId
                );
            }

            // Notify Assigned Technician
            if (assignedTechId != null && !assignedTechId.isBlank() && !assignedTechId.equals(commenterId)) {
                createNotification(
                        assignedTechId,
                        "New Comment on Assigned Ticket 💬",
                        commenterName + " commented on a ticket assigned to you.",
                        NotificationType.NEW_COMMENT,
                        ticketId
                );
            }
        }, () -> log.warn("Skipping comment notification because ticket {} was not found", ticketId));
    }

    // Called by other services with full details
    public void createCommentNotification(String ticketOwnerId, String ticketId, String commenterName) {
        createNotification(
                ticketOwnerId,
                "New Comment 💬",
                commenterName + " commented on your ticket.",
                NotificationType.NEW_COMMENT,
                ticketId
        );
    }

    // ========== PRIVATE HELPER ==========

    private void createNotification(
            String userId, String title, String message,
            NotificationType type, String referenceId) {

        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .read(false)
                .build();

        notificationRepository.save(notification);
        log.info("Notification created for user {}: {}", userId, title);
    }

    // Map entity to DTO
    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .referenceId(notification.getReferenceId())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}