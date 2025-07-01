// Charizard Ember Pokédex - Interactive JavaScript
class EmberPokedex {
    constructor() {
        this.allPokemon = [];
        this.filteredPokemon = [];
        this.currentGeneration = 'all';
        this.currentType = 'all';
        this.searchTerm = '';
        this.currentTheme = 'fire'; // Default theme
        this.themeTransitionTimeout = null;
        
        // Generation ranges for filtering
        this.generationRanges = {
            1: [1, 151],
            2: [152, 251],
            3: [252, 386],
            4: [387, 493],
            5: [494, 649],
            6: [650, 721],
            7: [722, 809]
        };
        
        // Region mapping
        this.regionMap = {
            1: 'Kanto',
            2: 'Johto',
            3: 'Hoenn',
            4: 'Sinnoh',
            5: 'Unova',
            6: 'Kalos',
            7: 'Alola'
        };
        
        // Theme blending system
        this.themeBlendQueue = [];
        this.isBlending = false;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadPokemonData();
        this.hideLoadingScreen();
        this.renderPokemonGrid();
        this.addFlameEffects();
        this.startDynamicTheming();
    }
    
    setupEventListeners() {
        // Search functionality with dropdown
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Clear previous timeout
            clearTimeout(searchTimeout);
            
            // Update search term for main filtering
            this.searchTerm = query.toLowerCase();
            
            // Show dropdown with delay for async feel
            if (query.length > 0) {
                searchTimeout = setTimeout(() => {
                    this.showSearchDropdown(query);
                }, 300); // 300ms delay for better UX
            } else {
                this.hideSearchDropdown();
                this.filterAndRender();
            }
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box')) {
                this.hideSearchDropdown();
            }
        });
        
        // Handle search input focus
        searchInput.addEventListener('focus', (e) => {
            if (e.target.value.trim().length > 0) {
                this.showSearchDropdown(e.target.value.trim());
            }
        });
        
        // Generation filters
        document.querySelectorAll('[data-gen]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('[data-gen]').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                this.currentGeneration = e.target.dataset.gen;
                this.filterAndRender();
                
                // Add flame burst effect
                this.createFlameBurst(e.target);
            });
        });
        
        // Type filter
        const typeFilter = document.getElementById('typeFilter');
        typeFilter.addEventListener('change', (e) => {
            this.currentType = e.target.value;
            this.filterAndRender();
        });
        
        // Modal functionality
        this.setupModalEvents();
        
        // Tab functionality
        this.setupTabEvents();
    }
    
    setupModalEvents() {
        const modal = document.getElementById('pokedexModal');
        const closeBtn = document.getElementById('closeModal');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }
    
    setupTabEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }
    
    switchTab(tabName) {
        // Remove active class from all tabs and panels
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        
        // Add active class to selected tab and panel
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Panel`).classList.add('active');
    }
    
    async loadPokemonData() {
        try {
            const response = await fetch('pokemon.json');
            if (!response.ok) {
                throw new Error('Failed to load Pokémon data');
            }
            
            this.allPokemon = await response.json();
            this.filteredPokemon = [...this.allPokemon];
            
            console.log(`Loaded ${this.allPokemon.length} Pokémon`);
        } catch (error) {
            console.error('Error loading Pokémon data:', error);
            this.showError('Failed to load Pokémon data. Please refresh the page.');
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.add('hidden');
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 600);
    }
    
    showError(message) {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.innerHTML = `
            <div class="error-message">
                <h2>🔥 Oops!</h2>
                <p>${message}</p>
            </div>
        `;
    }
    
    getGeneration(pokemonId) {
        for (const [gen, range] of Object.entries(this.generationRanges)) {
            if (pokemonId >= range[0] && pokemonId <= range[1]) {
                return parseInt(gen);
            }
        }
        return 1;
    }
    
    filterAndRender() {
        this.filteredPokemon = this.allPokemon.filter(pokemon => {
            // Search filter
            const matchesSearch = !this.searchTerm || 
                pokemon.name.toLowerCase().includes(this.searchTerm) ||
                pokemon.id.toString().includes(this.searchTerm);
            
            // Generation filter
            const matchesGeneration = this.currentGeneration === 'all' || 
                this.getGeneration(pokemon.id) === parseInt(this.currentGeneration);
            
            // Type filter
            const matchesType = this.currentType === 'all' || 
                pokemon.types.includes(this.currentType);
            
            return matchesSearch && matchesGeneration && matchesType;
        });
        
        this.renderPokemonGrid();
    }
    
    renderPokemonGrid() {
        const grid = document.getElementById('pokemonGrid');
        const noResults = document.getElementById('noResults');
        
        if (this.filteredPokemon.length === 0) {
            grid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        noResults.style.display = 'none';
        
        grid.innerHTML = this.filteredPokemon.map(pokemon => this.createPokemonCard(pokemon)).join('');
        
        // Add click event listeners to cards
        document.querySelectorAll('.pokemon-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const pokemonId = parseInt(card.dataset.id);
                this.openPokemonModal(pokemonId);
                
                // Add opening animation
                card.classList.add('opening');
                setTimeout(() => card.classList.remove('opening'), 600);
            });
            
            // Add hover flame effect and theme preview
            card.addEventListener('mouseenter', (e) => {
                this.addHoverFlame(card);
                const pokemonId = parseInt(card.dataset.id);
                const pokemon = this.allPokemon.find(p => p.id === pokemonId);
                if (pokemon) {
                    this.previewTheme(pokemon.types[0]);
                }
            });
            
            card.addEventListener('mouseleave', (e) => {
                this.resetToCurrentTheme();
            });
        });
    }
    
    createPokemonCard(pokemon) {
        const generation = this.getGeneration(pokemon.id);
        const primaryType = pokemon.types[0];
        
        return `
            <div class="pokemon-card" data-id="${pokemon.id}" data-primary-type="${primaryType}">
                <div class="pokemon-image">
                    <img src="${pokemon.image}" alt="${pokemon.name}" loading="lazy">
                </div>
                <h3 class="pokemon-name">${this.capitalize(pokemon.name)}</h3>
                <p class="pokemon-id">#${pokemon.id.toString().padStart(3, '0')}</p>
                <div class="pokemon-types">
                    ${pokemon.types.map(type => 
                        `<span class="type-badge ${type}">${this.capitalize(type)}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    openPokemonModal(pokemonId) {
        const pokemon = this.allPokemon.find(p => p.id === pokemonId);
        if (!pokemon) return;
        
        this.populateModal(pokemon);
        this.applyTypeTheme(pokemon.types[0]); // Apply theme based on primary type
        
        const modal = document.getElementById('pokedexModal');
        modal.classList.add('active');
        
        // Reset to stats tab
        this.switchTab('stats');
        
        // Hide search dropdown if open
        this.hideSearchDropdown();
    }
    
    applyTypeTheme(primaryType) {
        const container = document.querySelector('.pokedex-container');
        
        // Remove all existing type classes
        const typeClasses = [
            'type-fire', 'type-water', 'type-grass', 'type-electric', 'type-psychic',
            'type-ice', 'type-dragon', 'type-dark', 'type-fairy', 'type-fighting',
            'type-poison', 'type-ground', 'type-flying', 'type-bug', 'type-rock',
            'type-ghost', 'type-steel', 'type-normal'
        ];
        
        typeClasses.forEach(cls => container.classList.remove(cls));
        
        // Add new type class
        container.classList.add(`type-${primaryType}`);
        
        // Add special effects based on type
        this.addTypeSpecificEffects(primaryType);
    }
    
    addTypeSpecificEffects(type) {
        const imageGlow = document.querySelector('.image-glow');
        if (!imageGlow) return;
        
        // Reset any existing type-specific styles
        imageGlow.style.background = '';
        
        // Apply type-specific glow colors
        switch (type) {
            case 'fire':
                imageGlow.style.background = 'radial-gradient(circle, #FF6B00, #FF8C42)';
                break;
            case 'water':
                imageGlow.style.background = 'radial-gradient(circle, #3FA9F5, #7BB3F0)';
                break;
            case 'grass':
                imageGlow.style.background = 'radial-gradient(circle, #6FCF97, #A8D982)';
                break;
            case 'electric':
                imageGlow.style.background = 'radial-gradient(circle, #FFEB3B, #FFF176)';
                break;
            case 'psychic':
                imageGlow.style.background = 'radial-gradient(circle, #E91E63, #F06292)';
                break;
            case 'ice':
                imageGlow.style.background = 'radial-gradient(circle, #00BCD4, #4DD0E1)';
                break;
            case 'dragon':
                imageGlow.style.background = 'radial-gradient(circle, #5D3FD3, #AA00FF)';
                break;
            case 'dark':
                imageGlow.style.background = 'radial-gradient(circle, #424242, #616161)';
                break;
            case 'fairy':
                imageGlow.style.background = 'radial-gradient(circle, #F8BBD9, #F48FB1)';
                break;
            case 'fighting':
                imageGlow.style.background = 'radial-gradient(circle, #FF5722, #FF7043)';
                break;
            case 'poison':
                imageGlow.style.background = 'radial-gradient(circle, #9C27B0, #BA68C8)';
                break;
            case 'ground':
                imageGlow.style.background = 'radial-gradient(circle, #8BC34A, #AED581)';
                break;
            case 'flying':
                imageGlow.style.background = 'radial-gradient(circle, #2196F3, #64B5F6)';
                break;
            case 'bug':
                imageGlow.style.background = 'radial-gradient(circle, #689F38, #8BC34A)';
                break;
            case 'rock':
                imageGlow.style.background = 'radial-gradient(circle, #795548, #A1887F)';
                break;
            case 'ghost':
                imageGlow.style.background = 'radial-gradient(circle, #673AB7, #9575CD)';
                break;
            case 'steel':
                imageGlow.style.background = 'radial-gradient(circle, #607D8B, #90A4AE)';
                break;
            default:
                imageGlow.style.background = 'var(--gradient-ember)';
        }
    }
    
    showSearchDropdown(query) {
        const dropdown = document.getElementById('searchDropdown');
        const searchResults = this.searchPokemon(query, 5); // Get top 5 matches
        
        if (searchResults.length === 0) {
            dropdown.innerHTML = '<div class="search-no-results">No Pokémon found</div>';
        } else {
            dropdown.innerHTML = searchResults.map(pokemon => this.createSearchDropdownItem(pokemon)).join('');
            
            // Add click listeners to dropdown items
            dropdown.querySelectorAll('.search-dropdown-item').forEach(item => {
                item.addEventListener('click', () => {
                    const pokemonId = parseInt(item.dataset.id);
                    this.openPokemonModal(pokemonId);
                    document.getElementById('searchInput').value = '';
                    this.searchTerm = '';
                    this.hideSearchDropdown();
                    this.filterAndRender();
                });
            });
        }
        
        dropdown.classList.add('active');
    }
    
    hideSearchDropdown() {
        const dropdown = document.getElementById('searchDropdown');
        dropdown.classList.remove('active');
    }
    
    searchPokemon(query, limit = 5) {
        const lowerQuery = query.toLowerCase();
        
        return this.allPokemon
            .filter(pokemon => 
                pokemon.name.toLowerCase().includes(lowerQuery) ||
                pokemon.id.toString().includes(query) ||
                pokemon.types.some(type => type.toLowerCase().includes(lowerQuery))
            )
            .slice(0, limit);
    }
    
    createSearchDropdownItem(pokemon) {
        const generation = this.getGeneration(pokemon.id);
        
        return `
            <div class="search-dropdown-item" data-id="${pokemon.id}">
                <img src="${pokemon.image}" alt="${pokemon.name}" loading="lazy">
                <div class="search-dropdown-info">
                    <div class="search-dropdown-name">${this.capitalize(pokemon.name)}</div>
                    <div class="search-dropdown-details">#${pokemon.id.toString().padStart(3, '0')} • Gen ${generation}</div>
                    <div class="search-dropdown-types">
                        ${pokemon.types.map(type => 
                            `<span class="type-badge ${type}">${this.capitalize(type)}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    populateModal(pokemon) {
        const generation = this.getGeneration(pokemon.id);
        
        // Basic info
        document.getElementById('modalPokemonImage').src = pokemon.image;
        document.getElementById('modalPokemonName').textContent = this.capitalize(pokemon.name);
        document.getElementById('modalPokemonId').textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
        
        // Types
        const typesContainer = document.getElementById('modalPokemonTypes');
        typesContainer.innerHTML = pokemon.types.map(type => 
            `<span class="type-badge ${type}">${this.capitalize(type)}</span>`
        ).join('');
        
        // Stats
        this.populateStats(pokemon.stats);
        
        // Moves
        this.populateMoves(pokemon.moves);
        
        // Info
        this.populateInfo(pokemon, generation);
    }
    
    populateStats(stats) {
        const statsContainer = document.getElementById('modalStats');
        statsContainer.innerHTML = stats.map(stat => `
            <div class="stat-item">
                <div class="stat-value">${stat.value}</div>
                <div class="stat-name">${this.formatStatName(stat.name)}</div>
            </div>
        `).join('');
    }
    
    populateMoves(moves) {
        const movesContainer = document.getElementById('modalMoves');
        const displayMoves = moves.slice(0, 12); // Show first 12 moves
        
        movesContainer.innerHTML = displayMoves.map(move => 
            `<div class="move-item">${this.formatMoveName(move)}</div>`
        ).join('');
    }
    
    populateInfo(pokemon, generation) {
        const infoContainer = document.getElementById('modalInfo');
        
        infoContainer.innerHTML = `
            <div class="info-section">
                <h3>🌍 Region Info</h3>
                <p><strong>Region:</strong> ${this.regionMap[generation]}</p>
                <p><strong>Generation:</strong> ${generation}</p>
                <p><strong>Height:</strong> ${(pokemon.height / 10).toFixed(1)} m</p>
                <p><strong>Weight:</strong> ${(pokemon.weight / 10).toFixed(1)} kg</p>
            </div>
            <div class="info-section">
                <h3>⚡ Abilities</h3>
                ${pokemon.abilities.map(ability => 
                    `<p>${this.capitalize(ability.replace('-', ' '))}</p>`
                ).join('')}
            </div>
            <div class="info-section">
                <h3>🎯 Battle Stats</h3>
                <p><strong>Total Base Stats:</strong> ${pokemon.stats.reduce((sum, stat) => sum + stat.value, 0)}</p>
                <p><strong>Highest Stat:</strong> ${this.getHighestStat(pokemon.stats)}</p>
                <p><strong>Type Effectiveness:</strong> ${this.getTypeAdvantages(pokemon.types)}</p>
            </div>
        `;
    }
    
    closeModal() {
        const modal = document.getElementById('pokedexModal');
        modal.classList.remove('active');
        
        // Reset theme to default after a short delay
        setTimeout(() => {
            this.resetModalTheme();
        }, 300);
    }
    
    resetModalTheme() {
        const container = document.querySelector('.pokedex-container');
        const typeClasses = [
            'type-fire', 'type-water', 'type-grass', 'type-electric', 'type-psychic',
            'type-ice', 'type-dragon', 'type-dark', 'type-fairy', 'type-fighting',
            'type-poison', 'type-ground', 'type-flying', 'type-bug', 'type-rock',
            'type-ghost', 'type-steel', 'type-normal'
        ];
        
        typeClasses.forEach(cls => container.classList.remove(cls));
        
        // Reset image glow
        const imageGlow = document.querySelector('.image-glow');
        if (imageGlow) {
            imageGlow.style.background = 'var(--gradient-ember)';
        }
    }
    
    // Utility functions
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    formatStatName(statName) {
        return statName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    formatMoveName(moveName) {
        return moveName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    getHighestStat(stats) {
        const highest = stats.reduce((max, stat) => stat.value > max.value ? stat : max);
        return `${this.formatStatName(highest.name)} (${highest.value})`;
    }
    
    getTypeAdvantages(types) {
        // Simplified type advantages for display
        const advantages = {
            fire: 'Strong vs Grass, Bug, Ice, Steel',
            water: 'Strong vs Fire, Ground, Rock',
            grass: 'Strong vs Water, Ground, Rock',
            electric: 'Strong vs Water, Flying',
            psychic: 'Strong vs Fighting, Poison',
            ice: 'Strong vs Grass, Ground, Flying, Dragon',
            dragon: 'Strong vs Dragon',
            dark: 'Strong vs Psychic, Ghost',
            fairy: 'Strong vs Fighting, Dragon, Dark',
            fighting: 'Strong vs Normal, Rock, Steel, Ice, Dark',
            poison: 'Strong vs Grass, Fairy',
            ground: 'Strong vs Poison, Rock, Steel, Fire, Electric',
            flying: 'Strong vs Fighting, Bug, Grass',
            bug: 'Strong vs Grass, Psychic, Dark',
            rock: 'Strong vs Flying, Bug, Fire, Ice',
            ghost: 'Strong vs Psychic, Ghost',
            steel: 'Strong vs Rock, Ice, Fairy',
            normal: 'Balanced type'
        };
        
        return types.map(type => advantages[type] || 'Balanced type').join('; ');
    }
    
    // Visual effects
    addFlameEffects() {
        // Start the ash particle system
        this.initAshParticles();
    }
    
    initAshParticles() {
        const container = document.getElementById('ashParticles');
        
        // Create initial batch of particles
        this.createAshBatch();
        
        // Continuously create new particles
        setInterval(() => {
            this.createAshBatch();
        }, 2000); // Create new batch every 2 seconds
    }
    
    createAshBatch() {
        const container = document.getElementById('ashParticles');
        const particleCount = Math.floor(Math.random() * 8) + 5; // 5-12 particles per batch
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                this.createAshParticle(container);
            }, Math.random() * 1000); // Stagger creation over 1 second
        }
    }
    
    createAshParticle(container) {
        const particle = document.createElement('div');
        
        // Random particle properties
        const size = Math.random();
        const colorType = Math.random();
        const startX = Math.random() * 100;
        const animationDuration = 12 + Math.random() * 8; // 12-20 seconds
        const delay = Math.random() * 2; // 0-2 second delay
        
        // Determine particle class based on size
        let sizeClass = '';
        if (size < 0.3) sizeClass = 'small';
        else if (size > 0.7) sizeClass = 'large';
        
        // Determine color type
        let colorClass = '';
        if (colorType < 0.4) colorClass = 'secondary';
        else if (colorType < 0.7) colorClass = 'tertiary';
        
        particle.className = `ash-particle ${sizeClass} ${colorClass}`;
        particle.style.cssText = `
            left: ${startX}vw;
            animation-duration: ${animationDuration}s;
            animation-delay: ${delay}s;
        `;
        
        container.appendChild(particle);
        
        // Remove particle after animation completes
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, (animationDuration + delay) * 1000);
    }
    
    createFlameBurst(element) {
        const burst = document.createElement('div');
        burst.className = 'flame-burst';
        burst.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            background: var(--gradient-ember);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 10;
            animation: burst 0.6s ease-out forwards;
        `;
        
        element.style.position = 'relative';
        element.appendChild(burst);
        
        setTimeout(() => {
            if (burst.parentNode) {
                burst.parentNode.removeChild(burst);
            }
        }, 600);
    }
    
    addHoverFlame(card) {
        if (card.querySelector('.hover-flame')) return;
        
        const flame = document.createElement('div');
        flame.className = 'hover-flame';
        flame.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width: 15px;
            height: 20px;
            background: var(--gradient-ember);
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
            opacity: 0.7;
            animation: flicker 1s ease-in-out infinite alternate;
            pointer-events: none;
            z-index: 5;
        `;
        
        card.style.position = 'relative';
        card.appendChild(flame);
        
        // Remove flame after hover
        setTimeout(() => {
            if (flame.parentNode) {
                flame.parentNode.removeChild(flame);
            }
        }, 2000);
    }
    
    // Dynamic Theme System
    startDynamicTheming() {
        // Start with a mixed theme blend
        this.applyGlobalTheme('mixed');
        
        // Cycle through themes based on visible Pokémon
        setInterval(() => {
            this.updateThemeBasedOnVisible();
        }, 5000); // Change theme every 5 seconds
        
        // Add scroll-based theme changes
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateThemeBasedOnVisible();
            }, 500);
        });
    }
    
    updateThemeBasedOnVisible() {
        if (this.filteredPokemon.length === 0) return;
        
        // Get visible Pokémon cards
        const cards = document.querySelectorAll('.pokemon-card');
        const visibleCards = Array.from(cards).filter(card => {
            const rect = card.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        });
        
        if (visibleCards.length === 0) return;
        
        // Collect types from visible Pokémon
        const visibleTypes = [];
        visibleCards.forEach(card => {
            const pokemonId = parseInt(card.dataset.id);
            const pokemon = this.allPokemon.find(p => p.id === pokemonId);
            if (pokemon) {
                visibleTypes.push(...pokemon.types);
            }
        });
        
        // Find most common type
        const typeCount = {};
        visibleTypes.forEach(type => {
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        
        const dominantType = Object.keys(typeCount).reduce((a, b) => 
            typeCount[a] > typeCount[b] ? a : b
        );
        
        // Apply blended theme
        this.blendThemes(visibleTypes.slice(0, 3)); // Use top 3 types for blending
    }
    
    blendThemes(types) {
        if (types.length === 0) return;
        
        // Create a unique blend based on the types
        const uniqueTypes = [...new Set(types)];
        
        if (uniqueTypes.length === 1) {
            this.applyGlobalTheme(uniqueTypes[0]);
        } else if (uniqueTypes.length === 2) {
            this.createDualTheme(uniqueTypes[0], uniqueTypes[1]);
        } else {
            this.createTripleTheme(uniqueTypes[0], uniqueTypes[1], uniqueTypes[2]);
        }
    }
    
    createDualTheme(type1, type2) {
        const theme1 = this.getTypeColors(type1);
        const theme2 = this.getTypeColors(type2);
        
        // Blend the colors
        const blendedTheme = {
            primary: theme1.primary,
            secondary: theme2.primary,
            tertiary: this.blendColors(theme1.secondary, theme2.secondary)
        };
        
        this.applyCustomTheme(blendedTheme);
    }
    
    createTripleTheme(type1, type2, type3) {
        const theme1 = this.getTypeColors(type1);
        const theme2 = this.getTypeColors(type2);
        const theme3 = this.getTypeColors(type3);
        
        const blendedTheme = {
            primary: theme1.primary,
            secondary: theme2.primary,
            tertiary: theme3.primary
        };
        
        this.applyCustomTheme(blendedTheme);
    }
    
    getTypeColors(type) {
        const typeColors = {
            fire: { primary: '#FF5E00', secondary: '#FF8C42', tertiary: '#FFA07A' },
            water: { primary: '#3FA9F5', secondary: '#7BB3F0', tertiary: '#4DD0E1' },
            grass: { primary: '#6FCF97', secondary: '#A8D982', tertiary: '#8BC34A' },
            electric: { primary: '#FFEB3B', secondary: '#FFF176', tertiary: '#FFCC02' },
            psychic: { primary: '#E91E63', secondary: '#F06292', tertiary: '#AD1457' },
            ice: { primary: '#00BCD4', secondary: '#4DD0E1', tertiary: '#00ACC1' },
            dragon: { primary: '#5D3FD3', secondary: '#9575CD', tertiary: '#AA00FF' },
            dark: { primary: '#424242', secondary: '#616161', tertiary: '#757575' },
            fairy: { primary: '#F8BBD9', secondary: '#F48FB1', tertiary: '#E91E63' },
            fighting: { primary: '#FF5722', secondary: '#FF7043', tertiary: '#D84315' },
            poison: { primary: '#9C27B0', secondary: '#BA68C8', tertiary: '#7B1FA2' },
            ground: { primary: '#8BC34A', secondary: '#AED581', tertiary: '#689F38' },
            flying: { primary: '#2196F3', secondary: '#64B5F6', tertiary: '#1976D2' },
            bug: { primary: '#689F38', secondary: '#8BC34A', tertiary: '#558B2F' },
            rock: { primary: '#795548', secondary: '#A1887F', tertiary: '#5D4037' },
            ghost: { primary: '#673AB7', secondary: '#9575CD', tertiary: '#512DA8' },
            steel: { primary: '#607D8B', secondary: '#90A4AE', tertiary: '#455A64' },
            normal: { primary: '#9E9E9E', secondary: '#BDBDBD', tertiary: '#757575' }
        };
        
        return typeColors[type] || typeColors.normal;
    }
    
    applyGlobalTheme(themeName) {
        if (this.currentTheme === themeName) return;
        
        this.currentTheme = themeName;
        const body = document.body;
        
        // Remove all existing theme classes
        const themeClasses = [
            'theme-fire', 'theme-water', 'theme-grass', 'theme-electric', 'theme-psychic',
            'theme-ice', 'theme-dragon', 'theme-dark', 'theme-fairy', 'theme-fighting',
            'theme-poison', 'theme-ground', 'theme-flying', 'theme-bug', 'theme-rock',
            'theme-ghost', 'theme-steel', 'theme-normal', 'theme-mixed'
        ];
        
        themeClasses.forEach(cls => body.classList.remove(cls));
        
        // Add new theme class
        body.classList.add(`theme-${themeName}`);
        
        // Update shadow glow variable
        const colors = this.getTypeColors(themeName);
        const rgb = this.hexToRgb(colors.primary);
        document.documentElement.style.setProperty('--shadow-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
    }
    
    applyCustomTheme(colors) {
        const root = document.documentElement;
        
        // Convert hex to RGB for transparency effects
        const primaryRgb = this.hexToRgb(colors.primary);
        const secondaryRgb = this.hexToRgb(colors.secondary);
        const tertiaryRgb = this.hexToRgb(colors.tertiary);
        
        // Update CSS custom properties
        root.style.setProperty('--accent-primary', colors.primary);
        root.style.setProperty('--accent-secondary', colors.secondary);
        root.style.setProperty('--accent-tertiary', colors.tertiary);
        root.style.setProperty('--accent-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
        root.style.setProperty('--accent-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
        root.style.setProperty('--accent-tertiary-rgb', `${tertiaryRgb.r}, ${tertiaryRgb.g}, ${tertiaryRgb.b}`);
        root.style.setProperty('--shadow-glow', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`);
    }
    
    previewTheme(type) {
        clearTimeout(this.themeTransitionTimeout);
        this.applyGlobalTheme(type);
    }
    
    resetToCurrentTheme() {
        clearTimeout(this.themeTransitionTimeout);
        this.themeTransitionTimeout = setTimeout(() => {
            this.updateThemeBasedOnVisible();
        }, 500);
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 94, b: 0 };
    }
    
    blendColors(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        const blended = {
            r: Math.round((rgb1.r + rgb2.r) / 2),
            g: Math.round((rgb1.g + rgb2.g) / 2),
            b: Math.round((rgb1.b + rgb2.b) / 2)
        };
        
        return `#${blended.r.toString(16).padStart(2, '0')}${blended.g.toString(16).padStart(2, '0')}${blended.b.toString(16).padStart(2, '0')}`;
    }
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.6;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes burst {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
        }
        50% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0.8;
        }
        100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
        }
    }
    
    .flame-particle {
        filter: blur(1px);
    }
    
    .hover-flame {
        filter: blur(1px);
    }
`;
document.head.appendChild(style);

// Initialize the Pokédex when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EmberPokedex();
});

// Add some extra interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add click sound effect simulation
    document.addEventListener('click', (e) => {
        if (e.target.matches('.filter-btn, .pokemon-card, .tab-btn')) {
            // Visual feedback for clicks
            e.target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 100);
        }
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('pokedexModal');
        if (modal.classList.contains('active')) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const tabs = document.querySelectorAll('.tab-btn');
                const activeTab = document.querySelector('.tab-btn.active');
                const currentIndex = Array.from(tabs).indexOf(activeTab);
                
                let newIndex;
                if (e.key === 'ArrowLeft') {
                    newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                } else {
                    newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                }
                
                tabs[newIndex].click();
                e.preventDefault();
            }
        }
    });
});