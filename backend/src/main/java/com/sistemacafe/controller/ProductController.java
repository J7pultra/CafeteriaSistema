package com.sistemacafe.controller;

import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.dto.ProductRequestDto;
import com.sistemacafe.dto.ProductResponseDto;
import com.sistemacafe.dto.ProductStockUpdateDto;
import com.sistemacafe.service.ProductService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Productos", description = "Endpoints para la gestión del catálogo de cafetería e inventario comercial")
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crear nuevo producto", description = "Registra un nuevo producto de cafetería (exclusivo para Administrador)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Producto creado con éxito"),
            @ApiResponse(responseCode = "400", description = "Validación de campos fallida"),
            @ApiResponse(responseCode = "422", description = "Conflicto por SKU duplicado")
    })
    public ResponseEntity<ProductResponseDto> createProduct(@Valid @RequestBody ProductRequestDto requestDto) {
        ProductResponseDto created = productService.createProduct(requestDto);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener producto por ID", description = "Retorna el detalle completo de un producto por su ID")
    public ResponseEntity<ProductResponseDto> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/sku/{sku}")
    @Operation(summary = "Obtener producto por SKU", description = "Busca un producto por su código SKU de inventario")
    public ResponseEntity<ProductResponseDto> getProductBySku(@PathVariable String sku) {
        return ResponseEntity.ok(productService.getProductBySku(sku));
    }

    @GetMapping
    @Operation(summary = "Listar catálogo de cafetería", description = "Consulta paginada del catálogo de cafetería con filtro opcional por categoría")
    public ResponseEntity<Page<ProductResponseDto>> getAllProducts(
            @RequestParam(required = false) ProductCategory category,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(productService.getAllProducts(category, pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar productos", description = "Búsqueda por nombre, SKU o descripción del producto")
    public ResponseEntity<Page<ProductResponseDto>> searchProducts(
            @RequestParam String query,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productService.searchProducts(query, pageable));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA')")
    @Operation(summary = "Productos con stock bajo", description = "Lista productos cuyo inventario está por debajo del umbral de alerta (default 10 unidades)")
    public ResponseEntity<List<ProductResponseDto>> getLowStockProducts(
            @Parameter(description = "Umbral opcional", example = "10") @RequestParam(required = false) Integer threshold) {
        return ResponseEntity.ok(productService.getLowStockProducts(threshold));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar información de producto", description = "Modifica características, precio, categoría y stock del producto (exclusivo Administrador)")
    public ResponseEntity<ProductResponseDto> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequestDto requestDto) {
        return ResponseEntity.ok(productService.updateProduct(id, requestDto));
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'BARISTA')")
    @Operation(summary = "Ajustar stock de producto", description = "Permite incrementar o reducir unidades de stock para reposición o mermas")
    public ResponseEntity<ProductResponseDto> updateStock(
            @PathVariable Long id,
            @Valid @RequestBody ProductStockUpdateDto stockUpdateDto) {
        return ResponseEntity.ok(productService.updateStock(id, stockUpdateDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desactivar producto", description = "Desactiva el producto del catálogo comercial (exclusivo Administrador)")
    public ResponseEntity<Void> deactivateProduct(@PathVariable Long id) {
        productService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }
}
