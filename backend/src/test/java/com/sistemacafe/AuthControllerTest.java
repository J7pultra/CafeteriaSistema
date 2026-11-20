package com.sistemacafe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistemacafe.controller.AuthController;
import com.sistemacafe.dto.AuthResponseDto;
import com.sistemacafe.dto.LoginRequestDto;
import com.sistemacafe.dto.RefreshTokenRequestDto;
import com.sistemacafe.dto.RegisterRequestDto;
import com.sistemacafe.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
})
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    @DisplayName("POST /api/v1/auth/login - Debe responder 200 OK con tokens de autenticación")
    void shouldLoginSuccessfully() throws Exception {
        LoginRequestDto request = LoginRequestDto.builder()
                .usernameOrEmail("admin_cafe")
                .password("Secr3tP@ss")
                .build();

        AuthResponseDto response = AuthResponseDto.builder()
                .accessToken("mock.jwt.token")
                .refreshToken("mock.refresh.token")
                .tokenType("Bearer")
                .expiresInMs(86400000L)
                .username("admin_cafe")
                .email("admin@sistemacafe.com")
                .roles(List.of("ROLE_ADMIN"))
                .build();

        when(authService.login(any(LoginRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mock.jwt.token"))
                .andExpect(jsonPath("$.username").value("admin_cafe"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Debe responder 201 Created al registrar usuario")
    void shouldRegisterSuccessfully() throws Exception {
        RegisterRequestDto request = RegisterRequestDto.builder()
                .username("nuevo_barista")
                .email("barista@cafe.com")
                .password("Password123!")
                .build();

        AuthResponseDto response = AuthResponseDto.builder()
                .accessToken("mock.jwt.token")
                .refreshToken("mock.refresh.token")
                .tokenType("Bearer")
                .username("nuevo_barista")
                .email("barista@cafe.com")
                .roles(List.of("ROLE_CUSTOMER"))
                .build();

        when(authService.register(any(RegisterRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("nuevo_barista"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Debe rechazar 400 Bad Request si la contraseña es demasiado corta")
    void shouldRejectInvalidRegistration() throws Exception {
        RegisterRequestDto request = RegisterRequestDto.builder()
                .username("barista")
                .email("barista@cafe.com")
                .password("123") // Menos de 8 caracteres
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh - Debe renovar token con 200 OK")
    void shouldRefreshTokenSuccessfully() throws Exception {
        RefreshTokenRequestDto request = RefreshTokenRequestDto.builder()
                .refreshToken("valid.refresh.token")
                .build();

        AuthResponseDto response = AuthResponseDto.builder()
                .accessToken("new.access.token")
                .refreshToken("valid.refresh.token")
                .username("barista")
                .build();

        when(authService.refreshToken(any(RefreshTokenRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new.access.token"));
    }
}
