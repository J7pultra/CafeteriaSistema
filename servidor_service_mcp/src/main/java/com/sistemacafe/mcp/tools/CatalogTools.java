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
 * HERRAMIENTAS MCP DE CATÁLOGO Y CAFÉS DE ESPECIALIDAD
 * Permite listar, buscar, filtrar, recomendar, registrar y actualizar cafés.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogTools {

    private final BackendApiClient backendClient;

    /**
     * Tool 1: Listar productos del catálogo de café.
     */
    @Tool(
        name = "listar_productos",
        description = "Obtiene la lista completa de cafés de especialidad disponibles en la cafetería, incluyendo SKU, nombre, origen, tueste, precio por kg y stock disponible."
    )
    public List<Map<String, Object>> listarProductos(
            @ToolParam(description = "Si es true solo lista cafés activos. Opcional, por defecto true", required = false) Boolean soloActivos) {
        
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
        description = "Busca la ficha técnica detallada de un café dado su código SKU exacto (ejemplo: 'COF-COL-MED', 'COF-ETH-YIR')."
    )
    public Map<String, Object> buscarProductoSku(
            @ToolParam(description = "Código SKU del café a buscar") String sku) {
        
        return backendClient.getProductBySku(sku)
                .map(this::mapProductSummary)
                .orElse(Map.of(
                        "encontrado", false,
                        "sku", sku,
                        "mensaje", "No se encontró ningún café con el SKU: " + sku
                ));
    }

    /**
     * Tool 3: Buscar café por origen o país.
     */
    @Tool(
        name = "buscar_cafe_origen",
        description = "Encuentra cafés filtrando por país, región o finca de origen (ejemplo: 'Colombia', 'Etiopía', 'Guatemala', 'Huila')."
    )
    public List<Map<String, Object>> buscarCafeOrigen(
            @ToolParam(description = "Nombre del país o región de origen a consultar") String origen) {
        
        if (origen == null || origen.isBlank()) return Collections.emptyList();
        String query = origen.trim().toLowerCase();

        return backendClient.getAllProducts().stream()
                .filter(p -> p.getOrigin() != null && p.getOrigin().toLowerCase().contains(query))
                .map(this::mapProductSummary)
                .collect(Collectors.toList());
    }

    /**
     * Tool 4: Filtrar por nivel de tueste y/o categoría.
     */
    @Tool(
        name = "filtrar_por_tueste_categoria",
        description = "Filtra granos de café según su nivel de tueste (LIGHT, MEDIUM, MEDIUM_DARK, DARK) y opcionalmente su categoría (ESPRESSO_SINGLE_ORIGIN, SPECIALTY_BEANS, COLD_BREW_BLEND, DECAF_ORGANIC)."
    )
    public List<Map<String, Object>> filtrarPorTuesteCategoria(
            @ToolParam(description = "Nivel de tueste: LIGHT, MEDIUM, MEDIUM_DARK, DARK", required = false) String tueste,
            @ToolParam(description = "Categoría del café", required = false) String categoria) {
        
        return backendClient.getAllProducts().stream()
                .filter(p -> {
                    boolean matchRoast = tueste == null || tueste.isBlank() || 
                            (p.getRoastLevel() != null && p.getRoastLevel().equalsIgnoreCase(tueste.trim()));
                    boolean matchCat = categoria == null || categoria.isBlank() || 
                            (p.getCategory() != null && p.getCategory().equalsIgnoreCase(categoria.trim()));
                    return matchRoast && matchCat;
                })
                .map(this::mapProductSummary)
                .collect(Collectors.toList());
    }

    /**
     * Tool 5: Recomendar café por notas de cata o sabor deseado.
     */
    @Tool(
        name = "recomendar_por_notas_sabor",
        description = "Recomienda los cafés más afines a las notas sensoriales solicitadas por el cliente (ejemplo: 'jazmín', 'chocolate', 'frutas', 'caramelo', 'cítrico')."
    )
    public Map<String, Object> recomendarPorNotasSabor(
            @ToolParam(description = "Notas de sabor o descriptores sensoriales deseados") String notasDeseadas) {
        
        if (notasDeseadas == null || notasDeseadas.isBlank()) {
            return Map.of("recomendaciones", Collections.emptyList(), "mensaje", "Por favor indique qué sabores o notas prefiere.");
        }

        String[] tokens = notasDeseadas.toLowerCase().split("[,\\s]+");
        List<CoffeeProductDto> all = backendClient.getAllProducts();

        List<Map<String, Object>> scored = new ArrayList<>();
        for (CoffeeProductDto p : all) {
            int score = 0;
            String text = ((p.getName() != null ? p.getName() : "") + " " +
                           (p.getFlavorNotes() != null ? p.getFlavorNotes() : "") + " " +
                           (p.getDescription() != null ? p.getDescription() : "")).toLowerCase();
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
                "criterioBusqueda", notasDeseadas,
                "totalEncontrados", scored.size(),
                "recomendaciones", scored
        );
    }

    /**
     * Tool 6: Crear un nuevo café en el catálogo.
     */
    @Tool(
        name = "crear_producto_cafe",
        description = "Registra un nuevo café de especialidad en el sistema con su nombre, precio, tueste, origen, categoría, stock inicial y notas de cata."
    )
    public Map<String, Object> crearProductoCafe(
            @ToolParam(description = "Nombre comercial del café (ejemplo: 'Café Colombia Geisha')") String nombre,
            @ToolParam(description = "Precio en dólares por kilogramo o unidad (ejemplo: 22.50)") Double precio,
            @ToolParam(description = "Nivel de tueste: LIGHT, MEDIUM, MEDIUM_DARK, DARK", required = false) String tueste,
            @ToolParam(description = "Origen o región geográfica", required = false) String origen,
            @ToolParam(description = "Categoría: ESPRESSO_SINGLE_ORIGIN, SPECIALTY_BEANS, COLD_BREW_BLEND, DECAF_ORGANIC", required = false) String categoria,
            @ToolParam(description = "Stock inicial en kilogramos (ejemplo: 50)", required = false) Integer stockInicial,
            @ToolParam(description = "Notas de sabor o descripción sensorial", required = false) String notasCata) {
        
        String cleanName = nombre != null ? nombre.trim() : "Café Especial de la Casa";
        BigDecimal finalPrice = BigDecimal.valueOf(precio != null && precio > 0 ? precio : 18.00);
        String cleanRoast = (tueste != null && !tueste.isBlank()) ? tueste.trim().toUpperCase() : "MEDIUM";
        String cleanOrigin = (origen != null && !origen.isBlank()) ? origen.trim() : "Origen de la Casa";
        String cleanCat = (categoria != null && !categoria.isBlank()) ? categoria.trim().toUpperCase() : "SPECIALTY_BEANS";
        int cleanStock = (stockInicial != null && stockInicial >= 0) ? stockInicial : 50;

        // Generar SKU único seguro
        String codePrefix = cleanName.replaceAll("[^a-zA-Z]", "").toUpperCase();
        if (codePrefix.length() > 6) codePrefix = codePrefix.substring(0, 6);
        if (codePrefix.length() < 3) codePrefix = "COF";
        String generatedSku = "COF-" + codePrefix + "-" + (1000 + new Random().nextInt(9000));

        String finalDesc = (notasCata != null && !notasCata.isBlank()) ? notasCata.trim() : ("Bebida artesanal " + cleanName + " seleccionada de especialidad.");

        CoffeeProductDto dto = CoffeeProductDto.builder()
                .sku(generatedSku)
                .name(cleanName)
                .price(finalPrice)
                .unitPrice(finalPrice)
                .roastLevel(cleanRoast)
                .origin(cleanOrigin)
                .category(cleanCat)
                .stockQuantity(cleanStock)
                .flavorNotes(finalDesc)
                .description(finalDesc)
                .active(true)
                .build();

        CoffeeProductDto created = backendClient.createProduct(dto);
        String finalSku = created.getSku() != null ? created.getSku() : generatedSku;
        BigDecimal resPrice = created.getPrice() != null ? created.getPrice() : finalPrice;
        int resStock = created.getStockQuantity() != null ? created.getStockQuantity() : cleanStock;
        String resDesc = created.getDescription() != null ? created.getDescription() : finalDesc;
        Long prodId = created.getId() != null ? created.getId() : (100L + new Random().nextInt(900));
        String targetId = "product-card-" + prodId;

        Map<String, Object> productDetails = new LinkedHashMap<>();
        productDetails.put("id", prodId);
        productDetails.put("targetId", targetId);
        productDetails.put("sku", finalSku);
        productDetails.put("name", created.getName());
        productDetails.put("nombre", created.getName());
        productDetails.put("price", resPrice);
        productDetails.put("precio", resPrice);
        productDetails.put("stockQuantity", resStock);
        productDetails.put("stock", resStock);
        productDetails.put("roastLevel", created.getRoastLevel());
        productDetails.put("tueste", created.getRoastLevel());
        productDetails.put("origin", created.getOrigin());
        productDetails.put("description", resDesc);
        productDetails.put("descripcion", resDesc);
        productDetails.put("flavorNotes", resDesc);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("exito", true);
        resp.put("success", true);
        resp.put("id", prodId);
        resp.put("targetId", targetId);
        resp.put("mensaje", "Café registrado exitosamente en el sistema");
        resp.put("message", "Café registrado exitosamente en el sistema");
        resp.put("sku", finalSku);
        resp.put("nombre", created.getName());
        resp.put("name", created.getName());
        resp.put("precio", resPrice);
        resp.put("price", resPrice);
        resp.put("stock", resStock);
        resp.put("stockQuantity", resStock);
        resp.put("tueste", created.getRoastLevel());
        resp.put("roastLevel", created.getRoastLevel());
        resp.put("origen", created.getOrigin());
        resp.put("description", resDesc);
        resp.put("descripcion", resDesc);
        resp.put("product", productDetails);

        return resp;
    }

    /**
     * Tool 7: Actualizar el precio de un producto existente.
     */
    @Tool(
        name = "actualizar_precio_producto",
        description = "Actualiza el precio de venta de un café en el catálogo dado su SKU y el nuevo precio."
    )
    public Map<String, Object> actualizarPrecioProducto(
            @ToolParam(description = "SKU del café a actualizar") String sku,
            @ToolParam(description = "Nuevo precio en dólares") Double nuevoPrecio) {
        
        if (sku == null || sku.isBlank() || nuevoPrecio == null || nuevoPrecio <= 0) {
            return Map.of("exito", false, "mensaje", "SKU y nuevo precio mayor a 0 son obligatorios.");
        }

        Optional<CoffeeProductDto> prodOpt = backendClient.getProductBySku(sku);
        if (prodOpt.isEmpty()) {
            return Map.of("exito", false, "mensaje", "No se encontró ningún café con SKU: " + sku);
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
                "mensaje", "Precio del café " + p.getName() + " actualizado a $" + nuevoPrecio
        );
    }

    /**
     * Tool 8: Desactivar producto del catálogo.
     */
    @Tool(
        name = "desactivar_producto_catalogo",
        description = "Desactiva temporalmente un café del catálogo para que no aparezca en venta a los clientes."
    )
    public Map<String, Object> desactivarProductoCatalogo(
            @ToolParam(description = "SKU del café a desactivar") String sku) {
        
        Optional<CoffeeProductDto> prodOpt = backendClient.getProductBySku(sku);
        if (prodOpt.isEmpty()) {
            return Map.of("exito", false, "mensaje", "Café con SKU " + sku + " no encontrado.");
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
                "mensaje", "El café " + p.getName() + " ha sido desactivado del catálogo comercial."
        );
    }

    private Map<String, Object> mapProductSummary(CoffeeProductDto p) {
        Map<String, Object> m = new LinkedHashMap<>();
        Long prodId = p.getId() != null ? p.getId() : 1L;
        m.put("id", prodId);
        m.put("targetId", "product-card-" + prodId);
        m.put("sku", p.getSku());
        m.put("nombre", p.getName());
        m.put("origen", p.getOrigin());
        m.put("tueste", p.getRoastLevel());
        m.put("categoria", p.getCategory());
        m.put("precio", p.getPrice() != null ? p.getPrice() : p.getUnitPrice());
        m.put("stockDisponible", p.getStockQuantity());
        m.put("notasCata", p.getFlavorNotes());
        m.put("descripcion", p.getDescription());
        m.put("activo", p.getActive() != null ? p.getActive() : true);
        return m;
    }
}
