import React from "react";
import {
  ToolboxIcon,
  CommunityIcon,
  MarketplaceIcon,
  CultureIcon,
} from "./iocncomponents";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/85 p-7 shadow-sm backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-xl">
    <div className="mb-5 inline-flex items-center justify-center rounded-2xl bg-harar-blue/10 p-4 text-harar-blue">
      {icon}
    </div>
    <h3 className="text-lg font-sora font-semibold text-harar-dark sm:text-xl">
      {title}
    </h3>
    <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">
      {description}
    </p>
    <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-harar-blue/10 blur-2xl transition group-hover:bg-harar-blue/15" />
  </div>
);

const Features: React.FC = () => {
  const features = [
    {
      icon: <MarketplaceIcon className="h-8 w-8" />,
      title: "Browse listings",
      description:
        "Explore available homes for rent and sale with clear pricing, photos, and essential details.",
    },
    {
      icon: <ToolboxIcon className="h-8 w-8" />,
      title: "Smart filtering",
      description:
        "Narrow down options by property type and budget to find the right match faster.",
    },
    {
      icon: <CommunityIcon className="h-8 w-8" />,
      title: "Connect with agents",
      description:
        "Contact verified agents to schedule visits, ask questions, and get guidance through the process.",
    },
    {
      icon: <CultureIcon className="h-8 w-8" />,
      title: "Local insights",
      description:
        "Understand neighborhoods with location details and key amenities to choose with confidence.",
    },
  ];

  return (
    <section id="services" className="py-20 bg-harar-stone">
      <div className="container mx-auto px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wide text-harar-blue">
            Why HomeConnect
          </p>
          <h2 className="text-3xl font-sora font-bold text-harar-dark md:text-4xl">
            Modern real estate, built for Harar
          </h2>
          <p className="mt-4 text-base text-zinc-600 md:text-lg">
            Find, filter, and connect—everything you need to move from browsing
            to booking in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
