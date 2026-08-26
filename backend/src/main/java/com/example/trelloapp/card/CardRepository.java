package com.example.trelloapp.card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, Long> {

    List<Card> findByBoardIdOrderByPositionAsc(Long boardId);

    Optional<Card> findTopByBoardIdAndListIdOrderByPositionDesc(Long boardId, Long listId);

    List<Card> findByBoardIdAndTitleContainingIgnoreCaseOrBoardIdAndDescriptionContainingIgnoreCase(
            Long boardIdForTitle, String title, Long boardIdForDescription, String description);
}
