package com.sliit.it3030.smartcampus.controller;

import com.sliit.it3030.smartcampus.dto.comment.CommentRequest;
import com.sliit.it3030.smartcampus.dto.comment.CommentResponse;
import com.sliit.it3030.smartcampus.model.User;
import com.sliit.it3030.smartcampus.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * POST /api/tickets/{ticketId}/comments
     *  
     */
    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User currentUser) {

        CommentResponse response = commentService.addComment(ticketId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/tickets/{ticketId}/comments
     *  
     */
    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable String ticketId,
            @AuthenticationPrincipal User currentUser) {

        List<CommentResponse> comments =
                commentService.getCommentsByTicket(ticketId, currentUser.getId());
        return ResponseEntity.ok(comments);
    }

    /**
     * PUT /api/comments/{commentId}
     *  
     */
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable String commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User currentUser) {

        CommentResponse updated = commentService.updateComment(commentId, request, currentUser);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/comments/{commentId}
     * 
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String commentId,
            @AuthenticationPrincipal User currentUser) {

        commentService.deleteComment(commentId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
