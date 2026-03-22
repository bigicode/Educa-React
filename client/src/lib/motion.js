export const motionEase = {
  entrance: [0.22, 1, 0.36, 1],
  exit: [0.4, 0, 1, 1],
  smooth: [0.2, 0.9, 0.2, 1],
};

export const splashDurationMs = 1350;

export function getRevealMotion(reduceMotion, options = {}) {
  const { delay = 0, x = 0, y = 20, scale = 1 } = options;

  if (reduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          duration: 0.18,
          delay,
        },
      },
    };
  }

  const initial = { opacity: 0 };

  if (x) {
    initial.x = x;
  }

  if (y) {
    initial.y = y;
  }

  if (scale !== 1) {
    initial.scale = scale;
  }

  return {
    initial,
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.58,
        delay,
        ease: motionEase.entrance,
      },
    },
  };
}

export function getPageMotion(reduceMotion) {
  if (reduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          duration: 0.16,
        },
      },
      exit: {
        opacity: 0,
        transition: {
          duration: 0.12,
        },
      },
    };
  }

  return {
    initial: {
      opacity: 0,
      y: 18,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.42,
        ease: motionEase.smooth,
      },
    },
    exit: {
      opacity: 0,
      y: -14,
      transition: {
        duration: 0.2,
        ease: motionEase.exit,
      },
    },
  };
}

export function getRootShellMotion(reduceMotion) {
  if (reduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          duration: 0.18,
        },
      },
      exit: {
        opacity: 0,
        transition: {
          duration: 0.12,
        },
      },
    };
  }

  return {
    initial: {
      opacity: 0,
      scale: 0.99,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.34,
        ease: motionEase.entrance,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.18,
        ease: motionEase.exit,
      },
    },
  };
}
