import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

export function FaqSection() {
  const faqs = [
    {
      question: "Funciona no celular?",
      answer: "Sim! O 360PRO é totalmente responsivo (Progressive Web App). Você pode acessá-pal pelo navegador do seu celular de qualquer lugar, seja na obra ou no escritório, com a mesma experiência fluida de um aplicativo."
    },
    {
      question: "Precisa instalar alguma coisa?",
      answer: "Não. A plataforma roda 100% na nuvem. Basta acessar o site com seu login e senha através de qualquer dispositivo com internet (computador, tablet ou celular)."
    },
    {
      question: "Como funciona o acesso dos clientes?",
      answer: "Você pode criar acessos ilimitados para os proprietários/clientes das obras. Eles terão uma visão restrita (Portal do Cliente) onde poderão ver apenas as fotos, o andamento físico e relatórios que você liberar."
    },
    {
      question: "Os dados ficam seguros?",
      answer: "Sim, utilizamos infraestrutura moderna com bancos de dados isolados e backups diários automáticos. Toda a comunicação é criptografada de ponta a ponta."
    },
    {
      question: "Existe treinamento para minha equipe?",
      answer: "Com certeza. Nossos planos Business incluem onboarding guiado e treinamento exclusivo para sua equipe. Para os demais planos, oferecemos tutoriais completos em vídeo e suporte via WhatsApp."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-on-surface mb-6">
            Perguntas Frequentes
          </h2>
          <p className="text-on-surface-variant text-lg">
            Ficou com alguma dúvida? Confira as respostas abaixo.
          </p>
        </div>

        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-outline rounded-2xl bg-surface/30 overflow-hidden"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-surface transition-colors"
              >
                <span className="font-bold text-on-surface">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180 text-primary' : ''
                  }`} 
                />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5 pt-0 text-on-surface-variant text-sm md:text-base border-t border-outline/30 mt-2 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
