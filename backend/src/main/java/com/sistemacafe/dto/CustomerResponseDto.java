package com.sistemacafe.dto;

import com.sistemacafe.domain.enums.CustomerTier;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Detalle completo de respuesta del cliente")
public class CustomerResponseDto {

    @Schema(example = "1")
    private Long id;

    @Schema(example = "Carlos")
    private String firstName;

    @Schema(example = "Valdez")
    private String lastName;

    @Schema(example = "Carlos Valdez")
    private String fullName;

    @Schema(example = "carlos.valdez@cafespecialty.com")
    private String email;

    @Schema(example = "+593998765432")
    private String phone;

    @Schema(example = "Av. Amazonas y Naciones Unidas, Quito")
    private String address;

    @Schema(example = "250")
    private Integer loyaltyPoints;

    @Schema(example = "SILVER")
    private CustomerTier tier;

    @Schema(example = "true")
    private boolean active;

    @Schema(example = "2026-11-16T10:00:00")
    private LocalDateTime createdAt;

    @Schema(example = "2026-11-16T10:00:00")
    private LocalDateTime updatedAt;
}
