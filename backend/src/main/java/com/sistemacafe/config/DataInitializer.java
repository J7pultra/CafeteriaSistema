package com.sistemacafe.config;

import com.sistemacafe.domain.enums.RoleType;
import com.sistemacafe.domain.model.Role;
import com.sistemacafe.domain.model.User;
import com.sistemacafe.domain.repository.RoleRepository;
import com.sistemacafe.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Value("${app.security.admin.username:admin}")
    private String adminUsername;

    @Value("${app.security.admin.email:admin@sistemacafe.com}")
    private String adminEmail;

    @Value("${app.security.admin.password:admin123}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Inicializando configuración de seguridad y roles en el Sistema de Cafetería...");

        // 1. Inicializar Roles del Sistema exclusivamente
        Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(RoleType.ROLE_ADMIN)
                        .description("Administrador del sistema de cafetería")
                        .build()));

        Role baristaRole = roleRepository.findByName(RoleType.ROLE_BARISTA).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(RoleType.ROLE_BARISTA)
                        .description("Barista y operador de pedidos y comandas")
                        .build()));

        Role customerRole = roleRepository.findByName(RoleType.ROLE_CUSTOMER).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(RoleType.ROLE_CUSTOMER)
                        .description("Cliente registrado en el programa de lealtad")
                        .build()));

        // 2. Inicializar Usuario Administrador (parametrizado por variables de entorno)
        if (!userRepository.existsByUsername(adminUsername)) {
            userRepository.save(User.builder()
                    .username(adminUsername)
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .roles(Set.of(adminRole))
                    .enabled(true)
                    .build());
            log.info("Usuario administrador inicial '{}' configurado desde variables de entorno.", adminUsername);
        }

        // 3. Inicializar Usuario Barista de Operaciones
        if (!userRepository.existsByUsername("barista")) {
            userRepository.save(User.builder()
                    .username("barista")
                    .email("barista@sistemacafe.com")
                    .password(passwordEncoder.encode("barista123"))
                    .roles(Set.of(baristaRole))
                    .enabled(true)
                    .build());
            log.info("Usuario barista inicial 'barista' configurado para operaciones.");
        }

        // Cero seeders ni datos ficticios insertados. El entorno inicia limpio para producción.
        log.info("Inicialización de seguridad completada con éxito. Catálogo y órdenes limpios.");
    }
}
