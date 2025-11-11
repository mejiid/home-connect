import Features from "@/components/futures";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { NavigationPromisesContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import React from "react";

const Home = () => {
  return (
    <main>
      <Hero />
      <Features />
    </main>
  );
};

export default Home;
