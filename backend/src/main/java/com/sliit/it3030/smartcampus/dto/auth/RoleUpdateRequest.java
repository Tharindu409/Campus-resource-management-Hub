package com.sliit.it3030.smartcampus.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleUpdateRequest {

    @NotBlank(message = "Role cannot be blank")
    private String role;  // "ROLE_USER", "ROLE_ADMIN", "ROLE_TECHNICIAN"

    @NotBlank(message = "Action cannot be blank")
    private String action; // "ADD" or "REMOVE"
}