package com.sistemacafe.controller;

import com.sistemacafe.dto.BaristaCreateRequestDto;
import com.sistemacafe.dto.StaffUserResponseDto;
import com.sistemacafe.service.UserManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Personal y Baristas", description = "Gestión exclusiva de cuentas de barista por el administrador")
public class UserController {

    private final UserManagementService userManagementService;

    @GetMapping("/baristas")
    @Operation(summary = "Listar baristas registrados", description = "Retorna todas las cuentas con rol ROLE_BARISTA")
    public ResponseEntity<List<StaffUserResponseDto>> listBaristas() {
        return ResponseEntity.ok(userManagementService.listBaristas());
    }

    @PostMapping("/baristas")
    @Operation(summary = "Registrar nuevo barista", description = "Crea una cuenta operativa con rol ROLE_BARISTA (solo Administrador)")
    public ResponseEntity<StaffUserResponseDto> createBarista(@Valid @RequestBody BaristaCreateRequestDto request) {
        return new ResponseEntity<>(userManagementService.createBarista(request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Activar o desactivar cuenta de barista", description = "Habilita o suspende el acceso de un barista registrado")
    public ResponseEntity<StaffUserResponseDto> updateBaristaStatus(
            @PathVariable Long id,
            @RequestParam boolean enabled) {
        return ResponseEntity.ok(userManagementService.updateUserStatus(id, enabled));
    }
}
