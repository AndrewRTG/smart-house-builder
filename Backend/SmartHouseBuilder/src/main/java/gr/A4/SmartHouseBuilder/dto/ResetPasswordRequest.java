package gr.A4.SmartHouseBuilder.dto;

public record ResetPasswordRequest(String token, String newPassword) {}