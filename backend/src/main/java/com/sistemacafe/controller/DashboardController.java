package com.sistemacafe.controller;

import com.sistemacafe.dto.DashboardMetricDto;
import com.sistemacafe.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Endpoints de analítica y métricas de negocio en tiempo real")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener métricas ejecutivas de negocio", description = "Retorna ingresos semanales, número de órdenes, nuevos clientes y alertas de inventario")
    public ResponseEntity<DashboardMetricDto> getDashboardMetrics() {
        return ResponseEntity.ok(dashboardService.getDashboardMetrics());
    }
}
