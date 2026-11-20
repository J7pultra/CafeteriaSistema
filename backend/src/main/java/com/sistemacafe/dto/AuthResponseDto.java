package com.sistemacafe.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Respuesta de autenticación con tokens JWT y perfil de usuario")
public class AuthResponseDto {

    @Schema(example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", description = "Token JWT de acceso")
    private String accessToken;

    @Schema(example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", description = "Token JWT para renovación")
    private String refreshToken;

    @Builder.Default
    @Schema(example = "Bearer", description = "Esquema del token")
    private String tokenType = "Bearer";

    @Schema(example = "86400000", description = "Tiempo de validez en milisegundos")
    private long expiresInMs;

    @Schema(example = "carlos_barista")
    private String username;

    @Schema(example = "carlos.barista@sistemacafe.com")
    private String email;

    @Schema(example = "[\"ROLE_BARISTA\"]")
    private List<String> roles;
}
