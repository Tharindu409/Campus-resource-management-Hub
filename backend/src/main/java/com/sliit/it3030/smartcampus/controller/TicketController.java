package com.sliit.it3030.smartcampus.controller;

import com.sliit.it3030.smartcampus.model.TicketModel;
import com.sliit.it3030.smartcampus.model.TicketStatus;
import com.sliit.it3030.smartcampus.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api/tickets")
public class TicketController {
    @Autowired
    private TicketService ticketService;

    //create
    @PostMapping
    public TicketModel createTicket(@RequestBody TicketModel ticket){
        return ticketService.createTicket(ticket);
    }

    @GetMapping("/{id}")
    public TicketModel getTicketById(@PathVariable String id) {
        return ticketService.getTicketById(id);
    }

    //get user ticket
    @GetMapping("/my")
    public List<TicketModel> getMyTickets(@RequestParam String createdBy){
        return ticketService.getMyTickets(createdBy);
    }
    //get all ticket
    @GetMapping
    public List<TicketModel> getAllTickets(){
        return ticketService.getAllTickets();
    }

    // Assign Technician (Admin)
    @PutMapping("/{id}/assign")
    public TicketModel assignTechnician(
            @PathVariable String id,
            @RequestParam String technician,
            @RequestParam(defaultValue = "STAFF") String actorRole
    ) {
        try {
            return ticketService.assignTechnician(id, technician, actorRole);
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    // Update Ticket Status (Technician)
    @PutMapping("/{id}/status")
    public TicketModel updateStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        try {
            TicketStatus status = TicketStatus.valueOf(payload.getOrDefault("status", "").trim().toUpperCase());
            String actorRole = payload.get("actorRole");
            String resolutionNotes = payload.get("resolutionNotes");
            String rejectionReason = payload.get("rejectionReason");

            return ticketService.updateStatus(id, status, actorRole, resolutionNotes, rejectionReason);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status update payload: " + ex.getMessage());
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public String deleteTicket(
            @PathVariable String id,
            @RequestParam(defaultValue = "USER") String actorRole
    ) {
        try {
            ticketService.deleteTicket(id, actorRole);
            return "Ticket deleted";
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }


}
