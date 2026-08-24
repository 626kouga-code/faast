package com.example.trelloapp.card;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CardService {

    private final CardRepository cardRepository;

    public CardService(CardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    public List<Card> findAll() {
        return cardRepository.findAll();
    }

    public Optional<Card> findById(Long id) {
        return cardRepository.findById(id);
    }

    public List<Card> findByBoardId(Long boardId) {
        return cardRepository.findByBoardId(boardId);
    }

    public List<Card> search(Long boardId, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return findByBoardId(boardId);
        }
        return cardRepository
                .findByBoardIdAndTitleContainingIgnoreCaseOrBoardIdAndDescriptionContainingIgnoreCase(
                        boardId, keyword, boardId, keyword);
    }
}
