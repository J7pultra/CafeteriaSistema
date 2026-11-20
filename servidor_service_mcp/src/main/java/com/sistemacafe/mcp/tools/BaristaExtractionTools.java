package com.sistemacafe.mcp.tools;

import com.sistemacafe.mcp.client.BackendApiClient;
import com.sistemacafe.mcp.dto.BlendFormulationDto;
import com.sistemacafe.mcp.dto.BrewRecipeDto;
import com.sistemacafe.mcp.dto.SystemHealthDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * HERRAMIENTAS MCP DE BARISTA, RECETAS DE EXTRACCIÓN Y DIAGNÓSTICO
 * Cálculos paramétricos para V60, Chemex, Aeropress, Espresso y formulación de blends.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BaristaExtractionTools {

    private final BackendApiClient backendClient;

    /**
     * Tool 23: Calcular receta técnica de extracción de café.
     */
    @Tool(
        name = "calcular_receta_extraccion",
        description = "Calcula la proporción exacta de agua, temperatura, molienda, tiempos y vertidos según el método de filtrado (V60, CHEMEX, AEROPRESS, ESPRESSO, PRENSA_FRANCESA) y los gramos de café."
    )
    public BrewRecipeDto calcularRecetaExtraccion(
            @ToolParam(description = "Método de preparación: V60, CHEMEX, AEROPRESS, ESPRESSO, PRENSA_FRANCESA") String metodo,
            @ToolParam(description = "Gramos de café en seco (ejemplo: 15, 18, 20)", required = false) Double gramosCafe,
            @ToolParam(description = "Nivel de tueste: LIGHT, MEDIUM, DARK", required = false) String nivelTueste) {
        
        String cleanMetodo = metodo != null ? metodo.toUpperCase().trim() : "V60";
        double g = gramosCafe != null && gramosCafe > 0 ? gramosCafe : 18.0;
        String roast = nivelTueste != null ? nivelTueste.toUpperCase().trim() : "MEDIUM";

        int temp = switch (roast) {
            case "LIGHT" -> 94;
            case "DARK" -> 88;
            default -> 91;
        };

        return switch (cleanMetodo) {
            case "CHEMEX" -> {
                double water = g * 16.0;
                yield BrewRecipeDto.builder()
                        .method("Chemex")
                        .roastLevel(roast)
                        .coffeeGrams(g)
                        .waterVolumeMl(water)
                        .brewRatio("1:16")
                        .waterTemperatureCelsius(temp)
                        .grindProfile("Media-Gruesa (Similar a sal marina)")
                        .totalTimeEstimate("4:00 - 4:30 min")
                        .steps(List.of(
                                "0:00 - Purgar filtro grueso con agua caliente y descartar agua.",
                                "0:30 - Pre-infusión con " + (g * 2.5) + " ml de agua durante 45s.",
                                "1:15 - Primer vertido continuo en espiral hasta alcanzar " + (water * 0.6) + " ml.",
                                "2:30 - Segundo vertido suave hasta " + water + " ml. Dejar filtrar."
                        ))
                        .baristaTip("El filtro de Chemex es un 30% más grueso; resalta una taza limpia, brillante y sin aceites amargos.")
                        .build();
            }
            case "AEROPRESS" -> {
                double water = g * 12.0;
                yield BrewRecipeDto.builder()
                        .method("Aeropress (Método Invertido)")
                        .roastLevel(roast)
                        .coffeeGrams(g)
                        .waterVolumeMl(water)
                        .brewRatio("1:12")
                        .waterTemperatureCelsius(temp - 2)
                        .grindProfile("Media-Fina (Similar a sal de mesa)")
                        .totalTimeEstimate("2:00 min")
                        .steps(List.of(
                                "0:00 - Colocar Aeropress invertido y verter " + (g * 3) + " ml para bloom.",
                                "0:30 - Remover 5 veces enérgicamente con la paleta.",
                                "0:45 - Completar vertido hasta " + water + " ml y colocar portafiltro enjuagado.",
                                "1:30 - Girar sobre taza y presionar con fuerza constante durante 30s hasta oír el silbido."
                        ))
                        .baristaTip("Ideal para cafés de tueste medio y notas a chocolate; entrega cuerpo redondo y dulzor acentuado.")
                        .build();
            }
            case "ESPRESSO" -> {
                double outYield = g * 2.0;
                yield BrewRecipeDto.builder()
                        .method("Espresso 1:2 Moderno")
                        .roastLevel(roast)
                        .coffeeGrams(g)
                        .waterVolumeMl(outYield)
                        .brewRatio("1:2")
                        .waterTemperatureCelsius(temp)
                        .grindProfile("Muy Fina (Especial para máquina de espresso 9 bares)")
                        .totalTimeEstimate("26 - 30 segundos")
                        .steps(List.of(
                                "1. Distribuir uniformemente con herramienta WDT en la canasta.",
                                "2. Tamper nivelado con 15 kg de presión.",
                                "3. Purgar ducha de grupo durante 2 segundos.",
                                "4. Iniciar extracción: primeras gotas a los 5-7s, cortar exactamente al alcanzar " + outYield + "g en taza."
                        ))
                        .baristaTip("Monitorea la crema avellanada con motas tigradas; si canaliza o es agrio, afina un punto el molino.")
                        .build();
            }
            case "PRENSA_FRANCESA" -> {
                double water = g * 15.0;
                yield BrewRecipeDto.builder()
                        .method("Prensa Francesa")
                        .roastLevel(roast)
                        .coffeeGrams(g)
                        .waterVolumeMl(water)
                        .brewRatio("1:15")
                        .waterTemperatureCelsius(temp)
                        .grindProfile("Gruesa uniforme")
                        .totalTimeEstimate("4:30 min")
                        .steps(List.of(
                                "0:00 - Agregar " + g + "g y verter todo el volumen (" + water + " ml).",
                                "1:00 - Romper la costra superficial suavemente con cuchara.",
                                "4:00 - Retirar espuma flotante y bajar el émbolo lentamente sin comprimir el fondo."
                        ))
                        .baristaTip("Proporciona una bebida densa con cuerpo completo gracias a los aceites naturales retenidos.")
                        .build();
            }
            case "V60" -> {
                double water = g * 15.0;
                yield BrewRecipeDto.builder()
                        .method("Hario V60 (Vertido en 3 fases)")
                        .roastLevel(roast)
                        .coffeeGrams(g)
                        .waterVolumeMl(water)
                        .brewRatio("1:15")
                        .waterTemperatureCelsius(temp)
                        .grindProfile("Media (Como arena fina de playa)")
                        .totalTimeEstimate("2:45 - 3:15 min")
                        .steps(List.of(
                                "0:00 - Pre-infusión con " + (g * 2.5) + " ml (desgasificación 35 segundos).",
                                "0:45 - Primer vertido concéntrico hasta alcanzar " + (water * 0.55) + " ml.",
                                "1:30 - Segundo vertido lento al centro hasta completar " + water + " ml.",
                                "2:15 - Swirl ligero en las paredes y esperar goteo final."
                        ))
                        .baristaTip("Mantén un flujo de agua laminar sin tocar las paredes de papel para maximizar la acidez limpia.")
                        .build();
            }
            default -> {
                double water = g * 15.0;
                yield BrewRecipeDto.builder()
                        .method(cleanMetodo)
                        .roastLevel(roast)
                        .coffeeGrams(g)
                        .waterVolumeMl(water)
                        .brewRatio("1:15")
                        .waterTemperatureCelsius(temp)
                        .grindProfile("Media estándar")
                        .totalTimeEstimate("3:00 min")
                        .steps(List.of("Verter " + water + " ml de agua a " + temp + "°C sobre " + g + "g de café."))
                        .baristaTip("Receta base de extracción equilibrada.")
                        .build();
            }
        };
    }

    /**
     * Tool 24: Formular blend maestro de café por perfil sensorial.
     */
    @Tool(
        name = "formular_blend_cafe",
        description = "Genera la formulación y porcentajes de orígenes para crear una mezcla (Blend de la casa) según el objetivo: ESPRESSO_EQUILIBRADO, DULCE_CHOCOLATE, AFRUTADO_FLORAL o COLD_BREW_INTENSO."
    )
    public BlendFormulationDto formularBlendCafe(
            @ToolParam(description = "Perfil deseado: ESPRESSO_EQUILIBRADO, DULCE_CHOCOLATE, AFRUTADO_FLORAL, COLD_BREW_INTENSO") String perfilDeseado) {
        
        String cleanPerfil = perfilDeseado != null ? perfilDeseado.toUpperCase().trim() : "ESPRESSO_EQUILIBRADO";

        return switch (cleanPerfil) {
            case "DULCE_CHOCOLATE" -> BlendFormulationDto.builder()
                    .blendName("Blend Caramelo & Cacao Fino")
                    .suitability("Bebidas con leche (Cappuccino, Latte, Flat White)")
                    .recommendedRoast("MEDIUM")
                    .overallProfile("Notas densas a chocolate de leche, toffee, nuez y azúcar mascabado.")
                    .components(List.of(
                            Map.of("origen", "Colombia Huila Supremo", "porcentaje", 50, "rol", "Base achocolatada y cuerpo"),
                            Map.of("origen", "Guatemala Antigua Los Volcanes", "porcentaje", 35, "rol", "Dulzura de caña y especias"),
                            Map.of("origen", "Brasil Cerrado Natural", "porcentaje", 15, "rol", "Crema espesa y notas a avellana")
                    ))
                    .message("Formulación balanceada para corteza de crema dulce y sin asperezas lácteas.")
                    .build();

            case "AFRUTADO_FLORAL" -> BlendFormulationDto.builder()
                    .blendName("Blend Sinfonía Cítrica & Flores")
                    .suitability("Filtrados ligeros (V60, Chemex, Batch Brew)")
                    .recommendedRoast("LIGHT")
                    .overallProfile("Aroma a jazmín blanco, bergamota fresca, durazno maduro y miel silvestre.")
                    .components(List.of(
                            Map.of("origen", "Etiopía Yirgacheffe Grado 1", "porcentaje", 65, "rol", "Complejidad floral y jazmín"),
                            Map.of("origen", "Colombia Huila Geisha", "porcentaje", 35, "rol", "Acidez de manzana verde y final largo")
                    ))
                    .message("Mezcla de alta gama para paladares refinados de café de especialidad.")
                    .build();

            case "COLD_BREW_INTENSO" -> BlendFormulationDto.builder()
                    .blendName("Blend Maceración Glacial")
                    .suitability("Extracción en frío de 16 a 24 horas")
                    .recommendedRoast("MEDIUM_DARK")
                    .overallProfile("Cuerpo licoroso, cacao amargo 80%, pasas y muy baja acidez.")
                    .components(List.of(
                            Map.of("origen", "Sumatra Mandheling", "porcentaje", 40, "rol", "Cuerpo terroso y notas a roble"),
                            Map.of("origen", "Colombia Huila", "porcentaje", 40, "rol", "Dulzura melosa"),
                            Map.of("origen", "Guatemala Antigua", "porcentaje", 20, "rol", "Regusto a chocolate puro")
                    ))
                    .message("Alta solubilidad en frío, cero amargor astringente.")
                    .build();

            case "ESPRESSO_EQUILIBRADO" -> BlendFormulationDto.builder()
                    .blendName("Blend Espresso Maestro de la Casa")
                    .suitability("Tolvas de molino para barra comercial de espresso continuo")
                    .recommendedRoast("MEDIUM_DARK")
                    .overallProfile("Equilibrio entre acidez cítrica suave, cuerpo untuoso y retrogusto a panela y cacao.")
                    .components(List.of(
                            Map.of("origen", "Colombia Huila Supremo", "porcentaje", 50, "rol", "Estructura ácida y notas a caramelo"),
                            Map.of("origen", "Guatemala Antigua", "porcentaje", 30, "rol", "Complejidad especiada"),
                            Map.of("origen", "Etiopía Yirgacheffe", "porcentaje", 20, "rol", "Brillo aromático y flores")
                    ))
                    .message("El blend insignia de Sistema Café Enterprise para un espresso dulce y redondo.")
                    .build();
            default -> BlendFormulationDto.builder()
                    .blendName("Blend Tradicional Barista")
                    .suitability("Propósito general")
                    .recommendedRoast("MEDIUM")
                    .overallProfile("Equilibrado y agradable")
                    .components(List.of(
                            Map.of("origen", "Café Colombia Huila", "porcentaje", 60, "rol", "Base principal"),
                            Map.of("origen", "Café Guatemala", "porcentaje", 40, "rol", "Dulzura y cuerpo")
                    ))
                    .message("Formulación clásica y versátil.")
                    .build();
        };
    }

    /**
     * Tool 25: Diagnosticar salud del servidor MCP y conectividad con Backend.
     */
    @Tool(
        name = "diagnosticar_salud_sistema",
        description = "Verifica la salud operativa del servidor MCP Spring AI, el conteo de tools activas (25) y la conexión reactiva con el Backend REST."
    )
    public SystemHealthDto diagnosticarSaludSistema() {
        boolean backendOk = backendClient.checkHealth();
        Map<String, Object> metrics = backendClient.getDashboardMetrics();

        Runtime rt = Runtime.getRuntime();
        long maxMem = rt.maxMemory() / (1024 * 1024);
        long totalMem = rt.totalMemory() / (1024 * 1024);
        long freeMem = rt.freeMemory() / (1024 * 1024);
        long usedMem = totalMem - freeMem;

        return SystemHealthDto.builder()
                .status("OPERATIVO")
                .mcpProtocol("Model Context Protocol (MCP) - Spring AI 1.1.0")
                .transport("SSE (Server-Sent Events) & REST Bridge")
                .toolCount(25)
                .backendConnected(backendOk)
                .backendUrl(backendClient.getBaseUrl())
                .timestamp(System.currentTimeMillis())
                .details(Map.of(
                        "memoriaUsadaMb", usedMem,
                        "memoriaTotalMb", totalMem,
                        "memoriaMaxMb", maxMem,
                        "metricasDashboardBackend", metrics
                ))
                .build();
    }
}
