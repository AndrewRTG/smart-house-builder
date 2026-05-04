package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.engine.CompatibilityEngine;
import gr.A4.SmartHouseBuilder.model.*;
import gr.A4.SmartHouseBuilder.model.Point2D;
import gr.A4.SmartHouseBuilder.team2.dto.*;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class LayoutIntegrationService {

    private final CompatibilityEngine compatibilityEngine;

    public List<ValidationResult> verifyTeam2Layout(SetupBuildDTO dto) {
        SetupBuild build = new SetupBuild();
        build.setId(dto.getId());
        build.setScale(dto.getScale());
        build.setMaxBudget(dto.getMaxBudget());
        build.setTargetEcosystem(dto.getTargetEcosystem());

        // Conversie rooms
        if (dto.getRooms() != null) {
            build.setRooms(dto.getRooms().stream()
                    .map(this::convertRoomDTOToRoom)
                    .collect(Collectors.toList()));
        }

        // Conversie devices
        if (dto.getDevices() != null) {
            build.setDevices(dto.getDevices().stream()
                    .map(this::convertPlacedDeviceDTOToPlacedDevice)
                    .collect(Collectors.toList()));
        }

        return compatibilityEngine.runAllChecks(build);
    }

    private Room convertRoomDTOToRoom(RoomDTO dto) {
        Room room = new Room();
        room.setId(dto.getId());
        room.setSquareMeters(dto.getSquareMeters());
        room.setWallType(dto.getWallType());

        if (dto.getWalls() != null) {
            room.setWalls(dto.getWalls().stream()
                    .map(this::convertWallDTOToSegment2D)
                    .collect(Collectors.toList()));
        }

        if (dto.getDoors() != null) {
            room.setDoors(dto.getDoors().stream()
                    .map(this::convertPointDTOToSegment2D)
                    .collect(Collectors.toList()));
        }

        if (dto.getWindows() != null) {
            room.setWindows(dto.getWindows().stream()
                    .map(this::convertWindowDTOToSegment2D)
                    .collect(Collectors.toList()));
        }

        if (dto.getPlugs() != null) {
            room.setPlugs(dto.getPlugs().stream()
                    .map(this::convertPointDTOToPoint2D)
                    .collect(Collectors.toList()));
        }

        return room;
    }

    private PlacedDevice convertPlacedDeviceDTOToPlacedDevice(PlacedDeviceDTO dto) {
        PlacedDevice placedDevice = new PlacedDevice();
        placedDevice.setCoordinates(convertPointDTOToPoint2D(dto.getCoordinates()));
        placedDevice.setRotationAngle(dto.getRotationAngle());
        placedDevice.setDevice(convertDeviceDTOToDevice(dto.getDevice()));
        return placedDevice;
    }

    private Device convertDeviceDTOToDevice(DeviceDTO dto) {
        Device device = new Device();
        device.setId(dto.getId());
        device.setName(dto.getName());
        device.setPrice(dto.getPrice());
        device.setEcosystem(dto.getEcosystem());
        device.setProtocol(dto.getProtocol());
        device.setLumens(dto.getLumens() != null ? dto.getLumens().doubleValue() : null);
        device.setRequiresPlug(dto.getRequiresPlug());
        device.setRangeRadius(dto.getRangeRadius());
        device.setDeviceType(dto.getDeviceType());
        device.setMountType(dto.getMountType());
        device.setFieldOfView(dto.getFieldOfView());
        device.setPowerConsumption(dto.getPowerConsumption());
        device.setComunicationFrequency(dto.getCommunicationFrequency());
        device.setWidth(dto.getWidth());
        return device;
    }

    private Point2D convertPointDTOToPoint2D(PointDTO dto) {
        if (dto == null) return null;
        Point2D point = new Point2D();
        point.setX(dto.getX());
        point.setY(dto.getY());
        return point;
    }

    private Segment2D convertWallDTOToSegment2D(WallDTO dto) {
        Segment2D segment = new Segment2D();
        segment.setX1(dto.getX1());
        segment.setY1(dto.getY1());
        segment.setX2(dto.getX2());
        segment.setY2(dto.getY2());
        return segment;
    }

    private Segment2D convertPointDTOToSegment2D(PointDTO dto) {
        Segment2D segment = new Segment2D();
        segment.setX1(dto.getX());
        segment.setY1(dto.getY());
        segment.setX2(dto.getX());
        segment.setY2(dto.getY());
        return segment;
    }

    private Segment2D convertWindowDTOToSegment2D(WindowDTO dto) {
        Segment2D segment = new Segment2D();
        segment.setX1(dto.getX());
        segment.setY1(dto.getY());
        segment.setX2(dto.getX() + dto.getWidth());
        segment.setY2(dto.getY() + dto.getHeight());
        return segment;
    }
}