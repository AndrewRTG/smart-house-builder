package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.Wishlist;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.WishlistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = WishlistController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class WishlistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WishlistService wishlistService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    private Wishlist mockWishlist;

    @BeforeEach
    void setUp() {
        Setup mockSetup = new Setup();
        mockSetup.setId(1L);
        mockSetup.setName("Dream Setup");

        mockWishlist = new Wishlist();
        mockWishlist.setId(100L);
        mockWishlist.setSetup(mockSetup);
        mockWishlist.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @WithMockUser(username = "marius")
    void toggleWishlist_ReturnsOk() throws Exception {
        when(wishlistService.toggleWishlist(1L, "marius")).thenReturn(true);

        mockMvc.perform(post("/api/v1/setups/1/wishlist"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.setupId").value(1))
                .andExpect(jsonPath("$.wishlisted").value(true));
    }

    @Test
    @WithMockUser(username = "marius")
    void getUserWishlist_ReturnsOk() throws Exception {
        var page = new PageImpl<>(List.of(mockWishlist));
        when(wishlistService.getUserWishlist(eq("marius"), any(PageRequest.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/wishlists?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(100))
                .andExpect(jsonPath("$.content[0].setupName").value("Dream Setup"));
    }

    @Test
    void getWishlistCount_ReturnsOk() throws Exception {
        when(wishlistService.getWishlistCount(1L)).thenReturn(42L);

        mockMvc.perform(get("/api/v1/setups/1/wishlist-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.setupId").value(1))
                .andExpect(jsonPath("$.count").value(42));
    }
}