package gr.A4.SmartHouseBuilder.team2.service;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class LayoutService {

    private final ConcurrentHashMap<Long, StoredLayout> store = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);

    public Long saveLayout(SetupBuildDTO payload) {
        long id = idSequence.getAndIncrement();
        StoredLayout entry = new StoredLayout(id, Instant.now(), payload);
        store.put(id, entry);
        return id;
    }

    public List<StoredLayout> getAllLayouts() {
        return store.values().stream()
                .sorted(Comparator.comparing(StoredLayout::id))
                .toList();
    }
}
