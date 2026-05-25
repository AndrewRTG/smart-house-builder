package gr.A4.SmartHouseBuilder.team2.util;

import gr.A4.SmartHouseBuilder.model.Device;
import gr.A4.SmartHouseBuilder.model.Point2D;
import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.Room;
import gr.A4.SmartHouseBuilder.model.Segment2D;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.team2.dto.PointDTO;
import gr.A4.SmartHouseBuilder.team2.dto.PlacedDeviceRichDTO;
import gr.A4.SmartHouseBuilder.team2.dto.RoomDTO;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.dto.WallDTO;
import gr.A4.SmartHouseBuilder.team2.dto.WindowDTO;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class ModelMapper {

    public SetupBuild toEngineModel(SetupBuildDTO dto) {
        if (dto == null) {
            return null;
        }

        SetupBuild model = new SetupBuild();
        model.setId(dto.getId());
        model.setScale(dto.getScale());
        model.setMaxBudget(dto.getMaxBudget());
        model.setTargetEcosystem(dto.getTargetEcosystem());

        if (dto.getRooms() != null) {
            model.setRooms(dto.getRooms().stream()
                    .map(this::mapRoom)
                    .collect(Collectors.toList()));
        }

        if (dto.getDevices() != null) {
            model.setDevices(dto.getDevices().stream()
                    .map(this::mapDevice)
                    .collect(Collectors.toList()));
        }
        return model;
    }

    private Room mapRoom(RoomDTO dto) {
        Room room = new Room();
        if (dto == null) {
            return room;
        }

        room.setId(dto.getId());
        room.setSquareMeters(dto.getSquareMeters());
        room.setWallType(dto.getWallType());

        if (dto.getWalls() != null) {
            room.setWalls(dto.getWalls().stream()
                    .map(this::mapWall)
                    .collect(Collectors.toList()));
        }
        if (dto.getDoors() != null) {
            room.setDoors(dto.getDoors().stream()
                    .map(this::mapPointAsSegment)
                    .collect(Collectors.toList()));
        }
        if (dto.getWindows() != null) {
            room.setWindows(dto.getWindows().stream()
                    .map(this::mapWindow)
                    .collect(Collectors.toList()));
        }
        if (dto.getPlugs() != null) {
            room.setPlugs(dto.getPlugs().stream()
                    .map(this::mapPoint)
                    .collect(Collectors.toList()));
        }

        return room;
    }

    private Segment2D mapWall(WallDTO dto) {
        Segment2D segment = new Segment2D();
        if (dto != null) {
            segment.setX1(dto.getX1());
            segment.setY1(dto.getY1());
            segment.setX2(dto.getX2());
            segment.setY2(dto.getY2());
        }
        return segment;
    }

    private Segment2D mapPointAsSegment(PointDTO dto) {
        Segment2D segment = new Segment2D();
        if (dto != null) {
            segment.setX1(dto.getX());
            segment.setY1(dto.getY());
            segment.setX2(dto.getX());
            segment.setY2(dto.getY());
        }
        return segment;
    }

    private Segment2D mapWindow(WindowDTO dto) {
        Segment2D segment = new Segment2D();
        if (dto != null) {
            Double width = dto.getWidth() != null ? dto.getWidth() : 0.0;
            segment.setX1(dto.getX());
            segment.setY1(dto.getY());
            segment.setX2(dto.getX() != null ? dto.getX() + width : null);
            segment.setY2(dto.getY());
        }
        return segment;
    }

    private Point2D mapPoint(PointDTO dto) {
        Point2D point = new Point2D();
        if (dto != null) {
            point.setX(dto.getX());
            point.setY(dto.getY());
        }
        return point;
    }

    private PlacedDevice mapDevice(PlacedDeviceRichDTO dto) {
        PlacedDevice pd = new PlacedDevice();
        Device d = new Device();

        if (dto != null && dto.getDevice() != null) {
            d.setName(dto.getDevice().getName());
            d.setDeviceType(dto.getDevice().getDeviceType());
            d.setEcosystem(dto.getDevice().getEcosystem());
            d.setProtocol(dto.getDevice().getProtocol());
        }

        pd.setDevice(d);
        if (dto != null && dto.getCoordinates() != null) {
            pd.setX(dto.getCoordinates().getX());
            pd.setY(dto.getCoordinates().getY());
        }
        return pd;
    }
}
