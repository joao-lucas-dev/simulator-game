"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  acceptOrder,
  advanceTime,
  buyIngredient,
  createInitialGameState,
  deliverOrder,
  endDay,
  hireMotoboy,
  openShop,
  purchaseUpgrade,
  rejectOrder,
  setSpeed,
  startBaking,
  startPreparation,
  toggleRunning
} from "./engine";
import type { GameState, IngredientId, UpgradeId } from "./types";

export type GameStore = GameState & {
  openShop: () => void;
  toggleRunning: () => void;
  setSpeed: (speed: 1 | 3 | 5) => void;
  buyIngredient: (ingredientId: IngredientId, quantity: number) => void;
  acceptOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  startPreparation: (orderId: string) => void;
  startBaking: (orderId: string) => void;
  deliverOrder: (orderId: string) => void;
  hireMotoboy: () => void;
  advanceTime: (minutes: number) => void;
  endDay: () => void;
  purchaseUpgrade: (upgradeId: UpgradeId) => void;
  resetGame: () => void;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...createInitialGameState(),
      openShop: () => set((state) => openShop(state)),
      toggleRunning: () => set((state) => toggleRunning(state)),
      setSpeed: (speed) => set((state) => setSpeed(state, speed)),
      buyIngredient: (ingredientId, quantity) =>
        set((state) => buyIngredient(state, ingredientId, quantity)),
      acceptOrder: (orderId) => set((state) => acceptOrder(state, orderId)),
      rejectOrder: (orderId) => set((state) => rejectOrder(state, orderId)),
      startPreparation: (orderId) => set((state) => startPreparation(state, orderId)),
      startBaking: (orderId) => set((state) => startBaking(state, orderId)),
      deliverOrder: (orderId) => set((state) => deliverOrder(state, orderId)),
      hireMotoboy: () => set((state) => hireMotoboy(state)),
      advanceTime: (minutes) => set((state) => advanceTime(state, minutes)),
      endDay: () => set((state) => endDay(state)),
      purchaseUpgrade: (upgradeId) => set((state) => purchaseUpgrade(state, upgradeId)),
      resetGame: () => set(createInitialGameState())
    }),
    {
      name: "company-simulator-save",
      version: 7,
      migrate: (persistedState) => {
        const savedState = persistedState as (Partial<GameState> & { speed?: number }) | undefined;
        const speed = savedState?.speed === 3 || savedState?.speed === 5 ? savedState.speed : 1;
        return { ...createInitialGameState(), ...savedState, speed };
      }
    }
  )
);
