import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Carlos Eduardo",
      company: "Construtora Silva",
      role: "Engenheiro Chefe",
      image: "https://i.pravatar.cc/150?img=11",
      text: "O 360PRO mudou a forma como gerenciamos nossas obras. A centralização das informações financeiras junto com o diário fotográfico economizou horas da minha equipe toda semana."
    },
    {
      name: "Mariana Costa",
      company: "MC Arquitetura",
      role: "Arquiteta e Sócia",
      image: "https://i.pravatar.cc/150?img=5",
      text: "A funcionalidade do Portal do Cliente é um diferencial gigantesco. Nossos clientes sentem muito mais confiança quando acompanham tudo em tempo real. Fechamos mais projetos por causa disso."
    },
    // {
    //   name: "Roberto Almeida",
    //   company: "Engenharia e Projetos RA",
    //   role: "Diretor Comercial",
    //   image: "https://i.pravatar.cc/150?img=68",
    //   text: "Eu utilizava planilhas complexas para calcular as guias de INSS da obra. O módulo de INSS do 360PRO faz isso em minutos. É impressionante a precisão da ferramenta."
    // }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 bg-surface/20 border-y border-outline/30 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-on-surface mb-6">
            O que dizem sobre o 360PRO
          </h2>
          <p className="text-on-surface-variant text-lg">
            Junte-se a centenas de profissionais que já transformaram a gestão de seus projetos.
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 z-20">
            <button 
              onClick={prevTestimonial}
              className="w-10 h-10 rounded-full bg-surface border border-outline flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 z-20">
            <button 
              onClick={nextTestimonial}
              className="w-10 h-10 rounded-full bg-surface border border-outline flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative h-[300px] md:h-[250px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-surface rounded-3xl border border-outline p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-xl shadow-primary/5"
              >
                <div className="w-24 h-24 shrink-0 rounded-full overflow-hidden border-4 border-surface shadow-lg relative">
                  <img 
                    src={testimonials[currentIndex].image} 
                    alt={testimonials[currentIndex].name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 text-center md:text-left relative">
                  <Quote className="absolute -top-4 -left-6 w-12 h-12 text-primary/10 rotate-180 hidden md:block" />
                  <div className="flex gap-1 mb-4 justify-center md:justify-start">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-on-surface-variant text-lg md:text-xl font-medium leading-relaxed mb-6 italic">
                    "{testimonials[currentIndex].text}"
                  </p>
                  <div>
                    <h4 className="text-on-surface font-bold text-lg">{testimonials[currentIndex].name}</h4>
                    <span className="text-primary text-sm font-medium">{testimonials[currentIndex].role}</span>
                    <span className="text-on-surface-variant text-sm"> • {testimonials[currentIndex].company}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-primary w-8' : 'bg-outline hover:bg-outline-variant'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
