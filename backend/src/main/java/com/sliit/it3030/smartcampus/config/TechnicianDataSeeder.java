package com.sliit.it3030.smartcampus.config;

import com.sliit.it3030.smartcampus.model.User;
import com.sliit.it3030.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class TechnicianDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        seedTechnician("tech1@smartcampus.local", "Technician One", "wd23-tech-1");
        seedTechnician("tech2@smartcampus.local", "Technician Two", "wd23-tech-2");
    }

    private void seedTechnician(String email, String name, String username) {
        if (userRepository.existsByEmail(email)) {
            return;
        }

        User technician = User.builder()
                .id(username)
                .email(email)
                .name(name)
                .githubUsername(username)
                .roles(new HashSet<>(Set.of(User.ROLE_USER, User.ROLE_TECHNICIAN)))
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(technician);
        log.info("Seeded technician account: {} ({})", username, email);
    }
}
