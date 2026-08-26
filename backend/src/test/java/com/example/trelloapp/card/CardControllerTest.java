package com.example.trelloapp.card;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.trelloapp.config.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CardController.class)
@Import(SecurityConfig.class)
@WithMockUser
class CardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CardService cardService;

    @MockBean
    private UserDetailsService userDetailsService;

    private Card sampleCard() {
        Card card = new Card();
        card.setId(1L);
        card.setBoardId(1L);
        card.setListId(1L);
        card.setTitle("サンプルカード");
        card.setPosition(1.0);
        return card;
    }

    @Test
    void getCardReturns404WhenNotFound() throws Exception {
        given(cardService.findById(anyLong())).willReturn(Optional.empty());

        mockMvc.perform(get("/api/cards/999")).andExpect(status().isNotFound());
    }

    @Test
    void getCardReturns200WhenFound() throws Exception {
        given(cardService.findById(1L)).willReturn(Optional.of(sampleCard()));

        mockMvc.perform(get("/api/cards/1")).andExpect(status().isOk());
    }

    @Test
    void createCardReturns400WhenTitleBlank() throws Exception {
        CardRequest request = new CardRequest();
        request.setTitle("  ");
        request.setBoardId(1L);
        request.setListId(1L);

        mockMvc
                .perform(
                        post("/api/cards")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createCardReturns201WhenValid() throws Exception {
        CardRequest request = new CardRequest();
        request.setTitle("新しいカード");
        request.setBoardId(1L);
        request.setListId(1L);
        given(cardService.create(any(CardRequest.class))).willReturn(sampleCard());

        mockMvc
                .perform(
                        post("/api/cards")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void updateCardReturns404WhenNotFound() throws Exception {
        CardRequest request = new CardRequest();
        request.setTitle("更新タイトル");
        request.setBoardId(1L);
        request.setListId(1L);
        given(cardService.update(anyLong(), any(CardRequest.class))).willReturn(Optional.empty());

        mockMvc
                .perform(
                        put("/api/cards/999")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteCardReturns204WhenDeleted() throws Exception {
        given(cardService.delete(1L)).willReturn(true);

        mockMvc.perform(delete("/api/cards/1")).andExpect(status().isNoContent());
    }

    @Test
    void deleteCardReturns404WhenNotFound() throws Exception {
        given(cardService.delete(999L)).willReturn(false);

        mockMvc.perform(delete("/api/cards/999")).andExpect(status().isNotFound());
    }

    @Test
    void getCardsWithoutBoardIdReturnsAll() throws Exception {
        given(cardService.findAll()).willReturn(List.of(sampleCard()));

        mockMvc.perform(get("/api/cards")).andExpect(status().isOk());
    }
}
