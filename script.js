document.addEventListener('DOMContentLoaded', () => {
    // State variables
    let allData = {};
    let flashcards = [];
    let currentCardIndex = 0;
    let languageMode = 'us-front';
    let deferredPrompt;
    let hasShownFlipInstruction = false; // New flag for one-time instruction

    // DOM element references
    const elements = {
        appContainer: document.getElementById('app-container'),
        groupSelectionScreen: document.getElementById('group-selection-screen'),
        flashcardScreen: document.getElementById('flashcard-screen'),
        groupList: document.getElementById('group-list'),
        groupTitle: document.getElementById('group-title'),
        backToGroupsBtn: document.getElementById('back-to-groups-btn'),
        cardContainer: document.getElementById('flashcard-container'),
        cardInner: document.getElementById('card-inner'),
        cardFront: document.getElementById('card-front'),
        cardBack: document.getElementById('card-back'),
        cardExample: document.getElementById('card-example'),
        cardCount: document.getElementById('card-count'),
        nextButton: document.getElementById('next-button'),
        prevButton: document.getElementById('prev-button'),
        knowItButton: document.getElementById('know-it-btn'),
        langLtButton: document.getElementById('lang-lt'),
        langUsButton: document.getElementById('lang-us'),
        sliderIndicator: document.getElementById('slider-indicator'),
        installButton: document.getElementById('install-button'),
        installContainer: document.getElementById('install-container'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsModal: document.getElementById('settings-modal'),
        closeSettingsBtn: document.getElementById('close-settings-btn'),
        viewKnownBtn: document.getElementById('view-known-btn'),
        resetKnownBtn: document.getElementById('reset-known-btn'),
        knownWordsModal: document.getElementById('known-words-modal'),
        knownWordsList: document.getElementById('known-words-list'),
        closeKnownWordsBtn: document.getElementById('close-known-words-btn'),
        tutorialText: document.getElementById('tutorial')
    };

    async function loadAllData() {
        try {
            const response = await fetch('./flashcards.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allData = await response.json();
            displayGroupSelection();
        } catch (error) {
            console.error("Could not load flashcard data:", error);
            elements.groupList.innerHTML = '<p class="text-red-500 text-center">Error loading data.</p>';
        }
    }

    function displayGroupSelection() {
        elements.groupList.innerHTML = '';
        allData.groups.forEach((group, index) => {
            const button = document.createElement('button');
            button.className = 'group-button';
            button.innerHTML = `<span class="group-emoji">${group.emoji}</span><span class="group-name">${group.name}</span>`;
            button.addEventListener('click', () => selectGroup(index));
            elements.groupList.appendChild(button);
        });
    }

    function selectGroup(groupIndex) {
        const selectedGroup = allData.groups[groupIndex];
        const knownWords = getKnownWords();
        flashcards = selectedGroup.cards.filter(card => !knownWords.includes(card.front));
        elements.groupTitle.textContent = selectedGroup.name;
        currentCardIndex = 0;
        elements.groupSelectionScreen.classList.add('hidden');
        elements.flashcardScreen.classList.remove('hidden');
        displayCard();
    }

    function showGroupSelection() {
        elements.flashcardScreen.classList.add('hidden');
        elements.groupSelectionScreen.classList.remove('hidden');
    }

    function displayCard() {
        if (flashcards.length === 0) {
            elements.cardFront.textContent = "Congratulations!";
            elements.cardBack.innerHTML = "You've learned all the words in this group.";
            elements.cardExample.innerHTML = "";
            elements.cardCount.textContent = "🎉";
            elements.knowItButton.classList.add('hidden');
            return;
        }
        elements.knowItButton.classList.remove('hidden');
        const card = flashcards[currentCardIndex];

        // Clear the card front and create separate containers
        elements.cardFront.innerHTML = '';

        // Create main word container
        const wordContainer = document.createElement('div');
        wordContainer.style.flex = '1';
        wordContainer.style.display = 'flex';
        wordContainer.style.alignItems = 'center';
        wordContainer.style.justifyContent = 'center';

        if (languageMode === 'us-front') {
            wordContainer.textContent = card.front;
            elements.cardBack.innerHTML = card.back;
        } else {
            wordContainer.textContent = card.back;
            elements.cardBack.innerHTML = card.front;
        }

        elements.cardFront.appendChild(wordContainer);

        // Add one-time instruction as separate container
        if (!hasShownFlipInstruction) {
            // make tutorialText visible
            elements.tutorialText.classList.remove('hidden');
            hasShownFlipInstruction = true;
        }

        elements.cardExample.innerHTML = card.example;
        elements.cardCount.textContent = `${currentCardIndex + 1}/${flashcards.length}`;
        elements.cardContainer.classList.remove('flipped');
    }

    function markAsKnown() {
        if (flashcards.length === 0) return;
        const knownWord = flashcards[currentCardIndex].front;
        addKnownWord(knownWord);
        flashcards.splice(currentCardIndex, 1);
        if (currentCardIndex >= flashcards.length) {
            currentCardIndex = flashcards.length - 1;
        }
        displayCard();
    }

    const KNOWN_WORDS_KEY = 'knownFlashcards';
    function getKnownWords() {
        return JSON.parse(localStorage.getItem(KNOWN_WORDS_KEY)) || [];
    }

    function addKnownWord(word) {
        const knownWords = getKnownWords();
        if (!knownWords.includes(word)) {
            knownWords.push(word);
            localStorage.setItem(KNOWN_WORDS_KEY, JSON.stringify(knownWords));
        }
    }

    function resetKnownWords() {
        localStorage.removeItem(KNOWN_WORDS_KEY);
        alert("Išmoktų žodžių sąrašas išvalytas!");
        elements.settingsModal.classList.add('hidden');
        // Re-load the current group to reflect the reset
        if (elements.flashcardScreen.classList.contains('hidden')) {
            // If we are on the group selection screen, just re-display it
            displayGroupSelection();
        } else {
            // If we are on the flashcard screen, re-select the current group
            // This requires knowing the current group index, which we don't track globally yet.
            // For now, we'll just go back to group selection.
            showGroupSelection();
        }
    }

    function viewKnownWords() {
        const knownWords = getKnownWords();
        elements.knownWordsList.innerHTML = '';
        if (knownWords.length === 0) {
            elements.knownWordsList.innerHTML = '<li>No words learned yet.</li>';
        } else {
            knownWords.forEach(word => {
                const li = document.createElement('li');
                li.textContent = word;
                elements.knownWordsList.appendChild(li);
            });
        }
        elements.settingsModal.classList.add('hidden');
        elements.knownWordsModal.classList.remove('hidden');
    }

    function flipCard() {
        elements.cardContainer.classList.toggle('flipped');
        // Remove instruction after flip
        elements.tutorialText.classList.add('hidden');
    }

    function nextCard() {
        if (flashcards.length === 0) return;
        currentCardIndex = (currentCardIndex + 1) % flashcards.length;
        displayCard();
    }

    function prevCard() {
        if (flashcards.length === 0) return;
        currentCardIndex = (currentCardIndex - 1 + flashcards.length) % flashcards.length;
        displayCard();
    }

    function switchLanguage(mode) {
        languageMode = mode;
        elements.sliderIndicator.classList.toggle('us-active', mode === 'us-front');
        elements.sliderIndicator.classList.toggle('lt-active', mode === 'lt-front');
        elements.langUsButton.classList.toggle('active', mode === 'us-front');
        elements.langLtButton.classList.toggle('active', mode === 'lt-front');
        displayCard();
    }

    function setupEventListeners() {
        elements.nextButton.addEventListener('click', nextCard);
        elements.prevButton.addEventListener('click', prevCard);
        elements.knowItButton.addEventListener('click', markAsKnown);
        elements.cardContainer.addEventListener('click', flipCard);
        elements.langLtButton.addEventListener('click', () => switchLanguage('lt-front'));
        elements.langUsButton.addEventListener('click', () => switchLanguage('us-front'));
        elements.backToGroupsBtn.addEventListener('click', showGroupSelection);
        elements.settingsBtn.addEventListener('click', () => elements.settingsModal.classList.remove('hidden'));
        elements.closeSettingsBtn.addEventListener('click', () => elements.settingsModal.classList.add('hidden'));
        elements.viewKnownBtn.addEventListener('click', viewKnownWords);
        elements.resetKnownBtn.addEventListener('click', resetKnownWords);
        elements.closeKnownWordsBtn.addEventListener('click', () => elements.knownWordsModal.classList.add('hidden'));

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            elements.installContainer.classList.remove('hidden');
        });

        elements.installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
                elements.installContainer.classList.add('hidden');
            }
        });

        window.addEventListener('appinstalled', () => {
            elements.installContainer.classList.add('hidden');
        });
    }

    function init() {
        setupEventListeners();
        loadAllData();
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
            });
        }
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            elements.installContainer.classList.add('hidden');
        }
    }

    init();
});
