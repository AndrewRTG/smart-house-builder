package gr.A4.SmartHouseBuilder.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "price_history")
public class PriceHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    private String storeName;
    private Double price;
    private String productUrl;
    private LocalDateTime scrapedAt;

    public PriceHistory (){}

}
