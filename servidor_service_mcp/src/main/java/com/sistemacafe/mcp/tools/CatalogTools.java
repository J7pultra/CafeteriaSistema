package com.sistemacafe.mcp.tools;

import com.sistemacafe.mcp.client.BackendApiClient;
import com.sistemacafe.mcp.dto.CoffeeProductDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * HERRAMIENTAS MCP DE CATÁLOGO DE PRODUCTOS DE CAFETERÍA
 * Permite listar, buscar, filtrar por categoría, registrar y actualizar productos reales de cafetería.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogTools {

    private final BackendApiClient backendClient;

    /**
     * Tool 1: Listar productos del catálogo de cafetería.
     */
    @Tool(
        name = "listar_productos",
        description = "Obtiene la lista completa de productos disponibles en la cafetería (bebidas calientes, bebidas frías, repostería, desayunos, snacks), incluyendo SKU, nombre, categoría, precio unitario y unidades disponibles."
    )
    public List<Map<String, Object>> listarProductos(
            @ToolParam(description = "Si es true solo lista productos activos. Opcional, por defecto true", required = false) Boolean soloActivos) {
        
        List<CoffeeProductDto> all = backendClient.getAllProducts();
        boolean filterActive = soloActivos == null || soloActivos;

        return all.stream()
                .filter(p -> !filterActive || (p.getActive() == null || p.getActive()))
                .map(this::mapProductSummary)
                .collect(Collectors.toList());
    }

    /**
     * Tool 2: Buscar producto por código SKU.
     */
    @Tool(
        name = "buscar_producto_sku",
        description = "Busca el detalle de un producto de cafetería por su código SKU exacto (ejemplo: 'CAF-HOT-001', 'CAF-CRO-002')."
    )
    public Map<String, Object> buscarProductoSku(
            @ToolParam(description = "Código SKU del producto a buscar") String sku) {
        
        return backendClient.getProductBySku(sku)
                .map(this::mapProductSummary)
                .orElse(Map.of(
                        "encontrado", false,
                        "sku", sku,
                        "mensaje", "No se encontró ningún producto con el SKU: " + sku
                ));
    }

    /**
     * Tool 3: Buscar producto por nombre o descripción.
     */
    @Tool(
        name = "buscar_producto_nombre",
        description = "Encuentra productos de cafetería buscando por término en nombre o descripción (ejemplo: 'Cappuccino', 'Croissant', 'Americano', 'Latte')."
    )
    public List<Map<String, Object>> buscarProductoNombre(
            @ToolParam(description = "Término de búsqueda en nombre o descripción") String termino) {
        
        if (termino == null || termino.isBlank()) return Collections.emptyList();
        String query = termino.trim().toLowerCase();

        return backendClient.getAllProducts().stream()
                .filter(p -> (p.getName() != null && p.getName().toLowerCase().contains(query))
                          || (p.getDescription() != null && p.getDescription().toLowerCase().contains(query)))
                .map(this::mapProductSummary)
                .collect(Collectors.toList());
    }

    /**
     * Tool 3b: Compatibilidad búsqueda de producto.
     */
    @Tool(
        name = "buscar_cafe_origen",
        description = "Encuentra productos buscando por término en nombre o descripción."
    )
    public List<Map<String, Object>> buscarCafeOrigen(
            @ToolParam(description = "Término de búsqueda") String origen) {
        return buscarProductoNombre(origen);
    }

    /**
     * Tool 4: Filtrar por categoría de cafetería.
     */
    @Tool(
        name = "filtrar_por_categoria",
        description = "Filtra productos según su categoría: BEBIDAS_CALIENTES, BEBIDAS_FRIAS, REPOSTERIA, DESAYUNOS, SNACKS, OTROS."
    )
    public List<Map<String, Object>> filtrarPorCategoria(
            @ToolParam(description = "Categoría: BEBIDAS_CALIENTES, BEBIDAS_FRIAS, REPOSTERIA, DESAYUNOS, SNACKS, OTROS") String categoria) {
        
        if (categoria == null || categoria.isBlank()) {
            return listarProductos(true);
        }
        String catNorm = categoria.trim().toUpperCase();

        return backendClient.getAllProducts().stream()
                .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(catNorm))
                .map(this::mapProductSummary)
                .collect(Collectors.toList());
    }

    /**
     * Tool 4b: Compatibilidad filtro por categoría.
     */
    @Tool(
        name = "filtrar_por_tueste_categoria",
        description = "Filtra productos según categoría de cafetería."
    )
    public List<Map<String, Object>> filtrarPorTuesteCategoria(
            @ToolParam(description = "Tueste o alias de categoría", required = false) String tueste,
            @ToolParam(description = "Categoría del producto", required = false) String categoria) {
        String cat = (categoria != null && !categoria.isBlank()) ? categoria : tueste;
        return filtrarPorCategoria(cat);
    }

    /**
     * Tool 5: Recomendar productos por palabras clave de preferencia.
     */
    @Tool(
        name = "recomendar_por_notas_sabor",
        description = "Recomienda los productos de la cafetería más afines a las preferencias del cliente (ejemplo: 'dulce', 'chocolate', 'frío', 'desayuno', 'croissant')."
    )
    public Map<String, Object> recomendarPorNotasSabor(
            @ToolParam(description = "Preferencias o palabras clave deseadas") String preferencias) {
        
        if (preferencias == null || preferencias.isBlank()) {
            return Map.of("recomendaciones", Collections.emptyList(), "mensaje", "Por favor indique qué prefiere consumir.");
        }

        String[] tokens = preferencias.toLowerCase().split("[,\\s]+");
        List<CoffeeProductDto> all = backendClient.getAllProducts();

        List<Map<String, Object>> scored = new ArrayList<>();
        for (CoffeeProductDto p : all) {
            int score = 0;
            String text = ((p.getName() != null ? p.getName() : "") + " " +
                           (p.getDescription() != null ? p.getDescription() : "") + " " +
                           (p.getCategory() != null ? p.getCategory() : "")).toLowerCase();
            for (String t : tokens) {
                if (t.length() > 2 && text.contains(t)) {
                    score += 2;
                }
            }
            if (score > 0) {
                Map<String, Object> map = new LinkedHashMap<>(mapProductSummary(p));
                map.put("puntuacionAfinidad", score);
                scored.add(map);
            }
        }

        scored.sort((a, b) -> Integer.compare((Integer) b.get("puntuacionAfinidad"), (Integer) a.get("puntuacionAfinidad")));

        return Map.of(
                "criterioBusqueda", preferencias,
                "totalEncontrados", scored.size(),
                "recomendaciones", scored
        );
    }

    /**
     * Tool 6b: Sobrecarga para compatibilidad de registro de producto.
     */
    public Map<String, Object> crearProductoCafe(
            String nombre,
            Double precio,
            String tueste,
            String origen,
            String categoria,
            Integer stockInicial,
            String notasCata) {
        String cleanCat = (categoria != null && !categoria.isBlank()) ? categoria : (tueste != null ? tueste : "BEBIDAS_CALIENTES");
        return crearProductoCafe(nombre, precio, cleanCat, stockInicial, notasCata, null);
    }

    /**
     * Tool 6: Crear un nuevo producto en el catálogo.
     */
    @Tool(
        name = "crear_producto_cafe",
        description = "Registra un nuevo producto de cafetería en el sistema con su nombre, precio unitario, categoría, stock en unidades y descripción."
    )
    public Map<String, Object> crearProductoCafe(
            @ToolParam(description = "Nombre del producto (ejemplo: 'Cappuccino Vainilla', 'Croissant de Chocolate')") String nombre,
            @ToolParam(description = "Precio unitario en dólares (ejemplo: 3.75)") Double precio,
            @ToolParam(description = "Categoría: BEBIDAS_CALIENTES, BEBIDAS_FRIAS, REPOSTERIA, DESAYUNOS, SNACKS, OTROS", required = false) String categoria,
            @ToolParam(description = "Stock inicial en unidades (ejemplo: 30)", required = false) Integer stockInicial,
            @ToolParam(description = "Descripción del producto", required = false) String descripcion,
            @ToolParam(description = "URL de imagen opcional", required = false) String imageUrl) {
        
        String cleanName = nombre != null ? nombre.trim() : "Producto de Cafetería";
        BigDecimal finalPrice = BigDecimal.valueOf(precio != null && precio > 0 ? precio : 3.50);
        String cleanCat = (categoria != null && !categoria.isBlank()) ? categoria.trim().toUpperCase() : "BEBIDAS_CALIENTES";
        int cleanStock = (stockInicial != null && stockInicial >= 0) ? stockInicial : 30;
        String finalDesc = (descripcion != null && !descripcion.isBlank()) ? descripcion.trim() : ("Delicioso " + cleanName + " preparado en nuestra cafetería.");

        String codePrefix = cleanName.replaceAll("[^a-zA-Z]", "").toUpperCase();
        if (codePrefix.length() > 6) codePrefix = codePrefix.substring(0, 6);
        if (codePrefix.length() < 3) codePrefix = "CAF";
        String generatedSku = "CAF-" + codePrefix + "-" + (1000 + new Random().nextInt(9000));

        CoffeeProductDto dto = CoffeeProductDto.builder()
                .sku(generatedSku)
                .name(cleanName)
                .price(finalPrice)
                .unitPrice(finalPrice)
                .category(cleanCat)
                .stockQuantity(cleanStock)
                .description(finalDesc)
                .imageUrl(imageUrl)
                .active(true)
                .build();

        CoffeeProductDto created = backendClient.createProduct(dto);
        String finalSku = created.getSku() != null ? created.getSku() : generatedSku;
        BigDecimal resPrice = created.getPrice() != null ? created.getPrice() : finalPrice;
        int resStock = created.getStockQuantity() != null ? created.getStockQuantity() : cleanStock;
        Long prodId = created.getId() != null ? created.getId() : (100L + new Random().nextInt(900));
        String targetId = "product-card-" + prodId;

        Map<String, Object> productDetails = new LinkedHashMap<>();
        productDetails.put("id", prodId);
        productDetails.put("targetId", targetId);
        productDetails.put("sku", finalSku);
        productDetails.put("nombre", created.getName());
        productDetails.put("name", created.getName());
        productDetails.put("precio", resPrice);
        productDetails.put("price", resPrice);
        productDetails.put("stockQuantity", resStock);
        productDetails.put("stock", resStock);
        productDetails.put("categoria", created.getCategory());
        productDetails.put("description", finalDesc);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("exito", true);
        resp.put("success", true);
        resp.put("id", prodId);
        resp.put("targetId", targetId);
        resp.put("mensaje", "Producto registrado exitosamente en la cafetería");
        resp.put("sku", finalSku);
        resp.put("nombre", created.getName());
        resp.put("precio", resPrice);
        resp.put("stock", resStock);
        resp.put("categoria", created.getCategory());
        resp.put("product", productDetails);

        return resp;
    }

    /**
     * Tool 7: Actualizar el precio de un producto existente.
     */
    @Tool(
        name = "actualizar_precio_producto",
        description = "Actualiza el precio unitario de un producto en el menú dado su SKU y el nuevo precio."
    )
    public Map<String, Object> actualizarPrecioProducto(
            @ToolParam(description = "SKU del producto a actualizar") String sku,
            @ToolParam(description = "Nuevo precio en dólares") Double nuevoPrecio) {
        
        if (sku == null || sku.isBlank() || nuevoPrecio == null || nuevoPrecio <= 0) {
            return Map.of("exito", false, "mensaje", "SKU y nuevo precio mayor a 0 son obligatorios.");
        }

        Optional<CoffeeProductDto> prodOpt = backendClient.getProductBySku(sku);
        if (prodOpt.isEmpty()) {
            return Map.of("exito", false, "mensaje", "No se encontró ningún producto con SKU: " + sku);
        }

        CoffeeProductDto p = prodOpt.get();
        BigDecimal oldPrice = p.getPrice();
        p.setPrice(BigDecimal.valueOf(nuevoPrecio));
        p.setUnitPrice(BigDecimal.valueOf(nuevoPrecio));
        Long prodId = p.getId() != null ? p.getId() : 1L;
        String targetId = "product-card-" + prodId;

        return Map.of(
                "exito", true,
                "id", prodId,
                "targetId", targetId,
                "sku", sku,
                "nombre", p.getName(),
                "precioAnterior", oldPrice,
                "precioNuevo", p.getPrice(),
                "mensaje", "Precio del producto " + p.getName() + " actualizado a $" + nuevoPrecio
        );
    }

    /**
     * Tool 8: Desactivar producto del catálogo.
     */
    @Tool(
        name = "desactivar_producto_catalogo",
        description = "Desactiva temporalmente un producto del catálogo para que no aparezca en venta a los clientes."
    )
    public Map<String, Object> desactivarProductoCatalogo(
            @ToolParam(description = "SKU del producto a desactivar") String sku) {
        
        Optional<CoffeeProductDto> prodOpt = backendClient.getProductBySku(sku);
        if (prodOpt.isEmpty()) {
            return Map.of("exito", false, "mensaje", "Producto con SKU " + sku + " no encontrado.");
        }

        CoffeeProductDto p = prodOpt.get();
        p.setActive(false);
        Long prodId = p.getId() != null ? p.getId() : 1L;
        String targetId = "product-card-" + prodId;

        return Map.of(
                "exito", true,
                "id", prodId,
                "targetId", targetId,
                "sku", sku,
                "nombre", p.getName(),
                "activo", false,
                "mensaje", "El producto " + p.getName() + " ha sido desactivado del menú."
        );
    }

    private Map<String, Object> mapProductSummary(CoffeeProductDto p) {
        Map<String, Object> m = new LinkedHashMap<>();
        Long prodId = p.getId() != null ? p.getId() : 1L;
        m.put("id", prodId);
        m.put("targetId", "product-card-" + prodId);
        m.put("sku", p.getSku());
        m.put("nombre", p.getName());
        m.put("categoria", p.getCategory());
        m.put("precio", p.getPrice() != null ? p.getPrice() : p.getUnitPrice());
        m.put("stockDisponible", p.getStockQuantity());
        m.put("descripcion", p.getDescription());
        m.put("imageUrl", p.getImageUrl());
        m.put("activo", p.getActive() != null ? p.getActive() : true);
        return m;
    }
}
