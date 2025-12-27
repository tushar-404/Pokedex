import { Pokemon } from '../types';
import Image from 'next/image';
import React from 'react';

interface Props {
  pokemon: Pokemon;
  onClick: (p: Pokemon) => void;
}


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

const PokemonCard: React.FC<Props> = ({ pokemon, onClick }) => {
  return (
    <div 
      onClick={() => onClick(pokemon)}
      className="glass-panel rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:border-accent-primary hover:shadow-[0_0_30px_var(--shadow-glow)] group relative"
    >
      <div className="relative mb-4 flex justify-center w-full h-32">
        <div className="absolute inset-0 bg-gradient-ember opacity-0 group-hover:opacity-20 transition-opacity rounded-full blur-xl" />
        
        <Image 
          src={pokemon.image} 
          alt={pokemon.name}
          width={150}
          height={150}
          className="object-contain drop-shadow-lg transition-transform group-hover:scale-110"
          priority={false}
        />
      </div>
      
      <h3 className="text-2xl font-black text-center capitalize mb-2 text-white group-hover:text-accent-primary transition-colors">
        {pokemon.name}
      </h3>
      
      <p className="text-center text-gray-400 mb-4 font-mono font-bold">
        #{pokemon.id.toString().padStart(3, '0')}
      </p>
      
      <div className="flex gap-2 justify-center flex-wrap">
        {pokemon.types.map((type) => (
          <span 
            key={type} 
            
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/20 backdrop-blur-sm shadow-sm
              ${typeColors[type] || 'bg-gray-700'} bg-opacity-80`}
          >
            {type}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PokemonCard;