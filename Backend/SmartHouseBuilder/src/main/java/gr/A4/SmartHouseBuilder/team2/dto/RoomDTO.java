package gr.A4.SmartHouseBuilder.team2.dto;

import lombok.Data;
import java.util.List;

@Data
public class RoomDTO {
    private String id;
    private Double squareMeters;
    private String wallType;
    private List<WallDTO> walls;
    private List<PointDTO> doors;
    private List<WindowDTO> windows;
    private List<PointDTO> plugs;
}
