'use client';

import { useState, useEffect } from 'react';
import { Recipe } from '@/types';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('family-recipes');
    if (saved) {
      try {
        setRecipes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recipes', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveRecipes = (newRecipes: Recipe[]) => {
    setRecipes(newRecipes);
    localStorage.setItem('family-recipes', JSON.stringify(newRecipes));
  };

  const addRecipe = (recipe: Recipe) => {
    saveRecipes([...recipes, recipe]);
  };

  const deleteRecipe = (id: string) => {
    saveRecipes(recipes.filter(r => r.id !== id));
  };

  return { recipes, addRecipe, deleteRecipe, isLoaded };
}
