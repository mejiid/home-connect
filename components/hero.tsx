import React from "react";

const Hero: React.FC = () => {
  return (
    <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center text-white">
      <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
      <img
        src="https://picsum.photos/1600/900?random=1"
        alt="A vibrant, narrow alleyway in the old city of Harar, Ethiopia"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-20 container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold font-sora leading-tight mb-4 animate-fade-in-up">
          Connecting Harar, <br /> One Home at a Time.
        </h1>
        <p
          className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          Your digital gateway to the heart of the Living Museum. Find services,
          events, and community at your fingertips.
        </p>
        <button
          className="bg-harar-blue text-white font-bold py-3 px-8 rounded-full shadow-xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 animate-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          Explore Services
        </button>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default Hero;
