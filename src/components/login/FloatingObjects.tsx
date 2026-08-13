import { motion } from "framer-motion";

export function FloatingObjects() {
  return (
    <>
      <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 left-10 md:-left-4 w-20 h-20 md:w-28 md:h-28 z-20">
        <img src="/guitar.png" alt="Guitar" className="w-full h-full object-contain drop-shadow-2xl" />
      </motion.div>
      <motion.div animate={{ y: [0, 25, 0], rotate: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-20 -right-4 md:-right-8 w-24 h-24 md:w-32 md:h-32 z-20">
        <img src="/piano.png" alt="Piano" className="w-full h-full object-contain drop-shadow-2xl" />
      </motion.div>
      <motion.div animate={{ y: [0, -15, 0], rotate: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-10 left-4 w-16 h-16 md:w-24 md:h-24 z-20 transform -rotate-12">
        <img src="/garba.png" alt="Dance" className="w-full h-full object-contain drop-shadow-2xl" />
      </motion.div>
      <motion.div animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="absolute top-1/3 -right-2 md:-right-10 w-16 h-16 md:w-20 md:h-20 z-20 transform rotate-12">
        <img src="/bharatnatyam.png" alt="Classical" className="w-full h-full object-contain drop-shadow-2xl" />
      </motion.div>
    </>
  );
}
