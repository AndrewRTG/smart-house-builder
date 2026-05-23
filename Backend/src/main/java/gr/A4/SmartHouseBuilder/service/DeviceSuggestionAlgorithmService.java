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
        String desiredCategoriesStr = criteria.getOrDefault("Categorii dorite", "Toate");
        String ecosystem = criteria.getOrDefault("Ecosistem", ORICARE);
        String level = criteria.getOrDefault("Nivel", ORICARE);

        // NOU: Aflam exact ce categorii ii trebuie inainte sa mergem la baza de date
        List<Integer> allowedCategoryIds = determineAllowedCategoryIds(desiredCategoriesStr);

        // NOU: Bugetul cu tot cu marja ta de toleranta de 5%
        double maxAllowedPrice = budget > 0 ? budget + (budget * 0.05) : 0.0;

        // NOU: Interogarea inteligenta in loc de findAll()
        List<HardwareDevice> dbCandidates = deviceRepository.findCandidatesForAlgorithm(allowedCategoryIds, maxAllowedPrice);

        // Continuam cu filtrarea fina in memorie pe setul redus de date
        List<HardwareDevice> filteredByEcosystem = filterByEcosystem(dbCandidates, ecosystem);
        List<HardwareDevice> filteredByLevel = filterByLevel(filteredByEcosystem, level);
        List<HardwareDevice> filteredByCategory = filterByTargetCategories(filteredByLevel, desiredCategoriesStr, ecosystem);

        return buildBalancedSetupWithinBudget(filteredByCategory, budget);
    }

    // --- METODA NOUA ---
    // Transforma cuvintele in ID-uri pentru baza de date
    private List<Integer> determineAllowedCategoryIds(String categoriesStr) {
        if (categoriesStr.equalsIgnoreCase("Toate") || categoriesStr.equalsIgnoreCase(ORICARE)) {
            // Daca vrea toate, returnam toate cele 12 ID-uri posibile (sau cate ai in total)
            return Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        }

        List<String> requestedCats = Arrays.stream(categoriesStr.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .toList();

        List<Integer> ids = new ArrayList<>();

        // Hub-urile (5) si Routerele (12) sunt fundatia oricarei case smart, le cerem mereu
        ids.add(5);
        ids.add(12);

        if (requestedCats.contains("security")) {
            ids.addAll(Arrays.asList(1, 8)); // Camere si Senzori
        }
        if (requestedCats.contains("comfort")) {
            ids.addAll(Arrays.asList(4, 11, 8)); // Electrocasnice, Aspiratoare, Senzori
        }
        if (requestedCats.contains("energy")) {
            ids.addAll(Arrays.asList(2, 7, 8)); // Prelungitoare, Prize, Senzori
        }
        if (requestedCats.contains("entertainment")) {
            ids.addAll(Arrays.asList(3, 6, 9, 10)); // Console, Monitoare, Boxe, TV
        }

        // Eliminam duplicatele in caz ca a cerut si security si comfort (amandoi folosesc senzori = 8)
        return ids.stream().distinct().collect(Collectors.toList());
    }

    private Map<String, String> parseCriteriaString(String text) {
        Map<String, String> map = new HashMap<>();
        if (text == null || text.isEmpty()) {
            return map;
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

        // Categoriile 5 (Hub) si 12 (Router) sunt mereu incluse by default
        if (cid == 5 || cid == 12) {
            return true;
        }

        // Verificare specifica pentru boxe smart
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
        Map<Integer, Queue<HardwareDevice>> groupedDevices = groupAndSortDevices(availableDevices);

        List<HardwareDevice> recommendedSetup = new ArrayList<>();
        double[] currentTotal = {0.0}; // Folosim un array pentru a putea modifica valoarea din metoda ajutatoare

        Map<Integer, Double> basePricePerCategory = new HashMap<>();
        Map<Integer, Integer> categoryCount = new HashMap<>();

        boolean addedInRound;
        do {
            addedInRound = false;
            for (Integer catId : new ArrayList<>(groupedDevices.keySet())) {
                boolean itemAdded = processCategoryRound(
                        catId, groupedDevices, recommendedSetup, currentTotal,
                        basePricePerCategory, categoryCount, maxBudget
                );

                if (itemAdded) {
                    addedInRound = true;
                }
            }
        } while (addedInRound);

        recommendedSetup.sort(Comparator.comparing(HardwareDevice::getCategoryId));
        System.out.println("Lista de sugestii generata cu succes (Capacitate maxima simulata: " + currentTotal[0] + " EUR)");
        return recommendedSetup;
    }

    private Map<Integer, Queue<HardwareDevice>> groupAndSortDevices(List<HardwareDevice> devices) {
        Map<Integer, Queue<HardwareDevice>> grouped = new HashMap<>();
        for (HardwareDevice d : devices) {
            grouped.computeIfAbsent(d.getCategoryId(), k -> new LinkedList<>()).add(d);
        }

        for (Queue<HardwareDevice> q : grouped.values()) {
            ((LinkedList<HardwareDevice>) q).sort(Comparator.comparing(d -> d.getPrice() != null ? d.getPrice() : Double.MAX_VALUE));
        }
        return grouped;
    }

    private boolean processCategoryRound(
            Integer catId, Map<Integer, Queue<HardwareDevice>> groupedDevices,
            List<HardwareDevice> recommendedSetup, double[] currentTotal,
            Map<Integer, Double> basePricePerCategory, Map<Integer, Integer> categoryCount,
            double maxBudget) {

        Queue<HardwareDevice> queue = groupedDevices.get(catId);
        if (queue == null || queue.isEmpty()) {
            return false;
        }

        if (categoryCount.getOrDefault(catId, 0) >= 3) {
            groupedDevices.remove(catId);
            return false;
        }

        HardwareDevice candidate = queue.peek();
        assert candidate != null;
        double price = candidate.getPrice() != null ? candidate.getPrice() : 0.0;

        if (price <= 0) {
            queue.poll();
            return true;
        }

        double costToCompute = calculateUpgradeCost(catId, price, basePricePerCategory);

        if (currentTotal[0] + costToCompute <= maxBudget + (maxBudget * 0.05)) {
            recommendedSetup.add(queue.poll());
            currentTotal[0] += costToCompute;

            basePricePerCategory.putIfAbsent(catId, price);
            categoryCount.put(catId, categoryCount.getOrDefault(catId, 0) + 1);
            return true;
        } else {
            queue.clear();
            return false;
        }
    }

    private double calculateUpgradeCost(Integer catId, double price, Map<Integer, Double> basePricePerCategory) {
        if (!basePricePerCategory.containsKey(catId)) {
            return price; // Setup de baza
        }
        return price - basePricePerCategory.get(catId); // Cost de upgrade
    }
}