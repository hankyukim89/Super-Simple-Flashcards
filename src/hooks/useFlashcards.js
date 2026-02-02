import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useFlashcards = () => {
    const [inputText, setInputText] = useState('Word 1, Definition 1\nWord 2, Definition 2');
    const [cards, setCards] = useState([]);
    const [separators, setSeparators] = useState({
        card: '\n',
        term: ','
    });

    // Unique ID map to perserve IDs across parses if possible, or just generate new ones.
    // For a simple text-based parser, it's hard to keep IDs stable if text changes significantly.
    // We'll generate fresh cards from text for now, but we might need to merge if we want to keep images attached.
    // Strategy: We parse the text. If we manually edited a card (helper state), we might need to sync back to text?
    // The user said: "it creates a preview... I can edit it there".
    // Two-way binding is tricky. 
    // APPROACH: 
    // 1. Source of truth is `inputText`. 
    // 2. We parse `inputText` to generate `cards` for preview.
    // 3. Edits in preview update `inputText`.
    // 4. Edits to "image" are stored in a side-map keyed by "term" or "index"? 
    //    If keyed by index, inserting a line shifts images. Bad.
    //    If keyed by content, editing content loses image. Bad.
    //    Maybe we generate a stable ID for each line? Hard with primitive string.

    // Revised Approach:
    // The user types in the text box. We parse on change.
    // The generated cards have IDs. 
    // Images are stored in a separate map: `imageMap: { [cardIndex OR contentHash]: imageSrc }`. 
    // Let's rely on line number (Index) for simplicity for now, but user warning: "Inserting lines shifts images".
    // OR, we assume the user finishes typing then adds images.
    // Let's try to parse and attach images if strictly matching term/def?

    const [images, setImages] = useState({}); // { [id]: { termImage: string, defImage: string } }

    const parseText = useCallback((text, seps) => {
        const cardStrings = text.split(seps.card);
        return cardStrings.map((cardStr, index) => {
            if (!cardStr.trim()) return null;
            const parts = cardStr.split(seps.term);
            const term = parts[0]?.trim() || '';
            const definition = parts.slice(1).join(seps.term).trim() || ''; // Join back if multiple commas
            return {
                id: `card-${index}`,
                term,
                definition,
                index
            };
        }).filter(Boolean);
    }, []);

    useEffect(() => {
        setCards(parseText(inputText, separators));
    }, [inputText, separators, parseText]);

    const updateCard = (index, field, value) => {
        // We need to reconstruct the inputText from the cards if we edit a card
        // This is complex because we have raw text `inputText` which might have extra whitespace we want to preserve?
        // Or we just STRICTLY enforce: inputText = cards.map(c => c.term + sep + c.def).join(cardSep)

        // User said: "I can edit it there [preview]".
        // Let's update the inputText based on the change.

        const newCards = [...cards];
        // Find the actual card in the parsed list (handle filtered/nulls?)
        // Our parseText filters nulls. 
        // Let's assume strict mapping for now.

        const card = newCards[index];
        if (!card) return;

        if (field === 'term') card.term = value;
        if (field === 'definition') card.definition = value;

        // Reconstruct Text
        const newText = newCards.map(c => `${c.term}${separators.term} ${c.definition}`).join(separators.card);
        setInputText(newText);
    };

    const addImage = (index, side, url) => {
        setImages(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                [side]: url
            }
        }));
    };

    const removeCard = (index) => {
        const newCards = [...cards];
        newCards.splice(index, 1);
        const newText = newCards.map(c => `${c.term}${separators.term} ${c.definition}`).join(separators.card);
        setInputText(newText);
        // Note: This shifts indices, so images at index+1 will move to index. 
        // This actually aligns with the user expectation for a text-based list (usually).
        // Images attached to "Line 5" stay at "Line 5" even if Line 5 content changes? 
        // Maybe better to move images too.

        // Let's shift images
        setImages(prev => {
            const newImages = {};
            Object.keys(prev).forEach(key => {
                const keyIdx = parseInt(key);
                if (keyIdx < index) newImages[keyIdx] = prev[keyIdx];
                if (keyIdx > index) newImages[keyIdx - 1] = prev[keyIdx];
            });
            return newImages;
        });
    };

    return {
        inputText,
        setInputText,
        cards,
        separators,
        setSeparators,
        updateCard,
        images,
        addImage,
        removeCard
    };
};
