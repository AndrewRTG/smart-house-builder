package gr.A4.SmartHouseBuilder.dto;

public class DeviceImportDto {

    private String name;
    private Double price;
    private String brand;
    private String description;
    private String imageUrl;
    private String sourceStore;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getSourceStore() { return sourceStore; }
    public void setSourceStore(String sourceStore) { this.sourceStore = sourceStore; }
}