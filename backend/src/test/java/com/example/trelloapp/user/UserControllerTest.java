package com.example.trelloapp.user;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.trelloapp.config.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    void registerReturns400WhenFieldsMissing() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("");
        request.setUsername("");
        request.setPassword("");

        mockMvc
                .perform(
                        post("/api/users/register")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerReturns400WhenPasswordTooShort() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setUsername("テストユーザー");
        request.setPassword("short");

        mockMvc
                .perform(
                        post("/api/users/register")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerReturns201WhenValid() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setUsername("テストユーザー");
        request.setPassword("password123");

        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setUsername("テストユーザー");
        given(userService.register(any(RegisterRequest.class))).willReturn(user);

        mockMvc
                .perform(
                        post("/api/users/register")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void registerReturns409WhenEmailAlreadyExists() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("dup@example.com");
        request.setUsername("誰か");
        request.setPassword("password123");

        given(userService.register(any(RegisterRequest.class)))
                .willThrow(new IllegalArgumentException("Email already registered"));

        mockMvc
                .perform(
                        post("/api/users/register")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void meReturnsForbiddenWhenNotAuthenticated() throws Exception {
        // SecurityConfigでanyRequest().authenticated()としているため、
        // セッションのない匿名アクセスはコントローラに到達する前にSpring Securityが403を返す
        mockMvc.perform(get("/api/users/me")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void meReturns401WhenAuthenticatedUserNotInRepository() throws Exception {
        given(userRepository.findByEmail("test@example.com")).willReturn(java.util.Optional.empty());

        mockMvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }
}
