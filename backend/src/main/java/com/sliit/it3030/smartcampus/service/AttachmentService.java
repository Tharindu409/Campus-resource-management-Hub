package com.sliit.it3030.smartcampus.service;

import com.sliit.it3030.smartcampus.exception.AttachmentLimitException;
import com.sliit.it3030.smartcampus.exception.FileUploadException;
import com.sliit.it3030.smartcampus.exception.ResourceNotFoundException;
import com.sliit.it3030.smartcampus.model.AttachmentModel;
import com.sliit.it3030.smartcampus.model.TicketModel;
import com.sliit.it3030.smartcampus.repository.AttachmentRepository;
import com.sliit.it3030.smartcampus.repository.TicketRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class AttachmentService {

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private TicketRepository ticketRepository;

    private static final Path UPLOAD_DIR = Paths.get(System.getProperty("user.dir"), "uploads");

    public AttachmentModel uploadAttachment(String ticketId, MultipartFile file) throws IOException {

        TicketModel ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if(file.isEmpty()){
            throw new FileUploadException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new FileUploadException("Only image attachments are allowed");
        }

        if(attachmentRepository.countByTicketId(ticketId) >= 3){
            throw new AttachmentLimitException("Maximum 3 attachments allowed");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || fileName.isBlank()) {
            throw new FileUploadException("Invalid file name");
        }

        Files.createDirectories(UPLOAD_DIR);
        Path destination = UPLOAD_DIR.resolve(fileName).normalize();
        file.transferTo(destination);
        String filePath = destination.toString();

        AttachmentModel attachment = new AttachmentModel();
        if (attachment.getId() == null || attachment.getId().isBlank()) {
            attachment.setId(UUID.randomUUID().toString());
        }
        attachment.setFileName(fileName);
        attachment.setFileType(contentType);
        attachment.setFilePath(filePath);
        attachment.setTicketId(ticket.getId());

        return attachmentRepository.save(attachment);
    }
}