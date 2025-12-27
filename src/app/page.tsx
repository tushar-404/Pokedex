'use client';

import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import pokemonData from '../data/pokemon.json'; 
import { Pokemon } from '../types';
import FlameBackground from '../components/FlameBackground';
import PokemonCard from '../components/PokemonCard';
import PokemonModal from '../components/PokemonModal';

export default function Pokedex() {
  
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGen, setSelectedGen] = useState<string>('all');
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  
  
  const [visibleCount, setVisibleCount] = useState(24);

  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0); 
    }
    setTimeout(() => setLoading(false), 800);
  }, []);

  
  useEffect(() => {
    if (selectedPokemon) {
      document.body.className = `theme-${selectedPokemon.types[0]}`;
    } else {
      document.body.className = 'theme-fire'; 
    }
  }, [selectedPokemon]);

  
  const getGeneration = (id: number) => {
    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    return 7; 
  };

  const toRoman = (num: number) => {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII"];
    return roman[num - 1] || num;
  };

  
  const allMatches = useMemo(() => {
    return (pokemonData as Pokemon[]).filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.id.toString().includes(search);
      const matchType = selectedType === 'all' || p.types.includes(selectedType);
      const matchGen = selectedGen === 'all' || getGeneration(p.id) === parseInt(selectedGen);
      return matchSearch && matchType && matchGen;
    });
  }, [search, selectedType, selectedGen]);

  
  const visiblePokemon = useMemo(() => {
    return allMatches.slice(0, visibleCount);
  }, [allMatches, visibleCount]);

  
  const handleEvolutionClick = (id: number) => {
    const targetPokemon = (pokemonData as Pokemon[]).find((p) => p.id === id);
    if (targetPokemon) setSelectedPokemon(targetPokemon);
  };

  return (
    <main className="min-h-screen relative p-4 md:p-8">
      <FlameBackground />

      {loading && (
        <div className="fixed inset-0 z-50 bg-bg-dark flex flex-col items-center justify-center transition-opacity duration-500">
           <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-accent-secondary animate-pulse font-bold tracking-widest">IGNITING POKEDEX...</p>
        </div>
      )}

      <header className="relative z-10 flex flex-col items-center mb-10 mt-4">
        <div className="flex items-center gap-3 mb-2 animate-[float_6s_ease-in-out_infinite]">
            <div className="relative">
                <div className="absolute inset-0 bg-accent-primary blur-2xl opacity-40"></div>
                <Image 
                  src="/Ember.webp"        
                  alt="Ember Dex Logo" 
                  width={100}              
                  height={100}             
                  className="relative w-20 h-20 md:w-24 md:h-24 drop-shadow-2xl object-contain" 
                  priority 
                />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic">
                <span className="text-transparent bg-clip-text bg-linear-to-r from-accent-primary to-accent-secondary drop-shadow-[0_0_10px_rgba(255,94,0,0.5)]">EMBER</span>
                <span className="text-blue-500 ml-1">DEX</span>
            </h1>
        </div>
        <p className="text-accent-secondary tracking-[0.3em] uppercase text-xs md:text-sm font-bold opacity-80">Ignite Your Journey</p>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto mb-12 glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4">
            
            <div className="flex-1 relative group">
                <input 
                    type="text"
                    placeholder="Search Pokémon name or ID..."
                    value={search}
                    onChange={(e) => { 
                      setSearch(e.target.value); 
                      setVisibleCount(24);
                    }}
                    className="w-full bg-black/40 border-2 border-transparent focus:border-accent-primary rounded-full py-4 pl-14 pr-6 text-white text-lg placeholder-gray-500 outline-none transition-all shadow-inner"
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-125 transition-transform">🔍</span>
            </div>
            
            <div className="relative">
                <select 
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setVisibleCount(24); 
                    }}
                    className="w-full md:w-auto appearance-none bg-bg-ui border-2 border-transparent hover:border-white/20 focus:border-accent-primary rounded-full px-8 py-4 text-white font-bold outline-none capitalize cursor-pointer transition-all shadow-lg"
                >
                    <option value="all">All Types</option>
                    <option value="fire">Fire</option>
                    <option value="water">Water</option>
                    <option value="grass">Grass</option>
                    <option value="electric">Electric</option>
                    <option value="psychic">Psychic</option>
                    <option value="ice">Ice</option>
                    <option value="dragon">Dragon</option>
                    <option value="dark">Dark</option>
                    <option value="fairy">Fairy</option>
                    <option value="fighting">Fighting</option>
                    <option value="poison">Poison</option>
                    <option value="ground">Ground</option>
                    <option value="flying">Flying</option>
                    <option value="bug">Bug</option>
                    <option value="rock">Rock</option>
                    <option value="ghost">Ghost</option>
                    <option value="steel">Steel</option>
                    <option value="normal">Normal</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-accent-primary">▼</div>
            </div>

             <div className="relative">
                <select 
                    value={selectedGen}
                    onChange={(e) => {
                      setSelectedGen(e.target.value);
                      setVisibleCount(24); 
                    }}
                    className="w-full md:w-auto appearance-none bg-bg-ui border-2 border-transparent hover:border-white/20 focus:border-accent-primary rounded-full px-8 py-4 text-white font-bold outline-none cursor-pointer transition-all shadow-lg"
                >
                    <option value="all">All Gens</option>
                    <option value="1">Gen 1</option>
                    <option value="2">Gen 2</option>
                    <option value="3">Gen 3</option>
                    <option value="4">Gen 4</option>
                    <option value="5">Gen 5</option>
                    <option value="6">Gen 6</option>
                    <option value="7">Gen 7</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-accent-primary">▼</div>
            </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto pb-20 space-y-16">
        
        {allMatches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <div className="text-6xl mb-4 grayscale">🔥</div>
                <h3 className="text-2xl font-bold text-white">No Pokémon Found</h3>
                <p className="text-gray-400">Try adjusting your filters.</p>
            </div>
        )}

        {[1, 2, 3, 4, 5, 6, 7].map((gen) => {
           
           const genPokemon = visiblePokemon.filter(p => getGeneration(p.id) === gen);
           
           if (genPokemon.length === 0) return null;

           return (
             <div key={gen} className="animate-[fadeIn_0.5s_ease-out]">
                <div className="flex items-center mb-8 pl-2">
                    <div className="h-8 w-1 bg-accent-primary rounded-full mr-4 shadow-[0_0_10px_var(--accent-primary)]"></div>
                    <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-white to-gray-500 uppercase tracking-widest">
                        Generation {toRoman(gen)}
                    </h2>
                    <div className="flex-1 h-px bg-linear-to-r from-white/10 to-transparent ml-6"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {genPokemon.map(poke => (
                        <PokemonCard 
                            key={poke.id} 
                            pokemon={poke} 
                            onClick={setSelectedPokemon} 
                        />
                    ))}
                </div>
             </div>
           );
        })}

        {visibleCount < allMatches.length && (
            <div className="flex justify-center pt-8">
                <button 
                    onClick={() => setVisibleCount(prev => prev + 24)}
                    className="px-8 py-4 bg-accent-primary/20 hover:bg-accent-primary text-white font-bold rounded-full border border-accent-primary transition-all shadow-[0_0_20px_var(--shadow-glow)] hover:scale-105 active:scale-95"
                >
                    LOAD MORE POKÉMON ({allMatches.length - visibleCount} Remaining)
                </button>
            </div>
        )}
      </div>

      {selectedPokemon && (
        <PokemonModal 
            pokemon={selectedPokemon} 
            onClose={() => setSelectedPokemon(null)} 
            onNavigate={handleEvolutionClick}
        />
      )}
    </main>
  );
}