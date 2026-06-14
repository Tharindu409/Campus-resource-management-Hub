package com.sliit.it3030.smartcampus.security;

public class AuthContext {

    private final String userId;
    private final String role;

    public AuthContext(String userId, String role) {
        this.userId = userId;
        this.role = role;
    }

    public String getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }
}
