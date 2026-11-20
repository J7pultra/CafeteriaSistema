package com.sistemacafe.dto;

import com.sistemacafe.domain.enums.RoleType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para registro de nuevo usuario en la plataforma")
public class RegisterRequestDto {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 50, message = "El nombre de usuario debe tener entre 3 y 50 caracteres")
    @Schema(example = "carlos_barista", description = "Nombre de usuario único")
    private String username;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato de correo no es válido")
    @Size(max = 100, message = "El correo no puede exceder 100 caracteres")
    @Schema(example = "carlos.barista@sistemacafe.com", description = "Correo institucional o de cliente")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 100, message = "La contraseña debe tener un mínimo de 8 caracteres")
    @Schema(example = "BaristaSecure2026!", description = "Contraseña de acceso")
    private String password;

    @Schema(description = "Roles solicitados para el usuario (Opcional, por defecto ROLE_CUSTOMER)")
    private Set<RoleType> roles;
}
