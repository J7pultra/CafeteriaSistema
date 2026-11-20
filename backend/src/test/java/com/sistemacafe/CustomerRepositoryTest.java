package com.sistemacafe;

import com.sistemacafe.config.AuditConfig;
import com.sistemacafe.domain.enums.CustomerTier;
import com.sistemacafe.domain.model.Customer;
import com.sistemacafe.domain.repository.CustomerRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(AuditConfig.class)
@ActiveProfiles("test")
class CustomerRepositoryTest {

    @Autowired
    private CustomerRepository customerRepository;

    @Test
    @DisplayName("Debe persistir cliente y autogenerar auditoría (createdAt, createdBy)")
    void shouldPersistCustomerWithAuditFields() {
        Customer customer = Customer.builder()
                .firstName("Carlos")
                .lastName("Valdez")
                .email("carlos.valdez@cafespecialty.com")
                .phone("+593998765432")
                .address("Calle Loja 123 y Gran Colombia")
                .loyaltyPoints(250)
                .tier(CustomerTier.SILVER)
                .active(true)
                .build();

        Customer saved = customerRepository.save(customer);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getCreatedBy()).isEqualTo("SYSTEM");
        assertThat(saved.getTier()).isEqualTo(CustomerTier.SILVER);
        assertThat(saved.getFullName()).isEqualTo("Carlos Valdez");

        Optional<Customer> found = customerRepository.findByEmail("carlos.valdez@cafespecialty.com");
        assertThat(found).isPresent();
        assertThat(found.get().getFirstName()).isEqualTo("Carlos");
    }

    @Test
    @DisplayName("Debe recalcular tier de fidelidad dinámicamente según puntos")
    void shouldRecalculateTierBasedOnPoints() {
        Customer customer = Customer.builder()
                .firstName("Elena")
                .lastName("Rivas")
                .email("elena.rivas@barista.ec")
                .loyaltyPoints(50)
                .build();

        customer.addLoyaltyPoints(500); // 550 total -> GOLD
        assertThat(customer.getLoyaltyPoints()).isEqualTo(550);
        assertThat(customer.getTier()).isEqualTo(CustomerTier.GOLD);

        customer.addLoyaltyPoints(500); // 1050 total -> PLATINUM
        assertThat(customer.getTier()).isEqualTo(CustomerTier.PLATINUM);
    }
}
