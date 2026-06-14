package com.sliit.it3030.smartcampus.controller;

import com.sliit.it3030.smartcampus.dto.auth.AuthResponse;
import com.sliit.it3030.smartcampus.dto.auth.LoginRequest;
import com.sliit.it3030.smartcampus.dto.auth.RegisterRequest;
import com.sliit.it3030.smartcampus.dto.auth.UserInfoDto;
import com.sliit.it3030.smartcampus.model.User;
import com.sliit.it3030.smartcampus.repository.UserRepository;
import com.sliit.it3030.smartcampus.security.JwtService;
import com.sliit.it3030.smartcampus.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * GET /api/auth/me
     * Returns current logged-in user info
     * Used by frontend after OAuth callback
     */
    @GetMapping("/me")
    public ResponseEntity<UserInfoDto> getCurrentUser(
            @AuthenticationPrincipal User currentUser) {

        UserInfoDto userInfo = authService.getCurrentUserInfo(currentUser.getId());
        return ResponseEntity.ok(userInfo);
    }

    /**
     * GET /api/auth/github
     * Redirect to GitHub OAuth
     * Spring Security handles this automatically
     * Just document this endpoint for frontend
     */
    @GetMapping("/github")
    public ResponseEntity<String> githubLogin() {
        return ResponseEntity.ok("Redirect to: /oauth2/authorization/github");
    }

    /**
     * POST /api/auth/login
     * Local email/password login for admin (development convenience)
        * Bootstrap credentials:
        * - admin@gmail.com / admin123
        * - nadeeshan@gmail.com / nadeeshan123
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Email and password are required");
        }

        String email = request.getEmail().toLowerCase(Locale.ROOT).trim();
        String password = request.getPassword();

        User user = userRepository.findByEmail(email).orElse(null);
        User bootstrapTemplate = getBootstrapUserTemplate(email, password);

        if (user == null) {
            if (bootstrapTemplate == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            user = userRepository.save(bootstrapTemplate);
        } else {
            // Validate password
            if (user.getPassword() == null) {
                if (bootstrapTemplate == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
                }

                user.setPassword(passwordEncoder.encode(password));
                if (user.getName() == null || user.getName().trim().isEmpty()) {
                    user.setName(bootstrapTemplate.getName());
                }
                if (user.getRoles() == null || user.getRoles().isEmpty()) {
                    user.setRoles(bootstrapTemplate.getRoles());
                }
                user.setUpdatedAt(LocalDateTime.now());
                user = userRepository.save(user);
            } else if (!passwordEncoder.matches(password, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRoles());
        AuthResponse resp = authService.buildAuthResponse(user, token);

        return ResponseEntity.ok(resp);
    }

    /**
     * POST /api/auth/register
     * Creates a local email/password account and returns auth token.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.getEmail().toLowerCase(Locale.ROOT).trim();

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        Set<String> roles = new HashSet<>(Set.of(User.ROLE_USER));
        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(roles)
                .provider("local")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRoles());
        AuthResponse response = authService.buildAuthResponse(user, token);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private User getBootstrapUserTemplate(String email, String password) {
        if ("admin@gmail.com".equalsIgnoreCase(email) && "admin123".equals(password)) {
            Set<String> roles = new HashSet<>();
            roles.add(User.ROLE_USER);
            roles.add(User.ROLE_ADMIN);

            return User.builder()
                    .email("admin@gmail.com")
                    .name("Admin")
                    .roles(roles)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .password(passwordEncoder.encode(password))
                    .build();
        }

        if ("nadeeshan@gmail.com".equalsIgnoreCase(email) && "nadeeshan123".equals(password)) {
            Set<String> roles = new HashSet<>();
            roles.add(User.ROLE_USER);

            return User.builder()
                    .email("nadeeshan@gmail.com")
                    .name("Nadeeshan")
                    .roles(roles)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .password(passwordEncoder.encode(password))
                    .build();
        }

        return null;
    }
}