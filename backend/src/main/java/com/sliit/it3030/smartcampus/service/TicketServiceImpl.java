package com.sliit.it3030.smartcampus.service;

import com.sliit.it3030.smartcampus.exception.ResourceNotFoundException;
import com.sliit.it3030.smartcampus.model.TicketModel;
import com.sliit.it3030.smartcampus.model.TicketStatus;
import com.sliit.it3030.smartcampus.repository.TicketRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class TicketServiceImpl implements TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private NotificationService notificationService;

    private static final Map<TicketStatus, Set<TicketStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(TicketStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(TicketStatus.OPEN, Set.of(TicketStatus.IN_PROGRESS, TicketStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(TicketStatus.IN_PROGRESS, Set.of(TicketStatus.RESOLVED, TicketStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(TicketStatus.RESOLVED, Set.of(TicketStatus.CLOSED, TicketStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(TicketStatus.CLOSED, Set.of());
        ALLOWED_TRANSITIONS.put(TicketStatus.REJECTED, Set.of());
    }

    @Override
    public TicketModel createTicket(TicketModel ticket) {
        if (ticket.getId() == null || ticket.getId().isBlank()) {
            ticket.setId(UUID.randomUUID().toString());
        }
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setRejectionReason(null);
        ticket.setResolutionNotes(null);
        
        /*starting time */
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    @Override
    public TicketModel getTicketById(String id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
    }

    @Override
    public List<TicketModel> getMyTickets(String createdBy) {
        return ticketRepository.findByCreatedBy(createdBy);
    }

    @Override
    public List<TicketModel> getAllTickets() {
        return ticketRepository.findAll();
    }

    @Override
    public TicketModel assignTechnician(String id, String technician, String actorRole) {

        if (!isStaffOrAdmin(actorRole)) {
            throw new IllegalArgumentException("Only staff/admin can assign a technician");
        }

        if (technician == null || technician.isBlank()) {
            throw new IllegalArgumentException("Technician is required");
        }

        String technicianId = technician.trim();

        TicketModel ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ticket.setAssignedTechnician(technicianId);
        ticket.setUpdatedAt(LocalDateTime.now());
        
        if (ticket.getFirstRespondedAt() == null) {
            ticket.setFirstRespondedAt(LocalDateTime.now());
        }

        TicketModel saved = ticketRepository.save(ticket);
        notificationService.sendTicketAssignedNotification(technicianId, saved.getId());
        return saved;
    }

    @Override
    public TicketModel updateStatus(String id, TicketStatus status, String actorRole, String resolutionNotes, String rejectionReason) {

        if (!isStaffOrAdmin(actorRole)) {
            throw new IllegalArgumentException("Only staff/admin can update ticket status");
        }

        TicketModel ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        TicketStatus currentStatus = ticket.getStatus();
        if (currentStatus == null) {
            currentStatus = TicketStatus.OPEN;
        }

        boolean statusChanged = status != currentStatus;

        if (statusChanged) {
            Set<TicketStatus> allowedNext = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of());
            if (!allowedNext.contains(status)) {
                throw new IllegalStateException("Invalid status transition: " + currentStatus + " -> " + status);
            }
        }

        if (status == TicketStatus.REJECTED) {
            if (!isAdmin(actorRole)) {
                throw new IllegalArgumentException("Only admin can reject a ticket");
            }

            if (rejectionReason == null || rejectionReason.isBlank()) {
                throw new IllegalArgumentException("Rejection reason is required when status is REJECTED");
            }

            ticket.setRejectionReason(rejectionReason.trim());
        }

        if ((status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) && resolutionNotes != null && !resolutionNotes.isBlank()) {
            ticket.setResolutionNotes(resolutionNotes.trim());
        }

        if (status != TicketStatus.REJECTED) {
            ticket.setRejectionReason(null);
        }

        ticket.setStatus(status);
        ticket.setUpdatedAt(LocalDateTime.now());

        /*get first response */
        if (ticket.getFirstRespondedAt() == null && isStaffOrAdmin(actorRole)) {
            ticket.setFirstRespondedAt(LocalDateTime.now());
        }
        /*resolution time */
        if (status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED || status == TicketStatus.REJECTED) {
            if (ticket.getResolvedAt() == null) {
                ticket.setResolvedAt(LocalDateTime.now());
            }
        }

        TicketModel saved = ticketRepository.save(ticket);

        if (statusChanged && saved.getCreatedBy() != null && !saved.getCreatedBy().isBlank()) {
            notificationService.sendTicketStatusNotification(saved.getCreatedBy(), saved.getId(), status.name());
        }

        return saved;
    }

    @Override
    public void deleteTicket(String id, String actorRole) {
        if (!isAdmin(actorRole)) {
            throw new IllegalArgumentException("Only admin can delete a ticket");
        }

        TicketModel ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ticketRepository.delete(ticket);
    }

    private boolean isStaffOrAdmin(String role) {
        String normalized = normalizeRole(role);
        return "STAFF".equals(normalized) || "ADMIN".equals(normalized) || "TECHNICIAN".equals(normalized);
    }

    private boolean isAdmin(String role) {
        return "ADMIN".equals(normalizeRole(role));
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "";
        }

        return role.trim().toUpperCase(Locale.ROOT);
    }
}