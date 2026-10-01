package com.sliit.it3030.smartcampus.service;

import com.sliit.it3030.smartcampus.dto.review.ReviewRequest;
import com.sliit.it3030.smartcampus.dto.review.ReviewResponse;
import com.sliit.it3030.smartcampus.exception.ResourceNotFoundException;
import com.sliit.it3030.smartcampus.model.Review;
import com.sliit.it3030.smartcampus.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewResponse createReview(ReviewRequest request) {
        Review review = Review.builder()
                .name(sanitizeText(request.getName()))
                .role(sanitizeText(request.getRole(), "Student"))
                .rating(normalizeRating(request.getRating()))
                .message(sanitizeText(request.getMessage()))
                .approved(true)
                .createdAt(LocalDateTime.now())
                .build();

        Review saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    public List<ReviewResponse> getApprovedReviews() {
        return reviewRepository.findByApprovedTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ReviewResponse getReviewById(String id) {
        Review review = reviewRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", id));
        return mapToResponse(review);
    }

    public ReviewResponse updateReview(String id, ReviewRequest request) {
        Review review = reviewRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", id));

        review.setName(sanitizeText(request.getName()));
        review.setRole(sanitizeText(request.getRole(), "Student"));
        review.setRating(normalizeRating(request.getRating()));
        review.setMessage(sanitizeText(request.getMessage()));
        review.setUpdatedAt(LocalDateTime.now());

        Review updated = reviewRepository.save(review);
        return mapToResponse(updated);
    }

    public void deleteReview(String id) {
        Review review = reviewRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", id));

        review.setDeleted(true);
        review.setUpdatedAt(LocalDateTime.now());
        reviewRepository.save(review);
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .name(review.getName())
                .role(review.getRole())
                .rating(review.getRating())
                .message(review.getMessage())
                .approved(review.isApproved())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    private String sanitizeText(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private String sanitizeText(String value, String fallback) {
        String cleaned = sanitizeText(value);
        return cleaned.isEmpty() ? fallback : cleaned;
    }

    private int normalizeRating(Integer value) {
        if (value == null) {
            return 5;
        }

        if (value < 1) {
            return 1;
        }
        if (value > 5) {
            return 5;
        }
        return value;
    }
}
