package com.example.trelloapp.card;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class CardServiceTest {

    @Autowired
    private CardRepository cardRepository;

    private CardService cardService() {
        return new CardService(cardRepository);
    }

    private CardRequest requestFor(String title, Long boardId, Long listId) {
        CardRequest request = new CardRequest();
        request.setTitle(title);
        request.setBoardId(boardId);
        request.setListId(listId);
        return request;
    }

    @Test
    void createAssignsIncrementingPositionWhenNotSpecified() {
        CardService service = cardService();

        Card first = service.create(requestFor("最初のカード", 1L, 1L));
        Card second = service.create(requestFor("次のカード", 1L, 1L));

        assertThat(first.getPosition()).isEqualTo(1.0);
        assertThat(second.getPosition()).isEqualTo(2.0);
    }

    @Test
    void updateChangesFieldsAndReturnsEmptyWhenNotFound() {
        CardService service = cardService();
        Card created = service.create(requestFor("元のタイトル", 1L, 1L));

        CardRequest updateRequest = requestFor("更新後のタイトル", 1L, 2L);
        Optional<Card> updated = service.update(created.getId(), updateRequest);

        assertThat(updated).isPresent();
        assertThat(updated.get().getTitle()).isEqualTo("更新後のタイトル");
        assertThat(updated.get().getListId()).isEqualTo(2L);

        assertThat(service.update(999L, updateRequest)).isEmpty();
    }

    @Test
    void deleteRemovesCardAndReturnsFalseWhenAlreadyGone() {
        CardService service = cardService();
        Card created = service.create(requestFor("削除対象", 1L, 1L));

        assertThat(service.delete(created.getId())).isTrue();
        assertThat(service.findById(created.getId())).isEmpty();
        assertThat(service.delete(created.getId())).isFalse();
    }

    @Test
    void searchFiltersByTitleOrDescriptionWithinBoard() {
        CardService service = cardService();
        CardRequest matching = requestFor("設計書を書く", 1L, 1L);
        matching.setDescription("API仕様をまとめる");
        service.create(matching);
        service.create(requestFor("買い物リスト", 1L, 1L));

        assertThat(service.search(1L, "設計")).hasSize(1);
        assertThat(service.search(1L, "存在しないキーワード")).isEmpty();
        assertThat(service.search(1L, null)).hasSize(2);
    }
}
