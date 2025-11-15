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
  <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-2">
    <div className="mb-6 inline-block p-4 rounded-full bg-harar-blue/10 text-harar-blue">
      {icon}
    </div>
    <h3 className="text-xl font-sora font-semibold mb-3 text-harar-dark">
      {title}
    </h3>
    <p className="text-gray-600 leading-relaxed">
      {description}
    </p>
  </div>
);

const Features: React.FC = () => {
  const features = [
    {
      icon: <ToolboxIcon className="h-8 w-8" />,
      title: "Local Services",
      description:
        "Find trusted plumbers, electricians, and artisans right in your neighborhood. Verified and reviewed by the community.",
    },
    {
      icon: <CommunityIcon className="h-8 w-8" />,
      title: "Community Hub",
      description:
        "Stay updated on local events, share news, and connect with your neighbors in a safe and friendly online space.",
    },
    {
      icon: <MarketplaceIcon className="h-8 w-8" />,
      title: "Harar Marketplace",
      description:
        "Buy and sell goods, from handmade crafts to fresh produce, within the trusted community of Harar.",
    },
    {
      icon: <CultureIcon className="h-8 w-8" />,
      title: "Cultural Guide",
      description:
        "Discover the rich history, hidden gems, and cultural etiquette of the Jugol, the ancient walled city.",
    },
  ];

  return (
    <section id="services" className="py-20 bg-harar-stone">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-sora font-bold text-harar-dark">
            Everything You Need, All in One Place
          </h2>
          <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
            A platform built for the people of Harar, by the people of Harar.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
