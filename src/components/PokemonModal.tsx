import { Pokemon, EvolutionStage } from '../types';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import React from 'react';

// Import local data
import evolutionsDataRaw from '../data/evolutions.json';
import pokemonDataRaw from '../data/pokemon.json';

// Type assertions
const evolutionsData = evolutionsDataRaw as Record<string, EvolutionStage[]>;
const allPokemon = pokemonDataRaw as Pokemon[];

interface Props {
  pokemon: Pokemon | null;
  onClose: () => void;
  onNavigate: (id: number) => void;
}

// 🎨 Color Map
const typeColors: Record<string, string> = {
  fire: 'bg-[#FF5E00]',
  water: 'bg-[#3FA9F5]',
  grass: 'bg-[#7AC142]',
  electric: 'bg-[#FFD700] text-black',
  psychic: 'bg-[#F85888]',
  ice: 'bg-[#98D8D8]',
  dragon: 'bg-[#7038F8]',
  dark: 'bg-[#705848]',
  fairy: 'bg-[#EE99AC]',
  fighting: 'bg-[#C03028]',
  poison: 'bg-[#A040A0]',
  ground: 'bg-[#E0C068] text-black',
  flying: 'bg-[#A890F0]',
  bug: 'bg-[#A8B820]',
  rock: 'bg-[#B8A038]',
  ghost: 'bg-[#705898]',
  steel: 'bg-[#B8B8D0]',
  normal: 'bg-[#A8A878]',
};

// 🛡️ DEFENSIVE TYPE CHART (What hurts the defender?)
// keys = Defending Type
// values = Lists of attacking types that are Super Effective (2x), Not Very Effective (0.5x), or No Effect (0x)
const defensiveChart: Record<string, { weak: string[]; resist: string[]; immune: string[] }> = {
  normal:   { weak: ['fighting'], resist: [], immune: ['ghost'] },
  fire:     { weak: ['water', 'ground', 'rock'], resist: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], immune: [] },
  water:    { weak: ['electric', 'grass'], resist: ['fire', 'water', 'ice', 'steel'], immune: [] },
  grass:    { weak: ['fire', 'ice', 'poison', 'flying', 'bug'], resist: ['water', 'electric', 'grass', 'ground'], immune: [] },
  electric: { weak: ['ground'], resist: ['electric', 'flying', 'steel'], immune: [] },
  ice:      { weak: ['fire', 'fighting', 'rock', 'steel'], resist: ['ice'], immune: [] },
  fighting: { weak: ['flying', 'psychic', 'fairy'], resist: ['bug', 'rock', 'dark'], immune: [] },
  poison:   { weak: ['ground', 'psychic'], resist: ['grass', 'fighting', 'poison', 'bug', 'fairy'], immune: [] },
  ground:   { weak: ['water', 'grass', 'ice'], resist: ['poison', 'rock'], immune: ['electric'] },
  flying:   { weak: ['electric', 'ice', 'rock'], resist: ['grass', 'fighting', 'bug'], immune: ['ground'] },
  psychic:  { weak: ['bug', 'ghost', 'dark'], resist: ['fighting', 'psychic'], immune: [] },
  bug:      { weak: ['fire', 'flying', 'rock'], resist: ['grass', 'fighting', 'ground'], immune: [] },
  rock:     { weak: ['water', 'grass', 'fighting', 'ground', 'steel'], resist: ['normal', 'fire', 'poison', 'flying'], immune: [] },
  ghost:    { weak: ['ghost', 'dark'], resist: ['poison', 'bug'], immune: ['normal', 'fighting'] },
  dragon:   { weak: ['ice', 'dragon', 'fairy'], resist: ['fire', 'water', 'electric', 'grass'], immune: [] },
  steel:    { weak: ['fire', 'fighting', 'ground'], resist: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immune: ['poison'] },
  dark:     { weak: ['fighting', 'bug', 'fairy'], resist: ['ghost', 'dark'], immune: ['psychic'] },
  fairy:    { weak: ['poison', 'steel'], resist: ['fighting', 'bug', 'dark'], immune: ['dragon'] },
};

// ⚔️ OFFENSIVE TYPE CHART (What does the type hit hard?)
// Keys = Attacking Type
// Values = Types it hits for Super Effective damage
const offensiveChart: Record<string, string[]> = {
  normal:   [],
  fire:     ['grass', 'ice', 'bug', 'steel'],
  water:    ['fire', 'ground', 'rock'],
  grass:    ['water', 'ground', 'rock'],
  electric: ['water', 'flying'],
  ice:      ['grass', 'ground', 'flying', 'dragon'],
  fighting: ['normal', 'ice', 'rock', 'dark', 'steel'],
  poison:   ['grass', 'fairy'],
  ground:   ['fire', 'electric', 'poison', 'rock', 'steel'],
  flying:   ['grass', 'fighting', 'bug'],
  psychic:  ['fighting', 'poison'],
  bug:      ['grass', 'psychic', 'dark'],
  rock:     ['fire', 'ice', 'flying', 'bug'],
  ghost:    ['psychic', 'ghost'],
  dragon:   ['dragon'],
  steel:    ['ice', 'rock', 'fairy'],
  dark:     ['psychic', 'ghost'],
  fairy:    ['fighting', 'dragon', 'dark'],
};

