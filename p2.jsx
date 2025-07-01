import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, ChevronRight, Filter, Loader2 } from 'lucide-react';


const animeData = {
  1: { season: 1, episode: "Pokémon - I Choose You!", number: 1 },
  4: { season: 1, episode: "Charmander – The Stray Pokémon", number: 11 },
  7: { season: 1, episode: "Here Comes the Squirtle Squad", number: 12 },
  25: { season: 1, episode: "Pokémon - I Choose You!", number: 1 },
  39: { season: 1, episode: "The Jigglypuff Song", number: 45 },
  52: { season: 1, episode: "Princess vs. Princess", number: 52 },
  54: { season: 1, episode: "The Case of the K-9 Caper!", number: 54 },
  104: { season: 2, episode: "Flower Power", number: 88 },
  131: { season: 2, episode: "Lapras of Luxury", number: 84 },
  144: { season: 2, episode: "Zapdos and Zapped", number: 75 },
  150: { season: 1, episode: "Mewtwo Strikes Back", number: 63 }
};

const generations = [
  { id: 1, name: "Generation I", range: [1, 151], region: "Kanto" },
  { id: 2, name: "Generation II", range: [152, 251], region: "Johto" },
  { id: 3, name: "Generation III", range: [252, 386], region: "Hoenn" },
  { id: 4, name: "Generation IV", range: [387, 493], region: "Sinnoh" },
  { id: 5, name: "Generation V", range: [494, 649], region: "Unova" },
  { id: 6, name: "Generation VI", range: [650, 721], region: "Kalos" },
  { id: 7, name: "Generation VII", range: [722, 809], region: "Alola" }
];

const typeColors = {
  normal: "bg-gray-400",
  fire: "bg-red-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-blue-300",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-yellow-600",
  flying: "bg-indigo-400",
  psychic: "bg-pink-500",
  bug: "bg-green-400",
  rock: "bg-yellow-800",
  ghost: "bg-purple-700",
  dragon: "bg-indigo-700",
  dark: "bg-gray-800",
  steel: "bg-gray-500",
  fairy: "bg-pink-300"
};

