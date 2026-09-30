package com.sliit.it3030.smartcampus.service;

import com.sliit.it3030.smartcampus.dto.auth.CreateUserRequest;
import com.sliit.it3030.smartcampus.dto.auth.UserInfoDto;
import com.sliit.it3030.smartcampus.model.User;
import com.sliit.it3030.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthService authService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void shouldCreateUserWithSelectedRoles() {
        CreateUserRequest request = new CreateUserRequest();
        request.setName("New Tech");
        request.setEmail("newtech@example.com");
        request.setPassword("secret123");
        request.setRoles(Set.of(User.ROLE_TECHNICIAN));

        when(userRepository.existsByEmail("newtech@example.com")).thenReturn(false);
        when(authService.getPasswordEncoder()).thenReturn(passwordEncoder);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed-password");

        User savedUser = User.builder()
                .id("user-123")
                .name("New Tech")
                .email("newtech@example.com")
                .password("hashed-password")
                .roles(Set.of(User.ROLE_TECHNICIAN))
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserInfoDto dto = new UserInfoDto();
        dto.setId("user-123");
        dto.setName("New Tech");
        dto.setEmail("newtech@example.com");
        dto.setRoles(Set.of(User.ROLE_TECHNICIAN));
        when(authService.mapToUserInfoDto(savedUser)).thenReturn(dto);

        UserInfoDto result = userService.createUser(request);

        assertEquals("user-123", result.getId());
        assertEquals("newtech@example.com", result.getEmail());
        assertTrue(result.getRoles().contains(User.ROLE_TECHNICIAN));
    }
}
