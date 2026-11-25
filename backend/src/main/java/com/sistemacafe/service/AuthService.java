package com.sistemacafe.service;

import com.sistemacafe.domain.enums.RoleType;
import com.sistemacafe.domain.model.Role;
import com.sistemacafe.domain.model.User;
import com.sistemacafe.domain.repository.RoleRepository;
import com.sistemacafe.domain.repository.UserRepository;
import com.sistemacafe.dto.AuthResponseDto;
import com.sistemacafe.dto.LoginRequestDto;
import com.sistemacafe.dto.RefreshTokenRequestDto;
import com.sistemacafe.dto.RegisterRequestDto;
import com.sistemacafe.exception.BusinessRuleException;
import com.sistemacafe.security.CustomUserDetailsService;
import com.sistemacafe.security.JwtService;
import com.sistemacafe.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;

    @Transactional
    public AuthResponseDto login(LoginRequestDto loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsernameOrEmail().trim(),
                            loginRequest.getPassword()
                    )
            );

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            String accessToken = jwtService.generateToken(userPrincipal);
            String refreshToken = jwtService.generateRefreshToken(userPrincipal);

            List<String> roles = userPrincipal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            return AuthResponseDto.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresInMs(jwtService.getJwtExpirationMs())
                    .username(userPrincipal.getUsername())
                    .email(userPrincipal.getEmail())
                    .roles(roles)
                    .build();
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Credenciales inválidas: usuario o contraseña incorrectos.");
        }
    }

    @Transactional
    public AuthResponseDto register(RegisterRequestDto registerRequest) {
        String username = registerRequest.getUsername().trim();
        String email = registerRequest.getEmail().toLowerCase().trim();

        if (userRepository.existsByUsername(username)) {
            throw new BusinessRuleException("El nombre de usuario '" + username + "' ya se encuentra registrado.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new BusinessRuleException("El correo electrónico '" + email + "' ya se encuentra registrado.");
        }

        // El registro público siempre asigna exclusivamente ROLE_CUSTOMER.
        // Los baristas solo pueden ser registrados por un Administrador desde /api/v1/users/baristas.
        Set<Role> userRoles = new HashSet<>();
        Role defaultRole = roleRepository.findByName(RoleType.ROLE_CUSTOMER)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(RoleType.ROLE_CUSTOMER)
                        .description("Rol predeterminado de cliente")
                        .build()));
        userRoles.add(defaultRole);

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .enabled(true)
                .roles(userRoles)
                .build();

        User savedUser = userRepository.save(user);
        UserPrincipal userPrincipal = UserPrincipal.create(savedUser);

        String accessToken = jwtService.generateToken(userPrincipal);
        String refreshToken = jwtService.generateRefreshToken(userPrincipal);

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInMs(jwtService.getJwtExpirationMs())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .roles(roles)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponseDto refreshToken(RefreshTokenRequestDto refreshRequest) {
        String refreshToken = refreshRequest.getRefreshToken();

        if (!jwtService.validateToken(refreshToken)) {
            throw new BusinessRuleException("El token de refresco proporcionado ha expirado o no es válido.");
        }

        String username = jwtService.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        String newAccessToken = jwtService.generateToken(userDetails);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        String email = userDetails instanceof UserPrincipal ? ((UserPrincipal) userDetails).getEmail() : "";

        return AuthResponseDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInMs(jwtService.getJwtExpirationMs())
                .username(userDetails.getUsername())
                .email(email)
                .roles(roles)
                .build();
    }
}
