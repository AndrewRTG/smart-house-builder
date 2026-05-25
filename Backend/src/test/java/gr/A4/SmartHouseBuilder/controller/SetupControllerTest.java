package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.SetupStatus;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.CommentRepository;
import gr.A4.SmartHouseBuilder.repository.LikeRepository;
import gr.A4.SmartHouseBuilder.repository.WishlistRepository;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.SetupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SetupController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class SetupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SetupService setupService;

    @MockitoBean
    private LikeRepository likeRepository;

    @MockitoBean
    private WishlistRepository wishlistRepository;

    @MockitoBean
    private CommentRepository commentRepository;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    private Setup mockSetup;

    @BeforeEach
    void setUp() {
        User mockUser = new User();
        mockUser.setId(10L);
        mockUser.setUsername("catalin");

        mockSetup = Setup.builder()
                .id(1L)
                .name("Living Room Setup")
                .description("Super setup de test")
                .deviceIds("[1, 2, 3]")
                .publicSetup(true)
                .status(SetupStatus.PUBLISHED)
                .user(mockUser)
                .build();

        when(likeRepository.countBySetupId(1L)).thenReturn(10L);
        when(wishlistRepository.countBySetupId(1L)).thenReturn(5L);
        when(commentRepository.countBySetupId(1L)).thenReturn(3L);
    }

    @Test
    @WithMockUser(username = "catalin")
    void createSetup_ReturnsCreated() throws Exception {
        String requestBody = """
                {
                    "name": "Living Room Setup",
                    "description": "Super setup de test",
                    "deviceIds": [1, 2, 3]
                }
                """;

        when(setupService.createSetup(eq("catalin"), any())).thenReturn(mockSetup);

        mockMvc.perform(post("/api/v1/setups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Living Room Setup"))
                .andExpect(jsonPath("$.authorUsername").value("catalin"))
                .andExpect(jsonPath("$.likeCount").value(10));
    }

    @Test
    void getSetup_ReturnsOk() throws Exception {
        when(setupService.getSetup(1L)).thenReturn(mockSetup);

        mockMvc.perform(get("/api/v1/setups/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Living Room Setup"));
    }

    @Test
    @WithMockUser(username = "catalin")
    void updateSetup_ReturnsOk() throws Exception {
        String requestBody = """
                {
                    "name": "Living Room Setup Modificat",
                    "description": "Alt descriere",
                    "deviceIds": [1, 2]
                }
                """;

        when(setupService.updateSetup(eq(1L), eq("catalin"), any())).thenReturn(mockSetup);

        mockMvc.perform(put("/api/v1/setups/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "catalin")
    void deleteSetup_ReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/setups/1"))
                .andExpect(status().isNoContent());

        verify(setupService).deleteSetup(1L, "catalin");
    }

    @Test
    @WithMockUser(username = "catalin")
    void copySetup_ReturnsCreated() throws Exception {
        String requestBody = """
                {
                    "name": "Setup Copiat"
                }
                """;

        when(setupService.copySetup(eq(1L), eq("catalin"), eq("Setup Copiat"))).thenReturn(mockSetup);

        mockMvc.perform(post("/api/v1/setups/1/copy")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Living Room Setup"));
    }

    @Test
    @WithMockUser(username = "catalin")
    void publishSetup_ReturnsOk() throws Exception {
        when(setupService.publishSetup(eq(1L), eq("catalin"), any())).thenReturn(mockSetup);

        mockMvc.perform(put("/api/v1/setups/1/publish"))
                .andExpect(status().isOk());
    }

    @Test
    void getPublicSetups_ReturnsOk() throws Exception {
        var page = new PageImpl<>(List.of(mockSetup));
        when(setupService.getPublicSetups(any(PageRequest.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/setups?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Living Room Setup"));
    }

    @Test
    @WithMockUser(username = "catalin")
    void getUserSetups_ReturnsOk() throws Exception {
        when(setupService.getUserSetups("catalin")).thenReturn(List.of(mockSetup));

        mockMvc.perform(get("/api/v1/setups/user/my-setups"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Living Room Setup"));
    }

    @Test
    @WithMockUser(username = "catalin")
    void getUserDrafts_ReturnsOk() throws Exception {
        var page = new PageImpl<>(List.of(mockSetup));
        when(setupService.getUserDrafts(eq("catalin"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/setups/user/drafts?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Living Room Setup"));
    }

    @Test
    @WithMockUser(username = "catalin")
    void getUserPublished_ReturnsOk() throws Exception {
        var page = new PageImpl<>(List.of(mockSetup));
        when(setupService.getUserPublished(eq("catalin"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/setups/user/published?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Living Room Setup"));
    }
}
