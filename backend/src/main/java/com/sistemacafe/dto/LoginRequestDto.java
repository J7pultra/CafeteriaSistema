package com.sistemacafe.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Credenciales para inicio de sesión en el sistema")
public class LoginRequestDto {

    @NotBlank(message = "El nombre de usuario o correo no puede estar vacío")
    @Schema(example = "admin_cafe", description = "Nombre de usuario o correo electrónico")
    @com.fasterxml.jackson.annotation.JsonAlias({"username", "email"})
    private String usernameOrEmail;

    @NotBlank(message = "La contraseña es obligatoria")
    @Schema(example = "SuperSecretPassword123!", description = "Contraseña en texto plano para autenticar")
    private String password;
}