const PokemonWebsite = () => {
  const [pokemon, setPokemon] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch Pokemon data
  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true);
        const pokemonData = [];
        
        // Fetch first 809 Pokemon (Gen 1-7)
        for (let i = 1; i <= 809; i++) {
          try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
            if (response.ok) {
              const data = await response.json();
              
              // Get generation info
              const generation = generations.find(gen => 
                i >= gen.range[0] && i <= gen.range[1]
              );
              
              pokemonData.push({
                id: data.id,
                name: data.name,
                types: data.types.map(type => type.type.name),
                sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
                generation: generation ? generation.id : 1,
                region: generation ? generation.region : 'Kanto',
                height: data.height,
                weight: data.weight,
                abilities: data.abilities.map(ability => ability.ability.name),
                stats: data.stats
              });
            }
          } catch (error) {
            console.error(`Error fetching Pokemon ${i}:`, error);
          }
          
          // Update progress every 50 Pokemon
          if (i % 50 === 0) {
            setPokemon([...pokemonData]);
            setFilteredPokemon([...pokemonData]);
          }
        }
        
        setPokemon(pokemonData);
        setFilteredPokemon(pokemonData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Pokemon:', error);
        setLoading(false);
      }
    };

    fetchPokemon();
  }, []);

  // Filter Pokemon
  useEffect(() => {
    let filtered = pokemon;
    
    if (selectedGeneration > 0) {
      const gen = generations.find(g => g.id === selectedGeneration);
      if (gen) {
        filtered = filtered.filter(p => p.id >= gen.range[0] && p.id <= gen.range[1]);
      }
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.types.some(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredPokemon(filtered);
  }, [pokemon, selectedGeneration, searchTerm]);

  // Fetch detailed Pokemon data
  const fetchPokemonDetails = async (pokemonId) => {
    setDetailLoading(true);
    try {
      // Fetch species data for evolution chain
      const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
      const speciesData = await speciesResponse.json();
      
      // Fetch evolution chain
      const evolutionResponse = await fetch(speciesData.evolution_chain.url);
      const evolutionData = await evolutionResponse.json();
      
      // Fetch moves
      const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      const pokemonData = await pokemonResponse.json();
      
      // Parse evolution chain
      const parseEvolutionChain = (chain) => {
        const evolutions = [];
        let current = chain;
        
        while (current) {
          const pokemonId = current.species.url.split('/').slice(-2, -1)[0];
          evolutions.push({
            id: parseInt(pokemonId),
            name: current.species.name,
            trigger: current.evolution_details[0]?.trigger?.name || null,
            level: current.evolution_details[0]?.min_level || null
          });
          current = current.evolves_to[0];
        }
        
        return evolutions;
      };
      
      const evolutionChain = parseEvolutionChain(evolutionData.chain);
      
      // Get top 5 moves
      const topMoves = pokemonData.moves
        .slice(0, 5)
        .map(move => ({
          name: move.move.name.replace('-', ' '),
          level: move.version_group_details[0]?.level_learned_at || 1
        }));
      
      const detailedPokemon = {
        ...pokemon.find(p => p.id === pokemonId),
        evolutionChain,
        moves: topMoves,
        animeAppearance: animeData[pokemonId] || null
      };
      
      setSelectedPokemon(detailedPokemon);
    } catch (error) {
      console.error('Error fetching Pokemon details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const TypeBadge = ({ type }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${typeColors[type] || 'bg-gray-400'} capitalize`}>
      {type}
    </span>
  );

  const PokemonCard = ({ pokemon }) => (
    <div 
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-100"
      onClick={() => fetchPokemonDetails(pokemon.id)}
    >
      <div className="p-4">
        <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg mb-3 flex items-center justify-center">
          <img 
            src={pokemon.sprite} 
            alt={pokemon.name}
            className="w-24 h-24 object-contain"
            loading="lazy"
          />
        </div>
        <h3 className="font-bold text-lg capitalize mb-2 text-gray-800">
          #{pokemon.id.toString().padStart(3, '0')} {pokemon.name}
        </h3>
        <div className="flex gap-1 flex-wrap">
          {pokemon.types.map(type => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>
    </div>
  );

  const PokemonModal = ({ pokemon, onClose }) => {
    if (!pokemon) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-xl">
            <h2 className="text-3xl font-bold capitalize text-gray-800">
              #{pokemon.id.toString().padStart(3, '0')} {pokemon.name}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6">
            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-6">
                    <img 
                      src={pokemon.sprite} 
                      alt={pokemon.name}
                      className="w-48 h-48 mx-auto object-contain"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg mb-2">Region</h3>
                      <p className="text-gray-600 text-lg">{pokemon.region}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-lg mb-2">Types</h3>
                      <div className="flex gap-2">
                        {pokemon.types.map(type => (
                          <TypeBadge key={type} type={type} />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-lg mb-2">Physical Stats</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="font-semibold">Height</div>
                          <div>{(pokemon.height / 10).toFixed(1)} m</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="font-semibold">Weight</div>
                          <div>{(pokemon.weight / 10).toFixed(1)} kg</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg mb-3">Top Moves</h3>
                    <div className="space-y-2">
                      {pokemon.moves?.map((move, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded capitalize">
                          <div className="font-semibold">{move.name}</div>
                          <div className="text-sm text-gray-600">Level {move.level}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg mb-3">Evolution Chain</h3>
                    <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                      {pokemon.evolutionChain?.map((evo, index) => (
                        <React.Fragment key={evo.id}>
                          <div className="flex flex-col items-center min-w-[80px]">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                              <img 
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png`}
                                alt={evo.name}
                                className="w-12 h-12 object-contain"
                              />
                            </div>
                            <span className="text-xs capitalize font-medium">{evo.name}</span>
                            {evo.level && (
                              <span className="text-xs text-gray-500">Lv. {evo.level}</span>
                            )}
                          </div>
                          {index < pokemon.evolutionChain.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  
                  {pokemon.animeAppearance && (
                    <div>
                      <h3 className="font-bold text-lg mb-3">First Anime Appearance</h3>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                        <div className="font-semibold">Season {pokemon.animeAppearance.season}</div>
                        <div className="text-sm text-gray-600 mb-1">
                          Episode {pokemon.animeAppearance.number}
                        </div>
                        <div className="font-medium">"{pokemon.animeAppearance.episode}"</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PokéDex
              </h1>
              <p className="text-gray-600 mt-1">Discover Pokémon from Generations I-VII</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 lg:min-w-[400px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search Pokémon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>
          
          {/* Generation Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGeneration(0)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    selectedGeneration === 0 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Generations
                </button>
                {generations.map(gen => (
                  <button
                    key={gen.id}
                    onClick={() => setSelectedGeneration(gen.id)}
                    className={`px-4 py-2 rounded-full transition-colors ${
                      selectedGeneration === gen.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Gen {gen.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600">Loading Pokémon data...</p>
            <p className="text-sm text-gray-500 mt-2">
              {pokemon.length} / 809 Pokémon loaded
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredPokemon.length} Pokémon
                {selectedGeneration > 0 && ` from Generation ${selectedGeneration}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
              {filteredPokemon.map(pokemon => (
                <PokemonCard key={pokemon.id} pokemon={pokemon} />
              ))}
            </div>

            {filteredPokemon.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-600 text-lg">No Pokémon found</p>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Pokemon Detail Modal */}
      {selectedPokemon && (
        <PokemonModal 
          pokemon={selectedPokemon} 
          onClose={() => setSelectedPokemon(null)} 
        />
      )}
    </div>
  );
};

export default PokemonWebsite;