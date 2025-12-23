import { Lock } from "lucide-react";

export const FloatingLocks = () => {
  const locks = [
    { delay: "0s", left: "10%", top: "20%", size: "w-12 h-12" },
    { delay: "0.5s", left: "85%", top: "15%", size: "w-10 h-10" },
    { delay: "1s", left: "15%", top: "70%", size: "w-14 h-14" },
    { delay: "1.5s", left: "80%", top: "65%", size: "w-8 h-8" },
    { delay: "2s", left: "50%", top: "40%", size: "w-12 h-12" },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {locks.map((lock, i) => (
        <Lock
          key={i}
          className={`absolute text-secure/10 ${lock.size} animate-float`}
          style={{
            left: lock.left,
            top: lock.top,
            animationDelay: lock.delay,
          }}
        />
      ))}
    </div>
  );
};
