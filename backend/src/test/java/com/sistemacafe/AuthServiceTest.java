package com.sistemacafe;

import com.sistemacafe.domain.enums.RoleType;
import com.sistemacafe.domain.model.Role;
import com.sistemacafe.domain.model.User;
import com.sistemacafe.domain.repository.RoleRepository;
import com.sistemacafe.domain.repository.UserRepository;
import com.sistemacafe.dto.AuthResponseDto;
import com.sistemacafe.dto.LoginRequestDto;
import com.sistemacafe.dto.RegisterRequestDto;
import com.sistemacafe.exception.BusinessRuleException;
import com.sistemacafe.security.CustomUserDetailsService;
import com.sistemacafe.security.JwtService;
import com.sistemacafe.security.UserPrincipal;
import com.sistemacafe.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @InjectMocks
    private AuthService authService;

    private User user;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        customerRole = Role.builder()
                .id(1L)
                .name(RoleType.ROLE_CUSTOMER)
                .description("Rol predeterminado")
                .build();

        user = User.builder()
                .id(10L)
                .username("juan_coffee")
                .email("juan@coffee.com")
                .password("encoded_pass")
                .enabled(true)
                .roles(Set.of(customerRole))
                .build();
    }

    @Test
    @DisplayName("Debe registrar nuevo usuario con contraseña cifrada y rol asignado")
    void shouldRegisterNewUserSuccessfully() {
        RegisterRequestDto request = RegisterRequestDto.builder()
                .username("juan_coffee")
                .email("juan@coffee.com")
                .password("plain_password")
                .build();

        when(userRepository.existsByUsername("juan_coffee")).thenReturn(false);
        when(userRepository.existsByEmail("juan@coffee.com")).thenReturn(false);
        when(passwordEncoder.encode("plain_password")).thenReturn("encoded_pass");
        when(roleRepository.findByName(RoleType.ROLE_CUSTOMER)).thenReturn(Optional.of(customerRole));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtService.generateToken(any())).thenReturn("mock.access.token");
        when(jwtService.generateRefreshToken(any())).thenReturn("mock.refresh.token");
        when(jwtService.getJwtExpirationMs()).thenReturn(3600000L);

        AuthResponseDto response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getUsername()).isEqualTo("juan_coffee");
        assertThat(response.getAccessToken()).isEqualTo("mock.access.token");
        verify(passwordEncoder).encode("plain_password");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción si el nombre de usuario ya está registrado")
    void shouldThrowWhenUsernameExists() {
        RegisterRequestDto request = RegisterRequestDto.builder()
                .username("juan_coffee")
                .email("otro@coffee.com")
                .password("plain_password")
                .build();

        when(userRepository.existsByUsername("juan_coffee")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("El nombre de usuario 'juan_coffee' ya se encuentra registrado");
    }

    @Test
    @DisplayName("Debe autenticar correctamente con credenciales válidas")
    void shouldAuthenticateValidCredentials() {
        LoginRequestDto loginRequest = LoginRequestDto.builder()
                .usernameOrEmail("juan_coffee")
                .password("plain_password")
                .build();

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(jwtService.generateToken(any())).thenReturn("valid.jwt.token");
        when(jwtService.generateRefreshToken(any())).thenReturn("valid.refresh.token");
        when(jwtService.getJwtExpirationMs()).thenReturn(3600000L);

        AuthResponseDto response = authService.login(loginRequest);

        assertThat(response.getAccessToken()).isEqualTo("valid.jwt.token");
        assertThat(response.getUsername()).isEqualTo("juan_coffee");
    }

    @Test
    @DisplayName("Debe lanzar BadCredentialsException si las credenciales son erróneas")
    void shouldThrowOnInvalidCredentials() {
        LoginRequestDto loginRequest = LoginRequestDto.builder()
                .usernameOrEmail("juan_coffee")
                .password("wrong_password")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Credenciales inválidas");
    }
}
