package com.sliit.it3030.smartcampus.repository;

import com.sliit.it3030.smartcampus.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGithubId(String githubId);

    // ✅ Add this for Google
    Optional<User> findByGoogleId(String googleId);

    boolean existsByEmail(String email);

    List<User> findByRolesContaining(String role);

    List<User> findByActiveTrue();
}