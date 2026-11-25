package com.sistemacafe.service;

import com.sistemacafe.domain.enums.RoleType;
import com.sistemacafe.domain.model.Role;
import com.sistemacafe.domain.model.User;
import com.sistemacafe.domain.repository.RoleRepository;
import com.sistemacafe.domain.repository.UserRepository;
import com.sistemacafe.dto.BaristaCreateRequestDto;
import com.sistemacafe.dto.StaffUserResponseDto;
import com.sistemacafe.exception.BusinessRuleException;
import com.sistemacafe.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<StaffUserResponseDto> listBaristas() {
        return userRepository.findByRoleName(RoleType.ROLE_BARISTA).stream()
                .map(this::toStaffDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StaffUserResponseDto createBarista(BaristaCreateRequestDto dto) {
        String username = dto.getUsername().trim();
        String email = dto.getEmail().toLowerCase().trim();

        if (userRepository.existsByUsername(username)) {
            throw new BusinessRuleException("El nombre de usuario '" + username + "' ya se encuentra registrado.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new BusinessRuleException("El correo electrónico '" + email + "' ya se encuentra registrado.");
        }

        Role baristaRole = roleRepository.findByName(RoleType.ROLE_BARISTA)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(RoleType.ROLE_BARISTA)
                        .description("Barista y operador de pedidos y comandas")
                        .build()));

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(dto.getPassword()))
                .enabled(true)
                .roles(Set.of(baristaRole))
                .build();

        User saved = userRepository.save(user);
        return toStaffDto(saved);
    }

    @Transactional
    public StaffUserResponseDto updateUserStatus(Long id, boolean enabled) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));

        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN);
        if (isAdmin && !enabled) {
            throw new BusinessRuleException("No se puede desactivar una cuenta de Administrador.");
        }

        user.setEnabled(enabled);
        User updated = userRepository.save(user);
        return toStaffDto(updated);
    }

    private StaffUserResponseDto toStaffDto(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .sorted()
                .collect(Collectors.toList());

        return StaffUserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .enabled(user.isEnabled())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
