package com.sistemacafe.dto;

import com.sistemacafe.domain.enums.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
@Schema(description = "Datos para realizar checkout directo de visitante sin registro previo")
public class GuestCheckoutRequestDto {

    @NotBlank(message = "El nombre del cliente es obligatorio")
    @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
    @Schema(example = "Carlos Mendoza")
    private String fullName;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "Formato de correo electrónico no válido")
    @Schema(example = "carlos.mendoza@example.com")
    private String email;

    @Size(max = 25, message = "El teléfono no puede superar 25 caracteres")
    @Schema(example = "+57 300 123 4567")
    private String phone;

    @NotNull(message = "El método de pago es obligatorio")
    @Schema(example = "CREDIT_CARD")
    private PaymentMethod paymentMethod;

    @Size(max = 300, message = "Las notas no pueden superar 300 caracteres")
    @Schema(example = "Entregar en portería del edificio")
    private String notes;

    @NotEmpty(message = "La orden debe contener al menos un producto")
    @Valid
    private List<OrderItemRequestDto> items;
}
