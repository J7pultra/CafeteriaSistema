package com.sistemacafe;

import com.sistemacafe.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 3600000L); // 1 hr
        ReflectionTestUtils.setField(jwtService, "refreshExpirationMs", 7200000L); // 2 hrs

        userDetails = new User(
                "barista_test",
                "password123",
                List.of(new SimpleGrantedAuthority("ROLE_BARISTA"))
        );
    }

    @Test
    @DisplayName("Debe generar token JWT válido y extraer el username correctamente")
    void shouldGenerateAndExtractUsername() {
        String token = jwtService.generateToken(userDetails);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("barista_test");
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    @DisplayName("Debe extraer las autoridades (roles) contenidas en los claims del token")
    @SuppressWarnings("unchecked")
    void shouldExtractRolesFromClaims() {
        String token = jwtService.generateToken(userDetails);

        List<String> roles = (List<String>) jwtService.extractAllClaims(token).get("roles");
        assertThat(roles).contains("ROLE_BARISTA");
    }

    @Test
    @DisplayName("Debe generar refresh token válido")
    void shouldGenerateValidRefreshToken() {
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        assertThat(refreshToken).isNotBlank();
        assertThat(jwtService.validateToken(refreshToken)).isTrue();
        assertThat(jwtService.extractUsername(refreshToken)).isEqualTo("barista_test");
    }

    @Test
    @DisplayName("Debe rechazar token alterado o corrupto")
    void shouldRejectTamperedToken() {
        String token = jwtService.generateToken(userDetails);
        String tamperedToken = token + "xyz123";

        assertThat(jwtService.validateToken(tamperedToken)).isFalse();
    }
}
