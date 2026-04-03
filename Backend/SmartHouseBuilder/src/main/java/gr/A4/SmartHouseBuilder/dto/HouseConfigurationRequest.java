package gr.A4.SmartHouseBuilder.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import gr.A4.SmartHouseBuilder.model.HouseElements;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HouseConfigurationRequest {
    private String name;
    private String createdAt;
    private HouseElements elements;
}