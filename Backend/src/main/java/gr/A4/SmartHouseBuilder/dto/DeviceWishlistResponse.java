package gr.A4.SmartHouseBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceWishlistResponse {
    private Long id;
    private Integer deviceId;
    private String deviceName;
    private String deviceBrand;
    private String deviceImageUrl;
    private Double deviceBestPrice;
    private LocalDateTime createdAt;
}