package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DeviceSuggestionAlgorithmService {

    private static final String ORICARE ="Oricare";
    private static final String APPLE="apple";
    private static final String GOOGLE="google";
    private static final String AMAZON="amazon";
    private static final String MATTER="MATTER";

    private final HardwareDeviceRepository deviceRepository;

    public DeviceSuggestionAlgorithmService(HardwareDeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public List<HardwareDevice> getSmartSuggestions(String criteriaString) {
        Map<String, String> criteria = parseCriteriaString(criteriaString);

        double budget = extractBudget(criteria.getOrDefault("Buget", "0"));
        String desiredCategoriesStr = criteria.getOrDefault("Categorii", criteria.getOrDefault("Categorii dorite", "Toate"));
        String ecosystem = criteria.getOrDefault("Ecosistem", ORICARE);
        String level = criteria.getOrDefault("Nivel", ORICARE);

        List<Integer> allowedCategoryIds = determineAllowedCategoryIds(desiredCategoriesStr);
        double maxAllowedPrice = budget > 0 ? budget + (budget * 0.05) : 0.0;
        List<HardwareDevice> dbCandidates = new ArrayList<>(deviceRepository.findCandidatesForAlgorithm(allowedCategoryIds, maxAllowedPrice));

        String cameraDataJson = criteria.getOrDefault("CameraData", "");
        if (!cameraDataJson.isEmpty()) {
            List<Long> existingDeviceIds = extractDeviceIdsFromCameraData(cameraDataJson);
            if (!existingDeviceIds.isEmpty()) {
                dbCandidates.removeIf(device -> existingDeviceIds.contains(device.getId()));
            }
        }

        List<HardwareDevice> filteredByEcosystem = filterByEcosystem(dbCandidates, ecosystem);
        List<HardwareDevice> filteredByLevel = filterByLevel(filteredByEcosystem, level);
        List<HardwareDevice> filteredByCategory = filterByTargetCategories(filteredByLevel, desiredCategoriesStr, ecosystem);

        return buildBalancedSetupWithinBudget(filteredByCategory, budget);
    }

    private Map<String, String> parseCriteriaString(String text) {
        Map<String, String> map = new HashMap<>();
        if (text == null || text.isEmpty()) {
            return map;
        }

        if (text.contains("CameraData:")) {
            int start = text.indexOf("CameraData:") + 11;
            int end = text.indexOf(". Buget:");
            if (end == -1) {
                end = text.indexOf(" Buget:");
            }

            if (end != -1 && start < end) {
                String json = text.substring(start, end).trim();
                map.put("CameraData", json);
                text = text.substring(0, text.indexOf("CameraData:")) + text.substring(end);
            }
        }

        String[] parts = text.split("\\.\\s*");
        for (String part : parts) {
            String[] keyValue = part.split(":\\s*", 2);
            if (keyValue.length == 2) {
                map.put(keyValue[0].trim(), keyValue[1].trim());
            }
        }
        return map;
    }

    private List<Integer> determineAllowedCategoryIds(String categoriesStr) {
        if (categoriesStr.equalsIgnoreCase("Toate") || categoriesStr.equalsIgnoreCase(ORICARE)) {
            return Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        }

        List<String> requestedCats = Arrays.stream(categoriesStr.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .toList();

        List<Integer> ids = new ArrayList<>();
        ids.add(5);
        ids.add(12);

        if (requestedCats.contains("security")) {
            ids.addAll(Arrays.asList(1, 8));
        }
        if (requestedCats.contains("comfort")) {
            ids.addAll(Arrays.asList(4, 11, 8));
        }
        if (requestedCats.contains("energy")) {
            ids.addAll(Arrays.asList(2, 7, 8));
        }
        if (requestedCats.contains("entertainment")) {
            ids.addAll(Arrays.asList(3, 6, 9, 10));
        }

        return ids.stream().distinct().collect(Collectors.toList());
    }

    private List<Long> extractDeviceIdsFromCameraData(String json) {
        List<Long> ids = new ArrayList<>();
        if (json == null || json.isBlank()) {
            return ids;
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);
            JsonNode devicesNode = root.path("devices");

            if (devicesNode.isArray()) {
                for (JsonNode node : devicesNode) {
                    if (node.has("id")) {
                        try {
                            ids.add(Long.parseLong(node.get("id").asText()));
                        } catch (NumberFormatException e) {
                        }
                    }
                }
            }
        } catch (Exception e) {
        }
        return ids;
    }

    private double extractBudget(String budgetStr) {
        String cleanNumber = budgetStr.replaceAll("[^0-9.]", "");
        try {
            return cleanNumber.isEmpty() ? 0.0 : Double.parseDouble(cleanNumber);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private List<HardwareDevice> filterByEcosystem(List<HardwareDevice> devices, String ecosystem) {
        if (ecosystem.equalsIgnoreCase(ORICARE)) {
            return devices;
        }

        String targetEco = ecosystem.toLowerCase();

        return devices.stream().filter(d -> {
            String protocol = d.getCommunicationProtocol() != null ? d.getCommunicationProtocol().toUpperCase() : "";
            String brand = d.getBrand() != null ? d.getBrand().toLowerCase() : "";

            if (targetEco.contains(APPLE)) {
                return isCompatibleWithApple(d, brand, protocol);
            } else if (targetEco.contains(GOOGLE)) {
                return isCompatibleWithGoogle(brand, protocol);
            } else if (targetEco.contains("alexa") || targetEco.contains(AMAZON)) {
                return isCompatibleWithAlexa(brand, protocol);
            }
            return true;
        }).collect(Collectors.toList());
    }

    private boolean isCompatibleWithApple(HardwareDevice d, String brand, String protocol) {
        if (brand.contains(AMAZON) || brand.contains(GOOGLE) || brand.contains("samsung")) {
            return false;
        }
        if (brand.contains(APPLE) || protocol.equals("THREAD") || protocol.equals(MATTER)) {
            return true;
        }

        String specs = d.getSpecifications() != null ? d.getSpecifications().toLowerCase() : "";
        String desc = d.getDescription() != null ? d.getDescription().toLowerCase() : "";

        if (protocol.equals("WIFI") || protocol.equals("BLUETOOTH")) {
            return specs.contains("homekit") || specs.contains("airplay") || desc.contains("homekit") || desc.contains("airplay");
        }
        return false;
    }

    private boolean isCompatibleWithGoogle(String brand, String protocol) {
        if (brand.contains(AMAZON) || brand.contains(APPLE)) {
            return false;
        }
        return protocol.equals("WIFI") || protocol.equals(MATTER) || protocol.equals("ZIGBEE");
    }

    private boolean isCompatibleWithAlexa(String brand, String protocol) {
        if (brand.contains(GOOGLE) || brand.contains(APPLE)) {
            return false;
        }
        return protocol.equals("WIFI") || protocol.equals(MATTER) || protocol.equals("ZIGBEE");
    }

    private List<HardwareDevice> filterByLevel(List<HardwareDevice> devices, String level) {
        if (level.equalsIgnoreCase(ORICARE)) {
            return devices;
        }

        return devices.stream().filter(d -> {
            String specs = d.getSpecifications() != null ? d.getSpecifications().toLowerCase() : "";

            if (level.equalsIgnoreCase("Plug & Play") || level.toLowerCase().contains("beginner")) {
                return !specs.contains("\"power_source\":\"poe\"") && !specs.contains("\"power_source\":\"wired\"")
                        && !specs.contains("\"storage_type\":\"nvr\"") && !specs.contains("in_wall") && !specs.contains("relay");
            } else if (level.equalsIgnoreCase("Intermediate")) {
                return !specs.contains("\"power_source\":\"poe\"");
            } else {
                return true;
            }
        }).collect(Collectors.toList());
    }

    private List<HardwareDevice> filterByTargetCategories(List<HardwareDevice> devices, String categoriesStr, String ecosystem) {
        if (categoriesStr.equalsIgnoreCase("Toate") || categoriesStr.equalsIgnoreCase(ORICARE)) {
            return devices;
        }

        List<String> requestedCats = Arrays.stream(categoriesStr.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .toList();

        return devices.stream()
                .filter(d -> isDeviceIncluded(d, requestedCats, ecosystem))
                .collect(Collectors.toList());
    }

    private boolean isDeviceIncluded(HardwareDevice d, List<String> requestedCats, String ecosystem) {
        int cid = d.getCategoryId();

        if (cid == 5 || cid == 12) {
            return true;
        }

        if (cid == 9 && isCompatibleSpeaker(d, ecosystem)) {
            return true;
        }

        String specs = d.getSpecifications() != null ? d.getSpecifications().toLowerCase() : "";

        if (requestedCats.contains("security") && isSecurityDevice(cid, specs)) return true;
        if (requestedCats.contains("comfort") && isComfortDevice(cid, specs)) return true;
        if (requestedCats.contains("energy") && isEnergyDevice(cid, specs)) return true;

        return requestedCats.contains("entertainment") && isEntertainmentDevice(cid);
    }

    private boolean isCompatibleSpeaker(HardwareDevice d, String ecosystem) {
        if (ecosystem.equalsIgnoreCase(ORICARE)) {
            return false;
        }

        String brand = d.getBrand() != null ? d.getBrand().toLowerCase() : "";
        String eco = ecosystem.toLowerCase();

        if (eco.contains(APPLE) && brand.contains(APPLE)) return true;
        if (eco.contains(GOOGLE) && brand.contains(GOOGLE)) return true;
        return eco.contains("alexa") && brand.contains(AMAZON);
    }

    private boolean isSecurityDevice(int cid, String specs) {
        return cid == 1 || (cid == 8 && (specs.contains("smoke") || specs.contains("gas") || specs.contains("contact") || specs.contains("motion") || specs.contains("water_leak")));
    }

    private boolean isComfortDevice(int cid, String specs) {
        return cid == 4 || cid == 11 || (cid == 8 && (specs.contains("temperature") || specs.contains("humidity") || specs.contains("luminance") || specs.contains("motion")));
    }

    private boolean isEnergyDevice(int cid, String specs) {
        return cid == 2 || cid == 7 || (cid == 8 && specs.contains("water_leak"));
    }

    private boolean isEntertainmentDevice(int cid) {
        return cid == 3 || cid == 6 || cid == 9 || cid == 10;
    }

    private List<HardwareDevice> buildBalancedSetupWithinBudget(List<HardwareDevice> availableDevices, double maxBudget) {
        Map<Integer, Queue<HardwareDevice>> groupedDevices = new HashMap<>();

        for (HardwareDevice d : availableDevices) {
            groupedDevices.computeIfAbsent(d.getCategoryId(), k -> new LinkedList<>()).add(d);
        }

        for (Queue<HardwareDevice> q : groupedDevices.values()) {
            ((LinkedList<HardwareDevice>) q).sort(Comparator.comparing(d -> d.getBestPrice() != null ? d.getBestPrice() : Double.MAX_VALUE));
        }

        List<HardwareDevice> recommendedSetup = new ArrayList<>();
        double currentTotal = 0.0;

        Map<Integer, Double> basePricePerCategory = new HashMap<>();
        Map<Integer, Integer> categoryCount = new HashMap<>();

        boolean addedInRound;
        do {
            addedInRound = false;
            for (Integer catId : new ArrayList<>(groupedDevices.keySet())) {
                Queue<HardwareDevice> queue = groupedDevices.get(catId);

                if (queue != null && !queue.isEmpty()) {
                    if (categoryCount.getOrDefault(catId, 0) >= 3) {
                        groupedDevices.remove(catId);
                        continue;
                    }

                    HardwareDevice candidate = queue.peek();
                    assert candidate != null;
                    double price = candidate.getBestPrice() != null ? candidate.getBestPrice() : 0.0;

                    if (price <= 0) {
                        queue.poll();
                        addedInRound = true;
                        continue;
                    }

                    double costToCompute;
                    if (!basePricePerCategory.containsKey(catId)) {
                        costToCompute = price;
                    } else {
                        costToCompute = price - basePricePerCategory.get(catId);
                    }

                    if (currentTotal + costToCompute <= maxBudget + (maxBudget * 0.05)) {
                        recommendedSetup.add(queue.poll());
                        currentTotal += costToCompute;

                        if (!basePricePerCategory.containsKey(catId)) {
                            basePricePerCategory.put(catId, price);
                        }

                        categoryCount.put(catId, categoryCount.getOrDefault(catId, 0) + 1);
                        addedInRound = true;
                    } else {
                        queue.clear();
                    }
                }
            }
        } while (addedInRound);

        recommendedSetup.sort(Comparator.comparing(HardwareDevice::getCategoryId));
        System.out.println("Lista de sugestii generata cu succes (Capacitate maxima simulata: " + currentTotal + " EUR)");
        return recommendedSetup;
    }
}