package com.sistemacafe.mcp;

import com.sistemacafe.mcp.tools.*;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.Arrays;
import java.util.List;

/**
 * SERVIDOR MCP (Model Context Protocol) - SISTEMA CAFÉ ENTERPRISE
 * 
 * Expone 25 herramientas especializadas en gestión de café, inventario,
 * comandas, fidelización de clientes y extracción técnica de baristas
 * mediante SSE reactivo y llamadas RPC para el agente inteligente.
 */
@SpringBootApplication
public class MainApplication {

    public static void main(String[] args) {
        SpringApplication.run(MainApplication.class, args);
    }

    /**
     * Registro central de Tools para el protocolo MCP (Spring AI).
     * Registra las 25 tools implementadas en los 5 servicios especializados.
     */
    @Bean
    public List<ToolCallback> mcpTools(
            CatalogTools catalogTools,
            InventoryTools inventoryTools,
            OrderTools orderTools,
            CustomerLoyaltyTools customerLoyaltyTools,
            BaristaExtractionTools baristaExtractionTools) {
        
        return Arrays.asList(
            MethodToolCallbackProvider.builder()
                .toolObjects(
                    catalogTools,
                    inventoryTools,
                    orderTools,
                    customerLoyaltyTools,
                    baristaExtractionTools
                )
                .build()
                .getToolCallbacks()
        );
    }
}
