package com.example.trelloapp.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class UserServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        userService = new UserService(userRepository, passwordEncoder);
    }

    private RegisterRequest requestFor(String email, String username, String password) {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(email);
        request.setUsername(username);
        request.setPassword(password);
        return request;
    }

    @Test
    void registerHashesPasswordAndSavesUser() {
        given(userRepository.existsByEmail("test@example.com")).willReturn(false);
        given(passwordEncoder.encode(anyString())).willReturn("hashed-password");
        given(userRepository.save(org.mockito.ArgumentMatchers.any(User.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        User created = userService.register(requestFor("test@example.com", "テストユーザー", "password123"));

        assertThat(created.getEmail()).isEqualTo("test@example.com");
        assertThat(created.getUsername()).isEqualTo("テストユーザー");
        assertThat(created.getPasswordHash()).isEqualTo("hashed-password");
    }

    @Test
    void registerThrowsWhenEmailAlreadyExists() {
        given(userRepository.existsByEmail("dup@example.com")).willReturn(true);

        assertThatThrownBy(() -> userService.register(requestFor("dup@example.com", "誰か", "password123")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
