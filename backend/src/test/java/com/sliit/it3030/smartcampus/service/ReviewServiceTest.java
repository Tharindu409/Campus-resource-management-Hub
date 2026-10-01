package com.sliit.it3030.smartcampus.service;

import com.sliit.it3030.smartcampus.dto.review.ReviewRequest;
import com.sliit.it3030.smartcampus.dto.review.ReviewResponse;
import com.sliit.it3030.smartcampus.model.Review;
import com.sliit.it3030.smartcampus.repository.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private ReviewService reviewService;

    @Test
    void shouldCreateReviewAndReturnResponse() {
        ReviewRequest request = new ReviewRequest();
        request.setName("Alice");
        request.setRole("Student");
        request.setRating(5);
        request.setMessage("Great platform!");

        Review savedReview = Review.builder()
                .id("rev-1")
                .name("Alice")
                .role("Student")
                .rating(5)
                .message("Great platform!")
                .approved(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);

        ReviewResponse result = reviewService.createReview(request);

        assertEquals("rev-1", result.getId());
        assertEquals("Alice", result.getName());
        assertEquals(5, result.getRating());
    }

    @Test
    void shouldReturnApprovedReviewsInNewestOrder() {
        Review review1 = Review.builder()
                .id("rev-1")
                .name("A")
                .role("Student")
                .rating(5)
                .message("Nice")
                .approved(true)
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        Review review2 = Review.builder()
                .id("rev-2")
                .name("B")
                .role("Lecturer")
                .rating(4)
                .message("Works well")
                .approved(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(reviewRepository.findByApprovedTrueOrderByCreatedAtDesc()).thenReturn(List.of(review1, review2));

        List<ReviewResponse> reviews = reviewService.getApprovedReviews();

        assertEquals(2, reviews.size());
        assertEquals("rev-1", reviews.get(0).getId());
    }
}
