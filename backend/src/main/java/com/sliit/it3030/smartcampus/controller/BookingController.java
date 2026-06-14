package com.sliit.it3030.smartcampus.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.sliit.it3030.smartcampus.dto.BookingRequest;
import com.sliit.it3030.smartcampus.dto.CancelRequest;
import com.sliit.it3030.smartcampus.dto.RejectRequest;
import com.sliit.it3030.smartcampus.entity.Booking;
import com.sliit.it3030.smartcampus.service.BookingService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // ──────────────────────────────────────────────
    // 1. POST /api/bookings — Create a new booking
    // ──────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingRequest request) {
        Booking booking = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    // ──────────────────────────────────────────────
    // 2. GET /api/bookings/my?userId=xxx — My bookings
    // ──────────────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings(@RequestParam String userId) {
        return ResponseEntity.ok(bookingService.getMyBookings(userId));
    }

    // ──────────────────────────────────────────────
    // 3. GET /api/bookings — All bookings (Admin)
    // ──────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // ──────────────────────────────────────────────
    // 4. PUT /api/bookings/{id}/approve — Approve
    // ──────────────────────────────────────────────
    @PutMapping("/{id}/approve")
    public ResponseEntity<Booking> approveBooking(@PathVariable String id) {
        try {
            Booking booking = bookingService.approveBooking(id);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            throw e;
        }
    }

    // ──────────────────────────────────────────────
    // 5. PUT /api/bookings/{id}/reject — Reject
    // ──────────────────────────────────────────────
    @PutMapping("/{id}/reject")
    public ResponseEntity<Booking> rejectBooking(
            @PathVariable String id,
            @RequestBody RejectRequest rejectRequest) {
        try {
            Booking booking = bookingService.rejectBooking(id, rejectRequest);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            throw e;
        }
    }

    // ──────────────────────────────────────────────
    // 6. PUT /api/bookings/{id}/cancel — Cancel
    // ──────────────────────────────────────────────
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(
            @PathVariable String id,
            @RequestBody CancelRequest cancelRequest) {
        try {
            Booking booking = bookingService.cancelBooking(id, cancelRequest);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            throw e;
        }
    }

    // ──────────────────────────────────────────────
    // 6b. PUT /api/bookings/{id}/cancel-delete — Cancel + Delete
    // ──────────────────────────────────────────────
    @PutMapping("/{id}/cancel-delete")
    public ResponseEntity<Void> cancelAndDeleteBooking(
            @PathVariable String id,
            @RequestBody CancelRequest cancelRequest) {
        bookingService.cancelAndDeleteBooking(id, cancelRequest);
        return ResponseEntity.noContent().build();
    }

    // ──────────────────────────────────────────────
    // 7. GET /api/bookings/resource/{resourceId} — Resource calendar
    // ──────────────────────────────────────────────
    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<List<Booking>> getBookingsByResource(@PathVariable String resourceId) {
        return ResponseEntity.ok(bookingService.getBookingsByResource(resourceId));
    }

    // ──────────────────────────────────────────────
    // BONUS: GET /api/bookings/stats — Admin dashboard stats
    // ──────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(bookingService.getStats());
    }

    // ──────────────────────────────────────────────
    // 8. DELETE /api/bookings/{id} — Permanently delete (Admin only)
    // ──────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteBooking(@PathVariable String id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
}
