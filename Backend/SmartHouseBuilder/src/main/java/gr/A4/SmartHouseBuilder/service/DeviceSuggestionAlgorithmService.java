package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeviceSuggestionAlgorithmService {

    private final HardwareDeviceRepository deviceRepository;

    public DeviceSuggestionAlgorithmService(HardwareDeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public List<HardwareDevice> getSmartSuggestions(String criteriaString) {
        Map<String, String> criteria = parseCriteriaString(criteriaString);

        double budget = extractBudget(criteria.getOrDefault("Buget", "0"));
        String desiredCategoriesStr = criteria.getOrDefault("Categorii dorite", "Toate");
        String ecosystem = criteria.getOrDefault("Ecosistem", "Oricare");
        String level = criteria.getOrDefault("Nivel", "Oricare");

        List<HardwareDevice> allDevices = deviceRepository.findAll();

        List<HardwareDevice> filteredByEcosystem = filterByEcosystem(allDevices, ecosystem);
        List<HardwareDevice> filteredByLevel = filterByLevel(filteredByEcosystem, level);

        // AM ADAGUAT 'ecosystem' AICI:
        List<HardwareDevice> filteredByCategory = filterByTargetCategories(filteredByLevel, desiredCategoriesStr, ecosystem);

        return buildBalancedSetupWithinBudget(filteredByCategory, budget);
    }

    // --- METODE DE SUPORT ---

    private Map<String, String> parseCriteriaString(String text) {
        Map<String, String> map = new HashMap<>();
        if (text == null || text.isEmpty()) return map;

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
        if (ecosystem.equalsIgnoreCase("Oricare")) return devices;

        return devices.stream().filter(d -> {
            String protocol = d.getCommunicationProtocol() != null ? d.getCommunicationProtocol().toUpperCase() : "";
            String brand = d.getBrand() != null ? d.getBrand().toLowerCase() : "";

            if (ecosystem.toLowerCase().contains("apple")) {
                if (brand.contains("amazon") || brand.contains("google") || brand.contains("samsung")) return false;
                if (brand.contains("apple") || protocol.equals("THREAD") || protocol.equals("MATTER")) return true;

                String specs = d.getSpecifications() != null ? d.getSpecifications().toLowerCase() : "";
                String desc = d.getDescription() != null ? d.getDescription().toLowerCase() : "";
                if (protocol.equals("WIFI") || protocol.equals("BLUETOOTH")) {
                    return specs.contains("homekit") || specs.contains("airplay") || desc.contains("homekit") || desc.contains("airplay");
                }
                return false;
            }
            else if (ecosystem.toLowerCase().contains("google")) {
                if (brand.contains("amazon") || brand.contains("apple")) return false;
                return protocol.equals("WIFI") || protocol.equals("MATTER") || protocol.equals("ZIGBEE");
            }
            else if (ecosystem.toLowerCase().contains("alexa") || ecosystem.toLowerCase().contains("amazon")) {
                if (brand.contains("google") || brand.contains("apple")) return false;
                return protocol.equals("WIFI") || protocol.equals("MATTER") || protocol.equals("ZIGBEE");
            }
            return true;
        }).collect(Collectors.toList());
    }

    private List<HardwareDevice> filterByLevel(List<HardwareDevice> devices, String level) {
        if (level.equalsIgnoreCase("Oricare")) return devices;

        return devices.stream().filter(d -> {
            String specs = d.getSpecifications() != null ? d.getSpecifications().toLowerCase() : "";

            if (level.equalsIgnoreCase("Plug & Play") || level.toLowerCase().contains("beginner")) {
                if (specs.contains("\"power_source\":\"poe\"") || specs.contains("\"power_source\":\"wired\"") || specs.contains("\"storage_type\":\"nvr\"") || specs.contains("in_wall") || specs.contains("relay")) {
                    return false;
                }
                return true;
            } else if (level.equalsIgnoreCase("Intermediate")) {
                if (specs.contains("\"power_source\":\"poe\"")) return false;
                return true;
            } else if (level.equalsIgnoreCase("DIY / Custom") || level.toLowerCase().contains("pro")) {
                return true;
            }
            return true;
        }).collect(Collectors.toList());
    }

    private List<HardwareDevice> filterByTargetCategories(List<HardwareDevice> devices, String categoriesStr, String ecosystem) {
        if (categoriesStr.equalsIgnoreCase("Toate") || categoriesStr.equalsIgnoreCase("Oricare")) return devices;

        List<String> requestedCats = Arrays.stream(categoriesStr.split(","))
                .map(String::trim).map(String::toLowerCase).toList();

        return devices.stream().filter(d -> {
            int cid = d.getCategoryId();
            String specs = d.getSpecifications() != null ? d.getSpecifications().toLowerCase() : "";
            boolean include = false;

            // Hub-urile (5) si Routerele (12) raman infrastructura de baza
            if (cid == 5 || cid == 12) include = true;

            // FORȚARE CREIER (BRAIN INJECTION): Boxele din Cat 9 specifice ecosistemului trec automat
            if (cid == 9 && !ecosystem.equalsIgnoreCase("Oricare")) {
                String brand = d.getBrand() != null ? d.getBrand().toLowerCase() : "";
                if (ecosystem.toLowerCase().contains("apple") && brand.contains("apple")) include = true;
                if (ecosystem.toLowerCase().contains("google") && brand.contains("google")) include = true;
                if (ecosystem.toLowerCase().contains("alexa") && brand.contains("amazon")) include = true;
            }

            if (requestedCats.contains("security")) {
                if (cid == 1) include = true;
                if (cid == 8 && (specs.contains("smoke") || specs.contains("gas") || specs.contains("contact") || specs.contains("motion") || specs.contains("water_leak"))) include = true;
            }
            if (requestedCats.contains("comfort")) {
                if (cid == 4 || cid == 11) include = true;
                if (cid == 8 && (specs.contains("temperature") || specs.contains("humidity") || specs.contains("luminance") || specs.contains("motion"))) include = true;
            }
            if (requestedCats.contains("energy")) {
                if (cid == 2 || cid == 7) include = true;
                if (cid == 8 && specs.contains("water_leak")) include = true;
            }
            if (requestedCats.contains("entertainment")) {
                if (cid == 3 || cid == 6 || cid == 9 || cid == 10) include = true;
            }

            return include;
        }).collect(Collectors.toList());
    }

    private List<HardwareDevice> buildBalancedSetupWithinBudget(List<HardwareDevice> availableDevices, double maxBudget) {
        Map<Integer, Queue<HardwareDevice>> groupedDevices = new HashMap<>();

        for (HardwareDevice d : availableDevices) {
            groupedDevices.computeIfAbsent(d.getCategoryId(), k -> new LinkedList<>()).add(d);
        }

        for (Queue<HardwareDevice> q : groupedDevices.values()) {
            ((LinkedList<HardwareDevice>) q).sort(Comparator.comparing(d -> d.getPrice() != null ? d.getPrice() : Double.MAX_VALUE));
        }

        List<HardwareDevice> recommendedSetup = new ArrayList<>();
        double currentTotal = 0.0;

        // CATEGORII UNDE VREM MAXIM 1 PRODUS: Hub-uri (5), Aspiratoare (11), Routere (12)
        List<Integer> singleItemCategories = Arrays.asList(5, 11, 12);
        Map<Integer, Integer> categoryCount = new HashMap<>();

        boolean addedInRound;
        do {
            addedInRound = false;
            // Folosim un ArrayList nou pentru a putea sterge elemente din Map in timp ce il parcurgem
            for (Integer catId : new ArrayList<>(groupedDevices.keySet())) {
                Queue<HardwareDevice> queue = groupedDevices.get(catId);

                if (queue != null && !queue.isEmpty()) {

                    // LIMITARE CANTITATE (DEDUPLICARE)
                    if (singleItemCategories.contains(catId) && categoryCount.getOrDefault(catId, 0) >= 1) {
                        groupedDevices.remove(catId); // Eliminam categoria din rotatie definitiv
                        continue;
                    }

                    HardwareDevice candidate = queue.peek();
                    double price = candidate.getPrice() != null ? candidate.getPrice() : 0.0;

                    if (price > 0 && currentTotal + price <= maxBudget) {
                        recommendedSetup.add(queue.poll());
                        currentTotal += price;
                        categoryCount.put(catId, categoryCount.getOrDefault(catId, 0) + 1);
                        addedInRound = true;
                    } else if (price == 0) {
                        queue.poll(); // Sarim peste produsele cu pret invalid
                        addedInRound = true;
                    } else {
                        // Produsul e prea scump. Fiind sortate crescator, inseamna ca toate
                        // celelalte produse ramase in aceasta categorie sunt prea scumpe.
                        queue.clear();
                    }
                }
            }
        } while (addedInRound);

        System.out.println("Suma totala a setup-ului smart diversificat: " + currentTotal + " EUR");
        return recommendedSetup;
    }
}