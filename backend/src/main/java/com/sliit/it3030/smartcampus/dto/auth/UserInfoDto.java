package com.sliit.it3030.smartcampus.dto.auth;

import lombok.*;
import java.util.Set;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoDto {
    private String id;
    private String name;
    private String email;
    private String avatarUrl;
    private String githubUsername;
    private String provider;
    private Set<String> roles;
    private boolean active;
    private LocalDateTime createdAt;
}