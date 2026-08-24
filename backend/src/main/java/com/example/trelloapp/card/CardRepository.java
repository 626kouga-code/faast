package com.example.trelloapp.card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CardRepository extends JpaRepository<Card, Long> {

    List<Card> findByBoardId(Long boardId);

    List<Card> findByBoardIdAndTitleContainingIgnoreCaseOrBoardIdAndDescriptionContainingIgnoreCase(
            Long boardIdForTitle, String title, Long boardIdForDescription, String description);
}
