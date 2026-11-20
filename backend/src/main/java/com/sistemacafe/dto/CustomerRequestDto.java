package com.sistemacafe.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
@Schema(description = "Datos para registrar o actualizar un cliente")
public class CustomerRequestDto {

    @NotBlank(message = "El nombre del cliente no puede estar vacío")
    @Size(min = 2, max = 60, message = "El nombre debe tener entre 2 y 60 caracteres")
    @Schema(example = "Carlos", description = "Nombre de pila del cliente")
    private String firstName;

    @NotBlank(message = "El apellido del cliente no puede estar vacío")
    @Size(min = 2, max = 60, message = "El apellido debe tener entre 2 y 60 caracteres")
    @Schema(example = "Valdez", description = "Apellido del cliente")
    private String lastName;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato de correo electrónico no es válido")
    @Size(max = 100, message = "El correo electrónico no puede superar los 100 caracteres")
    @Schema(example = "carlos.valdez@cafespecialty.com", description = "Email corporativo o personal único")
    private String email;

    @Size(max = 20, message = "El teléfono no puede superar los 20 caracteres")
    @Schema(example = "+593998765432", description = "Número de contacto telefónico")
    private String phone;

    @Size(max = 250, message = "La dirección no puede superar los 250 caracteres")
    @Schema(example = "Av. Amazonas y Naciones Unidas, Quito", description = "Dirección de entrega")
    private String address;
}
