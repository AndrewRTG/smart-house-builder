package gr.A4.SmartHouseBuilder.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HouseElements {
    private List<Wall> walls;
    private List<Window> windows;
    private List<Door> doors;
    private List<Device> devices;
    private List<Furniture> furniture;
}