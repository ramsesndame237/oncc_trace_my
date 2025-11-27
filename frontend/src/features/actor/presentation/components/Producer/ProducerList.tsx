"use client";

import React from "react";
import { ActorList } from "../ActorList";

/**
 * Composant spécialisé pour afficher uniquement les producteurs
 * Utilise ActorList avec le filtre PRODUCER
 */
export const ProducerList: React.FC = () => {
  return <ActorList actorType="PRODUCER" />;
};
