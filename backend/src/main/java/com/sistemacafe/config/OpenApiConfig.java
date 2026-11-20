package com.sistemacafe.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI coffeeEnterpriseOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Coffee Enterprise API - Sistema de Gestión y Ventas de Café")
                        .description("API RESTful enterprise para la gestión de clientes, catálogo de café de especialidad, órdenes transaccionales y métricas de negocio.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Equipo de Ingeniería de Software Enterprise")
                                .email("soporte@sistemacafe.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")));
    }
}
