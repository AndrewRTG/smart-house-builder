package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class PhysicalDiscrepancyEngine {

    private static final double MIN_DISTANCE = 0.5; // 0.5 metri între dispozitive
    private static final double HUB_RANGE = 15.0; // 15 metri rază hub

    public List<ValidationResult> runAllChecks(SetupBuild build) {
        List<ValidationResult> results = new ArrayList<>();

        if (build == null || build.getRooms() == null || build.getDevices() == null) {
            return results;
        }

        results.addAll(checkDevicesInRooms(build));
        results.addAll(checkDevicesOnDoorsWindows(build));
        results.addAll(checkLightCoverage(build));
        results.addAll(checkHubRange(build));
        results.addAll(checkDeviceOverlaps(build));

        return results;
    }

    // Verifică dacă toate dispozitivele sunt în interiorul camerelor
    private List<ValidationResult> checkDevicesInRooms(SetupBuild build) {
        List<ValidationResult> results = new ArrayList<>();

        for (PlacedDevice pd : build.getDevices()) {
            if (pd.getX() == null || pd.getY() == null) {
                continue;
            }

            boolean insideAnyRoom = false;
            for (Room room : build.getRooms()) {
                if (isPointInRoom(pd.getX(), pd.getY(), room)) {
                    insideAnyRoom = true;
                    break;
                }
            }

            if (!insideAnyRoom) {
                results.add(new ValidationResult(
                    false,
                    "ERROR",
                    String.format("Dispozitivul '%s' la (%.2f, %.2f) nu se află în nicio cameră",
                        pd.getDevice() != null ? pd.getDevice().getName() : "Unknown",
                        pd.getX(), pd.getY())
                ));
            }
        }

        return results;
    }

    // Verifică ca doar lock-urile să fie pe uși/geamuri
    private List<ValidationResult> checkDevicesOnDoorsWindows(SetupBuild build) {
        List<ValidationResult> results = new ArrayList<>();

        for (PlacedDevice pd : build.getDevices()) {
            if (pd.getX() == null || pd.getY() == null || pd.getDevice() == null) {
                continue;
            }

            String deviceType = pd.getDevice().getDeviceType();
            boolean isLock = deviceType != null &&
                (deviceType.equalsIgnoreCase("door lock") ||
                 deviceType.equalsIgnoreCase("window lock") ||
                 deviceType.toLowerCase().contains("lock"));

            for (Room room : build.getRooms()) {
                // Verifică uși
                if (room.getDoors() != null) {
                    for (Segment2D door : room.getDoors()) {
                        if (isPointOnSegment(pd.getX(), pd.getY(), door)) {
                            if (!isLock) {
                                results.add(new ValidationResult(
                                    false,
                                    "ERROR",
                                    String.format("Dispozitivul '%s' este plasat pe o ușă, dar nu este un lock",
                                        pd.getDevice().getName())
                                ));
                            }
                        }
                    }
                }

                // Verifică ferestre
                if (room.getWindows() != null) {
                    for (Segment2D window : room.getWindows()) {
                        if (isPointOnSegment(pd.getX(), pd.getY(), window)) {
                            if (!isLock) {
                                results.add(new ValidationResult(
                                    false,
                                    "ERROR",
                                    String.format("Dispozitivul '%s' este plasat pe o fereastră, dar nu este un lock",
                                        pd.getDevice().getName())
                                ));
                            }
                        }
                    }
                }
            }
        }

        return results;
    }

    // Verifică acoperirea luminii în cameră
    private List<ValidationResult> checkLightCoverage(SetupBuild build) {
        List<ValidationResult> results = new ArrayList<>();
        final double LIGHT_RADIUS = 4.0; // Un bec acoperă ~4 metri rază

        for (Room room : build.getRooms()) {
            if (room.getSquareMeters() == null) {
                continue;
            }

            // Numără becurile din această cameră
            List<PlacedDevice> lightsInRoom = new ArrayList<>();
            for (PlacedDevice pd : build.getDevices()) {
                if (pd.getDevice() != null) {
                    if (isLightDevice(pd) && isPointInRoom(pd.getX(), pd.getY(), room)) {
                        lightsInRoom.add(pd);
                    }
                }
            }

            // Aproximare: un bec acoperă π * r² = ~50 mp
            double coveragePerLight = Math.PI * LIGHT_RADIUS * LIGHT_RADIUS;
            double requiredLights = Math.ceil(room.getSquareMeters() / coveragePerLight);

            if (lightsInRoom.size() < requiredLights) {
                results.add(new ValidationResult(
                    false,
                    "WARNING",
                    String.format("Camera '%s' (%.2f mp) are doar %d bec(uri), dar necesită cel puțin %d pentru acoperire completă",
                        room.getId(), room.getSquareMeters(), lightsInRoom.size(), (int)requiredLights)
                ));
            }
        }

        return results;
    }

    // Verifică raza hub-ului
    private List<ValidationResult> checkHubRange(SetupBuild build) {
        List<ValidationResult> results = new ArrayList<>();

        // Găsește hub-ul
        PlacedDevice hub = null;
        for (PlacedDevice pd : build.getDevices()) {
            if (pd.getDevice() != null && pd.getDevice().getDeviceType() != null) {
                String type = pd.getDevice().getDeviceType().toLowerCase();
                if (type.contains("hub") || type.contains("gateway")) {
                    hub = pd;
                    break;
                }
            }
        }

        if (hub == null) {
            return results; // Nu există hub, nu verificăm
        }

        // Verifică distanța tuturor dispozitivelor față de hub
        for (PlacedDevice pd : build.getDevices()) {
            if (pd == hub || pd.getX() == null || pd.getY() == null) {
                continue;
            }

            double distance = distanceInMeters(build, hub.getX(), hub.getY(), pd.getX(), pd.getY());
            if (distance > HUB_RANGE) {
                results.add(new ValidationResult(
                    false,
                    "ERROR",
                    String.format("Dispozitivul '%s' la (%.2f, %.2f) este la %.2f metri de hub, peste raza de %.2f metri",
                        pd.getDevice() != null ? pd.getDevice().getName() : "Unknown",
                        pd.getX(), pd.getY(), distance, HUB_RANGE)
                ));
            }
        }

        return results;
    }

    // Verifică suprapunerile între dispozitive
    private List<ValidationResult> checkDeviceOverlaps(SetupBuild build) {
        List<ValidationResult> results = new ArrayList<>();
        List<PlacedDevice> devices = build.getDevices();

        for (int i = 0; i < devices.size(); i++) {
            PlacedDevice dev1 = devices.get(i);
            if (dev1.getX() == null || dev1.getY() == null) continue;

            for (int j = i + 1; j < devices.size(); j++) {
                PlacedDevice dev2 = devices.get(j);
                if (dev2.getX() == null || dev2.getY() == null) continue;

                double dist = distanceInMeters(build, dev1.getX(), dev1.getY(), dev2.getX(), dev2.getY());

                if (dist < MIN_DISTANCE) {
                    boolean canOverlap = canDevicesOverlap(dev1, dev2);
                    if (!canOverlap) {
                        results.add(new ValidationResult(
                            false,
                            "ERROR",
                            String.format("Dispozitivele '%s' și '%s' sunt prea aproape (%.2fm), distanța minimă este %.2fm",
                                dev1.getDevice() != null ? dev1.getDevice().getName() : "Unknown",
                                dev2.getDevice() != null ? dev2.getDevice().getName() : "Unknown",
                                dist, MIN_DISTANCE)
                        ));
                    }
                }
            }
        }

        return results;
    }

    // Helper: verifică dacă un punct este într-o cameră (simplificat - verifică doar bounding box)
    private boolean isPointInRoom(Double x, Double y, Room room) {
        if (x == null || y == null || room.getWalls() == null || room.getWalls().isEmpty()) {
            return false;
        }

        // Calculăm bounding box
        double minX = Double.MAX_VALUE, maxX = Double.MIN_VALUE;
        double minY = Double.MAX_VALUE, maxY = Double.MIN_VALUE;

        for (Segment2D wall : room.getWalls()) {
            minX = Math.min(minX, Math.min(wall.getX1(), wall.getX2()));
            maxX = Math.max(maxX, Math.max(wall.getX1(), wall.getX2()));
            minY = Math.min(minY, Math.min(wall.getY1(), wall.getY2()));
            maxY = Math.max(maxY, Math.max(wall.getY1(), wall.getY2()));
        }

        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }

    // Helper: verifică dacă un punct este pe un segment (cu toleranță)
    private boolean isPointOnSegment(Double x, Double y, Segment2D seg) {
        if (x == null || y == null || seg == null) {
            return false;
        }

        final double TOLERANCE = 0.3; // 30cm toleranță

        double dist = pointToSegmentDistance(x, y, seg.getX1(), seg.getY1(), seg.getX2(), seg.getY2());
        return dist < TOLERANCE;
    }

    // Helper: distanță între 2 puncte
    private double distance(double x1, double y1, double x2, double y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    private double distanceInMeters(SetupBuild build, double x1, double y1, double x2, double y2) {
        return distance(x1, y1, x2, y2) * coordinateUnitToMeters(build);
    }

    private double coordinateUnitToMeters(SetupBuild build) {
        if (build == null || build.getScale() == null) {
            return 1.0;
        }

        String scale = build.getScale().trim().toLowerCase(Locale.ROOT);
        if (scale.equals("cm") || scale.equals("centimeter") || scale.equals("centimeters")) {
            return 0.01;
        }
        if (scale.equals("mm") || scale.equals("millimeter") || scale.equals("millimeters")) {
            return 0.001;
        }
        if (scale.equals("grid") || scale.equals("point") || scale.equals("points")) {
            return 0.5;
        }
        return 1.0;
    }

    private boolean isLightDevice(PlacedDevice pd) {
        if (pd == null || pd.getDevice() == null) {
            return false;
        }

        String name = pd.getDevice().getName() != null ? pd.getDevice().getName().toLowerCase(Locale.ROOT) : "";
        String type = pd.getDevice().getDeviceType() != null ? pd.getDevice().getDeviceType().toLowerCase(Locale.ROOT) : "";

        return name.contains("bec") || name.contains("light") || name.contains("bulb") ||
               type.contains("light") || type.contains("bulb");
    }

    // Helper: distanță de la punct la segment
    private double pointToSegmentDistance(double px, double py, double x1, double y1, double x2, double y2) {
        double dx = x2 - x1;
        double dy = y2 - y1;
        double lengthSquared = dx * dx + dy * dy;

        if (lengthSquared == 0) {
            return distance(px, py, x1, y1);
        }

        double t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        double projX = x1 + t * dx;
        double projY = y1 + t * dy;

        return distance(px, py, projX, projY);
    }

    // Helper: verifică dacă 2 dispozitive se pot suprapune
    private boolean canDevicesOverlap(PlacedDevice dev1, PlacedDevice dev2) {
        if (dev1.getDevice() == null || dev2.getDevice() == null) {
            return false;
        }

        String type1 = dev1.getDevice().getDeviceType() != null ? dev1.getDevice().getDeviceType().toLowerCase() : "";
        String type2 = dev2.getDevice().getDeviceType() != null ? dev2.getDevice().getDeviceType().toLowerCase() : "";

        // Dispozitivele mici (becuri, senzori montați pe tavan/perete) pot fi peste mobilier
        boolean isSmall1 = type1.contains("light") || type1.contains("bulb") ||
                          type1.contains("sensor") || type1.contains("camera");
        boolean isSmall2 = type2.contains("light") || type2.contains("bulb") ||
                          type2.contains("sensor") || type2.contains("camera");

        // Dacă ambele sunt mici, nu se pot suprapune
        if (isSmall1 && isSmall2) {
            return false;
        }

        // Dacă unul este mic și celălalt nu (mobilier), permit suprapunere
        return (isSmall1 && !isSmall2) || (!isSmall1 && isSmall2);
    }
}
