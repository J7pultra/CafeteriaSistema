package com.sistemacafe.domain.model;

import com.sistemacafe.domain.enums.CustomerTier;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(callSuper = false, onlyExplicitlyIncluded = true)
@Entity
@Table(
    name = "customers",
    indexes = {
        @Index(name = "idx_customers_email", columnList = "email"),
        @Index(name = "idx_customers_last_name", columnList = "last_name"),
        @Index(name = "idx_customers_tier", columnList = "tier"),
        @Index(name = "idx_customers_active", columnList = "active")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_customers_email", columnNames = "email")
    }
)
public class Customer extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 60)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 60)
    private String lastName;

    @EqualsAndHashCode.Include
    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "address", length = 250)
    private String address;

    @Builder.Default
    @Column(name = "loyalty_points", nullable = false)
    private Integer loyaltyPoints = 0;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false, length = 20)
    private CustomerTier tier = CustomerTier.BRONZE;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public void addLoyaltyPoints(int points) {
        if (points > 0) {
            this.loyaltyPoints += points;
            recalculateTier();
        }
    }

    public boolean redeemLoyaltyPoints(int points) {
        if (points > 0 && this.loyaltyPoints >= points) {
            this.loyaltyPoints -= points;
            return true;
        }
        return false;
    }

    public void recalculateTier() {
        if (this.loyaltyPoints >= 1000) {
            this.tier = CustomerTier.PLATINUM;
        } else if (this.loyaltyPoints >= 500) {
            this.tier = CustomerTier.GOLD;
        } else if (this.loyaltyPoints >= 200) {
            this.tier = CustomerTier.SILVER;
        } else {
            this.tier = CustomerTier.BRONZE;
        }
    }
}
