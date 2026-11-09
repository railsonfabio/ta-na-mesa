import React from "react";
import { RestaurantDiscoveryView } from "../../components/RestaurantDiscoveryView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Descubra Restaurantes • Tá na Mesa",
  description: "Explore os melhores restaurantes, hamburguerias, pizzarias e bares com comanda digital em tempo real.",
};

export default function ExplorarPage() {
  return <RestaurantDiscoveryView />;
}
