import { UtensilsCrossed, Instagram, Facebook, Twitter, MapPin, Phone, Clock } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="mt-16 border-t border-white/5 bg-black py-12">
      <div className="container flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <UtensilsCrossed className="h-5 w-5 text-black" />
          </div>
          <span className="text-xl font-black uppercase tracking-tighter text-white">Empório <span className="text-primary">das Pizzas</span></span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <a 
            href="https://wa.me/5581973170226" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 transition-all group"
          >
            <div className="bg-green-500 p-2 rounded-lg text-black group-hover:scale-110 transition-transform">
              <Phone className="h-4 w-4" />
            </div>
            <span className="font-black text-sm uppercase tracking-widest">(81) 97317-0226</span>
          </a>

          <a 
            href="https://instagram.com/emporiodaspizzas" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-500 hover:bg-pink-500/20 transition-all group"
          >
            <div className="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
              <Instagram className="h-4 w-4" />
            </div>
            <span className="font-black text-sm uppercase tracking-widest">@emporiodaspizzas</span>
          </a>
        </div>

        <div className="flex flex-col items-center gap-2 mt-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            © {new Date().getFullYear()} Empório das Pizzas · Todos os direitos reservados
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            Desenvolvedor: Assnz.
          </p>
        </div>
      </div>
    </footer>
  );
};

