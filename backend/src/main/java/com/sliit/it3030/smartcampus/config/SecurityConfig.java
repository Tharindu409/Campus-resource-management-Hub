package com.sliit.it3030.smartcampus.config;

import com.sliit.it3030.smartcampus.security.CustomOAuth2UserService;
import com.sliit.it3030.smartcampus.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Disable CSRF because JWT is used
                .csrf(csrf -> csrf.disable())

                // Stateless authentication
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Exception handling
                .exceptionHandling(ex -> ex
                        .defaultAuthenticationEntryPointFor(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                                new AntPathRequestMatcher("/api/**")
                        )
                )

                // Authorization
                .authorizeHttpRequests(auth -> auth

                        // ==============================
                        // CORS PREFLIGHT
                        // ==============================
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ==============================
                        // AUTHENTICATION
                        // ==============================
                        .requestMatchers("/api/auth/github").permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/register").permitAll()

                        // Current logged-in user
                        .requestMatchers("/api/auth/me").authenticated()

                        // ==============================
                        // OAUTH2
                        // ==============================
                        .requestMatchers("/login/**").permitAll()
                        .requestMatchers("/oauth2/**").permitAll()

                        // ==============================
                        // UPLOADED FILES / IMAGES
                        // ==============================
                        .requestMatchers("/uploads/**").permitAll()

                        // ==============================
                        // RESOURCES
                        // ==============================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/resources/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/resources/**"
                        ).hasAuthority("ROLE_ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/resources/**"
                        ).hasAuthority("ROLE_ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/resources/**"
                        ).hasAuthority("ROLE_ADMIN")

                        // ==============================
                        // BOOKINGS
                        // ==============================
                        .requestMatchers(
                                "/api/bookings/**"
                        ).authenticated()

                        // ==============================
                        // TICKETS
                        // ==============================
                        .requestMatchers(
                                "/api/tickets/**"
                        ).authenticated()

                        // ==============================
                        // NOTIFICATIONS
                        // ==============================
                        .requestMatchers(
                                "/api/notifications/**"
                        ).authenticated()

                        // ==============================
                        // USERS
                        // ==============================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users"
                        ).hasAuthority("ROLE_ADMIN")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/users"
                        ).hasAuthority("ROLE_ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/*/role"
                        ).hasAuthority("ROLE_ADMIN")

                        // ==============================
                        // EVERYTHING ELSE
                        // ==============================
                        .anyRequest().authenticated()
                )

                // JWT Filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        // ==============================
        // OAUTH2 LOGIN
        // ==============================
        if (clientRegistrationRepositoryProvider.getIfAvailable() != null) {

            http.oauth2Login(oauth2 -> oauth2
                    .userInfoEndpoint(userInfo ->
                            userInfo.userService(customOAuth2UserService)
                    )
                    .successHandler(oAuth2LoginSuccessHandler)
            );
        }

        return http.build();
    }

    // =========================================================
    // CORS CONFIGURATION
    // =========================================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        /*
         * Local development
         * + Vercel production deployments
         */
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",

                // Main Vercel domain
                "https://campus-resource-management-hub.vercel.app",

                // Vercel deployment URLs
                "https://campus-resource-management-*.vercel.app"
        ));

        // Allowed HTTP methods
        config.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        // Allow all request headers
        config.setAllowedHeaders(List.of("*"));

        // Required if frontend sends credentials/JWT-related requests
        config.setAllowCredentials(true);

        // Cache preflight response
        config.setMaxAge(3600L);

        // Apply CORS configuration to every endpoint
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }

    // =========================================================
    // PASSWORD ENCODER
    // =========================================================
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}