package com.sliit.it3030.smartcampus.dto;

import lombok.Data;

@Data
public class CancelRequest {
    private String userId;   // required for USER role check
    private String role;     // "USER" or "ADMIN"
}
