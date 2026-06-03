import { Star } from "lucide-react";
import { useState, useEffect } from "react";

const rotatingWords = ["porta.", "mesa.", "festa.", "casa."];
const badgeMessages = [
  "Sabor premium. Qualidade sem igual.",
  "🔥 +14 pedidos na última hora",
  "✨ O mais pedido: Smash Duplo",
];

export const Hero = ({ onCta }: { onCta: () => void }) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [badgeIndex, setBadgeIndex] = useState(0);

  // Typewriter effect
  useEffect(() => {
    const currentWord = rotatingWords[wordIndex];
    let timeoutId: NodeJS.Timeout;

    if (isDeleting) {
      timeoutId = setTimeout(() => {
        setText(currentWord.substring(0, text.length - 1));
        if (text === "") {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        }
      }, 50);
    } else {
      if (text === currentWord) {
        timeoutId = setTimeout(() => setIsDeleting(true), 2000);
      } else {
        timeoutId = setTimeout(() => {
          setText(currentWord.substring(0, text.length + 1));
        }, 120);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [text, isDeleting, wordIndex]);

  // Badge rotating effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setBadgeIndex((prev) => (prev + 1) % badgeMessages.length);
    }, 4000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="relative overflow-hidden bg-black pt-10 pb-16 md:pt-24 md:pb-32">
      <div className="container relative z-10 grid gap-8 md:gap-12 lg:grid-cols-2 lg:items-center">
        
        {/* Left Side: Text and CTA */}
        <div className="animate-fade-in flex flex-col items-start text-left px-4 md:px-0">
          
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1a130d] border border-primary/20 px-4 py-1.5 mb-6 md:mb-8 overflow-hidden min-w-[280px]">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span key={badgeIndex} className="text-[10px] sm:text-xs font-semibold text-primary animate-slide-up" style={{ animationDuration: '0.4s' }}>
              {badgeMessages[badgeIndex]}
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl font-black leading-tight text-white md:text-7xl tracking-tight">
            A pizza perfeita.
          </h1>
          
          {/* Highlight Box */}
          <div className="mt-2 inline-block rounded-2xl md:rounded-3xl px-4 md:px-6 py-2 btn-glass-primary animate-shine">
            <span className="relative z-10 text-4xl font-black text-primary md:text-7xl tracking-tight flex items-center">
              Na sua <span className="ml-2 mr-1">{text}</span>
              <span className="inline-block w-[2px] md:w-[3px] h-[0.8em] bg-primary animate-pulse rounded-full opacity-80 -ml-[2px] translate-y-[6px]"></span>
            </span>
          </div>
          
          {/* Description */}
          <p className="mt-6 md:mt-8 max-w-lg text-base md:text-lg text-gray-400 leading-relaxed font-medium">
            Ingredientes premium, massa artesanal e a experiência única do Empório das Pizzas. Do nosso forno para sua mesa.
          </p>
          
          {/* Button */}
          <div className="mt-8 md:mt-10">
            <button
              onClick={onCta}
              className="btn-glass-primary animate-shine rounded-full px-8 md:px-10 py-3 md:py-4 text-base md:text-lg font-bold"
            >
              <span className="relative z-10">Fazer Pedido</span>
            </button>
          </div>
        </div>

        {/* Right Side: Image and Floating Badge */}
        <div className="relative flex justify-center lg:justify-end mt-12 lg:mt-0 opacity-0 animate-hero-entrance" style={{ animationDelay: '100ms' }}>
          
          {/* Pulsing Background Glow */}
          <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse-glow -z-10 scale-110" />

          {/* Circular Image Container */}
          <div className="group relative aspect-square w-full max-w-[500px] overflow-hidden rounded-full border-[8px] border-[#111] bg-[#0a0a0a] animate-float-dynamic shadow-[0_0_80px_rgba(255,110,0,0.15)]">
            <div className="absolute inset-0 bg-primary/20 opacity-0 transition-opacity duration-700 group-hover:opacity-100 z-10 rounded-full mix-blend-overlay" />
            <img
              src="/hero-pizza.png"
              alt="Pizza Perfeita"
              className="h-full w-full object-cover scale-110 transition-transform duration-[1.5s] ease-out group-hover:scale-[1.35]"
            />
          </div>

          {/* Floating Rating Badge */}
          <div className="absolute -bottom-6 right-4 lg:right-10 flex items-center gap-4 rounded-3xl bg-[#151515] border border-white/10 p-4 pr-8 shadow-[0_20px_40px_rgba(0,0,0,0.8)] animate-float-reverse-dynamic">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a1f16] border-2 border-[#151515] shadow-inner">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white leading-none">5.0</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Qualidade Máxima</span>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};






