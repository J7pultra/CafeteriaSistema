package com.sistemacafe.controller;

import com.sistemacafe.dto.CustomerRequestDto;
import com.sistemacafe.dto.CustomerResponseDto;
import com.sistemacafe.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Tag(name = "Clientes", description = "Endpoints para la gestión integral de clientes del sistema de café")
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA')")
    @Operation(summary = "Crear nuevo cliente", description = "Registra un nuevo cliente con nivel inicial BRONZE y validación de correo único")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Cliente creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Validación fallida en campos de entrada"),
            @ApiResponse(responseCode = "422", description = "Regla de negocio violada (correo ya existente)")
    })
    public ResponseEntity<CustomerResponseDto> createCustomer(@Valid @RequestBody CustomerRequestDto requestDto) {
        CustomerResponseDto created = customerService.createCustomer(requestDto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA', 'CUSTOMER')")
    @Operation(summary = "Obtener cliente por ID", description = "Retorna el perfil completo del cliente y su saldo de puntos de fidelidad")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cliente encontrado"),
            @ApiResponse(responseCode = "404", description = "Cliente no encontrado")
    })
    public ResponseEntity<CustomerResponseDto> getCustomerById(
            @Parameter(description = "ID del cliente", example = "1") @PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA', 'CUSTOMER')")
    @Operation(summary = "Obtener cliente por correo", description = "Busca un cliente por su dirección de email única")
    public ResponseEntity<CustomerResponseDto> getCustomerByEmail(
            @Parameter(description = "Email del cliente") @PathVariable String email) {
        return ResponseEntity.ok(customerService.getCustomerByEmail(email));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA')")
    @Operation(summary = "Listar clientes paginados", description = "Retorna una página de clientes activos")
    public ResponseEntity<Page<CustomerResponseDto>> getAllCustomers(
            @PageableDefault(size = 20, sort = "lastName", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(customerService.getAllCustomers(pageable));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA')")
    @Operation(summary = "Buscar clientes por coincidencia", description = "Filtra clientes por coincidencia en nombre, apellido o correo")
    public ResponseEntity<Page<CustomerResponseDto>> searchCustomers(
            @Parameter(description = "Término de búsqueda", example = "Valdez") @RequestParam String query,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(customerService.searchCustomers(query, pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA')")
    @Operation(summary = "Actualizar datos de cliente", description = "Modifica los datos personales y de contacto de un cliente existente")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cliente actualizado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada no válidos"),
            @ApiResponse(responseCode = "404", description = "Cliente no encontrado"),
            @ApiResponse(responseCode = "422", description = "Conflicto por email duplicado")
    })
    public ResponseEntity<CustomerResponseDto> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequestDto requestDto) {
        return ResponseEntity.ok(customerService.updateCustomer(id, requestDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desactivar cliente", description = "Desactiva lógicamente el cliente para preservar el historial de órdenes")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Cliente desactivado exitosamente"),
            @ApiResponse(responseCode = "404", description = "Cliente no encontrado")
    })
    public ResponseEntity<Void> deactivateCustomer(@PathVariable Long id) {
        customerService.deactivateCustomer(id);
        return ResponseEntity.noContent().build();
    }
}
