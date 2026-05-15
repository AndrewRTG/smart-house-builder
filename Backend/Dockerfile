FROM maven:3-eclipse-temurin-21 AS builder
WORKDIR /build

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

COPY --from=builder /build/target/*.jar app.jar

EXPOSE 20025
ENTRYPOINT ["java", "-jar", "app.jar"]