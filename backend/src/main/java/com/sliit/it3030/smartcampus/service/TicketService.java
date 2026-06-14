package com.sliit.it3030.smartcampus.service;

import com.sliit.it3030.smartcampus.model.TicketModel;
import com.sliit.it3030.smartcampus.model.TicketStatus;

import java.util.List;

public interface TicketService {

    TicketModel createTicket(TicketModel ticket);

    TicketModel getTicketById(String id);

    List<TicketModel> getMyTickets(String createdBy);

    List<TicketModel> getAllTickets();

    TicketModel assignTechnician(String id, String technician, String actorRole);

    TicketModel updateStatus(String id, TicketStatus status, String actorRole, String resolutionNotes, String rejectionReason);

    void deleteTicket(String id, String actorRole);

}
