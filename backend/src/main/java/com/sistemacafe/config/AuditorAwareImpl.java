package com.sistemacafe.config;

import org.springframework.data.domain.AuditorAware;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * AuditorAware implementation that resolves the current user from Spring Security context
 * for JPA entity auditing. Returns the username or a fallback 'SYSTEM' user.
 */
public class AuditorAwareImpl implements AuditorAware<String> {

    private static final String DEFAULT_AUDITOR = "SYSTEM";

    @Override
    @NonNull
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {
            return Optional.of(DEFAULT_AUDITOR);
        }

        return Optional.ofNullable(authentication.getName()).or(() -> Optional.of(DEFAULT_AUDITOR));
    }
}
