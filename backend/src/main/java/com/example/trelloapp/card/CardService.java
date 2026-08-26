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
        return cardRepository.findByBoardIdOrderByPositionAsc(boardId);
    }

    public List<Card> search(Long boardId, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return findByBoardId(boardId);
        }
        return cardRepository
                .findByBoardIdAndTitleContainingIgnoreCaseOrBoardIdAndDescriptionContainingIgnoreCase(
                        boardId, keyword, boardId, keyword);
    }

    public Card create(CardRequest req) {
        Card card = new Card();
        card.setTitle(req.getTitle().trim());
        card.setDescription(req.getDescription());
        card.setDueDate(req.getDueDate());
        card.setBoardId(req.getBoardId());
        card.setListId(req.getListId());
        card.setPosition(req.getPosition() != null ? req.getPosition() : nextPosition(req.getBoardId(), req.getListId()));
        card.setPriority(req.getPriority());
        return cardRepository.save(card);
    }

    public Optional<Card> update(Long id, CardRequest req) {
        return cardRepository.findById(id).map(card -> {
            card.setTitle(req.getTitle().trim());
            card.setDescription(req.getDescription());
            card.setDueDate(req.getDueDate());
            card.setBoardId(req.getBoardId());
            card.setListId(req.getListId());
            card.setPosition(req.getPosition() != null ? req.getPosition() : card.getPosition());
            card.setPriority(req.getPriority());
            return cardRepository.save(card);
        });
    }

    public boolean delete(Long id) {
        if (!cardRepository.existsById(id)) {
            return false;
        }
        cardRepository.deleteById(id);
        return true;
    }

    private double nextPosition(Long boardId, Long listId) {
        return cardRepository.findByBoardIdAndListIdOrderByPositionDesc(boardId, listId).stream()
                .findFirst()
                .map(c -> c.getPosition() != null ? c.getPosition() + 1 : 1.0)
                .orElse(1.0);
    }
}
