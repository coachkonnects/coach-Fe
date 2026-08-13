import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#FFF8F0] z-0">
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-64 -left-32 w-[40rem] h-[40rem] bg-pink-300/30 rounded-full mix-blend-multiply filter blur-[100px]"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 -right-32 w-[35rem] h-[35rem] bg-purple-300/30 rounded-full mix-blend-multiply filter blur-[100px]"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], x: [0, 30, 0], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-64 left-1/4 w-[45rem] h-[45rem] bg-blue-200/30 rounded-full mix-blend-multiply filter blur-[100px]"
      />
    </div>
  );
}
