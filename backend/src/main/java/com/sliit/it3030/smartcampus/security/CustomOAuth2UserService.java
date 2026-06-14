package com.sliit.it3030.smartcampus.security;

import com.sliit.it3030.smartcampus.model.User;
import com.sliit.it3030.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Value("${app.admin.emails:}")
    private String adminEmails;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {

        OAuth2User oAuth2User = super.loadUser(userRequest);

        // ✅ Detect provider
        String provider = userRequest
                .getClientRegistration()
                .getRegistrationId(); // "github" or "google"

        log.info("OAuth2 login via provider: {}", provider);

        // ✅ Route to correct handler
        if ("google".equals(provider)) {
            return processGoogleUser(oAuth2User);
        } else {
            return processGithubUser(oAuth2User);
        }
    }

    // ========== GITHUB ==========
    private OAuth2User processGithubUser(OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String githubId       = String.valueOf(attributes.get("id"));
        String githubUsername = (String) attributes.get("login");
        String avatarUrl      = (String) attributes.get("avatar_url");

        Object nameObj = attributes.get("name");
        String name = (nameObj != null && !nameObj.toString().trim().isEmpty())
                ? nameObj.toString()
                : githubUsername;

        Object emailObj = attributes.get("email");
        String email = (emailObj != null && !emailObj.toString().trim().isEmpty())
                ? emailObj.toString()
                : githubUsername + "@github.com";

        log.info("GitHub OAuth login: username={}, email={}", githubUsername, email);

        // Build admin emails set
        Set<String> configuredAdmins = buildAdminSet();

        // Find existing user
        User user = userRepository.findByGithubId(githubId)
                .orElseGet(() -> userRepository.findByEmail(email).orElse(null));

        if (user == null) {
            Set<String> roles = new HashSet<>();
            roles.add(User.ROLE_USER);
            if (configuredAdmins.contains(email.toLowerCase())) {
                roles.add(User.ROLE_ADMIN);
                log.info("Assigning admin role to user: {}", email);
            }

            user = User.builder()
                    .githubId(githubId)
                    .githubUsername(githubUsername)
                    .name(name)
                    .email(email)
                    .avatarUrl(avatarUrl)
                    .provider("github")
                    .roles(roles)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            log.info("New user registered via GitHub: {}", email);
        } else {
            user.setGithubId(githubId);
            user.setGithubUsername(githubUsername);
            user.setName(name);
            user.setAvatarUrl(avatarUrl);
            user.setProvider("github");
            user.setUpdatedAt(LocalDateTime.now());

            if (!user.getRoles().contains(User.ROLE_ADMIN)
                    && configuredAdmins.contains(email.toLowerCase())) {
                user.getRoles().add(User.ROLE_ADMIN);
                log.info("Upgrading existing user to admin: {}", email);
            }

            log.info("Existing user logged in via GitHub: {}", email);
        }

        userRepository.save(user);
        return oAuth2User;
    }

    // ========== GOOGLE ==========
    private OAuth2User processGoogleUser(OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // Google uses "sub" as the unique ID
        String googleId  = (String) attributes.get("sub");
        String email     = (String) attributes.get("email");
        String name      = (String) attributes.get("name");
        String avatarUrl = (String) attributes.get("picture");

        log.info("Google OAuth login: email={}", email);

        // Build admin emails set
        Set<String> configuredAdmins = buildAdminSet();

        // Find existing user
        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.findByEmail(email).orElse(null));

        if (user == null) {
            Set<String> roles = new HashSet<>();
            roles.add(User.ROLE_USER);
            if (configuredAdmins.contains(email.toLowerCase())) {
                roles.add(User.ROLE_ADMIN);
                log.info("Assigning admin role to Google user: {}", email);
            }

            user = User.builder()
                    .googleId(googleId)
                    .name(name)
                    .email(email)
                    .avatarUrl(avatarUrl)
                    .provider("google")
                    .roles(roles)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            log.info("New user registered via Google: {}", email);
        } else {
            user.setGoogleId(googleId);
            user.setName(name);
            user.setAvatarUrl(avatarUrl);
            user.setProvider("google");
            user.setUpdatedAt(LocalDateTime.now());

            if (!user.getRoles().contains(User.ROLE_ADMIN)
                    && configuredAdmins.contains(email.toLowerCase())) {
                user.getRoles().add(User.ROLE_ADMIN);
                log.info("Upgrading existing Google user to admin: {}", email);
            }

            log.info("Existing user logged in via Google: {}", email);
        }

        userRepository.save(user);
        return oAuth2User;
    }

    // ========== HELPER ==========
    private Set<String> buildAdminSet() {
        return Arrays.stream(
                adminEmails == null ? new String[0] : adminEmails.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }
}