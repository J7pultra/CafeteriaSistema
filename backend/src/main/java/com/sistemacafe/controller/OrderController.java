package com.sistemacafe.controller;

import com.sistemacafe.domain.enums.OrderStatus;
import com.sistemacafe.dto.OrderCreateRequestDto;
import com.sistemacafe.dto.OrderResponseDto;
import com.sistemacafe.dto.OrderStatusUpdateDto;
import com.sistemacafe.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Órdenes", description = "Endpoints para la creación transaccional, consulta y gestión de pedidos de café")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA', 'CUSTOMER')")
    @Operation(summary = "Checkout de compra para cuenta autenticada", description = "Procesa pedidos de usuarios autenticados y crea automáticamente su perfil de fidelización si es su primera compra")
    public ResponseEntity<OrderResponseDto> guestCheckout(@Valid @RequestBody com.sistemacafe.dto.GuestCheckoutRequestDto requestDto) {
        OrderResponseDto created = orderService.processGuestCheckout(requestDto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA', 'CUSTOMER')")
    @Operation(summary = "Crear nueva orden de compra", description = "Genera un pedido con descuento atómico de stock, cálculo de impuestos y puntos de fidelidad")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Orden creada exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de orden no válidos"),
            @ApiResponse(responseCode = "422", description = "Stock insuficiente o cliente/producto inactivo")
    })
    public ResponseEntity<OrderResponseDto> createOrder(@Valid @RequestBody OrderCreateRequestDto requestDto) {
        OrderResponseDto created = orderService.createOrder(requestDto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA', 'CUSTOMER')")
    @Operation(summary = "Obtener orden por ID", description = "Recupera la orden y el desglose de todos sus items")
    public ResponseEntity<OrderResponseDto> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/number/{orderNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA', 'CUSTOMER')")
    @Operation(summary = "Obtener orden por número de pedido", description = "Búsqueda por código de tracking único (ej. ORD-8F3A29B1)")
    public ResponseEntity<OrderResponseDto> getOrderByNumber(@PathVariable String orderNumber) {
        return ResponseEntity.ok(orderService.getOrderByOrderNumber(orderNumber));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA')")
    @Operation(summary = "Listar órdenes paginadas", description = "Consulta todas las órdenes con filtro opcional por estado")
    public ResponseEntity<Page<OrderResponseDto>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(orderService.getAllOrders(status, pageable));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA', 'CUSTOMER')")
    @Operation(summary = "Listar órdenes de un cliente", description = "Historial de pedidos efectuados por un cliente específico")
    public ResponseEntity<Page<OrderResponseDto>> getOrdersByCustomer(
            @PathVariable Long customerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId, pageable));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA')")
    @Operation(summary = "Actualizar estado de orden", description = "Modifica el ciclo de vida del pedido (PREPARING, SHIPPED, DELIVERED, etc.)")
    public ResponseEntity<OrderResponseDto> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateDto statusUpdateDto) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, statusUpdateDto.getStatus()));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA')")
    @Operation(summary = "Cancelar orden", description = "Cancela una orden activa y devuelve automáticamente el stock reservado al inventario")
    public ResponseEntity<OrderResponseDto> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }
}
