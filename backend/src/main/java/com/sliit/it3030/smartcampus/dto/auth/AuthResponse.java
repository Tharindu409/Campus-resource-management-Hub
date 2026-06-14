package com.sliit.it3030.smartcampus.dto.auth;

import lombok.*;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String id;
    private String name;
    private String email;
    private String avatarUrl;
    private String githubUsername;
    private Set<String> roles;
}