const PokemonModal: React.FC<Props> = ({ pokemon, onClose, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'moves' | 'info' | 'evolutions'>('stats');

  // Helper: Get types for evolution chain
  const getTypesForId = (id: number) => {
    const found = allPokemon.find(p => p.id === id);
    return found ? found.types : [];
  };

  // 🧮 CALCULATE WEAKNESSES & STRENGTHS CORRECTLY
  const { weaknesses, strengths } = useMemo(() => {
    if (!pokemon) return { weaknesses: [], strengths: [] };

    // 1. Calculate Weaknesses (Defensive)
    // We must check every single attacking type against the Pokemon's types
    const allTypes = Object.keys(defensiveChart);
    const calculatedWeaknesses: string[] = [];

    allTypes.forEach((attackType) => {
        let multiplier = 1;

        pokemon.types.forEach((defendType) => {
            const chart = defensiveChart[defendType.toLowerCase()];
            if (chart.weak.includes(attackType)) multiplier *= 2;
            else if (chart.resist.includes(attackType)) multiplier *= 0.5;
            else if (chart.immune.includes(attackType)) multiplier *= 0;
        });

        // If the final multiplier is > 1 (e.g. 2x or 4x), it's a weakness
        if (multiplier > 1) {
            calculatedWeaknesses.push(attackType);
        }
    });

    // 2. Calculate Strengths (Offensive)
    // Just combine the "Strong Against" lists of the Pokemon's own types
    const strengthSet = new Set<string>();
    pokemon.types.forEach((myType) => {
        const hitsHard = offensiveChart[myType.toLowerCase()] || [];
        hitsHard.forEach(t => strengthSet.add(t));
    });

    return {
        weaknesses: calculatedWeaknesses,
        strengths: Array.from(strengthSet)
    };
  }, [pokemon]);

  if (!pokemon) return null;

  const evolutionChain = evolutionsData[pokemon.id.toString()] || [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-dark border-2 border-accent-primary rounded-3xl p-6 md:p-10 shadow-[0_0_60px_var(--shadow-glow)] animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-accent-primary rounded-full text-black font-bold hover:scale-110 transition-transform shadow-lg z-10"
        >✕</button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Image & Basic Info */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 mb-6 flex justify-center items-center">
                <div className="absolute inset-0 bg-gradient-ember opacity-30 blur-3xl animate-pulse" />
                <Image 
                  src={pokemon.image} 
                  alt={pokemon.name}
                  width={250}
                  height={250}
                  className="object-contain drop-shadow-2xl z-10"
                  priority={true}
                />
            </div>
            <h2 className="text-4xl md:text-5xl font-black capitalize mb-2 text-white drop-shadow-md">{pokemon.name}</h2>
            <p className="text-accent-secondary font-mono text-xl mb-4">#{pokemon.id.toString().padStart(3, '0')}</p>
            <div className="flex gap-2">
                {pokemon.types.map((t) => (
                    <span key={t} className={`px-6 py-2 rounded-full uppercase text-sm font-bold tracking-widest text-white shadow-lg border border-white/20 ${typeColors[t] || 'bg-gray-700'}`}>
                        {t}
                    </span>
                ))}
            </div>
          </div>

          {/* Right Column: Interactive Tabs */}
          <div className="flex flex-col h-full">
            <div className="flex gap-4 border-b border-white/10 mb-6 overflow-x-auto">
                {(['stats', 'moves', 'info', 'evolutions'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)} 
                        className={`pb-3 px-4 font-bold uppercase tracking-widest text-sm transition-colors border-b-2 whitespace-nowrap
                            ${activeTab === tab 
                                ? 'text-accent-primary border-accent-primary' 
                                : 'text-gray-500 border-transparent hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-75">
                {/* STATS */}
                {activeTab === 'stats' && (
                    <div className="space-y-5">
                        {pokemon.stats.map((stat) => (
                            <div key={stat.name} className="space-y-1">
                                <div className="flex justify-between text-xs uppercase font-bold text-gray-400 tracking-wider">
                                    <span>{stat.name}</span>
                                    <span className="text-white text-lg">{stat.value}</span>
                                </div>
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div style={{ width: `${Math.min((stat.value / 150) * 100, 100)}%` }} className="h-full bg-accent-primary shadow-[0_0_15px_var(--accent-primary)] relative">
                                        <div className="absolute inset-0 bg-white/20"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* MOVES */}
                {activeTab === 'moves' && (
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {pokemon.moves.map((move) => (
                            <span key={move} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase text-center text-gray-300 hover:bg-white/10 hover:border-accent-primary/50 transition-colors cursor-default">
                                {move.replace('-', ' ')}
                            </span>
                        ))}
                    </div>
                )}
                
                {/* INFO (Fixed Weaknesses) */}
                {activeTab === 'info' && (
                   <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 text-center">
                            <h4 className="text-gray-500 text-xs uppercase font-bold mb-1">Height</h4>
                            <p className="text-3xl font-black text-white">{pokemon.height / 10}<span className="text-lg text-gray-500 ml-1">m</span></p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 text-center">
                            <h4 className="text-gray-500 text-xs uppercase font-bold mb-1">Weight</h4>
                            <p className="text-3xl font-black text-white">{pokemon.weight / 10}<span className="text-lg text-gray-500 ml-1">kg</span></p>
                        </div>
                        <div className="col-span-2 p-5 bg-white/5 rounded-2xl border border-white/10">
                            <h4 className="text-gray-500 text-xs uppercase font-bold mb-2">Abilities</h4>
                            <div className="flex flex-wrap gap-2">
                                {pokemon.abilities.map((ab) => (
                                    <span key={ab} className="px-3 py-1 bg-accent-primary/10 text-accent-primary border border-accent-primary/30 rounded-lg text-sm capitalize">
                                        {ab.replace('-', ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-2 p-5 bg-white/5 rounded-2xl border border-white/10">
                            <h4 className="text-red-400 text-xs uppercase font-bold mb-2">Weak To</h4>
                            <div className="flex flex-wrap gap-2">
                                {weaknesses.map((t) => (
                                    <span key={t} className={`px-2 py-1 rounded text-[10px] uppercase font-bold text-white ${typeColors[t] || 'bg-gray-600'}`}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-2 p-5 bg-white/5 rounded-2xl border border-white/10">
                            <h4 className="text-green-400 text-xs uppercase font-bold mb-2">Strong Against</h4>
                            <div className="flex flex-wrap gap-2">
                                {strengths.length > 0 ? strengths.map((t) => (
                                    <span key={t} className={`px-2 py-1 rounded text-[10px] uppercase font-bold text-white ${typeColors[t] || 'bg-gray-600'}`}>
                                        {t}
                                    </span>
                                )) : <span className="text-gray-500 text-xs">None</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* EVOLUTIONS (With Type Pills and Horizontal Layout) */}
                {activeTab === 'evolutions' && (
                    <div className="flex flex-col items-center justify-center h-full min-h-87.5">
                        {evolutionChain.length > 0 ? (
                            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
                                {evolutionChain.map((stage, index) => {
                                    const isCurrent = stage.id === pokemon.id;
                                    const stageTypes = getTypesForId(stage.id);

                                    return (
                                    <React.Fragment key={stage.id}>
                                        {index > 0 && (
                                            <div className="text-white/30 text-3xl md:text-5xl font-thin mx-1 md:mx-2">
                                                ›
                                            </div>
                                        )}
                                        <div 
                                            onClick={() => onNavigate(stage.id)}
                                            className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1"
                                        >
                                            <div className={`relative w-20 h-20 md:w-28 md:h-28 rounded-full border-4 flex items-center justify-center bg-black/20 mb-3 transition-all
                                                ${isCurrent 
                                                    ? 'border-accent-primary shadow-[0_0_20px_var(--shadow-glow)]' 
                                                    : 'border-white/10 group-hover:border-white/50'}`}
                                            >
                                                <Image 
                                                    src={stage.image}
                                                    alt={stage.name}
                                                    width={90}
                                                    height={90}
                                                    className={`object-contain transition-all duration-300
                                                        ${isCurrent ? 'scale-110' : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-100'}`}
                                                />
                                            </div>
                                            <h3 className={`text-sm md:text-base font-bold capitalize mb-1 
                                                ${isCurrent ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                                {stage.name}
                                            </h3>
                                            <p className="text-gray-600 text-xs font-mono mb-2">#{stage.id.toString().padStart(3,'0')}</p>
                                            <div className="flex gap-1">
                                                {stageTypes.map(t => (
                                                    <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white shadow-sm ${typeColors[t] || 'bg-gray-600'}`}>
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )})}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">This Pokémon does not evolve.</p>
                        )}
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonModal;