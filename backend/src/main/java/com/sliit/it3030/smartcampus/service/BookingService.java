package com.sliit.it3030.smartcampus.service;

import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sliit.it3030.smartcampus.dto.BookingRequest;
import com.sliit.it3030.smartcampus.dto.CancelRequest;
import com.sliit.it3030.smartcampus.dto.RejectRequest;
import com.sliit.it3030.smartcampus.entity.Booking;
import com.sliit.it3030.smartcampus.entity.BookingStatus;
import com.sliit.it3030.smartcampus.exception.BookingConflictException;
import com.sliit.it3030.smartcampus.exception.InvalidStatusTransitionException;
import com.sliit.it3030.smartcampus.exception.UnauthorizedException;
import com.sliit.it3030.smartcampus.repository.BookingRepository;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    // =============================================================
    // POST /api/bookings — Create a new booking (USER)
    // =============================================================
    @Transactional
    public Booking createBooking(BookingRequest request) {
        validateTimeRange(request.getStartTime(), request.getEndTime());

        // Conflict detection algorithm: existing.start < newEnd AND existing.end > newStart
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                request.getResourceId(),
                request.getStartTime(),
                request.getEndTime(),
                null
        );

        if (!conflicts.isEmpty()) {
            log.warn("Booking conflict detected for resourceId={} from {} to {}",
                    request.getResourceId(), request.getStartTime(), request.getEndTime());
            throw new BookingConflictException(
                "This resource already has a booking request during the selected time slot. " +
                "Please choose a different time."
            );
        }

        Booking booking = Booking.builder()
                .resourceId(request.getResourceId())
                .resourceName(request.getResourceName())
                .userId(request.getUserId())
                .userName(request.getUserName())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .status(BookingStatus.PENDING)
            .createdAt(new java.util.Date())
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Created booking id={} for userId={} on resourceId={}", saved.getId(), saved.getUserId(), saved.getResourceId());
        return saved;
    }

    // =============================================================
    // GET /api/bookings/my?userId=x — User's own bookings
    // =============================================================
    public List<Booking> getMyBookings(String userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // =============================================================
    // GET /api/bookings — All bookings (ADMIN)
    // =============================================================
    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    // =============================================================
    // PUT /api/bookings/{id}/approve — Approve booking (ADMIN)
    // =============================================================
    @Transactional
    public Booking approveBooking(String id) {
        Booking booking = findById(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidStatusTransitionException(
                    "Only PENDING bookings can be approved. Current status: " + booking.getStatus()
            );
        }

        // Re-check conflicts at approval time (another booking may have been approved in between)
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            booking.getResourceId(),
            booking.getStartTime(),
            booking.getEndTime(),
            booking.getId()
        );

        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                    "Cannot approve: another active booking already exists for this time slot."
            );
        }

        booking.setStatus(BookingStatus.APPROVED);
        log.info("Booking id={} APPROVED", id);
        Booking saved = bookingRepository.save(booking);

        if (saved.getUserId() != null && !saved.getUserId().isBlank()) {
            notificationService.sendBookingApprovedNotification(saved.getUserId(), saved.getId());
        }

        return saved;
    }

    // =============================================================
    // PUT /api/bookings/{id}/reject — Reject booking (ADMIN)
    // =============================================================
    @Transactional
    public Booking rejectBooking(String id, RejectRequest rejectRequest) {
        Booking booking = findById(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidStatusTransitionException(
                    "Only PENDING bookings can be rejected. Current status: " + booking.getStatus()
            );
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(rejectRequest.getReason());
        log.info("Booking id={} REJECTED with reason: {}", id, rejectRequest.getReason());
        Booking saved = bookingRepository.save(booking);

        if (saved.getUserId() != null && !saved.getUserId().isBlank()) {
            notificationService.sendBookingRejectedNotification(saved.getUserId(), saved.getId());
        }

        return saved;
    }

    // =============================================================
    // PUT /api/bookings/{id}/cancel — Cancel booking (USER/ADMIN)
    // =============================================================
    @Transactional
    public Booking cancelBooking(String id, CancelRequest cancelRequest) {
        Booking booking = findById(id);

        // Security: USER can only cancel their own booking
        if ("USER".equalsIgnoreCase(cancelRequest.getRole())) {
            if (!booking.getUserId().equals(cancelRequest.getUserId())) {
                throw new UnauthorizedException("You can only cancel your own bookings.");
            }
            if (booking.getStatus() == BookingStatus.REJECTED || booking.getStatus() == BookingStatus.CANCELLED) {
                throw new InvalidStatusTransitionException(
                        "Cannot cancel a booking with status: " + booking.getStatus()
                );
            }
        }

        // ADMIN can cancel any booking that is not already CANCELLED
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new InvalidStatusTransitionException("Booking is already CANCELLED.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        log.info("Booking id={} CANCELLED by userId={} (role={})", id, cancelRequest.getUserId(), cancelRequest.getRole());
        return bookingRepository.save(booking);
    }

    // =============================================================
    // PUT /api/bookings/{id}/cancel-delete — Cancel and delete (USER/ADMIN)
    // =============================================================
    @Transactional
    public void cancelAndDeleteBooking(String id, CancelRequest cancelRequest) {
        Booking booking = findById(id);

        if ("USER".equalsIgnoreCase(cancelRequest.getRole())
                && !booking.getUserId().equals(cancelRequest.getUserId())) {
            throw new UnauthorizedException("You can only delete your own bookings.");
        }

        if (booking.getStatus() != BookingStatus.CANCELLED) {
            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
        }

        bookingRepository.deleteById(id);
        log.info("Booking id={} CANCELLED and DELETED by userId={} (role={})", id, cancelRequest.getUserId(), cancelRequest.getRole());
    }

    // =============================================================
    // GET /api/bookings/resource/{resourceId} — Resource calendar
    // =============================================================
    public List<Booking> getBookingsByResource(String resourceId) {
        return bookingRepository.findByResourceIdOrderByStartTimeAsc(resourceId);
    }

    // =============================================================
    // Stats for admin dashboard
    // =============================================================
    public Map<String, Long> getStats() {
        return Map.of(
                "PENDING", bookingRepository.countByStatus(BookingStatus.PENDING),
                "APPROVED", bookingRepository.countByStatus(BookingStatus.APPROVED),
                "REJECTED", bookingRepository.countByStatus(BookingStatus.REJECTED),
                "CANCELLED", bookingRepository.countByStatus(BookingStatus.CANCELLED),
                "TOTAL", bookingRepository.count()
        );
    }

    // =============================================================
    // DELETE /api/bookings/{id} — Delete booking (ADMIN)
    // =============================================================
    @Transactional
    public void deleteBooking(String id) {
        Booking booking = findById(id);
        bookingRepository.delete(booking);
        log.info("Booking id={} permanently DELETED", id);
    }

    // =============================================================
    // Helpers
    // =============================================================
    private Booking findById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Booking not found with id: " + id));
    }

    private void validateTimeRange(java.util.Date start, java.util.Date end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("Start time and end time are required.");
        }
        if (!start.before(end)) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }
        if (start.before(new java.util.Date())) {
            throw new IllegalArgumentException("Cannot create a booking in the past.");
        }
    }
}
