package com.sliit.it3030.smartcampus.controller;

import com.sliit.it3030.smartcampus.model.AttachmentModel;
import com.sliit.it3030.smartcampus.service.AttachmentService;
import com.sliit.it3030.smartcampus.repository.AttachmentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin
public class AttachmentController {

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private AttachmentService attachmentService;

    @PostMapping("/{id}/attachments")
    public AttachmentModel uploadAttachment(@PathVariable String id,
                                   @RequestParam("file") MultipartFile file) throws IOException {
        try {
            return attachmentService.uploadAttachment(id, file);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @GetMapping("/{id}/attachments")
    public List<AttachmentModel> getAttachments(@PathVariable String id) {
        return attachmentRepository.findByTicketId(id);
    }
}