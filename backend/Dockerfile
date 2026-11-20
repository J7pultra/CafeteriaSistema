# syntax=docker/dockerfile:1.4
# ==============================================================================
# Stage 1: Build & Dependency Resolution
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Cache maven dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Build application JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# Extract Spring Boot layered JAR for optimal Docker caching
WORKDIR /workspace/target
RUN java -Djarmode=layertools -jar coffee-enterprise-backend-1.0.0-SNAPSHOT.jar extract

# ==============================================================================
# Stage 2: Minimal Production Runtime
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-privileged system user and group
RUN addgroup -S spring && adduser -S spring -G spring

# Copy extracted layers from builder
COPY --from=builder --chown=spring:spring /workspace/target/dependencies/ ./
COPY --from=builder --chown=spring:spring /workspace/target/spring-boot-loader/ ./
COPY --from=builder --chown=spring:spring /workspace/target/snapshot-dependencies/ ./
COPY --from=builder --chown=spring:spring /workspace/target/application/ ./

USER spring:spring

EXPOSE 8080

# Configure JVM flags optimized for container environments
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
