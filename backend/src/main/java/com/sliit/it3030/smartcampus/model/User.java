package com.sliit.it3030.smartcampus.model;

import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String name;

    private String avatarUrl;

    // GitHub fields
    private String githubId;
    private String githubUsername;

    // ✅ Google fields
    private String googleId;

    // ✅ Which provider they used
    private String provider; // "github" or "google"

    @Builder.Default
    private Set<String> roles = new HashSet<>();

    @JsonIgnore
    private String password;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    // Role constants
    public static final String ROLE_USER = "ROLE_USER";
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_TECHNICIAN = "ROLE_TECHNICIAN";
    public static final String ROLE_STAFF = "ROLE_STAFF";
}