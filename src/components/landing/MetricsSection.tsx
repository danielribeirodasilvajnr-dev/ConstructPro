import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';

function AnimatedCounter({ value, suffix = "" }: { value: number, suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const startTime = performance.now();
      
      const updateCounter = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function (easeOutExpo)
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        setCount(Math.floor(easeOut * value));
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };
      
      requestAnimationFrame(updateCounter);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      +{count}{suffix}
    </span>
  );
}

export function MetricsSection() {
  const metrics = [
    { value: 1000, label: "Simulações Realizadas" },
    { value: 500, label: "Obras Gerenciadas" },
    { value: 100, label: "Regularizações Concluídas" },
    { value: 24, label: "Horas de Acesso Online", isStatic: true, suffix: "h" }
  ];

  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/20 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x divide-white/10 text-center">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center justify-center px-4"
            >
              <div className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-background mb-2 tracking-tight">
                {metric.isStatic ? (
                  <span>{metric.value}{metric.suffix}</span>
                ) : (
                  <AnimatedCounter value={metric.value} />
                )}
              </div>
              <div className="text-background/80 text-sm md:text-base font-medium uppercase tracking-[2px]">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
