"use client";

import { useScroll, useSpring, MotionValue } from "framer-motion";
import { useEffect, useRef, ReactNode } from "react";

interface ScrollyVideoProps {
  src: string;
  children?: (progress: MotionValue<number>) => ReactNode;
}

export default function ScrollyVideo({ src, children }: ScrollyVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const springScroll = useSpring(scrollYProgress, {
    damping: 40,
    stiffness: 300,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let frameId = 0;

    const updateVideoTime = () => {
      if (!video.duration || Number.isNaN(video.duration)) {
        frameId = window.requestAnimationFrame(updateVideoTime);
        return;
      }

      const progress = springScroll.get();
      const targetTime = progress * video.duration;

      if (video.readyState >= 2 && Math.abs(video.currentTime - targetTime) > 0.01) {
        video.currentTime = targetTime;
      }

      frameId = window.requestAnimationFrame(updateVideoTime);
    };

    frameId = window.requestAnimationFrame(updateVideoTime);

    return () => window.cancelAnimationFrame(frameId);
  }, [springScroll]);

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
        {children && children(springScroll)}
      </div>
    </div>
  );
}
