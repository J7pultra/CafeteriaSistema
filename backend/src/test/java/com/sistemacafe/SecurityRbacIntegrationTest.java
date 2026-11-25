package com.sistemacafe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.dto.BaristaCreateRequestDto;
import com.sistemacafe.dto.DashboardMetricDto;
import com.sistemacafe.dto.ProductRequestDto;
import com.sistemacafe.dto.ProductResponseDto;
import com.sistemacafe.dto.StaffUserResponseDto;
import com.sistemacafe.service.CustomerService;
import com.sistemacafe.service.DashboardService;
import com.sistemacafe.service.OrderService;
import com.sistemacafe.service.ProductService;
import com.sistemacafe.service.UserManagementService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityRbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @MockBean
    private CustomerService customerService;

    @MockBean
    private OrderService orderService;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private UserManagementService userManagementService;

    @Test
    @DisplayName("GET /api/v1/customers sin autenticación debe retornar 401 Unauthorized")
    void shouldReturn401WhenAccessingProtectedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/customers"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Acceso no autorizado: Se requiere token JWT válido para acceder a este recurso."));
    }

    @Test
    @DisplayName("GET /api/v1/products público debe retornar 200 OK sin autenticación")
    void shouldAllowPublicAccessToProductCatalog() throws Exception {
        when(productService.getAllProducts(any(), any()))
                .thenReturn(new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 20), 0));

        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "cliente_standard", roles = {"CUSTOMER"})
    @DisplayName("POST /api/v1/products con rol CUSTOMER debe retornar 403 Forbidden")
    void shouldDenyProductCreationForCustomerRole() throws Exception {
        ProductRequestDto request = ProductRequestDto.builder()
                .sku("COF-DENIED-01")
                .name("Café Prohibido")
                .unitPrice(new BigDecimal("15.00"))
                .stockQuantity(10)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .build();

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Acceso denegado: No posee los permisos necesarios para ejecutar esta acción."));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = {"ADMIN"})
    @DisplayName("POST /api/v1/products con rol ADMIN debe retornar 201 Created")
    void shouldAllowProductCreationForAdminRole() throws Exception {
        ProductRequestDto request = ProductRequestDto.builder()
                .sku("COF-ALLOWED-01")
                .name("Café Permitido")
                .unitPrice(new BigDecimal("15.00"))
                .stockQuantity(10)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .build();

        ProductResponseDto response = ProductResponseDto.builder()
                .id(99L)
                .sku("COF-ALLOWED-01")
                .name("Café Permitido")
                .build();

        when(productService.createProduct(any(ProductRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(99));
    }

    @Test
    @WithMockUser(username = "barista_user", roles = {"BARISTA"})
    @DisplayName("GET /api/v1/dashboard/metrics con rol BARISTA debe retornar 403 Forbidden")
    void shouldDenyDashboardAccessForBarista() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/metrics"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = {"ADMIN"})
    @DisplayName("GET /api/v1/dashboard/metrics con rol ADMIN debe retornar 200 OK")
    void shouldAllowDashboardAccessForAdmin() throws Exception {
        DashboardMetricDto metrics = DashboardMetricDto.builder()
                .totalRevenueWeek(new BigDecimal("2500.00"))
                .totalOrdersWeek(60)
                .newCustomersWeek(12)
                .lowStockProductsCount(2)
                .salesByRoastLevel(Collections.emptyMap())
                .build();

        when(dashboardService.getDashboardMetrics()).thenReturn(metrics);

        mockMvc.perform(get("/api/v1/dashboard/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenueWeek").value(2500.00))
                .andExpect(jsonPath("$.totalOrdersWeek").value(60));
    }

    @Test
    @DisplayName("POST /api/v1/orders/checkout sin autenticación debe retornar 401 Unauthorized")
    void shouldRejectAnonymousCheckout() throws Exception {
        mockMvc.perform(post("/api/v1/orders/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "cliente_standard", roles = {"CUSTOMER"})
    @DisplayName("POST /api/v1/users/baristas con rol CUSTOMER debe retornar 403 Forbidden")
    void shouldDenyBaristaCreationForCustomer() throws Exception {
        BaristaCreateRequestDto request = BaristaCreateRequestDto.builder()
                .username("nuevo_barista")
                .email("nuevo@barista.com")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/v1/users/baristas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin_user", roles = {"ADMIN"})
    @DisplayName("POST /api/v1/users/baristas con rol ADMIN debe retornar 201 Created")
    void shouldAllowBaristaCreationForAdmin() throws Exception {
        BaristaCreateRequestDto request = BaristaCreateRequestDto.builder()
                .username("nuevo_barista")
                .email("nuevo@barista.com")
                .password("Password123!")
                .build();

        StaffUserResponseDto response = StaffUserResponseDto.builder()
                .id(12L)
                .username("nuevo_barista")
                .email("nuevo@barista.com")
                .enabled(true)
                .roles(java.util.List.of("ROLE_BARISTA"))
                .build();

        when(userManagementService.createBarista(any(BaristaCreateRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/users/baristas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("nuevo_barista"));
    }
}
