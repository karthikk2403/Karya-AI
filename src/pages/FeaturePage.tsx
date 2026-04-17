import React from 'react';
import { motion } from 'motion/react';

export default function FeaturePage({ title, description, icon: Icon }: { title: string, description: string, icon: any }) {
  return (
    <div className="flex-1 p-8 h-full flex flex-col items-center justify-center text-center relative bg-bg-deep">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-24 h-24 rounded-3xl bg-brand-accent/10 flex items-center justify-center mb-8 border border-border-subtle shadow-[0_0_40px_rgba(34,211,238,0.15)]"
      >
        <Icon className="w-12 h-12 text-brand-accent" />
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-4xl font-bold tracking-tight mb-4 text-brand-primary"
      >
        {title}
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-brand-muted max-w-lg"
      >
        {description}
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12 px-6 py-3 rounded-full bg-bg-card/50 border border-border-subtle text-sm font-medium text-brand-muted/50"
      >
        Coming soon in Karya Pro
      </motion.div>
    </div>
  );
}
