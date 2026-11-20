package com.sistemacafe;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class SistemaCafeApplicationTests {

    @Test
    @DisplayName("Debe cargar correctamente el contexto de la aplicación Spring Boot")
    void contextLoads() {
    }
}
