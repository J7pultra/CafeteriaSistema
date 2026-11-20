package com.sistemacafe.controller;

import com.sistemacafe.dto.AuthResponseDto;
import com.sistemacafe.dto.LoginRequestDto;
import com.sistemacafe.dto.RefreshTokenRequestDto;
import com.sistemacafe.dto.RegisterRequestDto;
import com.sistemacafe.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints para registro, inicio de sesión y renovación de tokens JWT")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica credenciales de usuario y genera par de tokens (Access y Refresh JWT)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Autenticación exitosa"),
            @ApiResponse(responseCode = "400", description = "Petición inválida o formato incorrecto"),
            @ApiResponse(responseCode = "401", description = "Credenciales incorrectas")
    })
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto loginRequest) {
        return ResponseEntity.ok(authService.login(loginRequest));
    }

    @PostMapping("/register")
    @Operation(summary = "Registrar nuevo usuario", description = "Crea una nueva cuenta de usuario con contraseñas cifradas en BCrypt y asignación de roles")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Usuario registrado y autenticado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Error de validación de campos"),
            @ApiResponse(responseCode = "422", description = "Conflicto por nombre de usuario o correo existente")
    })
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto registerRequest) {
        return new ResponseEntity<>(authService.register(registerRequest), HttpStatus.CREATED);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar token de acceso", description = "Emite un nuevo Access Token a partir de un Refresh Token vigente")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Token renovado con éxito"),
            @ApiResponse(responseCode = "422", description = "Refresh token expirado o corrupto")
    })
    public ResponseEntity<AuthResponseDto> refreshToken(@Valid @RequestBody RefreshTokenRequestDto refreshRequest) {
        return ResponseEntity.ok(authService.refreshToken(refreshRequest));
    }
}
