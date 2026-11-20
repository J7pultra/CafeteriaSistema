package com.sistemacafe.config;

import com.sistemacafe.domain.enums.RoleType;
import com.sistemacafe.domain.model.Role;
import com.sistemacafe.domain.model.User;
import com.sistemacafe.domain.repository.RoleRepository;
import com.sistemacafe.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Verificando inicialización de datos del Sistema de Café...");

        // 1. Inicializar Roles
        Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(RoleType.ROLE_ADMIN)
                        .description("Administrador del sistema de café")
                        .build()));

        Role baristaRole = roleRepository.findByName(RoleType.ROLE_BARISTA).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(RoleType.ROLE_BARISTA)
                        .description("Barista y operador de pedidos")
                        .build()));

        Role customerRole = roleRepository.findByName(RoleType.ROLE_CUSTOMER).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(RoleType.ROLE_CUSTOMER)
                        .description("Cliente registrado en el programa de lealtad")
                        .build()));

        // 2. Inicializar Usuarios
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@sistemacafe.com")
                    .password(passwordEncoder.encode("admin123"))
                    .roles(Set.of(adminRole))
                    .enabled(true)
                    .build());
            log.info("Usuario 'admin' creado exitosamente con contraseña 'admin123'.");
        }

        if (!userRepository.existsByUsername("barista")) {
            userRepository.save(User.builder()
                    .username("barista")
                    .email("barista@sistemacafe.com")
                    .password(passwordEncoder.encode("barista123"))
                    .roles(Set.of(baristaRole))
                    .enabled(true)
                    .build());
            log.info("Usuario 'barista' creado exitosamente con contraseña 'barista123'.");
        }

        if (!userRepository.existsByUsername("cliente_carlos")) {
            userRepository.save(User.builder()
                    .username("cliente_carlos")
                    .email("carlos.mendoza@example.com")
                    .password(passwordEncoder.encode("cliente123"))
                    .roles(Set.of(customerRole))
                    .enabled(true)
                    .build());
            log.info("Usuario 'cliente_carlos' creado exitosamente.");
        }

        // Catálogo de Café y Clientes se gestionan exclusivamente mediante CRUD real
        log.info("Inicialización de seguridad y roles completada.");
    }
}
